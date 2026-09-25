"use strict";

function createMockElement(tagName, attrs = {}, children = []) {
  const attributes = Object.assign({}, attrs);
  const styleObj = {};
  const stylePriorities = {};
  const dataset = {};
  const listeners = new Map();
  const classSet = new Set(
    (attributes.class || "")
      .split(/\s+/)
      .filter(Boolean)
  );

  const styleProxy = {
    setProperty(k, v, p = "") {
      styleObj[k] = String(v);
      stylePriorities[k] = p || "";
    },
    removeProperty(k) {
      delete styleObj[k];
      delete stylePriorities[k];
    },
    getPropertyValue(k) {
      return styleObj[k] || "";
    },
    getPropertyPriority(k) {
      return stylePriorities[k] || "";
    },
  };

  const style = new Proxy(styleProxy, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return styleObj[prop];
    },
    set(target, prop, value) {
      if (prop in target) {
        target[prop] = value;
        return true;
      }
      styleObj[prop] = String(value);
      return true;
    },
    deleteProperty(target, prop) {
      delete styleObj[prop];
      delete stylePriorities[prop];
      return true;
    },
  });

  const childList = [];
  const setConnected = (node, connected) => {
    if (!node) return;
    node.isConnected = connected;
    for (const child of node.children || []) {
      setConnected(child, connected);
    }
  };

  const el = {
    tagName: tagName.toUpperCase(),
    style,
    dataset,
    children: childList,
    parentElement: null,
    parentNode: null,
    isConnected: true,
    clientWidth: 640,
    clientHeight: 480,
    get firstChild() {
      return childList[0] || null;
    },
    get textContent() {
      return this._textContent !== undefined
        ? this._textContent
        : childList.map((c) => (c && c.textContent ? c.textContent : "")).join("");
    },
    set textContent(val) {
      this._textContent = String(val);
      childList.length = 0;
    },
    get innerHTML() {
      return this._innerHTML || "";
    },
    set innerHTML(val) {
      this._innerHTML = String(val);
      if (val === "") {
        childList.length = 0;
      }
    },
    get className() {
      return Array.from(classSet).join(" ");
    },
    set className(val) {
      classSet.clear();
      attributes.class = String(val);
      String(val)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((c) => classSet.add(c));
    },
    get id() {
      return attributes.id || "";
    },
    set id(val) {
      attributes.id = String(val);
    },
    get title() {
      return attributes.title || "";
    },
    set title(val) {
      attributes.title = String(val);
    },
    get type() {
      return attributes.type || "";
    },
    set type(val) {
      attributes.type = String(val);
    },
    classList: {
      contains: (c) => classSet.has(c),
      add: (...cs) => {
        cs.forEach((c) => classSet.add(c));
        attributes.class = Array.from(classSet).join(" ");
      },
      remove: (...cs) => {
        cs.forEach((c) => classSet.delete(c));
        attributes.class = Array.from(classSet).join(" ");
      },
      toggle: (c, force) => {
        const next = force !== undefined ? Boolean(force) : !classSet.has(c);
        if (next) classSet.add(c);
        else classSet.delete(c);
        attributes.class = Array.from(classSet).join(" ");
        return next;
      },
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
    removeAttribute(name) {
      delete attributes[name];
      if (name === "class") {
        classSet.clear();
      }
    },
    appendChild(child) {
      if (child && child.parentElement && child.parentElement !== el) {
        child.remove();
      }
      if (child) {
        child.parentElement = el;
        child.parentNode = el;
        setConnected(child, Boolean(el.isConnected));
        childList.push(child);
      }
      return child;
    },
    insertBefore(child, referenceNode) {
      if (child && child.parentElement && child.parentElement !== el) {
        child.remove();
      }
      if (child) {
        child.parentElement = el;
        child.parentNode = el;
        setConnected(child, Boolean(el.isConnected));
        const idx = referenceNode ? childList.indexOf(referenceNode) : -1;
        if (idx !== -1) {
          childList.splice(idx, 0, child);
        } else {
          childList.unshift(child);
        }
      }
      return child;
    },
    remove() {
      if (this.parentElement) {
        const idx = this.parentElement.children.indexOf(this);
        if (idx !== -1) {
          this.parentElement.children.splice(idx, 1);
        }
        this.parentElement = null;
        this.parentNode = null;
      }
      setConnected(this, false);
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (listeners.has(type)) {
        listeners.get(type).delete(fn);
      }
    },
    dispatchEvent(event) {
      const type = event.type || event;
      const ev =
        typeof event === "string"
          ? {
              type,
              target: this,
              currentTarget: this,
              stopPropagation() {},
              preventDefault() {},
            }
          : event;
      ev.target = ev.target || this;
      ev.currentTarget = this;
      if (typeof ev.stopPropagation !== "function") ev.stopPropagation = () => {};
      if (typeof ev.preventDefault !== "function") ev.preventDefault = () => {};

      if (listeners.has(type)) {
        for (const handler of Array.from(listeners.get(type))) {
          handler.call(this, ev);
        }
      }
      return !ev.defaultPrevented;
    },
    click() {
      return this.dispatchEvent({ type: "click" });
    },
    closest(selector) {
      const selectors = selector.split(",").map((s) => s.trim());
      let cur = this;
      while (cur) {
        for (const sel of selectors) {
          if (
            sel.startsWith(".") &&
            cur.classList &&
            cur.classList.contains(sel.slice(1))
          ) {
            return cur;
          }
          if (sel.toLowerCase() === (cur.tagName || "").toLowerCase()) {
            return cur;
          }
        }
        cur = cur.parentElement;
      }
      return null;
    },
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: this.clientWidth,
        height: this.clientHeight,
        bottom: this.clientHeight,
        right: this.clientWidth,
      };
    },
    cloneNode(deep = false) {
      const clonedAttrs = Object.assign({}, attributes);
      if (classSet.size > 0) {
        clonedAttrs.class = Array.from(classSet).join(" ");
      }
      const clonedChildren = deep
        ? childList.map((c) => (c && c.cloneNode ? c.cloneNode(true) : c))
        : [];
      const clone = createMockElement(tagName, clonedAttrs, clonedChildren);
      for (const [k, v] of Object.entries(styleObj)) {
        clone.style.setProperty(k, v, stylePriorities[k]);
      }
      for (const [k, v] of Object.entries(dataset)) {
        clone.dataset[k] = v;
      }
      clone.clientWidth = this.clientWidth;
      clone.clientHeight = this.clientHeight;
      if (this._textContent !== undefined) {
        clone._textContent = this._textContent;
      }
      return clone;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const results = [];
      const selectors = selector.split(",").map((s) => s.trim());

      const matchesSingle = (node, sel) => {
        if (!node) return false;
        if (sel === "*") return true;
        if (sel.startsWith("#")) return node.getAttribute("id") === sel.slice(1);
        const tag = (node.tagName || "").toLowerCase();
        if (sel === "defs" || sel === "svg" || sel === "rect" || sel === "button" || sel === "span" || sel === "div" || sel === "g") {
          return tag === sel;
        }
        if (sel === "path.pieCircle") {
          return tag === "path" && node.classList && node.classList.contains("pieCircle");
        }
        if (sel === "path.flowchart-link") {
          return tag === "path" && node.classList && node.classList.contains("flowchart-link");
        }
        if (sel === ".legend rect") {
          return tag === "rect" && node._parentClass === "legend";
        }
        const classMatch = sel.match(/^([a-zA-Z0-9_-]+)?\.([a-zA-Z0-9_-]+)$/);
        if (classMatch) {
          const [, t, cls] = classMatch;
          if (t && tag !== t.toLowerCase()) return false;
          return (
            (node.classList && node.classList.contains(cls)) ||
            (node.className && node.className.split(/\s+/).includes(cls))
          );
        }
        if (sel === "rect, polygon, circle, ellipse, path.basic.label-container") {
          return ["rect", "polygon", "circle", "ellipse"].includes(tag);
        }
        const attrMatch = sel.match(/^([a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]$/);
        if (attrMatch) {
          const [, t, attr, val] = attrMatch;
          if (t && tag !== t.toLowerCase()) return false;
          if (val === undefined) return node.getAttribute(attr) !== null;
          return (
            node.getAttribute(attr) === val ||
            (node[attr] !== undefined && String(node[attr]) === val)
          );
        }
        return false;
      };

      for (const sel of selectors) {
        if (sel.startsWith(":scope > ")) {
          const directSel = sel.slice(9).trim();
          for (const child of childList) {
            if (matchesSingle(child, directSel)) {
              if (!results.includes(child)) results.push(child);
            }
          }
        } else {
          const walk = (node) => {
            for (const child of node.children || []) {
              if (matchesSingle(child, sel)) {
                if (!results.includes(child)) results.push(child);
              }
              walk(child);
            }
          };
          walk(this);
        }
      }
      return results;
    },
    ownerDocument: {
      createElement(tag) {
        return createMockElement(tag);
      },
      createElementNS(_ns, tag) {
        return createMockElement(tag);
      },
    },
  };

  if (children && children.length > 0) {
    for (const child of children) {
      el.appendChild(child);
    }
  }

  return el;
}

module.exports = {
  createMockElement,
};
