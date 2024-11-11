import { stripNulls } from "./utils";


export interface FlagDefinition {
    sensorId: string;
    flagId: string | undefined;
    starts: string;
    ends: string;
    flag: string;
    note: string;
}


export class Flag {

    flagId: string;
    datetimeFrom: string;
    datetimeTo: string;
    flagName: string;
    note: string;

    constructor(data: FlagDefinition) {
        this.flagId = data.flagId || Flag.id(data);
        this.datetimeFrom = data.starts;
        this.datetimeTo = data.ends;
        this.flagName = data.flag;
        this.note = data.note;
    }

    static id(data): string {
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