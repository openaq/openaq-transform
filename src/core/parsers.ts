import type { Options as CsvParseOptions } from "csv-parse";
import debug from "debug";
import type { CsvParseFunction } from "../types/parsers";

const log = debug("openaq-transform parsers: DEBUG");

export const parseDelimited = async (
	content: string | Blob | Object,
	parse: CsvParseFunction,
	options: CsvParseOptions,
) => {
	if (typeof content === "string") {
		return parse(content, options);
	}
	return content;
};

export const createDelimitedParsers = (parse: CsvParseFunction) => {
	const csv = async (content: string | Blob | object) => {
		log(`Parsing ${typeof content} data using the csv method`);
		return parseDelimited(content, parse, {
			columns: true,
			skip_empty_lines: true,
		});
	};

	const tsv = async (content: string | Blob | object) => {
		log(`Parsing ${typeof content} data using the tsv method`);
		return parseDelimited(content, parse, {
			delimiter: "\t",
			columns: true,
			skip_empty_lines: true,
		});
	};

	return { csv, tsv };
};

export const json = async (content: string | Blob | object) => {
	log(`Parsing ${typeof content} data using the json method`);
	if (typeof content === "string") {
		return JSON.parse(content);
	} else {
		return content;
	}
};
