import type { ParserMethods, ReaderMethods } from "@openaq/transform/core";
import { apiReader, Client, json, xml } from "@openaq/transform/core";
import { csv, tsv } from "./parsers";
import { fileReader } from "./readers";

const readers: ReaderMethods = {
	api: apiReader,
	file: fileReader,
};

const parsers: ParserMethods = {
	json,
	csv,
	tsv,
	xml,
};

export class BrowserClient<S = object> extends Client<
	ReaderMethods,
	ParserMethods,
	S
> {
	readers = readers;
	parsers = parsers;
}
