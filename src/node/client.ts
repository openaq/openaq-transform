import { Client } from "../core/client";
import { json } from "../core/parsers";
import { apiReader } from "../core/readers";
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
};

export class NodeClient extends Client {
	readers = readers;
	parsers = parsers;
}
