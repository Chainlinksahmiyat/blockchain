// This is a simple SQLite database setup for the Next.js app
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function openDB() {
  // Use absolute path for SQLite DB in Next.js API routes
  const dbPath = path.join(process.cwd(), 'ahmiyat.db');
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}
