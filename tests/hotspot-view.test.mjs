import test from "node:test";
import assert from "node:assert/strict";

class FakeStyle {
  setProperty(name, value) {
    this[name] = String(value);
  }
}

class FakeElement extends EventTarget {
  constructor(tagName) {
    super();
    this.tagName = tagName;
    this.attributes = new Map();
    this.children = [];
    this.className = "";
    this.dataset = {};
    this.style = new FakeStyle();
    this.tabIndex = 0;
    this.textContent = "";
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }
}

globalThis.document = {
  createElement: (tagName) => new FakeElement(tagName),
  createElementNS: (_namespace, tagName) => new FakeElement(tagName),
};

const {
  hideCapabilityTrace,
  renderCapabilityTrace,
  renderHotspots,
} = await import("../js/hotspot-view.js");

const item = {
  id: "industry-research",
  label: "行业研究 Skill",
  kind: "skill",
  metrics: [{ value: "6+", label: "输出类型" }],
};

test("one active trace keeps a stable desktop rail and plate position", () => {
  const view = renderHotspots(new FakeElement("div"), [item]);
  const stage = { width: 600, height: 400 };

  renderCapabilityTrace(view, {
    item,
    index: 0,
    anchor: { x: 250, y: 120, visible: true },
    stage,
    mobile: false,
    locked: false,
  });
  const initialTransform = view.plate.style.transform;
  assert.equal(view.plate.dataset.rail, "left");

  renderCapabilityTrace(view, {
    item,
    index: 0,
    anchor: { x: 350, y: 260, visible: true },
    stage,
    mobile: false,
    locked: false,
  });

  assert.equal(view.plate.dataset.rail, "left");
  assert.equal(view.plate.style.transform, initialTransform);
  assert.match(view.tracePath.getAttribute("d"), /^M 350 260 H 212/);
  assert.match(view.tracePath.getAttribute("d"), /H 200$/);

  hideCapabilityTrace(view);
  renderCapabilityTrace(view, {
    item,
    index: 0,
    anchor: { x: 350, y: 260, visible: true },
    stage,
    mobile: false,
    locked: false,
  });
  assert.equal(view.plate.dataset.rail, "right");
});

test("disposing a hotspot view removes target and plate interactions", () => {
  const calls = [];
  const view = renderHotspots(new FakeElement("div"), [item], {
    preview: (id) => calls.push(`preview:${id}`),
    scheduleClear: () => calls.push("clear"),
    toggleLock: (id) => calls.push(`lock:${id}`),
  });
  const target = view.targets.get(item.id);

  target.dispatchEvent(new Event("pointerenter"));
  target.dispatchEvent(new Event("click"));
  view.plate.dispatchEvent(new Event("click"));
  assert.deepEqual(calls, ["preview:industry-research", "lock:industry-research"]);

  view.dispose();
  target.dispatchEvent(new Event("pointerenter"));
  target.dispatchEvent(new Event("pointerleave"));
  target.dispatchEvent(new Event("click"));
  view.plate.dispatchEvent(new Event("click"));
  assert.deepEqual(calls, ["preview:industry-research", "lock:industry-research"]);
});

test("touching a hotspot selects and locks the experience", () => {
  const calls = [];
  const view = renderHotspots(new FakeElement("div"), [item], {
    selectTouch: (id) => calls.push(`touch:${id}`),
    toggleLock: (id) => calls.push(`lock:${id}`),
  });
  const target = view.targets.get(item.id);
  const pointerDown = new Event("pointerdown");
  Object.defineProperty(pointerDown, "pointerType", { value: "touch" });

  target.dispatchEvent(pointerDown);
  target.dispatchEvent(new Event("click"));

  assert.deepEqual(calls, ["touch:industry-research"]);
});
