import fs from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/remove-pedestal.mjs input.glb output.glb");
}

const source = fs.readFileSync(inputPath);
if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2) {
  throw new Error("Expected a glTF 2.0 binary file");
}

let offset = 12;
let jsonChunk;
let binChunk;
while (offset < source.length) {
  const chunkLength = source.readUInt32LE(offset);
  const chunkType = source.readUInt32LE(offset + 4);
  const chunk = source.subarray(offset + 8, offset + 8 + chunkLength);
  if (chunkType === 0x4e4f534a) jsonChunk = chunk;
  if (chunkType === 0x004e4942) binChunk = chunk;
  offset += 8 + chunkLength;
}

if (!jsonChunk || !binChunk) throw new Error("GLB is missing JSON or BIN data");
const gltf = JSON.parse(jsonChunk.toString("utf8").trim());
const primitive = gltf.meshes?.[0]?.primitives?.[0];
if (!primitive || primitive.indices == null || primitive.attributes?.POSITION == null) {
  throw new Error("Expected one indexed mesh primitive");
}

const positionAccessor = gltf.accessors[primitive.attributes.POSITION];
const positionView = gltf.bufferViews[positionAccessor.bufferView];
const indexAccessor = gltf.accessors[primitive.indices];
const indexView = gltf.bufferViews[indexAccessor.bufferView];
const positionOffset = (positionView.byteOffset ?? 0) + (positionAccessor.byteOffset ?? 0);
const indexOffset = (indexView.byteOffset ?? 0) + (indexAccessor.byteOffset ?? 0);
const positionStride = positionView.byteStride ?? 12;
const IndexArray =
  indexAccessor.componentType === 5125
    ? Uint32Array
    : indexAccessor.componentType === 5123
      ? Uint16Array
      : Uint8Array;
const indices = new IndexArray(
  binChunk.buffer,
  binChunk.byteOffset + indexOffset,
  indexAccessor.count,
);
const positions = new DataView(
  binChunk.buffer,
  binChunk.byteOffset + positionOffset,
  positionView.byteLength - (positionAccessor.byteOffset ?? 0),
);

const parent = new Int32Array(positionAccessor.count);
parent.fill(-1);
const rank = new Uint8Array(positionAccessor.count);
const find = (value) => {
  if (parent[value] < 0) parent[value] = value;
  let root = value;
  while (parent[root] !== root) root = parent[root];
  while (parent[value] !== value) {
    const next = parent[value];
    parent[value] = root;
    value = next;
  }
  return root;
};
const union = (left, right) => {
  left = find(left);
  right = find(right);
  if (left === right) return;
  if (rank[left] < rank[right]) [left, right] = [right, left];
  parent[right] = left;
  if (rank[left] === rank[right]) rank[left] += 1;
};

for (let index = 0; index < indices.length; index += 3) {
  union(indices[index], indices[index + 1]);
  union(indices[index + 1], indices[index + 2]);
}

const components = new Map();
for (let vertex = 0; vertex < positionAccessor.count; vertex += 1) {
  if (parent[vertex] < 0) continue;
  const root = find(vertex);
  let component = components.get(root);
  if (!component) {
    component = { minY: Infinity, maxY: -Infinity };
    components.set(root, component);
  }
  const y = positions.getFloat32(vertex * positionStride + 4, true);
  component.minY = Math.min(component.minY, y);
  component.maxY = Math.max(component.maxY, y);
}

const [globalMinY, globalMaxY] = [positionAccessor.min[1], positionAccessor.max[1]];
const modelHeight = globalMaxY - globalMinY;
const pedestalTop = globalMinY + modelHeight * 0.05;
const pedestalRoots = new Set(
  [...components]
    .filter(([, component]) => component.maxY < pedestalTop && component.maxY - component.minY < modelHeight * 0.08)
    .map(([root]) => root),
);
if (!pedestalRoots.size) throw new Error("No isolated pedestal components were detected");

const filteredIndices = new IndexArray(indices.length);
let keptCount = 0;
let removedTriangles = 0;
for (let index = 0; index < indices.length; index += 3) {
  if (pedestalRoots.has(find(indices[index]))) {
    removedTriangles += 1;
    continue;
  }
  filteredIndices[keptCount++] = indices[index];
  filteredIndices[keptCount++] = indices[index + 1];
  filteredIndices[keptCount++] = indices[index + 2];
}

const outputBin = Buffer.from(binChunk);
Buffer.from(filteredIndices.buffer, 0, keptCount * filteredIndices.BYTES_PER_ELEMENT).copy(
  outputBin,
  indexOffset,
);
indexAccessor.count = keptCount;

const encodedJson = Buffer.from(JSON.stringify(gltf), "utf8");
const paddedJsonLength = Math.ceil(encodedJson.length / 4) * 4;
const paddedJson = Buffer.alloc(paddedJsonLength, 0x20);
encodedJson.copy(paddedJson);
const totalLength = 12 + 8 + paddedJson.length + 8 + outputBin.length;
const output = Buffer.alloc(totalLength);
output.writeUInt32LE(0x46546c67, 0);
output.writeUInt32LE(2, 4);
output.writeUInt32LE(totalLength, 8);
output.writeUInt32LE(paddedJson.length, 12);
output.writeUInt32LE(0x4e4f534a, 16);
paddedJson.copy(output, 20);
const binHeader = 20 + paddedJson.length;
output.writeUInt32LE(outputBin.length, binHeader);
output.writeUInt32LE(0x004e4942, binHeader + 4);
outputBin.copy(output, binHeader + 8);
fs.writeFileSync(outputPath, output);

console.log(
  JSON.stringify({
    outputPath,
    pedestalComponents: pedestalRoots.size,
    removedTriangles,
    remainingTriangles: keptCount / 3,
  }),
);
