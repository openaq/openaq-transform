import { parse } from "csv-parse/sync";
import { createDelimitedParsers } from "../core/parsers";

export const { csv, tsv } = createDelimitedParsers(parse);
