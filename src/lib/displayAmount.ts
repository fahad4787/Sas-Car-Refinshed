/** Formats amounts without trailing zeros; shows decimals only when needed (up to 4 places). */
const formatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
})

export function formatDisplayAmount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return formatter.format(value)
}
