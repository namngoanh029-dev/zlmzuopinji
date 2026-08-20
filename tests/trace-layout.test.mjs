import test from "node:test";
import assert from "node:assert/strict";
import { buildTraceLayout } from "../js/trace-layout.js";

const stage = { width: 600, height: 400 };
const plate = { width: 160, height: 72 };

test("a left body anchor routes outward to the left rail", () => {
  assert.deepEqual(
    buildTraceLayout({ anchor: { x: 250, y: 120 }, stage, plate }),
    {
      rail: "left",
      plateX: 16,
      plateY: 148,
      path: "M 250 120 H 188 V 184 H 176",
    },
  );
});

test("a right body anchor routes outward to the right rail", () => {
  assert.deepEqual(
    buildTraceLayout({ anchor: { x: 350, y: 120 }, stage, plate }),
    {
      rail: "right",
      plateX: 424,
      plateY: 148,
      path: "M 350 120 H 412 V 184 H 424",
    },
  );
});

test("a mobile trace terminates at the bottom plate", () => {
  assert.deepEqual(
    buildTraceLayout({ anchor: { x: 280, y: 120 }, stage, plate, mobile: true }),
    {
      rail: "bottom",
      plateX: 220,
      plateY: 312,
      path: "M 280 120 V 296 H 280 V 312",
    },
  );
});

test("a low anchor keeps its plate inside stage bounds", () => {
  const layout = buildTraceLayout({ anchor: { x: 350, y: 380 }, stage, plate });
  assert.equal(layout.plateY, 312);
  assert.equal(layout.path, "M 350 380 H 412 V 348 H 424");
});

test("an active desktop trace keeps its assigned rail and plate height", () => {
  assert.deepEqual(
    buildTraceLayout({
      anchor: { x: 520, y: 260 },
      stage,
      plate,
      rail: "left",
      plateY: 148,
    }),
    {
      rail: "left",
      plateX: 16,
      plateY: 148,
      path: "M 520 260 H 188 V 184 H 176",
    },
  );
});
