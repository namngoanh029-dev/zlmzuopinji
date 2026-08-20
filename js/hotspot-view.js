import { buildTraceLayout } from "./trace-layout.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const TARGET_SIZE = 72;
const TOUCH_TARGET_SIZE = 44;
const PLATE_HEIGHT = 78;
const PLATE_WIDTH = 184;

const metricText = (item) => {
  const metric = item.metrics?.[0];
  return metric ? `${metric.value} · ${metric.label}` : "查看详情";
};

export function fallbackHotspotPositions(items, stage) {
  const width = Math.max(1, stage.width);
  const height = Math.max(1, stage.height);
  return Object.fromEntries(
    items.map((item, index) => {
      const anchor = Array.isArray(item.anchor) ? item.anchor : [];
      const xRatio = Number.isFinite(anchor[0]) ? 0.5 + anchor[0] * 0.16 : index % 2 ? 0.68 : 0.32;
      const yRatio = Number.isFinite(anchor[1]) ? 0.5 - anchor[1] * 0.15 : 0.25 + index * 0.12;
      return [
        item.id,
        {
          x: Math.max(12, Math.min(width - 12, xRatio * width)),
          y: Math.max(12, Math.min(height - 12, yRatio * height)),
          visible: true,
        },
      ];
    }),
  );
}

export function renderHotspots(container, items, handlers = {}) {
  const safeHandlers = handlers ?? {};
  const listenerCleanups = [];
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    listenerCleanups.push(() => target.removeEventListener(type, handler));
  };
  container.replaceChildren();
  container.dataset.traceVisible = "false";
  container.dataset.explore = "false";

  const traceSvg = document.createElementNS(SVG_NAMESPACE, "svg");
  traceSvg.setAttribute("class", "capability-trace");
  traceSvg.setAttribute("aria-hidden", "true");
  const tracePath = document.createElementNS(SVG_NAMESPACE, "path");
  tracePath.setAttribute("class", "capability-trace-path");
  tracePath.setAttribute("pathLength", "1");
  traceSvg.append(tracePath);
  container.append(traceSvg);

  const targets = new Map();
  for (const [index, item] of items.entries()) {
    const target = document.createElement("button");
    target.type = "button";
    target.className = "skill-sticker";
    target.dataset.itemId = item.id;
    target.dataset.region = item.region ?? "face";
    target.dataset.projectedVisible = "true";
    target.setAttribute("aria-label", `${item.label}，${metricText(item)}`);
    target.setAttribute("aria-pressed", "false");
    target.style.setProperty("--node-index", String(index));

    const node = document.createElement("span");
    node.className = "capability-node";
    node.setAttribute("aria-hidden", "true");
    target.append(node);

    let pointerType = "";
    listen(target, "pointerdown", (event) => {
      pointerType = event.pointerType;
    });
    listen(target, "pointerenter", () => safeHandlers.preview?.(item.id));
    listen(target, "focus", () => safeHandlers.preview?.(item.id));
    listen(target, "click", () => {
      if (pointerType === "touch") safeHandlers.selectTouch?.(item.id);
      else safeHandlers.toggleLock?.(item.id);
      pointerType = "";
    });
    targets.set(item.id, target);
    container.append(target);
  }

  const plate = document.createElement("button");
  plate.type = "button";
  plate.className = "capability-plate";
  plate.tabIndex = -1;
  plate.setAttribute("aria-hidden", "true");
  plate.setAttribute("aria-pressed", "false");

  const plateIndex = document.createElement("span");
  plateIndex.className = "capability-plate-index";
  const plateKind = document.createElement("span");
  plateKind.className = "capability-plate-kind";
  const plateTitle = document.createElement("strong");
  plateTitle.className = "capability-plate-title";
  const plateResult = document.createElement("span");
  plateResult.className = "capability-plate-result";
  plate.append(plateIndex, plateKind, plateTitle, plateResult);
  container.append(plate);

  const view = {
    container,
    targets,
    traceSvg,
    tracePath,
    plate,
    plateIndex,
    plateKind,
    plateTitle,
    plateResult,
    activeId: null,
    activeRail: null,
    activePlateY: null,
    layoutMode: null,
    dispose: () => {
      for (const cleanup of listenerCleanups.splice(0)) cleanup();
    },
  };

  listen(plate, "pointerenter", () => safeHandlers.cancelClear?.());
  listen(plate, "focus", () => safeHandlers.cancelClear?.());
  listen(plate, "click", () => {
    if (view.activeId) safeHandlers.toggleLock?.(view.activeId);
  });

  return view;
}

export function positionHotspotTargets(view, positions, touch = false) {
  const size = touch ? TOUCH_TARGET_SIZE : TARGET_SIZE;
  for (const [id, target] of view.targets) {
    const point = positions[id];
    target.dataset.projectedVisible = String(Boolean(point?.visible));
    if (!point?.visible) continue;
    target.style.transform = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px) translate(-50%, -50%)`;
  }
}

export function renderCapabilityTrace(view, { item, index, anchor, stage, mobile, locked }) {
  const itemChanged = view.activeId !== item.id;
  const layoutMode = mobile ? "mobile" : "desktop";
  const layoutChanged = itemChanged || view.layoutMode !== layoutMode;
  view.activeId = item.id;
  view.layoutMode = layoutMode;
  if (layoutChanged) {
    view.activeRail = null;
    view.activePlateY = null;
  }
  view.container.dataset.traceVisible = "true";
  view.container.dataset.activeId = item.id;

  if (item.region) {
    view.container.dataset.traceVisible = "false";
    view.plate.setAttribute("aria-hidden", "true");
    view.plate.setAttribute("aria-pressed", "false");
    view.plate.tabIndex = -1;
    view.tracePath.setAttribute("d", "");
    return;
  }

  view.plate.setAttribute("aria-hidden", "false");
  view.plate.setAttribute("aria-pressed", String(locked));
  view.plate.tabIndex = 0;

  if (itemChanged) {
    view.plateIndex.textContent = String(index + 1).padStart(2, "0");
    view.plateKind.textContent = item.kind.toUpperCase();
    view.plateTitle.textContent = item.label;
    view.plateResult.textContent = metricText(item);
  }

  const plateWidth = Math.max(0, Math.min(PLATE_WIDTH, stage.width - 32));
  const layout = buildTraceLayout({
    anchor,
    stage,
    plate: { width: plateWidth, height: PLATE_HEIGHT },
    mobile,
    rail: view.activeRail,
    plateY: view.activePlateY,
  });
  if (layoutChanged) {
    view.activeRail = layout.rail;
    view.activePlateY = layout.plateY;
  }
  view.tracePath.setAttribute("d", layout.path);
  view.plate.dataset.rail = layout.rail;
  view.plate.style.transform = `translate(${layout.plateX}px, ${layout.plateY}px)`;
}

export function hideCapabilityTrace(view) {
  view.activeId = null;
  view.activeRail = null;
  view.activePlateY = null;
  view.layoutMode = null;
  view.container.dataset.traceVisible = "false";
  delete view.container.dataset.activeId;
  view.plate.setAttribute("aria-hidden", "true");
  view.plate.setAttribute("aria-pressed", "false");
  view.plate.tabIndex = -1;
}
