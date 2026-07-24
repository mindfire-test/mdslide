import fs from 'fs';
import { InputNotFoundError } from '../middleware/errors.js';

export const STDIO_PLACEHOLDER = 'mdslide:stdio';

export function isStdio(value: string | undefined): boolean {
  return value === STDIO_PLACEHOLDER || value === '-';
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function readInputSource(inputFile: string): Promise<string> {
  if (isStdio(inputFile)) {
    return readStdin();
  }
  try {
    await fs.promises.access(inputFile);
  } catch {
    throw new InputNotFoundError(inputFile);
  }
  return fs.promises.readFile(inputFile, 'utf8');
}
