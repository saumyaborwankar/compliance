import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TMP_DATA_DIR = path.join(process.env.TMPDIR || '/tmp', 'compliance-data');

export async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Try a no-op to validate writability
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(TMP_DATA_DIR, { recursive: true });
  }
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const primaryPath = path.join(DATA_DIR, fileName);
  const tmpPath = path.join(TMP_DATA_DIR, fileName);
  try {
    const data = await fs.readFile(primaryPath, 'utf8');
    return JSON.parse(data) as T;
  } catch (err: unknown) {
    // Try tmp path if primary fails (read-only env)
    try {
      const data = await fs.readFile(tmpPath, 'utf8');
      return JSON.parse(data) as T;
    } catch (err2: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT' && (err2 as NodeJS.ErrnoException).code === 'ENOENT') {
        await writeJsonFile<T>(fileName, fallback);
        return fallback;
      }
      throw err2;
    }
  }
}

export async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
  await ensureDataDir();
  const preferredDir = await (async () => {
    try {
      // Attempt write to primary dir to detect EROFS
      await fs.access(DATA_DIR);
      return DATA_DIR;
    } catch {
      return TMP_DATA_DIR;
    }
  })();
  const filePath = path.join(preferredDir, fileName);
  const tmpPath = `${filePath}.tmp`;
  const json = JSON.stringify(data, null, 2);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tmpPath, json, 'utf8');
  await fs.rename(tmpPath, filePath);
}

export async function appendToJsonArray<T>(fileName: string, item: T): Promise<void> {
  const arr = await readJsonFile<T[]>(fileName, []);
  arr.push(item);
  await writeJsonFile<T[]>(fileName, arr);
}
