import { Client } from "../core/client";
import { json, xml } from "../core/parsers";
import { apiReader } from "../core/readers";
import type { ParserMethods } from "../types/parsers";
import type { ReaderMethods } from "../types/readers";
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
