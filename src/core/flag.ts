import type { FlagData } from "../types/flag";
import { stripNulls } from "./utils";


export class Flag {

    flagId: string;
    datetimeFrom: string;
    datetimeTo: string;
    flagName: string;
    note: string;

    constructor(data: FlagData) {
        this.flagId = data.flagId || Flag.id(data);
        this.datetimeFrom = data.starts;
        this.datetimeTo = data.ends;
        this.flagName = data.flag;
        this.note = data.note;
    }

    static id(data: FlagData): string {
        const starts = data.starts || 'infinity';
        return `${data.sensorId}-${data.flag}::${starts}`;
    }

    /**
     * Export method to convert to json
     */
    json() {
        return stripNulls({
            flag_id: this.flagId,
            datetime_from: this.datetimeFrom,
            datetime_to: this.datetimeTo,
            flag_name: this.flagName,
            note: this.note,
        });
    }
}
