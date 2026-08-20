import { CASE_ITEMS, CAPABILITY_ITEMS, EXPERIENCE_TIMELINE, PORTFOLIO_ITEMS } from "./content.js?v=20260820-sports-health";
import { initialState, reducePortfolioState, visibleItemId, visibleTraceId } from "./state.js";
import {
  renderExperienceTimeline,
  renderFallbackList,
  renderPanel,
  renderSelectedCases,
  renderStories,
  renderWorkingMethod,
} from "./dom.js?v=20260820-sports-health";
import {
  fallbackHotspotPositions,
  hideCapabilityTrace,
  positionHotspotTargets,
  renderCapabilityTrace,
  renderHotspots,
} from "./hotspot-view.js";

const itemFor = (id) => PORTFOLIO_ITEMS.find((item) => item.id === id) ?? PORTFOLIO_ITEMS[0];
const HOVER_CLEAR_DELAY = 420;

export function bootstrapPortfolio(root = document) {
  const panel = root.querySelector("#case-panel");
  const hero = root.querySelector(".hero");
  const hotspotLayer = root.querySelector("#hotspot-layer");
  const stories = root.querySelector("#case-stories");
  const fallbackList = root.querySelector("#fallback-project-list");
  const experienceTimeline = root.querySelector("#experience-timeline");
  const selectedCases = root.querySelector("#selected-cases");
  const workingMethod = root.querySelector("#working-method");
  const sceneShell = root.querySelector(".scene-shell");
  const sceneStatus = root.querySelector("#scene-status");
  const canvas = root.querySelector("#avatar-canvas");
  if (!panel || !hero || !hotspotLayer || !stories || !fallbackList || !experienceTimeline || !selectedCases || !workingMethod || !sceneShell) return null;

  let state = initialState;
  let avatarScene = null;
  let latestAnchors = null;
  let storyObserver = null;
  let discoveryObserver = null;
  let clearTimer = null;
  let discoveryTimer = null;
  let disposed = false;

  const reduceMotion = () =>
    globalThis.window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const useMobilePanel = () =>
    globalThis.window?.matchMedia?.("(max-width: 720px)")?.matches ?? false;

  const useTouchInput = () =>
    globalThis.window?.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ?? false;

  const scrollToPanel = () => {
    panel.scrollIntoView?.({
      behavior: reduceMotion() ? "auto" : "smooth",
      block: "end",
    });
  };

  let render = () => {};
  const dispatch = (action) => {
    if (disposed) return state;
    state = reducePortfolioState(state, action);
    render();
    return state;
  };

  const cancelClear = () => {
    if (clearTimer !== null) globalThis.clearTimeout(clearTimer);
    clearTimer = null;
  };

  const scheduleClear = () => {
    if (state.lockedId) return;
    cancelClear();
    clearTimer = globalThis.setTimeout(() => dispatch({ type: "CLEAR_PREVIEW" }), HOVER_CLEAR_DELAY);
  };

  const toggleLock = (id) => {
    cancelClear();
    const next = dispatch({ type: "TOGGLE_LOCK", id });
    if (next.lockedId === id && useMobilePanel()) scrollToPanel();
    return next;
  };

  const hotspotView = renderHotspots(hotspotLayer, CAPABILITY_ITEMS, {
    preview: (id) => {
      cancelClear();
      dispatch({ type: "PREVIEW", id });
    },
    scheduleClear,
    cancelClear,
    selectTouch: toggleLock,
    toggleLock,
  });

  const fallbackHandlers = {
    activate: (id) => dispatch({ type: "ACTIVATE", id }),
    toggleLock,
    select: (id) => dispatch({ type: "ACTIVATE", id }),
  };

  const stageSize = () => {
    const rect = sceneShell.getBoundingClientRect?.() ?? { width: 1, height: 1 };
    return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
  };

  const currentAnchors = () => latestAnchors ?? fallbackHotspotPositions(CAPABILITY_ITEMS, stageSize());

  const updateTrace = () => {
    const positions = currentAnchors();
    const touch = useTouchInput();
    positionHotspotTargets(hotspotView, positions, touch);
    hotspotView.container.dataset.explore = String(state.exploreMode);

    const id = visibleTraceId(state);
    const anchor = id ? positions[id] : null;
    if (!id || !anchor?.visible) {
      hideCapabilityTrace(hotspotView);
      return;
    }

    renderCapabilityTrace(hotspotView, {
      item: itemFor(id),
      index: CAPABILITY_ITEMS.findIndex((item) => item.id === id),
      anchor,
      stage: stageSize(),
      mobile: touch || useMobilePanel(),
      locked: state.lockedId === id,
    });
  };

  render = () => {
    const item = itemFor(visibleItemId(state));
    renderPanel(panel, item, state.lockedId === item.id, {
      dismiss: (id) => {
        dispatch({ type: "DISMISS_TRACE" });
        root.querySelector(`#fallback-project-list [data-item-id="${id}"]`)?.focus?.();
      },
    });

    const traceId = visibleTraceId(state);
    avatarScene?.setActiveMarker?.(traceId);
    avatarScene?.focusAnchor?.(traceId);
    panel.dataset.visible = String(Boolean(traceId));
    hero.dataset.detailVisible = String(Boolean(traceId));
    for (const [id, target] of hotspotView.targets) {
      target.dataset.active = String(id === traceId);
      target.dataset.visited = String(state.visitedIds.has(id));
      target.setAttribute("aria-pressed", String(state.lockedId === id));
    }

    root.querySelectorAll(".fallback-entry").forEach((button) => {
      button.dataset.active = String(button.dataset.itemId === item.id);
      button.dataset.visited = String(state.visitedIds.has(button.dataset.itemId));
      button.setAttribute("aria-pressed", String(state.lockedId === button.dataset.itemId));
    });
    root.querySelectorAll(".case-card").forEach((card) => {
      const id = card.dataset.caseId;
      const active = id === item.id;
      card.dataset.active = String(active);
      card.dataset.visited = String(state.visitedIds.has(id));
      card.querySelector(".case-card-trigger")?.setAttribute("aria-pressed", String(state.lockedId === id));
    });
    updateTrace();
  };

  renderExperienceTimeline(experienceTimeline, EXPERIENCE_TIMELINE);
  renderSelectedCases(selectedCases, CASE_ITEMS, { select: toggleLock });
  renderWorkingMethod(workingMethod, itemFor("working-method"));
  renderStories(stories, CASE_ITEMS, fallbackHandlers);
  renderFallbackList(fallbackList, CAPABILITY_ITEMS, fallbackHandlers);
  render();

  if (typeof IntersectionObserver !== "undefined") {
    storyObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) dispatch({ type: "SET_CHAPTER", id: visible.target.dataset.chapterId });
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: 0 },
    );
    root.querySelectorAll("[data-chapter-id]").forEach((section) => storyObserver.observe(section));
  }

  if (typeof IntersectionObserver !== "undefined" && !reduceMotion()) {
    discoveryObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        sceneShell.classList.add("is-discovering");
        discoveryTimer = globalThis.setTimeout(() => sceneShell.classList.remove("is-discovering"), 1400);
        discoveryObserver?.disconnect();
      },
      { threshold: 0.45 },
    );
    discoveryObserver.observe(sceneShell);
  }

  const handleKeydown = (event) => {
    if (event.key === "Escape") dispatch({ type: "DISMISS_TRACE" });
  };

  const handleScenePointerDown = (event) => {
    if (event.target.closest?.(".skill-sticker")) {
      if (event.pointerType !== "touch") dispatch({ type: "DISMISS_TRACE" });
      return;
    }
    if (event.target.closest?.(".capability-plate")) return;
    if (event.pointerType === "touch" && !state.exploreMode) {
      dispatch({ type: "SET_EXPLORE", value: true });
      return;
    }
    dispatch({ type: "DISMISS_TRACE" });
  };

  const handlePageHide = (event) => {
    if (!event.persisted) dispose();
  };

  const markSceneFallback = () => {
    sceneShell.dataset.modelStatus = "fallback";
    if (sceneStatus) sceneStatus.textContent = "占位人偶 / FALLBACK";
  };

  const markSceneReady = () => {
    sceneShell.dataset.modelStatus = "ready";
    if (sceneStatus) sceneStatus.textContent = "个人模型 / GLB";
  };

  const handleResize = () => {
    avatarScene?.resize?.();
    updateTrace();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelClear();
    if (discoveryTimer !== null) globalThis.clearTimeout(discoveryTimer);
    globalThis.window?.removeEventListener?.("resize", handleResize);
    globalThis.window?.removeEventListener?.("keydown", handleKeydown);
    globalThis.window?.removeEventListener?.("pagehide", handlePageHide);
    sceneShell.removeEventListener?.("pointerdown", handleScenePointerDown);
    hero.removeEventListener?.("pointerenter", cancelClear);
    hero.removeEventListener?.("pointerleave", scheduleClear);
    hotspotView.dispose?.();
    storyObserver?.disconnect?.();
    discoveryObserver?.disconnect?.();
    storyObserver = null;
    discoveryObserver = null;
    avatarScene?.dispose?.();
    avatarScene = null;
    latestAnchors = null;
  };

  globalThis.window?.addEventListener?.("keydown", handleKeydown);
  sceneShell.addEventListener?.("pointerdown", handleScenePointerDown);
  hero.addEventListener?.("pointerenter", cancelClear);
  hero.addEventListener?.("pointerleave", scheduleClear);
  if (canvas) canvas.setAttribute("aria-label", "可拖拽旋转的个人 3D 模型，双击回到正面");

  const sceneReady = import("./scene.js?v=20260819-moving-regions-2")
    .then(({ createAvatarScene }) => {
      if (disposed) return null;
      if (!canvas) {
        markSceneFallback();
        return null;
      }

      try {
        const modelUrl = sceneShell.dataset.modelUrl || null;
        avatarScene = createAvatarScene({
          canvas,
          modelUrl,
          anchors: CAPABILITY_ITEMS.map(({ id, anchor, region }) => ({ id, anchor, region })),
          onAnchors: (positions) => {
            if (disposed) return;
            latestAnchors = positions;
            updateTrace();
          },
          onReady: markSceneReady,
          onFallback: markSceneFallback,
        });
      } catch (_error) {
        markSceneFallback();
        return null;
      }

      handleResize();
      render();
      globalThis.window?.addEventListener?.("resize", handleResize);
      return avatarScene;
    })
    .catch((_error) => {
      if (!disposed) markSceneFallback();
      return null;
    });

  globalThis.window?.addEventListener?.("pagehide", handlePageHide);

  return {
    getState: () => state,
    dispatch,
    sceneReady,
    dispose,
  };
}

if (typeof document !== "undefined") {
  bootstrapPortfolio(document);
}
