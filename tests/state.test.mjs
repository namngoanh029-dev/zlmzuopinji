import test from "node:test";
import assert from "node:assert/strict";
import * as stateModule from "../js/state.js";

const { initialState, reducePortfolioState, visibleItemId } = stateModule;

test("initial state starts on refund automation without a preview or trace lock", () => {
  assert.equal(initialState.activeId, "refund-automation");
  assert.equal(initialState.previewId, null);
  assert.equal(initialState.exploreMode, false);
  assert.equal(initialState.lockedId, null);
});

test("hover activates a hotspot without locking it", () => {
  const next = reducePortfolioState(initialState, { type: "ACTIVATE", id: "retail-radar" });
  assert.equal(next.activeId, "retail-radar");
  assert.equal(next.lockedId, null);
});

test("preview activates and records a hotspot without locking it", () => {
  const next = reducePortfolioState(initialState, { type: "PREVIEW", id: "retail-radar" });

  assert.equal(next.activeId, "retail-radar");
  assert.equal(next.previewId, "retail-radar");
  assert.equal(next.lockedId, null);
  assert.deepEqual([...next.visitedIds], ["retail-radar"]);
});

test("preview is ignored while a trace is locked", () => {
  const locked = reducePortfolioState(initialState, { type: "TOGGLE_LOCK", id: "ai-audit" });
  const next = reducePortfolioState(locked, { type: "PREVIEW", id: "retail-radar" });

  assert.strictEqual(next, locked);
});

test("clear preview removes only an unlocked preview", () => {
  const previewed = reducePortfolioState(initialState, { type: "PREVIEW", id: "retail-radar" });
  const cleared = reducePortfolioState(previewed, { type: "CLEAR_PREVIEW" });

  assert.equal(cleared.previewId, null);
  assert.equal(cleared.activeId, "retail-radar");
  assert.strictEqual(reducePortfolioState(cleared, { type: "CLEAR_PREVIEW" }), cleared);

  const locked = reducePortfolioState(initialState, { type: "TOGGLE_LOCK", id: "ai-audit" });
  assert.strictEqual(reducePortfolioState(locked, { type: "CLEAR_PREVIEW" }), locked);
});

test("click locks a hotspot and clicking it again unlocks it", () => {
  const locked = reducePortfolioState(initialState, { type: "TOGGLE_LOCK", id: "ai-audit" });
  assert.equal(locked.activeId, "ai-audit");
  assert.equal(locked.previewId, "ai-audit");
  assert.equal(locked.lockedId, "ai-audit");
  const unlocked = reducePortfolioState(locked, { type: "TOGGLE_LOCK", id: "ai-audit" });
  assert.equal(unlocked.activeId, "ai-audit");
  assert.equal(unlocked.previewId, null);
  assert.equal(unlocked.lockedId, null);
});

test("locking another hotspot moves the lock and preview to it", () => {
  const first = reducePortfolioState(initialState, { type: "TOGGLE_LOCK", id: "ai-audit" });
  const second = reducePortfolioState(first, { type: "TOGGLE_LOCK", id: "retail-radar" });

  assert.equal(second.activeId, "retail-radar");
  assert.equal(second.previewId, "retail-radar");
  assert.equal(second.lockedId, "retail-radar");
});

test("explore mode toggles on and off", () => {
  const entered = reducePortfolioState(initialState, { type: "SET_EXPLORE" });
  const exited = reducePortfolioState(entered, { type: "SET_EXPLORE" });

  assert.equal(entered.exploreMode, true);
  assert.equal(exited.exploreMode, false);
});

test("explore mode honors an explicit boolean value", () => {
  const entered = reducePortfolioState(initialState, { type: "SET_EXPLORE", value: true });
  const kept = reducePortfolioState(entered, { type: "SET_EXPLORE", value: true });

  assert.equal(entered.exploreMode, true);
  assert.equal(kept.exploreMode, true);
});

