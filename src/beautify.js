"use strict";

const { resolveThemeSpec } = require("./themes.js");
const { tightenPieViewBox, extractSvgNaturalSize } = require("./sizing.js");
const { DEFAULT_SETTINGS } = require("./settings.js");

/**
 * Checks whether an element has a custom author-specified fill/stroke.
 */
function hasExplicitUserStyle(el) {
  if (!el || typeof el.getAttribute !== "function") return false;
  if (el.dataset && el.dataset.mbUserCustom !== undefined) {
    return el.dataset.mbUserCustom === "true";
  }

  const styleAttr = (el.getAttribute("style") || "").toLowerCase();
  const fillAttr = (el.getAttribute("fill") || "").toLowerCase();
  const combined = `${styleAttr};fill:${fillAttr}`;

  if (!combined.includes("fill")) {
    if (el.dataset) el.dataset.mbUserCustom = "false";
    return false;
  }

  const mermaidDefaults = [
    "#ececff",
    "rgb(236, 236, 255)",
    "#ffffde",
    "rgb(255, 255, 222)",
    "#f9f9f9",
    "#eeeeee",
    "#eaeaea",
    "#ffffff",
    "#1f2020",
    "#282a36",
    "#2a2a2a",
    "none",
    "transparent",
  ];

  const fillMatch = styleAttr.match(/fill\s*:\s*([^;!]+)/i);
  const candidateFill = (fillMatch ? fillMatch[1] : fillAttr).trim();
  if (!candidateFill || candidateFill.startsWith("var(")) {
    if (el.dataset) el.dataset.mbUserCustom = "false";
    return false;
  }

  for (const def of mermaidDefaults) {
    if (candidateFill === def) {
      if (el.dataset) el.dataset.mbUserCustom = "false";
      return false;
    }
  }

  if (el.dataset) el.dataset.mbUserCustom = "true";
  return true;
}

function applyStyleProp(el, prop, val) {
  if (!el || !el.style) return;
  el.style[prop] = val;
  if (typeof el.style.setProperty === "function") {
    const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    el.style.setProperty(cssProp, val, "important");
  }
}

/**
 * Analyzes flowchart/graph nodes and edges in SVG DOM.
 */
