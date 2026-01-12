import { readFile } from 'fs/promises';
import type { DataContext, FileSystemReaderParameters } from '../types/readers';
import { Parser } from '../types/parsers';

export const fileSystemReader = async ({
  resource,
  encoding,
}: FileSystemReaderParameters, parser: Parser, _?: DataContext): Promise<object> => {

  if (!resource.isUrlResource()) {
    throw new TypeError('fileSystemReader requires a URL-based resource');
  }
  const results = await Promise.all(resource.urls.map(({url}) => {
    const path = url.startsWith('file://') ? new URL(url) : url;
    const data = readFile(path, { encoding: encoding ?? 'utf8' })
    return data.toString();
  }));
  
  return parser({content: results})
};
