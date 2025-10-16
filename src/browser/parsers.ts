import { parse } from 'csv-parse/browser/esm/sync'
import { createDelimitedParsers } from '../core/parsers'

const { csv, tsv } = createDelimitedParsers(parse);

export { csv, tsv }
