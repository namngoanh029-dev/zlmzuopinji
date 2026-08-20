import test from "node:test";
import assert from "node:assert/strict";
import { isAnchorFacingCamera } from "../js/avatar-interaction.js";

test("a front-side marker remains interactive from the front camera", () => {
  assert.equal(isAnchorFacingCamera([0.5, 0.4, 0.7], [0, 0.25, 7]), true);
});

test("a front-side marker is hidden when the camera rotates behind the avatar", () => {
  assert.equal(isAnchorFacingCamera([0.5, 0.4, 0.7], [0, 0.25, -7]), false);
});

test("invalid marker coordinates fail closed", () => {
  assert.equal(isAnchorFacingCamera(null, [0, 0, 7]), false);
  assert.equal(isAnchorFacingCamera([0, 0, 1], [Number.NaN, 0, 7]), false);
});
