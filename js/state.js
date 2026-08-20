function immutableSet(values = []) {
  const set = new Set(values);
  const rejectMutation = () => {
    throw new TypeError("visitedIds is immutable");
  };

  Object.defineProperties(set, {
    add: { value: rejectMutation },
    delete: { value: rejectMutation },
    clear: { value: rejectMutation },
  });

  return Object.freeze(set);
}

export const initialState = Object.freeze({
  activeId: "refund-automation",
  previewId: null,
  exploreMode: false,
  lockedId: null,
  chapterId: "refund-automation",
  visitedIds: immutableSet(),
});

export function reducePortfolioState(state, action) {
  switch (action.type) {
    case "ACTIVATE":
      return {
        ...state,
        activeId: action.id,
        visitedIds: immutableSet([...state.visitedIds, action.id]),
      };
    case "PREVIEW":
      if (state.lockedId != null) return state;
      return {
        ...state,
        activeId: action.id,
        previewId: action.id,
        visitedIds: immutableSet([...state.visitedIds, action.id]),
      };
    case "CLEAR_PREVIEW":
      if (state.lockedId != null || state.previewId == null) return state;
      return {
        ...state,
        previewId: null,
      };
    case "TOGGLE_LOCK":
      if (state.lockedId === action.id) {
        return {
          ...state,
          activeId: action.id,
          previewId: null,
          lockedId: null,
          visitedIds: immutableSet([...state.visitedIds, action.id]),
        };
      }
      return {
        ...state,
        activeId: action.id,
        previewId: action.id,
        lockedId: action.id,
        visitedIds: immutableSet([...state.visitedIds, action.id]),
      };
    case "SET_EXPLORE":
      return {
        ...state,
        exploreMode: typeof action.value === "boolean" ? action.value : !state.exploreMode,
      };
    case "DISMISS_TRACE":
      return {
        ...state,
        previewId: null,
        lockedId: null,
        exploreMode: false,
      };
    case "SET_CHAPTER":
      return {
        ...state,
        chapterId: action.id,
        activeId: state.lockedId ?? action.id,
      };
    case "RESET":
      return { ...initialState, visitedIds: immutableSet() };
    default:
      return state;
  }
}

export function visibleItemId(state) {
  return state.lockedId ?? state.previewId ?? state.activeId;
}

export function visibleTraceId(state) {
  return state.lockedId ?? state.previewId ?? null;
}
