import { MongoClient, Db } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

let db: Db;

export async function connectDB() {
  await client.connect();

  db = client.db(process.env.DB_NAME);

 try {
  await client.connect();
  console.log("✅ MongoDB Connected");
} catch (err) {
  console.error("MongoDB Error:", err);
}
}

export function getDB() {
  return db;
}