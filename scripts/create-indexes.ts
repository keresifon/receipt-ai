import clientPromise from '@/lib/mongodb'

async function main() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || 'expenses')
  await db.collection('line_items').createIndexes([
    { key: { receipt_id: 1 } },
    { key: { date: 1, store: 1 } },
    { key: { category: 1, date: -1 } },
  ])
  await db.collection('receipts').createIndexes([
    { key: { date: 1, merchant: 1 } },
    { key: { createdAt: -1 } },
  ])
  console.log('Indexes created')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
