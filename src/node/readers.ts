import { readFile } from 'fs/promises';
import { FileSystemReaderParamsDefinition,  } from '../core/readers';

export const fileSystemReader = async ({
  path,
  encoding,
}: FileSystemReaderParamsDefinition): Promise<string> => {
  const data = await readFile(path, { encoding: encoding ?? 'utf8' });
  return data;
};
