"use strict";

const { SIZE_PRESETS, DEFAULT_SETTINGS } = require("./settings.js");

const DIAGRAM_TYPE_LABELS = {
  flowchart: "Flowchart",
  pie: "Pie",
  gantt: "Gantt",
  sequence: "Sequence",
  state: "State",
  mindmap: "Mindmap",
  class: "Class",
  er: "ER",
  other: "Mermaid",
};


/**
 * Extracts natural width/height/x/y from an SVG element's viewBox or width/height attributes.
 */
function extractSvgNaturalSize(svg) {
  if (!svg) return null;

  if (svg.dataset && svg.dataset.mbNaturalWidth && svg.dataset.mbNaturalHeight) {
    const w = parseFloat(svg.dataset.mbNaturalWidth);
    const h = parseFloat(svg.dataset.mbNaturalHeight);
    const x = parseFloat(svg.dataset.mbNaturalX || "0");
    const y = parseFloat(svg.dataset.mbNaturalY || "0");
    if (w > 0 && h > 0) {
      return { x, y, width: w, height: h };
    }
  }

  const viewBoxAttr =
    typeof svg.getAttribute === "function" ? svg.getAttribute("viewBox") : null;
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (
      parts.length === 4 &&
      parts.every((n) => Number.isFinite(n)) &&
      parts[2] > 0 &&
      parts[3] > 0
    ) {
      return {
        x: parts[0],
        y: parts[1],
        width: parts[2],
        height: parts[3],
      };
    }
  }

  if (svg.viewBox && svg.viewBox.baseVal) {
    const vb = svg.viewBox.baseVal;
    if (vb.width > 0 && vb.height > 0) {
      return {
        x: vb.x || 0,
        y: vb.y || 0,
        width: vb.width,
        height: vb.height,
      };
    }
  }

  const attrW = parseFloat(
    (typeof svg.getAttribute === "function" && svg.getAttribute("width")) || ""
  );
  const attrH = parseFloat(
    (typeof svg.getAttribute === "function" && svg.getAttribute("height")) || ""
  );
  if (attrW > 0 && attrH > 0) {
    return { x: 0, y: 0, width: attrW, height: attrH };
  }

  const styleMaxW =
    svg.style && svg.style.maxWidth ? parseFloat(svg.style.maxWidth) : NaN;
  if (Number.isFinite(styleMaxW) && styleMaxW > 0) {
    return { x: 0, y: 0, width: styleMaxW, height: Math.round(styleMaxW * 0.65) };
  }

  return null;
}

/**

/**
 * Detects the Mermaid diagram type and orientation from SVG DOM attributes and elements.
 */
function detectDiagramType(svg, naturalSize) {
  if (!svg) {
    return { type: "other", orientation: "horizontal", label: DIAGRAM_TYPE_LABELS.other };
  }

  const role = (
    (typeof svg.getAttribute === "function" &&
      (svg.getAttribute("aria-roledescription") || svg.getAttribute("class"))) ||
    ""
  ).toLowerCase();

  const q = (sel) =>
    typeof svg.querySelector === "function" ? svg.querySelector(sel) : null;

  let type = "other";
  if (role.includes("pie") || q(".pieCircle") || q(".pieTitleText")) {
    type = "pie";
  } else if (role.includes("gantt") || (q(".grid .tick") && q(".task"))) {
    type = "gantt";
  } else if (role.includes("sequence") || q(".actor")) {
    type = "sequence";
  } else if (role.includes("state") || q(".statediagram-state")) {
    type = "state";
  } else if (role.includes("mindmap") || q(".mindmap-node")) {
    type = "mindmap";
  } else if (role.includes("class") || q(".classGroup")) {
    type = "class";
  } else if (role.includes("er") || q(".er.entityBox")) {
    type = "er";
  } else if (
    role.includes("flowchart") ||
    role.includes("graph") ||
    q(".node") ||
    q(".edgePath") ||
    q(".flowchart-link")
  ) {
    type = "flowchart";
  }

  const size = naturalSize || extractSvgNaturalSize(svg) || { width: 400, height: 300 };
  const ratio = size.width / Math.max(1, size.height);
  let orientation = "horizontal";
  if (ratio < 0.85) {
    orientation = "vertical";
  } else if (ratio <= 1.2) {
    orientation = "square";
  }

  return {
    type,
    orientation,
    aspectRatio: ratio,
    label: DIAGRAM_TYPE_LABELS[type] || DIAGRAM_TYPE_LABELS.other,
  };
}


/**
 * Tightens excessive horizontal whitespace in Mermaid pie charts.
 */
