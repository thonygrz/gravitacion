const formatters = new Map<number, Intl.NumberFormat>();

/**
 * Formats a number for the Spanish interface (decimal comma) with at most `maxDecimals`
 * decimals. Floating-point leftovers such as cos(90°) = 6e-17 print as 0.
 */
export function formatNumber(value: number, maxDecimals: number): string {
  let formatter = formatters.get(maxDecimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: maxDecimals });
    formatters.set(maxDecimals, formatter);
  }
  return formatter.format(Math.abs(value) < 1e-12 ? 0 : value);
}
