// File type validation and virus scanning utilities for uploads
import { FileTypeParser } from 'file-type';
import { exec } from 'child_process';
import fs from 'fs';

// Allowed mime types for uploads
export const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
];

// Validate file type by reading magic bytes
export async function validateFileType(filePath: string): Promise<boolean> {
  const parser = new FileTypeParser();
  const type = await parser.fromFile(filePath);
  return type ? allowedMimeTypes.includes(type.mime) : false;
}

// Scan file for viruses using clamscan (clamav must be installed)
export function scanFileForVirus(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(`clamscan --no-summary ${filePath}`, (err, stdout) => {
      if (err) return reject(err);
      if (stdout.includes('OK')) resolve(true);
      else resolve(false);
    });
  });
}
