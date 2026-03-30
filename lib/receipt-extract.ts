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
- Canadian receipts: capture HST, GST, PST, QST, TPS/TVQ as shown. If tax appears per line, set hst on that line. If tax is only shown once at the bottom, set totals.tax to that amount.
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
 * If the model put tax only on totals.tax but not on any line, add one synthetic tax line
 * so clients can show HST without manual entry.
 */
export function enrichReceiptExtract(receipt: ReceiptExtract): ReceiptExtract {
  const tax = receipt.totals?.tax
  const lines = [...(receipt.line_items ?? [])]

  if (tax != null && tax > 0.005) {
    const taxLabel = /\b(HST|GST|PST|QST|TPS|TVQ|harmonized|sales tax|Harmonized)\b/i
    const hasDedicatedTaxLine = lines.some(
      (li) =>
        taxLabel.test(li.description) ||
        (li.category != null && /^tax$/i.test(String(li.category).trim()))
    )
    const hasMeaningfulLineHst = lines.some((li) => (li.hst ?? 0) > 0.005)

    if (!hasDedicatedTaxLine && !hasMeaningfulLineHst) {
      const t = round2(tax)
      lines.push({
        description: 'Sales tax (HST/GST/PST — from receipt)',
        category: 'Tax',
        quantity: null,
        unit_price: null,
        total_price: t,
        hst: t,
        discount: null,
      })
    }
  }

  return { ...receipt, line_items: lines }
}
