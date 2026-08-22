import type { ParserMethods, ReaderMethods } from "@openaq/transform/core";
import { apiReader, Client, json, xml } from "@openaq/transform/core";
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
