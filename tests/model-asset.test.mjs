import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateGlb } from "../scripts/validate-model.mjs";

test("GLB validator accepts a valid magic header and size", () => {
  const valid = Buffer.alloc(12);
  valid.write("glTF", 0, "ascii");
  valid.writeUInt32LE(2, 4);
  valid.writeUInt32LE(12, 8);
  assert.deepEqual(validateGlb(valid), { valid: true, bytes: 12 });
});

test("GLB validator rejects a non-GLB file", () => {
  assert.equal(validateGlb(Buffer.from("not-a-glb")).valid, false);
});

test("GLB validator rejects a declared length mismatch", () => {
  const mismatched = Buffer.alloc(13);
  mismatched.write("glTF", 0, "ascii");
  mismatched.writeUInt32LE(2, 4);
  mismatched.writeUInt32LE(12, 8);

  assert.deepEqual(validateGlb(mismatched), { valid: false, bytes: 13 });
});

test("GLB validator rejects non-Buffer input without throwing", () => {
  for (const value of ["glTF", [0x67, 0x6c, 0x54, 0x46]]) {
    assert.deepEqual(validateGlb(value), { valid: false, bytes: 0 });
  }
});

test("the no-WebGL poster is a real PNG asset", async () => {
  const poster = await readFile(new URL("../assets/models/zlm-avatar-poster.png", import.meta.url));
  assert.deepEqual([...poster.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(poster.length > 10_000);
});