test("dismiss trace clears trace-only state and preserves the current item, chapter, and visits", () => {
  const previewed = reducePortfolioState(initialState, { type: "PREVIEW", id: "retail-radar" });
  const locked = reducePortfolioState(previewed, { type: "TOGGLE_LOCK", id: "retail-radar" });
  const exploring = reducePortfolioState(locked, { type: "SET_EXPLORE" });
  const chapter = reducePortfolioState(exploring, { type: "SET_CHAPTER", id: "ai-audit" });
  const dismissed = reducePortfolioState(chapter, { type: "DISMISS_TRACE" });

  assert.equal(dismissed.activeId, "retail-radar");
  assert.equal(dismissed.chapterId, "ai-audit");
  assert.strictEqual(dismissed.visitedIds, chapter.visitedIds);
  assert.equal(dismissed.previewId, null);
  assert.equal(dismissed.lockedId, null);
  assert.equal(dismissed.exploreMode, false);
});

test("scroll chapters update the active item but respect a locked item", () => {
  const locked = reducePortfolioState(initialState, { type: "TOGGLE_LOCK", id: "refund-automation" });
  const next = reducePortfolioState(locked, { type: "SET_CHAPTER", id: "ai-audit" });
  assert.equal(next.chapterId, "ai-audit");
  assert.equal(next.activeId, "refund-automation");
});

test("activating creates a visited set without mutating or reusing the previous set", () => {
  const previous = { ...initialState, visitedIds: new Set(["industry-research"]) };
  const next = reducePortfolioState(previous, { type: "ACTIVATE", id: "retail-radar" });

  assert.notStrictEqual(next.visitedIds, previous.visitedIds);
  assert.deepEqual([...previous.visitedIds], ["industry-research"]);
  assert.deepEqual([...next.visitedIds], ["industry-research", "retail-radar"]);
});

test("locking creates a visited set without mutating or reusing the previous set", () => {
  const previous = { ...initialState, visitedIds: new Set(["industry-research"]) };
  const next = reducePortfolioState(previous, { type: "TOGGLE_LOCK", id: "ai-audit" });

  assert.notStrictEqual(next.visitedIds, previous.visitedIds);
  assert.deepEqual([...previous.visitedIds], ["industry-research"]);
  assert.deepEqual([...next.visitedIds], ["industry-research", "ai-audit"]);
});

test("reset returns a new empty visited set", () => {
  const previous = { ...initialState, visitedIds: new Set(["ai-audit"]) };
  const next = reducePortfolioState(previous, { type: "RESET" });

  assert.notStrictEqual(next.visitedIds, previous.visitedIds);
  assert.equal(next.visitedIds.size, 0);
  assert.equal(previous.visitedIds.size, 1);
});

test("unknown actions return the original state", () => {
  assert.strictEqual(reducePortfolioState(initialState, { type: "UNKNOWN" }), initialState);
});

test("visible item prefers a locked item and falls back to the active item", () => {
  assert.equal(visibleItemId({ activeId: "retail-radar", lockedId: "ai-audit" }), "ai-audit");
  assert.equal(visibleItemId({ activeId: "retail-radar", previewId: "ai-audit", lockedId: null }), "ai-audit");
  assert.equal(visibleItemId({ activeId: "retail-radar", previewId: null, lockedId: null }), "retail-radar");
});

test("visible trace prefers a lock, then a preview, and otherwise has no trace", () => {
  assert.equal(stateModule.visibleTraceId({ lockedId: "ai-audit", previewId: "retail-radar" }), "ai-audit");
  assert.equal(stateModule.visibleTraceId({ lockedId: null, previewId: "retail-radar" }), "retail-radar");
  assert.equal(stateModule.visibleTraceId({ lockedId: null, previewId: null }), null);
});

test("visited sets reject direct mutation", () => {
  const activated = reducePortfolioState(initialState, { type: "ACTIVATE", id: "retail-radar" });
  const reset = reducePortfolioState(activated, { type: "RESET" });

  for (const state of [initialState, activated, reset]) {
    assert.throws(() => state.visitedIds.add("ai-audit"), TypeError);
    assert.throws(() => state.visitedIds.delete("retail-radar"), TypeError);
    assert.throws(() => state.visitedIds.clear(), TypeError);
  }
});
