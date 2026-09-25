"use strict";

let Notice;
try {
  Notice = require("obsidian").Notice;
} catch (_err) {
  Notice = class {};
}
const { extractSvgNaturalSize } = require("./sizing.js");
const { resolveThemeSpec } = require("./themes.js");
const { beautifySvgDom, applyStyleProp } = require("./beautify.js");

function resolveLiveCssColor(val, fallback = "#ffffff") {
  if (!val || typeof val !== "string") return fallback;
  const trimmed = val.trim();
  if (!trimmed.includes("var(") && !trimmed.includes("color-mix(")) {
    return trimmed;
  }
  if (typeof document === "undefined" || !document.body) return fallback;
  try {
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.visibility = "hidden";
    probe.style.color = trimmed;
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe).color;
    probe.remove();
    return computed && computed !== "rgba(0, 0, 0, 0)" ? computed : fallback;
  } catch (_e) {
    return fallback;
  }
}

async function exportSvgAsPng(svg, settings = {}, isDark) {
  const dark =
    typeof isDark === "boolean"
      ? isDark
      : typeof document !== "undefined" &&
        document.body &&
        document.body.classList.contains("theme-dark");

  try {
    // Re-run beautifySvgDom on the source svg first so latest theme & padding are guaranteed
    beautifySvgDom(svg, settings, dark);

    let nat = null;
    const currentVb = typeof svg.getAttribute === "function" ? svg.getAttribute("viewBox") : null;
    if (currentVb) {
      const parts = currentVb.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
        nat = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
      }
    }
    if (!nat) {
      nat = extractSvgNaturalSize(svg) || { x: 0, y: 0, width: 640, height: 420 };
    }
    const scale = 3.0;
    const { themeObj, palette } = resolveThemeSpec(settings, dark);
    const resolvedCardBg = resolveLiveCssColor(
      palette.cardBg,
      dark ? "#191919" : "#FAF9F5"
    );
    const resolvedCardBorder = resolveLiveCssColor(
      palette.cardBorder,
      dark ? "#3D3934" : "#D8D2C6"
    );
    const resolvedGridDot = resolveLiveCssColor(
      palette.gridDot,
      dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
    );
    const fontFamily =
      themeObj.fontFamily ||
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei UI", sans-serif';

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.style.setProperty("width", `${nat.width}px`);
    clone.style.setProperty("height", `${nat.height}px`);
    clone.setAttribute("width", String(nat.width));
    clone.setAttribute("height", String(nat.height));

    // Resolve any CSS variables inside cloned SVG elements
    const colorProps = ["fill", "stroke", "color", "backgroundColor", "borderColor"];
    const allEls = [clone, ...Array.from(clone.querySelectorAll("*"))];
    allEls.forEach((el) => {
      if (el.style) {
        for (const prop of colorProps) {
          const rawVal = el.style[prop];
          if (rawVal && (rawVal.includes("var(") || rawVal.includes("color-mix("))) {
            const resolved = resolveLiveCssColor(rawVal, "");
            if (resolved) {
              applyStyleProp(el, prop, resolved);
            }
          }
        }
      }
      if (typeof el.getAttribute === "function") {
        for (const attr of ["fill", "stroke"]) {
          const attrVal = el.getAttribute(attr);
          if (attrVal && (attrVal.includes("var(") || attrVal.includes("color-mix("))) {
            const resolved = resolveLiveCssColor(attrVal, "");
            if (resolved) {
              el.setAttribute(attr, resolved);
            }
          }
        }
      }
    });

    // Inject standalone <style> into SVG clone so <foreignObject> never clips and fonts match
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
      svg, text, .nodeLabel, .edgeLabel, .label, foreignObject div, foreignObject span {
        font-family: ${fontFamily} !important;
        line-height: 1.42 !important;
        letter-spacing: 0.01em !important;
      }
      foreignObject {
        overflow: visible !important;
      }
    `;
    clone.insertBefore(styleEl, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const pad = 32;
    const totalW = nat.width + pad * 2;
    const totalH = nat.height + pad * 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(totalW * scale);
    canvas.height = Math.round(totalH * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    // 1. Draw Theme Canvas Background
    ctx.fillStyle = resolvedCardBg;
    ctx.fillRect(0, 0, totalW, totalH);

    // 2. Draw Subtle Architectural Grid
    if (settings.showDotGrid !== false) {
      ctx.save();
      if (settings.theme === "swiss-mono") {
        ctx.strokeStyle = resolvedGridDot;
        ctx.lineWidth = 0.75;
        const step = 20;
        for (let x = step; x < totalW; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, totalH);
          ctx.stroke();
        }
        for (let y = step; y < totalH; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(totalW, y);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = resolvedGridDot;
        const step = 18;
        for (let x = 12; x < totalW; x += step) {
          for (let y = 12; y < totalH; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, 1.05, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // 3. Draw Subtle Outer Frame Border
    ctx.strokeStyle = resolvedCardBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, totalW - 1.5, totalH - 1.5);

    // 4. Draw High-DPI SVG Diagram
    ctx.drawImage(img, pad, pad, nat.width, nat.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob && navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      new Notice(`Copied 3x HD PNG (${themeObj.name})`);
    } else if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mermaid-${settings.theme}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      new Notice("Downloaded 3x HD PNG");
    }
  } catch (err) {
    console.error("Mermaid Boost PNG export error:", err);
    new Notice("Failed to export PNG");
  }
}

module.exports = {
  resolveLiveCssColor,
  exportSvgAsPng,
};
