import debug from "debug";
import type { Options as CsvParseOptions } from 'csv-parse';
import { XMLParser } from "fast-xml-parser";
import type { SourceRecord } from "../types/data";
import type {
	CsvParseFunction,
	DelimitedParserOptions,
	JsonParser,
	StringParser,
	XmlParserOptions,
} from "../types/parsers";

const log = debug("openaq-transform:parsers");
const warn = debug("openaq-transform:parsers:warn");


export const parseDelimited = async (
	content: string,
	parse: CsvParseFunction,
	options: CsvParseOptions,
) => {
	return parse(content, options);
};

export const createDelimitedParsers = (parse: CsvParseFunction) => {
	const csv: StringParser<SourceRecord[]>  = async (content: string, options) => {
		log(`Parsing ${typeof content} data using the csv method`);
		const { format, ...csvOptions } = (options as DelimitedParserOptions) ?? {};

		if (csvOptions.delimiter && csvOptions.delimiter !== ",") {
        	warn(`${format} parser received delimiter "${csvOptions.delimiter}", delimiter is fixed to "," and will not be overwritten`);
    	}

		return parseDelimited(content, parse, {
			columns: true,
			skip_empty_lines: true,
			...csvOptions,
		});
	};

	const tsv: StringParser<SourceRecord[]>  = async (content: string, options) => {
		log(`Parsing ${typeof content} data using the tsv method`);
		const { format, ...tsvOptions } = (options as DelimitedParserOptions) ?? {};

		if (tsvOptions.delimiter && tsvOptions.delimiter !== "\t") {
        	warn(`${format} parser received delimiter "${tsvOptions.delimiter}", delimiter is fixed to "\\t" and will not be overwritten`);
    	}
    
		return parseDelimited(content, parse, {
			columns: true,
			skip_empty_lines: true,
			...tsvOptions,
			delimiter: "\t",
		});
	};

	return { csv, tsv };
};

export const json: JsonParser<SourceRecord | SourceRecord[]> = async (
	content,
) => {
	log(`Parsing ${typeof content} data using the json method`);
	if (typeof content === "string") {
		return JSON.parse(content) as SourceRecord | SourceRecord[];
	} else {
		return content as SourceRecord | SourceRecord[];
	}
};

export const xml: StringParser<SourceRecord | SourceRecord[]> = async (
	content,
	options,
) => {
	log(`Parsing ${typeof content} data using the xml method`);
	const { format, ...xmlParserOptions } = (options as XmlParserOptions) ?? {};
	const parser = new XMLParser(xmlParserOptions);
	return parser.parse(content) as SourceRecord | SourceRecord[];
};
