import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI as string
if (!uri) throw new Error('Missing MONGODB_URI')

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient>

const globalWithMongo = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> }

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export default clientPromise
