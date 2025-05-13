import { DateTime } from 'luxon';



interface DatetimeOptionsDefinition {
  format?: string,
  timezoneParse?: string,
  timezoneOut?: string
}

export class Datetime {
  #input: string | number | Date;  //'2025-01-01 00:00'
  format?: string;   // 'YYYY-mm-dd HH:mm'
  timezoneParse?: string; // 'UTC'
  timezoneOut?: string; // UTC 'America/Denver'
  readonly date: DateTime;



  constructor(
    input: string | number | Date,
    options?: DatetimeOptionsDefinition
  ) {
    if (
      options?.format?.includes('Z') && options?.timezoneParse
    ) throw new TypeError()
    this.#input = input;
    this.format = options?.format;
    this.timezoneParse = options?.timezoneParse;
    this.timezoneOut = options?.timezoneOut;
    this.date = this.parseDate();
  }

  private parseDate(): DateTime {
    if (!this.#input) {
      throw new TypeError('Input required');
    }
    let parsedDate: DateTime | null = null;

    if (typeof this.#input == 'number') {
      parsedDate = DateTime.fromSeconds(this.#input);
      if (!this.timezoneOut) this.timezoneOut = 'UTC'
    } else if (this.#input instanceof Date) {
      parsedDate = DateTime.fromJSDate(this.#input);
    } else {
      try {
        if (!this.format) { // defaults to ISO-8601
          parsedDate = DateTime.fromISO(this.#input);
        } else {
          if (this.timezoneParse) {
            parsedDate = DateTime.fromFormat(this.#input, this.format, { zone: this.timezoneParse })
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

  readonly greaterOf = (date: Datetime): Datetime => this.date >= date.date ? this : date

  readonly lesserOf = (date: Datetime): Datetime => this.date <= date.date ? this : date

  toString() {
    return this.date.setZone(this.timezoneOut).toISO()
  }
}
