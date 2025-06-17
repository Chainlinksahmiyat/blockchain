// Persistent logger for server (writes to file and console)
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'server.log');

export function persistentLog(message: string, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} [${level.toUpperCase()}] ${message}`;
  fs.appendFileSync(LOG_FILE, logLine + '\n');
  if (level === 'error') {
    console.error(logLine);
  } else {
    console.log(logLine);
  }
}
