export function packUnitLabelForWeightKg(weightKg: number): string {
  const w = Number(weightKg)
  if (!Number.isFinite(w) || w <= 0) return ''

  if (w <= 0.5) return 'pcs'
  if (w <= 2) return 'ltr'
  if (w <= 5.5) return 'gallon'
  if (w >= 10 && w <= 20) return 'drum'

  return ''
}
