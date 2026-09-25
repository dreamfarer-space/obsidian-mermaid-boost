"use strict";

function createMockElement(tagName, attrs = {}, children = []) {
  const attributes = Object.assign({}, attrs);
  const style = {};
  const dataset = {};
  const classSet = new Set(
    (attributes.class || "")
      .split(/\s+/)
      .filter(Boolean)
  );

  const el = {
    tagName: tagName.toUpperCase(),
    style,
    dataset,
    children,
    firstChild: children[0] || null,
    classList: {
      contains: (c) => classSet.has(c),
      add: (...cs) => cs.forEach((c) => classSet.add(c)),
      remove: (...cs) => cs.forEach((c) => classSet.delete(c)),
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? String(attributes[name])
        : null;
    },
    setAttribute(name, val) {
      attributes[name] = String(val);
      if (name === "class") {
        classSet.clear();
        String(val)
          .split(/\s+/)
          .filter(Boolean)
          .forEach((c) => classSet.add(c));
      }
    },
    appendChild(child) {
      children.push(child);
      if (!this.firstChild) this.firstChild = child;
      return child;
    },
    insertBefore(child) {
      children.unshift(child);
      this.firstChild = children[0];
      return child;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const results = [];
      const selectors = selector.split(",").map((s) => s.trim());
      const matchesSingle = (node, sel) => {
        if (sel === "#mb-node-shadow") return node.getAttribute("id") === "mb-node-shadow";
        if (sel === "defs") return node.tagName.toLowerCase() === "defs";
        if (sel === "rect") return node.tagName.toLowerCase() === "rect";
        if (sel === "path.pieCircle")
          return node.tagName.toLowerCase() === "path" && node.classList.contains("pieCircle");
        if (sel === "path.flowchart-link")
          return node.tagName.toLowerCase() === "path" && node.classList.contains("flowchart-link");
        if (sel === ".legend rect")
          return node.tagName.toLowerCase() === "rect" && node._parentClass === "legend";
        if (sel.startsWith(".")) {
          const cls = sel.slice(1);
          return node.classList.contains(cls);
        }
        if (sel === "rect, polygon, circle, ellipse, path.basic.label-container") {
          return ["rect", "polygon", "circle", "ellipse"].includes(
            node.tagName.toLowerCase()
          );
        }
        return false;
      };
      const walk = (node) => {
        for (const child of node.children || []) {
          if (selectors.some((sel) => matchesSingle(child, sel))) {
            results.push(child);
          }
          walk(child);
        }
      };
      walk(this);
      return results;
    },
    ownerDocument: {
      createElementNS(_ns, tag) {
        return createMockElement(tag);
      },
    },
  };
  return el;
}

module.exports = {
  createMockElement,
};
