import type { Options as CsvParseOptions } from 'csv-parse';

type CsvParseFunction = (
    input: string | Buffer,
    options?: CsvParseOptions
) => any;

export const createDelimitedParsers = (parse: CsvParseFunction) => {
    const csv = async ({ text }: ParserParamsDefinition) => {
        if (typeof (text) === 'string') {
            return parse(text, {
                columns: true,
                skip_empty_lines: true
            });
        } else {
            return text;
        }
    };

    const tsv = async ({ text }: ParserParamsDefinition) => {
        if (typeof (text) === 'string') {
            return parse(text, {
                delimiter: '\t',
                columns: true,
                skip_empty_lines: true
            });
        } else {
            return text;
        }
    };

    return { csv, tsv }; 
};

export interface ParserParamsDefinition {
   text: string,
}

export type ParserDefinition = (params: ParserParamsDefinition) => object

export interface ParserObjectDefinition {
  measurements: string;
  locations?: string;
}


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
