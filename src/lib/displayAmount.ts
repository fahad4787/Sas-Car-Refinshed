/** Formats amounts without trailing zeros; shows decimals only when needed (up to 4 places). */
const formatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
})

export function formatDisplayAmount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return formatter.format(value)
}

/**
 * Truncates toward zero to `maxDecimals` places (no rounding up). Strips float noise
 * (e.g. 1.6999999999999993 → "1.6999") and trims trailing zeros ("5.0000" → "5").
 */
export function formatTruncatedQty(value: number, maxDecimals = 4): string {
  if (!Number.isFinite(value)) return '0'
  const factor = 10 ** maxDecimals
  const truncated = Math.trunc(value * factor) / factor
  const t = Object.is(truncated, -0) ? 0 : truncated
  const s = t.toFixed(maxDecimals)
  const [intPart, frac = ''] = s.split('.')
  if (!frac) return intPart
  const fracTrim = frac.replace(/0+$/, '')
  if (fracTrim === '') return intPart
  return `${intPart}.${fracTrim}`
}
