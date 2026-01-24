import { Client } from "../core/client";
import { json } from "../core/parsers";
import { apiReader } from "../core/readers";
import type { ParserMethods } from "../types/parsers";
import type { ReaderMethods } from "../types/readers";
import { csv, tsv } from "./parsers";
import { fileReader } from "./readers";

const readers = {
	api: apiReader,
	file: fileReader,
} satisfies ReaderMethods;

const parsers = {
	json,
	csv,
	tsv,
} satisfies ParserMethods;

export class BrowserClient extends Client<typeof readers, typeof parsers> {
	readers = readers;
	parsers = parsers;
}
