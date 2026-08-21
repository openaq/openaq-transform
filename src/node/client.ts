import { apiReader, json, xml } from "../core";
import { Client } from "../core/client";
import type { ParserMethods } from "../types/parsers";
import type { ReaderMethods } from "../types/readers";
import { csv, tsv } from "./parsers";
import { fileSystemReader } from "./readers";

const readers: ReaderMethods = {
	api: apiReader,
	file: fileSystemReader,
};

const parsers: ParserMethods = {
	json,
	csv,
	tsv,
	xml,
};

export class NodeClient<S = object> extends Client<
	ReaderMethods,
	ParserMethods,
	S
> {
	readers = readers;
	parsers = parsers;
}
