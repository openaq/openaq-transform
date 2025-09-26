import { readFile } from 'fs/promises';
import type { FileSystemReaderParameters } from '../types/readers';

export const fileSystemReader = async ({
  path,
  encoding,
}: FileSystemReaderParameters): Promise<string> => {
  const data = await readFile(path, { encoding: encoding ?? 'utf8' });
  return data;
};
