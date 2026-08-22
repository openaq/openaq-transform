import { createDelimitedParsers } from "@openaq/transform/core";
import { parse } from "csv-parse/browser/esm/sync";

export const { csv, tsv } = createDelimitedParsers(parse);
