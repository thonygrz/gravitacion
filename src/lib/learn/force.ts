/** How a force changed, as a factor that reads well: "4 times smaller" rather than "×0.25". */
export type ForceChange =
  | { readonly kind: "same" }
  | { readonly kind: "larger"; readonly factor: number }
  | { readonly kind: "smaller"; readonly factor: number };

// Relative differences below this are rounding, not a change the visitor made.
const SAME = 1e-9;

export function forceChange(before: number, after: number): ForceChange {
  if (Math.abs(after - before) <= SAME * Math.max(Math.abs(before), Math.abs(after))) {
    return { kind: "same" };
  }
  return after > before
    ? { kind: "larger", factor: after / before }
    : { kind: "smaller", factor: before / after };
}