function tightenPieViewBox(svg, naturalSize) {
  if (!svg || !naturalSize) return naturalSize;
  const { x, y, width, height } = naturalSize;

  if (typeof svg.getBBox === "function") {
    try {
      const bbox = svg.getBBox();
      if (
        bbox &&
        Number.isFinite(bbox.width) &&
        Number.isFinite(bbox.height) &&
        bbox.width > 80 &&
        bbox.height > 80 &&
        bbox.width < width * 0.94
      ) {
        const padX = 24;
        const padY = 16;
        const newX = Math.round(bbox.x - padX);
        const newY = Math.round(bbox.y - padY);
        const newW = Math.max(260, Math.round(bbox.width + padX * 2));
        const newH = Math.max(200, Math.round(bbox.height + padY * 2));
        if (typeof svg.setAttribute === "function") {
          svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
        }
        return { x: newX, y: newY, width: newW, height: newH, trimmed: true };
      }
    } catch (_) {
      // Fallback
    }
  }

  if (width >= 640 && height >= 360 && width / height >= 1.5) {
    const trimLeft = Math.round(width * 0.16);
    const trimRight = Math.round(width * 0.11);
    const trimTop = Math.round(height * 0.04);
    const trimBottom = Math.round(height * 0.05);
    const newX = x + trimLeft;
    const newY = y + trimTop;
    const newW = Math.max(320, width - trimLeft - trimRight);
    const newH = Math.max(240, height - trimTop - trimBottom);
    if (typeof svg.setAttribute === "function") {
      svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
    }
    return { x: newX, y: newY, width: newW, height: newH, trimmed: true };
  }
  return { x, y, width, height, trimmed: false };
}


/**
 * Computes smart rendered dimensions (width, height, scale) and whether height collapse is needed.
 */
function computeSmartDiagramSize(naturalSize, diagramMeta, settings = {}, containerWidth = 0) {
  const merged = Object.assign({}, DEFAULT_SETTINGS, settings);
  const preset = SIZE_PRESETS[merged.sizePreset] || SIZE_PRESETS.compact;

  const baseScale =
    merged.sizePreset === "original"
      ? 1.0
      : Number.isFinite(merged.baseScale) && merged.baseScale > 0
      ? merged.baseScale
      : preset.baseScale;

  let maxHeight =
    merged.sizePreset === "original"
      ? 2400
      : Number.isFinite(merged.maxHeight) && merged.maxHeight > 0
      ? merged.maxHeight
      : preset.maxHeight;

  let maxWidth =
    merged.sizePreset === "original"
      ? 1600
      : Number.isFinite(merged.maxWidth) && merged.maxWidth > 0
      ? merged.maxWidth
      : preset.maxWidth;

  const minReadableScale =
    merged.sizePreset === "original"
      ? 1.0
      : Number.isFinite(merged.minReadableScale) && merged.minReadableScale > 0
      ? merged.minReadableScale
      : preset.minReadableScale;

  const natW = Math.max(1, (naturalSize && naturalSize.width) || 400);
  const natH = Math.max(1, (naturalSize && naturalSize.height) || 300);
  const type = (diagramMeta && diagramMeta.type) || "flowchart";

  if (merged.sizePreset !== "original") {
    if (type === "pie") {
      maxHeight = Math.min(maxHeight, merged.sizePreset === "compact" ? 235 : 280);
      maxWidth = Math.min(maxWidth, merged.sizePreset === "compact" ? 430 : 500);
    } else if (type === "gantt") {
      maxHeight = Math.min(maxHeight, merged.sizePreset === "compact" ? 260 : 320);
      maxWidth = Math.max(maxWidth, 640);
    }
  }

  const effectiveContainerW =
    Number.isFinite(containerWidth) && containerWidth > 0
      ? Math.max(40, containerWidth - (containerWidth > 80 ? 32 : 16))
      : maxWidth;

  const availableWidth = Math.min(maxWidth, effectiveContainerW);

  const scaleW = availableWidth / natW;
  const scaleH = maxHeight / natH;

  const idealScale = Math.min(baseScale, scaleW, scaleH);
  const readableFloor = Math.min(scaleW, Math.max(minReadableScale, idealScale));
  const finalScale = Math.min(
    scaleW,
    Math.max(0.05, Math.min(1.5, readableFloor))
  );

  const renderWidth = Math.min(
    availableWidth,
    Math.max(Math.min(40, availableWidth), Math.round(natW * finalScale))
  );
  const renderHeight = Math.max(30, Math.round(natH * finalScale));

  const needsHeightCollapse =
    Boolean(merged.autoCollapseTall) &&
    merged.sizePreset !== "original" &&
    renderHeight > maxHeight * 1.12;

  return {
    naturalWidth: natW,
    naturalHeight: natH,
    width: renderWidth,
    height: renderHeight,
    scale: Number(finalScale.toFixed(3)),
    maxHeight,
    maxWidth: availableWidth,
    needsHeightCollapse,
    collapsedHeight: needsHeightCollapse ? maxHeight : renderHeight,
  };
}

module.exports = {
  DIAGRAM_TYPE_LABELS,
  extractSvgNaturalSize,
  detectDiagramType,
  tightenPieViewBox,
  computeSmartDiagramSize,
};
