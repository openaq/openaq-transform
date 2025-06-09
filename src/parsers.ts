import { parse } from 'csv-parse/sync';

export interface ParserParamsDefinition {
   text: string,
}

export type ParserDefinition = (params: ParserParamsDefinition) => object


export interface ParserMethodsDefinition {
    [key: string]: ParserDefinition
}

export const json = async ({ text }: ParserParamsDefinition) => {
    if(typeof(text) === 'string') {
        return JSON.parse(text);
    } else {
        return text;
    }
};

export const csv = async ({ text }: ParserParamsDefinition) => {
    if(typeof(text) === 'string') {
        return parse(text, {
            columns: true,
            skip_empty_lines: true
        });
    } else {
        return text;
    }
};
