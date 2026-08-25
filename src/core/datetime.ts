import { DateTime, Duration } from "luxon";
import { type DatetimeFormat, ISO_UTC, SQL_NAIVE, SQL_UTC } from "./constants";
import type { DatetimeOptions, TimeOffset } from "./types/datetime";
import { formatValueForLog } from "./utils";

function assertValid(
	dt: DateTime,
	message: () => string,
): asserts dt is DateTime<true> {
	if (!dt.isValid) {
		throw new TypeError(message());
	}
}
function isValidDatetime(dt: DateTime): dt is DateTime<true> {
	return dt.isValid;
}

export const ISO_FORMAT = Symbol("iso");

const FORMATS: Record<string, string | typeof ISO_FORMAT> = {
	[ISO_UTC]: ISO_FORMAT,
	[SQL_UTC]: "yyyy-MM-dd HH:mm:ssZZ",
	[SQL_NAIVE]: "yyyy-MM-dd HH:mm:ss",
};

/** @internal */
export function resolveFormat(f?: DatetimeFormat) {
	if (!f) {
		return ISO_FORMAT;
	}
	return FORMATS[f] ?? f;
}

/**
 * A wrapper class for Luxon's `DateTime` that provides simplified
 * handling for various date and time inputs, with a focus on timezone management.
 *
 * It aims to provide a consistent API for parsing dates from strings, numbers,
 * or native `Date` objects, and ensures the internal `DateTime` object is always valid.
 */
export class Datetime {
	/**
	 * The raw input value used to construct the `Datetime` instance.
	 * This can be a string, number (Unix timestamp in seconds), native `Date` object,
	 * or another `Datetime` instance.
	 * @private
	 */
	#input: string | number | Date | DateTime;

	/**
	 * The format of the timestamp string if the input was a string and a format was provided.
	 * Follows the conventions set by Luxon: https://moment.github.io/luxon/#/parsing.
	 */
	format?: string;

	/**
	 * The IANA timezone identifier representing the timezone of the timestamp string
	 * as it was interpreted during parsing. e.g.: 'UTC' or 'America/Denver'.
	 */
	timezone?: string;

	/**
	 * The IANA timezone identifier representing the timezone of the measurement location.
	 * This defaults to `timezone` if not explicitly set, or 'UTC' if `input` was a number.
	 */
	locationTimezone?: string;

	/**
	 * The internal Luxon `DateTime` object representing the parsed and valid date and time.
	 * @readonly
	 */
	readonly date: DateTime<true>;

	/**
	 * Creates an instance of `Datetime`.
	 *
	 * @param input The date/time value to parse.
	 * - `string`: A date/time string (e.g., '2025-01-01T00:00:00', '2025-01-01 00:00').
	 * If `format` is provided, it attempts to parse with that format. Otherwise, it defaults to ISO-8601.
	 * - `number`: A Unix timestamp in seconds. It will be interpreted in 'UTC' if `locationTimezone` is not specified.
	 * - `Date`: A native JavaScript `Date` object. **Requires `timezone` option** to specify how it is interpreted.
	 * @param options Optional configuration for parsing and timezone handling.
	 * @throws {TypeError} If both `format` includes 'Z' and `timezone` is provided.
	 * @throws {TypeError} If `input` is a `Date` object and `timezone` option is not provided.
	 * @throws {TypeError} If `input` is missing.
	 * @throws {TypeError} If parsing fails or the resulting date is invalid.
	 */
	constructor(
		input: string | number | Date | DateTime,
		options?: DatetimeOptions,
	) {
		const resolvedFormat = resolveFormat(options?.format);
		const formatHasZone =
			typeof resolvedFormat === "string" && /Z/.test(resolvedFormat);
		const inputHasZone = typeof input === "string" && /Z$/i.test(input);

		if ((formatHasZone || inputHasZone) && options?.timezone) {
			throw new TypeError(
				`Cannot set a timezone ("${options.timezone}") when the input or format ` +
					`also has zone information.`,
			);
		}

		if (input instanceof Date && !options?.timezone) {
			throw new TypeError("Input of type Date must include timezone option");
		}
		this.#input = input;
		this.format = options?.format;
		this.timezone = options?.timezone;
		this.locationTimezone = options?.locationTimezone ?? options?.timezone;
		this.date = this.parseDate();
		if (this.date > DateTime.now()) {
			throw new RangeError(
				`Date string cannot be in the future. ${String(
					input,
				)} --> ${this.toLocal()}`,
			);
		}
	}

