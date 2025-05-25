


//export interface ReaderDefinition {}
export interface ReaderParamsDefinition {
   url: string,
   as: ReadAs
}

export type ReaderDefinition = (params: ReaderParamsDefinition) => object

export interface ReaderMethodsDefinition {
    [key: string]: ReaderDefinition
}

enum ReadAs {
    json = "json",
    text = "text",
    blob = "blob",
    response = "response",
}


// as json, text, blob, response
export const api = async ({ url, as }: ReaderParamsDefinition) => {
    const res = await fetch(url);
    if(as === 'json') {
        return res.json();
    } else if(as === 'text') {
        return res.text();
    } else if(as === 'blob') {
        return res.blob();
    } else if(as === 'response') {
        return res;
    } else {
        return res.json();
    }
};

export const s3 = (args: ReaderParamsDefinition) => {
    return args}
export const google = (args: ReaderParamsDefinition) => {
    return args
}
