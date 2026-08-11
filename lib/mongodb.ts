import { MongoClient, type MongoClientOptions } from 'mongodb'

const uri = process.env.MONGODB_URI as string
if (!uri) throw new Error('Missing MONGODB_URI')

const options: MongoClientOptions = {
  maxPoolSize: 5, // keep low on shared free-tier Atlas (500 connection limit)
  minPoolSize: 0, // don't hold idle sockets on serverless
  maxIdleTimeMS: 10_000,
  appName: process.env.MONGODB_APP_NAME || 'nowahala-receipt',
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    globalThis._mongoClientPromise = client.connect()
  }
  return globalThis._mongoClientPromise
}

const clientPromise = getClientPromise()

export default clientPromise
