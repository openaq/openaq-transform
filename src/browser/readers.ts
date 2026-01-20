import { Parser } from "../types/parsers";
import { DataContext, FileReaderParameters } from "../types/readers";

export const fileReader = async ({
  resource,
  encoding
}: FileReaderParameters, parser: Parser, _?: DataContext): Promise<object> => {
  if (!resource.isFileResource()) {
    throw new TypeError('fileReader requires a file-based resource');
  }
  
  const files = resource.files;
  if (!files || files.length === 0) {
    throw new TypeError('No files available to read');
  }
  
  const results = await Promise.all(
    files.map(file => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (typeof e?.target?.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error('FileReader did not return a string result.'));
          }
        };
        
        reader.onerror = () => {
          reject(reader.error || new Error('FileReader error occurred'));
        };
      
        reader.readAsText(file, encoding ?? 'utf-8');
      })
    )
  );

  return parser({content: results})
  

}
