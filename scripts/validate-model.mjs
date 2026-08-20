import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const MAX_GLB_BYTES = 5 * 1024 * 1024;

export function validateGlb(buffer) {
  if (!Buffer.isBuffer(buffer)) return { valid: false, bytes: 0 };

  const valid =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "glTF" &&
    buffer.readUInt32LE(4) === 2 &&
    buffer.readUInt32LE(8) === buffer.length;

  return { valid, bytes: buffer.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? "assets/models/zlm-avatar.glb";
  const buffer = await readFile(file);
  const result = validateGlb(buffer);

  if (!result.valid || result.bytes > MAX_GLB_BYTES) {
    throw new Error(`Invalid or oversized GLB: ${file}`);
  }

  console.log(`Valid GLB: ${file} (${result.bytes} bytes)`);
}
