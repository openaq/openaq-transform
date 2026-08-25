/**
 * ISO-8601, with or without a `Z` / numeric offset, with or without
 * milliseconds. default when `datetimeFormat` is unset.
*/
export const ISO_UTC = 'ISO_UTC';

/** `2026-03-23 00:00:00Z` space separator, Zulu designator. */
export const SQL_UTC = "SQL_UTC";

/** `2026-03-23 00:00:00` space separater, no zone information, requires `timezone`. */
export const SQL_NAIVE = "SQL_NAIVE";


/**
 * A datetime format: either one of the named constants, or a raw
 * Luxon token string for sources that aren't covered by constants.
 * @see https://moment.github.io/luxon/#/parsing
 */
export type DatetimeFormat =
  | typeof ISO_UTC
  | typeof SQL_UTC
  | typeof SQL_NAIVE
  | (string & {});
