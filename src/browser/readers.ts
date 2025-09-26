import { BlobReaderParameters } from "../types/readers";

export const fileReader = async ({
  resource,
}: BlobReaderParameters): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (typeof e?.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('FileReader did not return a string result.'));
      }
    };
    reader.onerror = (e: ProgressEvent<FileReader>) => {
      reject(reader.error || e);
    };
    reader.readAsText(resource);
  });
};