	/**
	 * Parses the input value based on its type and configured options,
	 * returning a valid Luxon `DateTime` object.
	 * @private
	 * @returns {DateTime<true>} A valid Luxon DateTime object.
	 * @throws {TypeError} If the input is missing, parsing fails, or the resulting date is invalid.
	 */
	private parseDate(): DateTime<true> {
		if (!this.#input) {
			throw new TypeError("Input required");
		}
		let parsedDate: DateTime;
		const resolvedFormat = resolveFormat(this.format);

		if (this.#input instanceof DateTime) {
			parsedDate = this.#input;
		} else if (typeof this.#input === "number") {
			parsedDate = DateTime.fromSeconds(this.#input);
			if (!this.locationTimezone) this.locationTimezone = "UTC";
		} else if (this.#input instanceof Date) {
			parsedDate = DateTime.fromISO(this.#input.toISOString(), {
				setZone: true,
			});
		} else {
			if (resolvedFormat === ISO_FORMAT) {
				parsedDate = DateTime.fromISO(this.#input, { setZone: true });
			} else {
				let input = this.#input;
				if (/ZZ/.test(resolvedFormat)) {
					input = input.replace(/Z$/i, "+00:00");
				}

				parsedDate = this.timezone
					? DateTime.fromFormat(input, resolvedFormat, { zone: this.timezone })
					: DateTime.fromFormat(input, resolvedFormat, { setZone: true });
			}

			if (!this.locationTimezone && parsedDate.zoneName) {
				this.locationTimezone = parsedDate.zoneName;
			}
		}

		assertValid(
			parsedDate,
			() =>
				`Invalid date input: "${formatValueForLog(this.#input)}" with format ` +
				`"${resolvedFormat === ISO_FORMAT ? "ISO-8601" : resolvedFormat}". ` +
				`${parsedDate.invalidReason}: ${parsedDate.invalidExplanation ?? ""}`,
		);
		return parsedDate;
	}

	/**
	 * Converts the internal Luxon `DateTime` to a native JavaScript `Date` object.
	 * The returned `Date` object will represent the same instant in time.
	 * @returns {Date} A native JavaScript `Date` object.
	 */
	toDate(): Date {
		return this.date.toJSDate();
	}

	/**
	 * Checks if this `Datetime` instance represents a moment in time
	 * that is strictly greater than another `Datetime` instance.
	 * @param date The `Datetime` instance to compare against.
	 * @returns {boolean} `true` if this instance is later, `false` otherwise.
	 */
	readonly isGreaterThan = (date: Datetime): boolean => this.date > date.date;

	/**
	 * Checks if this `Datetime` instance represents a moment in time
	 * that is strictly less than another `Datetime` instance.
	 * @param date The `Datetime` instance to compare against.
	 * @returns {boolean} `true` if this instance is earlier, `false` otherwise.
	 */
	readonly isLessThan = (date: Datetime): boolean => this.date < date.date;

	/**
	 * Returns the `Datetime` instance that represents the later moment in time
	 * between this instance and another provided `Datetime` instance.
	 * @param date The `Datetime` instance to compare against.
	 * @returns {Datetime} This instance if it's later or equal, otherwise the provided `date` instance.
	 */
	readonly greaterOf = (date: Datetime): Datetime =>
		this.date >= date.date ? this : date;

	/**
	 * Returns the `Datetime` instance that represents the earlier moment in time
	 * between this instance and another provided `Datetime` instance.
	 * @param date The `Datetime` instance to compare against.
	 * @returns {Datetime} This instance if it's earlier or equal, otherwise the provided `date` instance.
	 */
	readonly lesserOf = (date: Datetime): Datetime =>
		this.date <= date.date ? this : date;

	/**
	 * Converts the `Datetime` to its UTC representation as an ISO 8601 string,
	 * suppressing milliseconds.
	 *
	 * @returns {string} An ISO 8601 string in UTC, e.g., '2025-01-01T00:00:00Z'.
	 */
	toUTC(formatString: string | null = null): string {
		const date = this.date.setZone("UTC");
		assertValid(date, () => `Could not convert to UTC: ${date.invalidReason}`);
		return formatString
			? date.toFormat(formatString)
			: date.toISO({ suppressMilliseconds: true });
	}

	/**
	 * Converts the `Datetime` to its representation in the `locationTimezone`
	 * as an ISO 8601 string, suppressing milliseconds.
	 *
	 * @returns {string | undefined} An ISO 8601 string in the `locationTimezone`,
	 * or `undefined` if `locationTimezone` is somehow invalid (though unlikely if set correctly).
	 */
	toLocal(formatString: string | null = null): string | undefined {
		const date = this.date.setZone(this.locationTimezone);
		if (isValidDatetime(date)) {
			return formatString
				? date.toFormat(formatString)
				: date.toISO({ suppressMilliseconds: true });
		}
	}

	/**
	 * Serialize the datetime object to a string
	 *
	 * @returns {string | undefined} An ISO 8601 string in the `locationTimezone`,
	 * or `undefined` if `locationTimezone` is somehow invalid (though unlikely if set correctly).
	 */
	toString(formatString: string | null = null): string | undefined {
		return this.toLocal(formatString);
	}

	/**
	 * Creates a new Datetime instance representing the internal date/time,
	 * plus the required offset value.
	 *
	 * @param {number | Duration | TimeOffset} [timeOffset=0] - The amount to add to the current time.
	 *
	 * @returns {Datetime} A new Datetime instance adjusted by the specified offset
	 */
	add(timeOffset: number | Duration | TimeOffset): Datetime {
		let dt: DateTime;

		if (typeof timeOffset === "number") {
			if (timeOffset < 0) {
				throw new RangeError("timeOffset must be a positive number");
			}
			dt = this.date.plus(timeOffset * 1000);
		} else {
			const dur =
				timeOffset instanceof Duration
					? timeOffset
					: Duration.fromObject(timeOffset);
			if (dur.as("seconds") < 0) {
				throw new RangeError("timeOffset must be a positive number");
			}
			dt = this.date.plus(dur);
		}

		return new Datetime(dt, {
			locationTimezone: this.locationTimezone,
		});
	}

	/**
	 * Creates a new Datetime instance representing the internal date/time,
	 * minus the required offset value.
	 *
	 * @param {number | Duration | TimeOffset} [timeOffset=0] - The amount to subtract from the current time.
	 *
	 * @returns {Datetime} A new Datetime instance adjusted by the specified offset
	 */
	minus(timeOffset: number | Duration | TimeOffset): Datetime {
		let dt: DateTime;

		if (typeof timeOffset === "number") {
			if (timeOffset < 0) {
				throw new RangeError("timeOffset must be a positive number");
			}
			dt = this.date.minus(timeOffset * 1000);
		} else {
			const dur =
				timeOffset instanceof Duration
					? timeOffset
					: Duration.fromObject(timeOffset);
			if (dur.as("seconds") < 0) {
				throw new RangeError("timeOffset must be a positive number");
			}
			dt = this.date.minus(dur);
		}

		return new Datetime(dt, {
			locationTimezone: this.locationTimezone,
		});
	}

	/**
	 * Creates a new Datetime instance representing the current date and time,
	 * optionally adjusted by a specified offset into the past.
	 *
	 * @param {number | Duration | TimeOffset} [timeOffset=0] - The amount to subtract from the current time.
	 * @param {string} [timezone] - The IANA to intepret "now".
	 *
	 * @returns {Datetime} A new Datetime instance adjusted by the specified offset
	 */
	static now(
		timeOffset: number | Duration | TimeOffset = 0,
		timezone?: string,
	): Datetime {
		const now = timezone ? DateTime.now().setZone(timezone) : DateTime.now();
		assertValid(now, () => `Invalid timezone: "${timezone}"`);
		let dt: DateTime;

		if (typeof timeOffset === "number") {
			dt = now.minus(Math.abs(timeOffset) * 1000);
		} else if (timeOffset instanceof Duration) {
			dt = now.minus(timeOffset);
		} else {
			dt = now.minus(timeOffset);
		}

		return new Datetime(
			dt,
			timezone ? { timezone, locationTimezone: timezone } : undefined,
		);
	}
}
