import type { OrbitFigure } from "@/lib/orbits/figure";
import { bodyColor } from "./orbit-colors";

interface OrbitDrawingProps {
  readonly figure: OrbitFigure;
  /**
   * Marks the starting point of each body. In Lagrange's and the figure eight the three
   * paths are the same curve, so the marks are what shows that there are three bodies.
   */
  readonly markStarts?: boolean;
  readonly className?: string;
}

/** The whole path of each body as a static SVG; decorative, the surrounding text names the orbit. */
export function OrbitDrawing({ figure, markStarts = false, className }: OrbitDrawingProps) {
  const { x, y, width, height } = figure.viewBox;
  const startRadius = 0.018 * Math.max(width, height);
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {figure.paths.map((d, body) => (
        <path
          key={body}
          d={d}
          fill="none"
          stroke={bodyColor(body)}
          strokeOpacity={0.9}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {markStarts &&
        figure.starts.map((start, body) => (
          <circle key={body} cx={start.x} cy={start.y} r={startRadius} fill={bodyColor(body)} />
        ))}
    </svg>
  );
}
