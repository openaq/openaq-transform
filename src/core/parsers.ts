import type { Options as CsvParseOptions } from "csv-parse";
import debug from "debug";
import type { SourceRecord } from "../types/data";
import type { CsvParseFunction, JsonParser } from "../types/parsers";

const log = debug("openaq-transform parsers: DEBUG");

export const parseDelimited = async (
	content: string,
	parse: CsvParseFunction,
	options: CsvParseOptions,
) => {
	return parse(content, options);
};

export const createDelimitedParsers = (parse: CsvParseFunction) => {
	const csv = async (content: string) => {
		log(`Parsing ${typeof content} data using the csv method`);
		return parseDelimited(content, parse, {
			columns: true,
			skip_empty_lines: true,
		});
	};

	const tsv = async (content: string) => {
		log(`Parsing ${typeof content} data using the tsv method`);
		return parseDelimited(content, parse, {
			delimiter: "\t",
			columns: true,
			skip_empty_lines: true,
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
