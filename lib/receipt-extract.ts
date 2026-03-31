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
- Put receipt-level subtotal, tax, and total in totals (subtotal, tax, total) — do NOT add separate line_items for "Subtotal", "Total", or "Grand Total" footer rows; those double-count in expense totals. Only line_items should be actual purchases, discounts, and explicit tax lines (HST/GST/PST) when shown as their own line.
- Always fill totals.subtotal and totals.total when the receipt shows them. When subtotal and total are present but no separate tax line, set totals.tax to (total minus subtotal), rounded to two decimals — that difference is usually sales tax (HST/GST/PST) before tips or fees. If there is an explicit HST/GST line, use that amount for totals.tax instead.
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
 * Footer rows that are not real purchases — they inflate dashboard sums if left in line_items.
 * Does not remove explicit HST/GST/PST tax lines.
 */
function isSummaryFooterLine(li: LineItemExtract): boolean {
  const raw = li.description.trim()
  const d = raw.replace(/\s+/g, ' ')
  const lower = d.toLowerCase()

  // Synthetic line added by enrichReceiptExtract
  if (lower.includes('subtotal vs total')) return false

  if (/^(hst|gst|pst|qst)(\s|$|[:(])/i.test(d)) return false
  if (/^sales tax\b/i.test(d)) return false
  if (/^harmonized\b/i.test(lower)) return false
  if (/\btax\b/i.test(d) && /hst|gst|pst|qst|sales|harmonized/i.test(lower)) return false

  if (/^subtotal\b/i.test(d) || /^sub-total\b/i.test(d) || /^sub total\b/i.test(d)) return true
  if (/^grand\s*total\b/i.test(lower)) return true
  if (/^amount\s*due\b/i.test(lower)) return true
  if (/^balance\s*due\b/i.test(lower) || /^balance$/i.test(lower)) return true
  if (/^total\s*due\b/i.test(lower)) return true
  if (/^total$/i.test(d.trim())) return true
  if (/^total\s*:/i.test(d)) return true

  return false
}

function stripSummaryFooterLines(lines: LineItemExtract[]): LineItemExtract[] {
  return lines.filter((li) => !isSummaryFooterLine(li))
}

/**
 * If we can determine tax but no line carries it, add one synthetic tax line so clients can show HST.
 */
export function enrichReceiptExtract(receipt: ReceiptExtract): ReceiptExtract {
  const lines = [...(receipt.line_items ?? [])]
  let mergedTotals: NonNullable<ReceiptExtract['totals']> = { ...(receipt.totals ?? {}) }

  const resolved = resolveTaxAmount(receipt.totals, lines)
  if (resolved != null) {
    mergedTotals = resolved.mergedTotals
    const { tax: taxAmount } = resolved

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
  }

  const stripped = stripSummaryFooterLines(lines)
  return { ...receipt, totals: mergedTotals, line_items: stripped }
}
