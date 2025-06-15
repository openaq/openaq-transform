import { parse } from 'csv-parse';
import { createDelimitedParsers } from '../core/parsers'

export const { csv, tsv } = createDelimitedParsers(parse)