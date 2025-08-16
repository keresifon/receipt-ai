# Receipt AI – Next.js + Gemini + MongoDB

Snap a receipt → extract structured line items with Gemini → store in MongoDB → view analytics.

## Stack
- Next.js (App Router, TypeScript)
- Google Gemini 1.5 Flash (multimodal OCR + parsing)
- MongoDB (Atlas recommended)
- Recharts (dashboard)

## Quick Start
1) Copy `.env.example` → `.env.local` and fill in:
   - `GEMINI_API_KEY`
   - `MONGODB_URI`, `MONGODB_DB`
2) Install & run:
```bash
npm i
npm run dev
```
3) Open:
- `/` to upload
- `/dashboard` for analytics

## Indexes (optional but recommended)
```bash
npm run create-indexes
```

## Scripts
- `dev`: local development
- `build`/`start`: production build
- `lint`, `typecheck`
- `create-indexes`: creates MongoDB indexes

## Notes
- Date and Store from the upload form override model output.
- If your currency varies, store `currency` on each line item and adjust analytics.
- For serverless Atlas without multi-document transactions, the upload route will do two inserts (receipt then items) without a session.
