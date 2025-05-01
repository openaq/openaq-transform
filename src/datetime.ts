import { tz } from "@date-fns/tz";
import { fromUnixTime, parse, parseISO, format } from "date-fns";

export class Datetime {

    #input: string | number | Date;
    format?: string;
    timezone?: string;
    #date: Date | null;

    constructor(input: string | number, format?: string, timezone?: string) {
        this.#input = input;
        this.format = format;
        this.timezone = timezone;
        this.#date = null;

      // we should parse it here and not defer to later
      if(!this.#input) {
        throw new Error('Input required');
      }

      if (typeof this.#input == 'number') {
        this.#date = fromUnixTime(this.#input)
      } else {
        if (!this.format) {
          this.#date = parseISO(this.#input);
        } else {
          this.#date = parse(String(this.#input), this.format, new Date())
        }
      }


    }

  toDate() {
    return this.#date;
  }

  // this should just be an serializer/formatter
  toString() {
    return format(this.#date, "yyyy-MM-dd'T'HH:mm:ssxxx");//, { in: tz(this.timezone) });
  }

}