function classifyGraphTopology(svg) {
  const result = new Map();
  if (!svg || typeof svg.querySelectorAll !== "function") return result;

  const nodes = Array.from(svg.querySelectorAll(".node"));
  if (nodes.length === 0) return result;

  const nodeIds = [];
  const nodeKeyMap = new Map();
  const nodeOrderMap = new Map();

  nodes.forEach((node, idx) => {
    const rawId =
      (typeof node.getAttribute === "function" &&
        (node.getAttribute("data-id") || node.getAttribute("id"))) ||
      `node_${idx}`;
    const cleanMatch = rawId.match(/^flowchart-(.+?)-\d+$/);
    const key = cleanMatch ? cleanMatch[1] : rawId;
    nodeIds.push(key);
    nodeKeyMap.set(key, node);
    nodeOrderMap.set(key, idx);
  });

  const adj = new Map(nodeIds.map((k) => [k, new Set()]));
  const rev = new Map(nodeIds.map((k) => [k, new Set()]));

  const edges = Array.from(
    svg.querySelectorAll(".edgePath, .flowchart-link, path[data-edge], g.edgePaths > g")
  );

  const keySet = new Set(nodeIds);
  const sortedKeys = [...nodeIds].sort((a, b) => b.length - a.length);

  edges.forEach((edge) => {
    const idStr =
      (typeof edge.getAttribute === "function" &&
        (edge.getAttribute("id") || edge.getAttribute("class"))) ||
      "";
    if (!idStr) return;

    // Fast path: check for Mermaid's standard LS-src-LE-dst pattern
    const lsMatch = idStr.match(/LS-(.+?)[-_]LE-(.+?)(?:$|[-_\s])/);
    if (lsMatch && keySet.has(lsMatch[1]) && keySet.has(lsMatch[2])) {
      adj.get(lsMatch[1]).add(lsMatch[2]);
      rev.get(lsMatch[2]).add(lsMatch[1]);
      return;
    }

    // Fast path: flowchart-src-dst-N or L-src-dst-N
    const lMatch = idStr.match(/(?:flowchart|L)[-_](.+?)[-_](.+?)(?:[-_]\d+)?$/);
    if (lMatch && keySet.has(lMatch[1]) && keySet.has(lMatch[2])) {
      adj.get(lMatch[1]).add(lMatch[2]);
      rev.get(lMatch[2]).add(lMatch[1]);
      return;
    }

    let matched = false;
    for (const src of sortedKeys) {
      if (!idStr.includes(src)) continue;
      for (const dst of sortedKeys) {
        if (src === dst) continue;
        if (
          idStr.includes(`-${src}-${dst}`) ||
          idStr.includes(`_${src}_${dst}`) ||
          (idStr.includes(`LS-${src}`) && idStr.includes(`LE-${dst}`))
        ) {
          adj.get(src).add(dst);
          rev.get(dst).add(src);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  });

  const anyEdgeMatched = Array.from(rev.values()).some((s) => s.size > 0);
  const depthMap = new Map();
  const branchGroupMap = new Map();

  if (anyEdgeMatched) {
    const roots = nodeIds.filter(
      (k) => rev.get(k).size === 0 && adj.get(k).size > 0
    );
    const startSeeds = roots.length > 0 ? roots : [nodeIds[0]];

    const queue = [];
    startSeeds.forEach((rKey) => {
      depthMap.set(rKey, 0);
      branchGroupMap.set(rKey, 0);
      queue.push(rKey);
    });

    let nextSectionBranchIdx = 0;
    while (queue.length > 0) {
      const curr = queue.shift();
      const currDepth = depthMap.get(curr) || 0;
      const children = Array.from(adj.get(curr) || []).sort(
        (a, b) => (nodeOrderMap.get(a) || 0) - (nodeOrderMap.get(b) || 0)
      );

      for (const child of children) {
        if (!depthMap.has(child)) {
          const nextDepth = currDepth + 1;
          depthMap.set(child, nextDepth);
          if (nextDepth === 1) {
            branchGroupMap.set(child, nextSectionBranchIdx++);
          } else {
            branchGroupMap.set(child, branchGroupMap.get(curr) || 0);
          }
          queue.push(child);
        }
      }
    }
  }

  const sinks = anyEdgeMatched
    ? nodeIds.filter((k) => adj.get(k).size === 0 && rev.get(k).size > 0)
    : [];
  const hasSingleConvergenceSink = sinks.length === 1 && nodes.length >= 3;

  nodes.forEach((node, idx) => {
    const key = nodeIds[idx];
    const depth = depthMap.has(key) ? depthMap.get(key) : idx === 0 ? 0 : 1;
    const branchGroup = branchGroupMap.has(key)
      ? branchGroupMap.get(key)
      : Math.max(0, idx - 1);

    let tier = "detail";
    if (anyEdgeMatched) {
      const inDeg = rev.get(key).size;
      const outDeg = adj.get(key).size;
      if (inDeg === 0 && outDeg > 0) {
        tier = "root";
      } else if (outDeg === 0 && inDeg > 0 && hasSingleConvergenceSink) {
        tier = "leaf";
      } else if (depth === 1 && outDeg > 0) {
        tier = "section";
      } else {
        tier = "detail";
      }
    } else {
      if (idx === 0) {
        tier = "root";
      } else if (idx === nodes.length - 1 && nodes.length >= 3) {
        tier = "leaf";
      } else {
        tier = "section";
      }
    }

    result.set(node, {
      tier,
      depth,
      branchGroup,
      index: idx,
      paletteIndex: branchGroup % 4,
      key,
    });
  });

  return result;
}

/**
 * Resolves the active theme specification from the 29 themes across 7 groups.

/**
 * Ensures SVG <defs> contains the #mb-wobble displacement filter for Handcrafted & Chalkboard modes.
 */
function ensureDropShadowFilter(svg) {
  if (!svg || typeof svg.querySelector !== "function") return;
  const doc = svg.ownerDocument || (typeof document !== "undefined" ? document : null);
  if (!doc || typeof doc.createElementNS !== "function") return;

  const ns = "http://www.w3.org/2000/svg";
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = doc.createElementNS(ns, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  if (!svg.querySelector("#mb-wobble")) {
    const wobbleFilter = doc.createElementNS(ns, "filter");
    wobbleFilter.setAttribute("id", "mb-wobble");
    wobbleFilter.setAttribute("x", "-5%");
    wobbleFilter.setAttribute("y", "-5%");
    wobbleFilter.setAttribute("width", "110%");
    wobbleFilter.setAttribute("height", "110%");

    const turb = doc.createElementNS(ns, "feTurbulence");
    turb.setAttribute("type", "fractalNoise");
    turb.setAttribute("baseFrequency", "0.025");
    turb.setAttribute("numOctaves", "2");
    turb.setAttribute("seed", "7");
    turb.setAttribute("result", "n");

    const disp = doc.createElementNS(ns, "feDisplacementMap");
    disp.setAttribute("in", "SourceGraphic");
    disp.setAttribute("in2", "n");
    disp.setAttribute("scale", "3.2");
    disp.setAttribute("xChannelSelector", "R");
    disp.setAttribute("yChannelSelector", "G");

    wobbleFilter.appendChild(turb);
    wobbleFilter.appendChild(disp);
    defs.appendChild(wobbleFilter);
  }
}


/**
 * Applies deep SVG DOM beautification matching all 29 themes across the 7 groups 1:1.
 */
function beautifySvgDom(svg, settings = {}, isDark = false) {
  if (!svg || typeof svg.querySelectorAll !== "function") return;
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
  const { themeKey, themeObj, palette } = resolveThemeSpec(merged, isDark);
  const radius =
    typeof settings.nodeRadius === "number" && Number.isFinite(settings.nodeRadius)
      ? settings.nodeRadius
      : Number.isFinite(themeObj.defaultRadius)
      ? themeObj.defaultRadius
      : Number.isFinite(merged.nodeRadius)
      ? merged.nodeRadius
      : 6;
  const svgFilter = themeObj.svgFilter || "none";
  const fontFamily =
    themeObj.fontFamily ||
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif';
  const strokeWidth = themeObj.strokeWidth || "1.5px";
  const defaultNodeStrokeWidth = themeObj.nodeStrokeWidth || strokeWidth;
  const defaultEdgeStrokeWidth = themeObj.edgeStrokeWidth || strokeWidth;

  ensureDropShadowFilter(svg);
  applyStyleProp(svg, "fontFamily", fontFamily);

  if (svgFilter !== "none") {
    applyStyleProp(svg, "filter", svgFilter);
    if (typeof svg.setAttribute === "function") {
      svg.setAttribute("filter", svgFilter);
    }
  } else {
    applyStyleProp(svg, "filter", "none");
    if (typeof svg.removeAttribute === "function") {
      svg.removeAttribute("filter");
    }
  }

  if (svg.dataset && svg.dataset.mbViewBoxPadded !== "true" && typeof svg.getAttribute === "function") {
    const vbAttr = svg.getAttribute("viewBox");
    if (vbAttr) {
      const parts = vbAttr
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
        const padX = 20;
        const padY = 14;
        const nextVb = `${parts[0] - padX} ${parts[1] - padY} ${parts[2] + padX * 2} ${parts[3] + padY * 2}`;
        svg.setAttribute("viewBox", nextVb);
        svg.dataset.mbViewBoxPadded = "true";
      }
    }
  }

  // 1. Subgraph / Cluster boxes
  const clusters = Array.from(svg.querySelectorAll(".cluster"));
  clusters.forEach((cluster) => {
    const rect = cluster.querySelector("rect");
    if (rect && !hasExplicitUserStyle(rect)) {
      rect.setAttribute("rx", String(radius));
      rect.setAttribute("ry", String(radius));
      applyStyleProp(rect, "fill", palette.cluster.fill);
      applyStyleProp(rect, "stroke", palette.cluster.stroke);
      applyStyleProp(rect, "strokeWidth", strokeWidth);
      applyStyleProp(rect, "strokeDasharray", "none");
    }
    const labels = Array.from(
      cluster.querySelectorAll(".nodeLabel, .cluster-label span, text")
    );
    labels.forEach((lbl) => {
      applyStyleProp(lbl, "color", palette.cluster.text);
      applyStyleProp(lbl, "fill", palette.cluster.text);
      applyStyleProp(lbl, "fontFamily", fontFamily);
      applyStyleProp(lbl, "fontWeight", "600");
    });
  });

  // 2. Flowchart / State / Sequence Nodes
  const needsTopology = Boolean(merged.multiToneNodes || (palette && palette.nodeMap));
  const topology = needsTopology ? classifyGraphTopology(svg) : new Map();
  const sectionList = palette.sectionPalettes || palette.branchPalettes;
  const detailList = palette.detailPalettes || palette.branchPalettes;
  const nodes = Array.from(svg.querySelectorAll(".node, .statediagram-state"));
  nodes.forEach((node, idx) => {
    const info = topology.get(node) || {
      tier: idx === 0 ? "root" : "detail",
      branchGroup: Math.max(0, idx - 1),
      paletteIndex: Math.max(0, idx - 1) % detailList.length,
      key: `node_${idx}`,
    };

    let colorSpec = palette.rootNode;
    if (palette.nodeMap && info.key && palette.nodeMap[info.key]) {
      colorSpec = palette.nodeMap[info.key];
    } else if (palette.nodeCycle && palette.nodeCycle.length > 0) {
      colorSpec = palette.nodeCycle[idx % palette.nodeCycle.length];
    } else if (merged.multiToneNodes) {
      if (info.tier === "root") {
        colorSpec = palette.rootNode;
      } else if (info.tier === "leaf") {
        colorSpec = palette.leafNode;
      } else if (info.tier === "section") {
        colorSpec = sectionList[info.branchGroup % sectionList.length];
      } else {
        colorSpec = detailList[info.branchGroup % detailList.length];
      }
    }

    if (node.dataset) {
      node.dataset.mbTier = info.tier;
      node.dataset.mbBranch = String(info.branchGroup ?? 0);
      node.dataset.mbPalette = String(info.paletteIndex);
      node.dataset.mbTheme = themeKey;
    }

    if (typeof node.querySelectorAll === "function") {
      const fos = Array.from(node.querySelectorAll("foreignObject"));
      fos.forEach((fo) => {
        if (typeof fo.setAttribute === "function") {
          fo.setAttribute("overflow", "visible");
        }
        applyStyleProp(fo, "overflow", "visible");
        if (!fo.dataset || fo.dataset.mbExpanded !== "true") {
          const origW = parseFloat((fo.getAttribute && fo.getAttribute("width")) || "0");
          if (origW > 0) {
            const extraW = 34;
            const newW = origW + extraW;
            fo.setAttribute("width", String(newW));
            const origX = fo.getAttribute("x");
            if (origX !== null && origX !== "") {
              fo.setAttribute("x", String(parseFloat(origX) - extraW / 2));
            } else if (fo.parentElement && typeof fo.parentElement.getAttribute === "function") {
              const tf = fo.parentElement.getAttribute("transform") || "";
              const m = tf.match(/translate\(\s*([-\d.]+)\s*[,\s]\s*([-\d.]+)\s*\)/i);
              if (m) {
                const tx = parseFloat(m[1]) - extraW / 2;
                const ty = parseFloat(m[2]);
                fo.parentElement.setAttribute("transform", `translate(${tx}, ${ty})`);
              }
            }
            const innerDivs = Array.from(fo.querySelectorAll("div"));
            innerDivs.forEach((d) => {
              applyStyleProp(d, "maxWidth", `${Math.max(236, newW)}px`);
            });
          }
          if (fo.dataset) fo.dataset.mbExpanded = "true";
        }
      });
    }

    const nodeStrokeW = colorSpec.strokeWidth || defaultNodeStrokeWidth;
    const shapes = Array.from(
      node.querySelectorAll(
        "rect, polygon, circle, ellipse, path.basic.label-container, path.label-container"
      )
    );
    shapes.forEach((shape) => {
      if (shape.tagName.toLowerCase() === "rect") {
        shape.setAttribute("rx", String(radius));
        shape.setAttribute("ry", String(radius));
        if (!shape.dataset || shape.dataset.mbExpanded !== "true") {
          const origRw = parseFloat((shape.getAttribute && shape.getAttribute("width")) || "0");
          const origRx = parseFloat((shape.getAttribute && shape.getAttribute("x")) || "0");
          if (origRw > 30) {
            const extraRw = 26;
            shape.setAttribute("width", String(origRw + extraRw));
            shape.setAttribute("x", String(origRx - extraRw / 2));
            if (shape.dataset) shape.dataset.mbExpanded = "true";
          }
        }
      }
      if (!hasExplicitUserStyle(shape)) {
        applyStyleProp(shape, "fill", colorSpec.fill);
        applyStyleProp(shape, "stroke", colorSpec.stroke);
        applyStyleProp(shape, "strokeWidth", nodeStrokeW);
        applyStyleProp(shape, "filter", "none");
        if (typeof shape.removeAttribute === "function") {
          shape.removeAttribute("filter");
        }
      }
    });

    const textEls = Array.from(
      node.querySelectorAll(".nodeLabel, span, div, text, tspan, p")
    );
    textEls.forEach((tEl) => {
      applyStyleProp(tEl, "color", colorSpec.text);
      applyStyleProp(tEl, "fill", colorSpec.text);
      applyStyleProp(tEl, "fontFamily", fontFamily);
    });
  });

  // 3. Sequence diagram actors & notes
  const actorColor = palette.actor || palette.rootNode;
  const noteColor = palette.note || palette.rootNode;
  const actors = Array.from(svg.querySelectorAll("rect.actor"));
  actors.forEach((actor) => {
    actor.setAttribute("rx", String(radius));
    actor.setAttribute("ry", String(radius));
    if (!hasExplicitUserStyle(actor)) {
      applyStyleProp(actor, "fill", actorColor.fill);
      applyStyleProp(actor, "stroke", actorColor.stroke);
      applyStyleProp(actor, "strokeWidth", strokeWidth);
    }
  });
  const actorTexts = Array.from(svg.querySelectorAll("text.actor > tspan, text.actor"));
  actorTexts.forEach((tEl) => {
    applyStyleProp(tEl, "fill", actorColor.text);
    applyStyleProp(tEl, "fontFamily", fontFamily);
  });

  const notes = Array.from(svg.querySelectorAll(".note, rect.note"));
  notes.forEach((note) => {
    note.setAttribute("rx", String(radius));
    note.setAttribute("ry", String(radius));
    if (!hasExplicitUserStyle(note)) {
      applyStyleProp(note, "fill", noteColor.fill);
      applyStyleProp(note, "stroke", noteColor.stroke);
      applyStyleProp(note, "strokeWidth", strokeWidth);
    }
  });
  const noteTexts = Array.from(svg.querySelectorAll("text.noteText > tspan, text.noteText"));
  noteTexts.forEach((tEl) => {
    applyStyleProp(tEl, "fill", noteColor.text);
    applyStyleProp(tEl, "fontFamily", fontFamily);
  });

  // 4. Edges, Connector Paths, and Arrowhead Markers
  const edgePaths = Array.from(
    svg.querySelectorAll(
      ".edgePath path.path, path.flowchart-link, .messageLine0, .messageLine1, .transition, line.actor-line"
    )
  );
  edgePaths.forEach((path, idx) => {
    let eStroke = palette.edge.stroke;
    let eWidth = defaultEdgeStrokeWidth;
    if (palette.edgeCycle && palette.edgeCycle.length > 0) {
      const eSpec = palette.edgeCycle[idx % palette.edgeCycle.length];
      if (eSpec) {
        if (eSpec.stroke) eStroke = eSpec.stroke;
        if (eSpec.strokeWidth) eWidth = eSpec.strokeWidth;
      }
    }
    applyStyleProp(path, "stroke", eStroke);
    applyStyleProp(path, "strokeWidth", eWidth);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    if (typeof path.removeAttribute === "function") {
      path.removeAttribute("filter");
    }
  });

  const markers = Array.from(
    svg.querySelectorAll("marker path, marker circle, marker polygon")
  );
  markers.forEach((m) => {
    applyStyleProp(m, "fill", palette.edge.stroke);
    applyStyleProp(m, "stroke", palette.edge.stroke);
  });

  // 5. Edge Labels
  const edgeLabels = Array.from(svg.querySelectorAll(".edgeLabel"));
  edgeLabels.forEach((lbl) => {
    const bgRect = lbl.querySelector("rect, .labelBkg");
    if (bgRect) {
      if (bgRect.tagName && bgRect.tagName.toLowerCase() === "rect") {
        bgRect.setAttribute("rx", "4");
        bgRect.setAttribute("ry", "4");
      }
      applyStyleProp(bgRect, "fill", palette.edge.labelBg);
      applyStyleProp(bgRect, "backgroundColor", palette.edge.labelBg);
      applyStyleProp(bgRect, "stroke", "none");
      applyStyleProp(bgRect, "border", "none");
    }
    const spans = Array.from(lbl.querySelectorAll("span, text, div, p"));
    spans.forEach((s) => {
      applyStyleProp(s, "color", palette.edge.labelText);
      applyStyleProp(s, "fill", palette.edge.labelText);
      applyStyleProp(s, "fontFamily", fontFamily);
    });
  });

  // 6. Pie Chart Slices & Legend
  const pieSlices = Array.from(svg.querySelectorAll("path.pieCircle"));
  if (pieSlices.length > 0) {
    pieSlices.forEach((slice, idx) => {
      const sliceColor = palette.pieColors[idx % palette.pieColors.length];
      applyStyleProp(slice, "fill", sliceColor);
      slice.setAttribute("fill", sliceColor);
      applyStyleProp(slice, "stroke", palette.cardBg);
      slice.setAttribute("stroke", palette.cardBg);
      applyStyleProp(slice, "strokeWidth", "2px");
    });
    const legendRects = Array.from(svg.querySelectorAll(".legend rect"));
    legendRects.forEach((r, idx) => {
      const sliceColor = palette.pieColors[idx % palette.pieColors.length];
      r.setAttribute("rx", "4");
      r.setAttribute("ry", "4");
      applyStyleProp(r, "fill", sliceColor);
      r.setAttribute("fill", sliceColor);
      applyStyleProp(r, "stroke", sliceColor);
    });
    const legendTexts = Array.from(
      svg.querySelectorAll(".legend text, .pieTitleText, text.slice")
    );
    legendTexts.forEach((tEl) => {
      applyStyleProp(tEl, "fontFamily", fontFamily);
      applyStyleProp(tEl, "fill", palette.rootNode.text);
    });
  }

  // 7. Gantt Chart Tasks & Grid
  const ganttTasks = Array.from(svg.querySelectorAll("rect.task"));
  if (ganttTasks.length > 0) {
    ganttTasks.forEach((task, idx) => {
      task.setAttribute("rx", "5");
      task.setAttribute("ry", "5");
      const color = palette.pieColors[idx % palette.pieColors.length];
      applyStyleProp(task, "fill", color);
      applyStyleProp(task, "stroke", color);
    });
    const ganttTexts = Array.from(svg.querySelectorAll("text.taskText, text.titleText, .tick text"));
    ganttTexts.forEach((tEl) => {
      applyStyleProp(tEl, "fontFamily", fontFamily);
      applyStyleProp(tEl, "fill", palette.rootNode.text);
    });
  }
}

module.exports = {
  hasExplicitUserStyle,
  applyStyleProp,
  classifyGraphTopology,
  ensureDropShadowFilter,
  beautifySvgDom,
};
