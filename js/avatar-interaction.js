const isFinitePoint = (point) =>
  Array.isArray(point) && point.length >= 3 && point.slice(0, 3).every(Number.isFinite);

export function isAnchorFacingCamera(anchor, cameraPosition, threshold = 0.02) {
  if (!isFinitePoint(anchor) || !isFinitePoint(cameraPosition)) return false;

  const [ax, ay, az] = anchor;
  const [cx, cy, cz] = cameraPosition;
  const anchorLength = Math.hypot(ax, ay, az);
  const cameraLength = Math.hypot(cx, cy, cz);
  if (!anchorLength || !cameraLength) return false;

  const alignment = (ax * cx + ay * cy + az * cz) / (anchorLength * cameraLength);
  return alignment > threshold;
}
