import { z } from 'zod'

function preprocessEmptyToZero(val: unknown): number {
  if (val === '' || val === null || val === undefined) return 0
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

function preprocessEmptyToUndefined(val: unknown): number | undefined {
  if (val === '' || val === null || val === undefined) return undefined
  if (typeof val === 'number') return Number.isFinite(val) ? val : undefined
  const n = Number(val)
  return Number.isFinite(n) ? n : undefined
}

/** Non-negative numbers; empty field → 0 (for costing, rates, VAT %, etc.). */
export const zNonNegativeInput = z.preprocess(preprocessEmptyToZero, z.number().nonnegative())

/** Qty must be > 0; empty → validation error. */
export const zPositiveQtyInput = z.preprocess(
  preprocessEmptyToUndefined,
  z
    .number({ invalid_type_error: 'Qty (Kg) is required' })
    .positive('Qty (Kg) is required'),
)

export const zVatPercentInput = z.preprocess(preprocessEmptyToZero, z.number().min(0).max(100))
