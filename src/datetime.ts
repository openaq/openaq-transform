import { fromUnixTime, parse, parseISO } from "date-fns";

export class Datetime {

    _input: string | number;
    format?: string;
    timezone?: string ;

    constructor(input: string | number, format?: string, timezone?: string) {
        this._input = input;
        this.format = format;
        this.timezone = timezone;
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