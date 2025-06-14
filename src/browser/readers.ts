import { BlobReaderParamsDefinition } from "../core/readers";

export const fileReader = async ({
  url,
}: BlobReaderParamsDefinition): Promise<string> => {
  return await new Promise((resolve, reject) => {
    console.log("url reader", url)
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
    reader.readAsText(url);
  });
};