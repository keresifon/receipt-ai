import { z } from 'zod'

export const LineItemSchema = z.object({
  description: z.string(),
  category: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  total_price: z.number(),
  hst: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
})
export type LineItem = z.infer<typeof LineItemSchema>

export const ReceiptSchema = z.object({
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(), // YYYY-MM-DD
  notes: z.string().nullable().optional(),
  totals: z.object({
    subtotal: z.number().nullable().optional(),
    tax: z.number().nullable().optional(),
    total: z.number().nullable().optional(),
    currency: z.string().nullable().optional()
  }).partial().optional(),
  line_items: z.array(LineItemSchema).default([])
})
export type Receipt = z.infer<typeof ReceiptSchema>
