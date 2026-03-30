/**
 * Shared Gemini instructions and post-processing for /api/upload and /api/upload/guest.
 * Improves HST/tax and loyalty “rewards” capture when the model only puts tax on totals.
 */

export const RECEIPT_AI_SYSTEM_PROMPT = `Extract receipt summary and line items. Return ONLY JSON with keys:
merchant (string|null), date (YYYY-MM-DD|null), notes (string|null),
totals (object with subtotal, tax, total, currency — all nullable),
line_items (array of {
  description (string),
  category (string|null),
  quantity (number|null),
  unit_price (number|null),
  total_price (number),
  hst (number|null),
  discount (number|null)
}).

Rules:
- Use null for unknowns. Normalize numbers to decimals (no currency symbols).
- Always fill totals.subtotal and totals.total when the receipt shows them. When the receipt shows subtotal and total but no separate tax line, set totals.tax to (total minus subtotal), rounded to two decimals — that difference is usually sales tax (HST/GST/PST) before tips or fees. If there is an explicit HST/GST line, use that amount for totals.tax instead.
- Canadian receipts: capture HST, GST, PST, QST, TPS/TVQ as shown. If tax appears per line, set hst on that line. If tax is only shown once at the bottom, set totals.tax to that amount.
- Include non-product lines such as "Subtotal" and "Total" in line_items when they appear on the receipt (with their dollar amounts in total_price).
- Loyalty / rewards: capture PC Optimum, Scene+, Air Miles, "points redeemed", "You saved", instant savings, and similar as line items when there is a dollar amount. Put savings in discount (positive dollars saved) or reflect in that line's total_price. Name the line clearly (e.g. "PC Optimum points redeemed", "Store promotion").
- Harmonized Sales Tax: when the receipt shows a single tax line (e.g. "HST", "GST", "Tax"), include it as its own line_item with description mentioning tax and amounts in total_price and hst when possible.

No commentary outside JSON.`

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type LineItemExtract = {
  description: string
  category?: string | null
  quantity?: number | null
  unit_price?: number | null
  total_price: number
  hst?: number | null
  discount?: number | null
}

export type ReceiptExtract = {
  merchant?: string | null
  date?: string | null
  notes?: string | null
  totals?: {
    subtotal?: number | null
    tax?: number | null
    total?: number | null
    currency?: string | null
  }
  line_items?: LineItemExtract[]
}

/**
 * When the receipt has Subtotal and Total rows in line_items but totals.tax is missing.
 */
function inferTaxFromSubtotalTotalLines(lines: LineItemExtract[]): number | null {
  let subAmt: number | null = null
  for (const li of lines) {
    const d = li.description.trim().replace(/\s+/g, ' ')
    if (/^subtotal\b/i.test(d) || /^sub-total\b/i.test(d) || /^sub total\b/i.test(d)) {
      subAmt = li.total_price
      break
    }
  }

  let totalAmt: number | null = null
  for (let i = lines.length - 1; i >= 0; i--) {
    const li = lines[i]
    const d = li.description.trim().replace(/\s+/g, ' ')
    const dl = d.toLowerCase()
    if (/subtotal/.test(dl)) continue
    if (
      /^total\b/i.test(d) ||
      /^grand\s*total\b/i.test(dl) ||
      /^amount\s*due\b/i.test(dl) ||
      /^balance\s*due\b/i.test(dl) ||
      /^balance$/i.test(dl) ||
      /^total\s*due\b/i.test(dl)
    ) {
      totalAmt = li.total_price
      break
    }
  }

  if (
    subAmt != null &&
    totalAmt != null &&
    Number.isFinite(subAmt) &&
    Number.isFinite(totalAmt) &&
    totalAmt > subAmt + 0.005
  ) {
    return round2(totalAmt - subAmt)
  }

  return null
}

/**
 * Resolve tax amount: explicit totals.tax, or total - subtotal, or inferred from Subtotal/Total lines.
 */
function resolveTaxAmount(
  totals: ReceiptExtract['totals'],
  lines: LineItemExtract[]
): { tax: number; mergedTotals: NonNullable<ReceiptExtract['totals']> } | null {
  const merged: NonNullable<ReceiptExtract['totals']> = { ...(totals ?? {}) }

  if (merged.tax != null && merged.tax > 0.005) {
    return { tax: round2(merged.tax), mergedTotals: { ...merged, tax: round2(merged.tax) } }
  }

  const sub = merged.subtotal
  const tot = merged.total
  if (
    sub != null &&
    tot != null &&
    Number.isFinite(sub) &&
    Number.isFinite(tot) &&
    tot > sub + 0.005
  ) {
    const t = round2(tot - sub)
    merged.tax = t
    return { tax: t, mergedTotals: merged }
  }

  const fromLines = inferTaxFromSubtotalTotalLines(lines)
  if (fromLines != null && fromLines > 0.005) {
    merged.tax = fromLines
    return { tax: fromLines, mergedTotals: merged }
  }

  return null
}

/**
 * If we can determine tax but no line carries it, add one synthetic tax line so clients can show HST.
 */
export function enrichReceiptExtract(receipt: ReceiptExtract): ReceiptExtract {
  const lines = [...(receipt.line_items ?? [])]

  const resolved = resolveTaxAmount(receipt.totals, lines)
  if (resolved == null) {
    return { ...receipt, line_items: lines }
  }

  const { tax: taxAmount, mergedTotals } = resolved

  const taxLabel = /\b(HST|GST|PST|QST|TPS|TVQ|harmonized|sales tax|Harmonized)\b/i
  const hasDedicatedTaxLine = lines.some(
    (li) =>
      taxLabel.test(li.description) ||
      (li.category != null && /^tax$/i.test(String(li.category).trim()))
  )
  const hasMeaningfulLineHst = lines.some((li) => (li.hst ?? 0) > 0.005)

  if (!hasDedicatedTaxLine && !hasMeaningfulLineHst) {
    const t = round2(taxAmount)
    lines.push({
      description: 'Sales tax (HST/GST/PST — subtotal vs total)',
      category: 'Tax',
      quantity: null,
      unit_price: null,
      total_price: t,
      hst: t,
      discount: null,
    })
  }

  return { ...receipt, totals: mergedTotals, line_items: lines }
}
