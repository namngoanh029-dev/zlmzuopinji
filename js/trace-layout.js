const GUTTER = 16;
const ELBOW_GAP = 12;
const MOBILE_ELBOW_GAP = 16;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const round = (value) => Math.round(value);

export function buildTraceLayout({
  anchor,
  stage,
  plate,
  mobile = false,
  rail: fixedRail = null,
  plateY: fixedPlateY = null,
}) {
  const plateWidth = Math.min(plate.width, Math.max(0, stage.width - GUTTER * 2));
  const maxPlateX = Math.max(GUTTER, stage.width - plateWidth - GUTTER);
  const maxPlateY = Math.max(GUTTER, stage.height - plate.height - GUTTER);

  if (mobile) {
    const plateX = round(clamp((stage.width - plateWidth) / 2, GUTTER, maxPlateX));
    const plateY = round(maxPlateY);
    const attachX = round(clamp(anchor.x, plateX + 24, plateX + plateWidth - 24));
    const elbowY = plateY - MOBILE_ELBOW_GAP;
    return {
      rail: "bottom",
      plateX,
      plateY,
      path: `M ${round(anchor.x)} ${round(anchor.y)} V ${elbowY} H ${attachX} V ${plateY}`,
    };
  }

  const rail = fixedRail === "left" || fixedRail === "right"
    ? fixedRail
    : anchor.x < stage.width / 2 ? "left" : "right";
  const plateX = rail === "left" ? GUTTER : maxPlateX;
  const resolvedPlateY = round(
    clamp(Number.isFinite(fixedPlateY) ? fixedPlateY : anchor.y + 28, GUTTER, maxPlateY),
  );
  const attachX = rail === "left" ? plateX + plateWidth : plateX;
  const attachY = round(resolvedPlateY + plate.height / 2);
  const elbowX = rail === "left" ? attachX + ELBOW_GAP : attachX - ELBOW_GAP;

  return {
    rail,
    plateX: round(plateX),
    plateY: resolvedPlateY,
    path: `M ${round(anchor.x)} ${round(anchor.y)} H ${round(elbowX)} V ${attachY} H ${round(attachX)}`,
  };
}
