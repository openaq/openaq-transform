import { createDelimitedParsers } from "@openaq/transform/core";
import { parse } from "csv-parse/sync";

export const { csv, tsv } = createDelimitedParsers(parse);
