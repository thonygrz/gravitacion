// One colour per body, shared by the SVG drawings and the canvas: orange, light blue
// and green, far apart in hue and at least 5.8:1 against the page background
// (measured in docs/decisiones.md).
export const BODY_COLORS = ["#e69f00", "#56b4e9", "#009e73"] as const;

export const bodyColor = (body: number): string => BODY_COLORS[body % BODY_COLORS.length];
