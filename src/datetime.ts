import { fromUnixTime, parse, parseISO } from "date-fns";

export class Datetime {

    _input: string | number | Date;
    format?: string;
    timezone?: string;

    constructor(input: string | number, format?: string, timezone?: string) {
        this._input = input;
        this.format = format;
        this.timezone = timezone;
        this._date = null;

      // we should parse it here and not defer to later
      if(!this._input) {
        throw new Exception('Input required');
      }

      if (typeof this._input == 'number') {
        this._date = fromUnixTime(this._input)
      }
      if (!this.format) {
        this._date = parseISO(this._input);
      } else {
        this._date = parse(String(this._input), this.format, new Date())
      }

    }

  // this should just be an serializer/formatter
  toString() {
    return this._date.toISOString();
  }

    get datetime(): Date {
        if (typeof this._input == 'number') {
            return fromUnixTime(this._input)
        }
        if (!this.format) {
            return parseISO(this._input);
        } else {
            return parse(String(this._input), this.format, new Date())
        }
    }
}
