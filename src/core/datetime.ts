import { DateTime } from 'luxon';


interface DatetimeOptionsDefinition {
  format?: string,
  timezone?: string,
  locationTimezone?: string
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
  #input: string | number | Date;

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
    input: string | number | Date,
    options?: DatetimeOptionsDefinition
  ) {
    if (
      options?.format?.includes('Z') && options?.timezone
    ) throw new TypeError(`You cannot include both the Z option in your format (${options.format}) and a timezone (${options.timezone})`)
    if (input instanceof Date && !options?.timezone) {
      throw new TypeError("Input of type Date must include timezone option");
    }
    this.#input = input;
    this.format = options?.format;
    this.timezone = options?.timezone;
    this.locationTimezone = options?.locationTimezone ?? options?.timezone;
    this.date = input instanceof Datetime ? DateTime.fromObject(input.date.toObject(), { zone: input.locationTimezone }) as DateTime<true> : this.parseDate();
  }

  /**
   * Parses the input value based on its type and configured options,
   * returning a valid Luxon `DateTime` object.
   * @private
   * @returns {DateTime<true>} A valid Luxon DateTime object.
   * @throws {TypeError} If the input is missing, parsing fails, or the resulting date is invalid.
   */
  private parseDate(): DateTime {
    if (!this.#input) {
      throw new TypeError('Input required');
    }
    let parsedDate: DateTime | null = null;

    if (typeof this.#input == 'number') {
      parsedDate = DateTime.fromSeconds(this.#input);
      if (!this.locationTimezone) this.locationTimezone = 'UTC'
    } else if (this.#input instanceof Date) {
      const year = this.#input.getFullYear();
      const month = this.#input.getMonth() + 1;
      const day = this.#input.getDate();
      const hour = this.#input.getHours();
      const minute = this.#input.getMinutes();
      const second = this.#input.getSeconds();
      parsedDate = DateTime.fromObject({year, month,day,hour,minute,second}, {zone: this.locationTimezone})
    } else {
      try {
        if (!this.format) { // defaults to ISO-8601
          // the setZone option will ensure that it sets the zone to the string offset and not the local zone
          parsedDate = DateTime.fromISO(this.#input, { setZone: true });
          if(!this.locationTimezone && !!parsedDate.zoneName) {
            this.locationTimezone = parsedDate.zoneName
          }
        } else {
          if (this.timezone) {
            parsedDate = DateTime.fromFormat(this.#input, this.format, { zone: this.timezone })
          } else {
            parsedDate = DateTime.fromFormat(this.#input, this.format)
          }
        }
      } catch (error) {
        throw new TypeError(
          `Failed to parse date string "${this.#input}" with format "${this.format}". Error: ${error}`
        );
      }
    }
    if (!parsedDate.isValid) {
      throw new TypeError(
        `Invalid date input: "${this.#input}" with format "${this.format}: ${parsedDate.invalidReason}".`
      );
    }
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
  readonly isGreaterThan = (date: Datetime): boolean => this.date > date.date

  /**
   * Checks if this `Datetime` instance represents a moment in time
   * that is strictly less than another `Datetime` instance.
   * @param date The `Datetime` instance to compare against.
   * @returns {boolean} `true` if this instance is earlier, `false` otherwise.
   */
  readonly isLessThan = (date: Datetime): boolean => this.date < date.date

  /**
   * Returns the `Datetime` instance that represents the later moment in time
   * between this instance and another provided `Datetime` instance.
   * @param date The `Datetime` instance to compare against.
   * @returns {Datetime} This instance if it's later or equal, otherwise the provided `date` instance.
   */
  readonly greaterOf = (date: Datetime): Datetime => this.date >= date.date ? this : date

  /**
   * Returns the `Datetime` instance that represents the earlier moment in time
   * between this instance and another provided `Datetime` instance.
   * @param date The `Datetime` instance to compare against.
   * @returns {Datetime} This instance if it's earlier or equal, otherwise the provided `date` instance.
   */
  readonly lesserOf = (date: Datetime): Datetime => this.date <= date.date ? this : date

  /**
   * Converts the `Datetime` to its UTC representation as an ISO 8601 string,
   * suppressing milliseconds.
   *
   * @returns {string} An ISO 8601 string in UTC, e.g., '2025-01-01T00:00:00Z'.
   */
  toUTC(): string{
    const date = this.date.setZone('UTC') as DateTime<true>;
    return date.toISO({ suppressMilliseconds: true });
  }

  /**
   * Converts the `Datetime` to its representation in the `locationTimezone`
   * as an ISO 8601 string, suppressing milliseconds.
   *
   * @returns {string | undefined} An ISO 8601 string in the `locationTimezone`,
   * or `undefined` if `locationTimezone` is somehow invalid (though unlikely if set correctly).
   */
  toLocal(): string | undefined {
    const date = this.date.setZone(this.locationTimezone);
    if (date.isValid) {
      return date.toISO({ suppressMilliseconds: true });
    }
  }

}
