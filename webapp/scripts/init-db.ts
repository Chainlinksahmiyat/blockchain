import { openDB } from '../lib/db';

export async function setupDatabase() {
  const db = await openDB();
  await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)');
  await db.run('CREATE TABLE IF NOT EXISTS contents (id INTEGER PRIMARY KEY, type TEXT, filename TEXT, uploader TEXT, hash TEXT, timestamp INTEGER)');
  return db;
}

setupDatabase();
