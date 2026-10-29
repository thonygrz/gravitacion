const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats a number for the Spanish interface (decimal comma) with at most `maxDecimals`
 * decimals and at least `minDecimals`: padded, a number that keeps changing on screen
 * keeps its width. Floating-point leftovers such as cos(90°) = 6e-17 print as 0.
 */
export function formatNumber(value: number, maxDecimals: number, minDecimals = 0): string {
  const key = `${minDecimals}-${maxDecimals}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(Math.abs(value) < 1e-12 ? 0 : value);
}
