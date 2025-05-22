import { DateTime } from 'luxon';



interface DatetimeOptionsDefinition {
  format?: string,
  timezone?: string,
  locationTimezone?: string
}

// settled on `timezone` as the variable name of the formated string to match the variable `format`
// both referring to the string as written in the data
export class Datetime {
  #input: string | number | Date | Datetime;  //'2025-01-01 00:00'
  format?: string;   // 'YYYY-mm-dd HH:mm' Format of the timestamp string
  timezone?: string; // 'UTC' The timezone of the timestamp string
  locationTimezone?: string; // UTC 'America/Denver' - the timezone of the measurement location
  readonly date: DateTime;



  constructor(
    input: string | number | Date | Datetime,
    options?: DatetimeOptionsDefinition
  ) {
    if (
      options?.format?.includes('Z') && options?.timezone
    ) throw new TypeError()
    this.#input = input;
    this.format = options?.format;
    this.timezone = options?.timezone;
    this.locationTimezone = options?.locationTimezone ?? options?.timezone;
    this.date = this.parseDate();
  }

  private parseDate(): DateTime {
    if (!this.#input) {
      throw new TypeError('Input required');
    }
    let parsedDate: DateTime | null = null;

    if (typeof this.#input == 'number') {
      parsedDate = DateTime.fromSeconds(this.#input);
      if (!this.locationTimezone) this.locationTimezone = 'UTC'
    } else if (this.#input instanceof Date) {
      parsedDate = DateTime.fromJSDate(this.#input);
    }else if (this.#input instanceof Datetime) {
      parsedDate = this.#input.date;
    } else {
      try {
        if (!this.format) { // defaults to ISO-8601
          parsedDate = DateTime.fromISO(this.#input);
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

  toDate(): Date {
    return this.date.toJSDate();
  }

  readonly isGreaterThan = (date: Datetime): boolean => this.date > date.date

  readonly isLessThan = (date: Datetime): boolean => this.date < date.date

    // when a null/undefinded value is passed we will always return this.date
    // this is valuable when you are updating a value that has not been initialized
  readonly greaterOf = (date: Datetime): Datetime => this.date >= (date?.date ?? this.date) ? this : date

  readonly lesserOf = (date: Datetime): Datetime => this.date <= (date?.date ?? this.date) ? this : date

  toString() {
    return this.date.setZone(this.locationTimezone).toISO()
  }

  toUTC() {
    return this.date.setZone('UTC').toISO()
  }

  toLocal() {
    return this.date.setZone().toISO()
  }

}
