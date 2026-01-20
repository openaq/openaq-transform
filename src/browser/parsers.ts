import { parse } from 'csv-parse/browser/esm/sync'
import { createDelimitedParsers } from '../core/parsers'

export const { csv, tsv } = createDelimitedParsers(parse);

