import type { FlagData, FlagJSON } from "../types/flag";
import { stripNulls } from "./utils";

export class Flag {
	key: string;
	datetimeFrom: string;
	datetimeTo: string;
	flagName: string;
	note: string;

	constructor(data: FlagData) {
		this.key = data.key || this.#key(data);
		this.datetimeFrom = data.starts;
		this.datetimeTo = data.ends;
		this.flagName = data.flag;
		this.note = data.note;
	}

	#key(data: FlagData): string {
		const starts = data.starts || "infinity";
		return `${data.sensorKey}-${data.flag}::${starts}`;
	}

	/**
	 * Export method to convert to json
	 */
	json(): FlagJSON {
		return stripNulls({
			key: this.key,
			datetime_from: this.datetimeFrom,
			datetime_to: this.datetimeTo,
			flag_name: this.flagName,
			note: this.note,
		});
	}
}
