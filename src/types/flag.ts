import type { Flag } from "../core/flag";

export interface FlagData {
    sensorId: string;
    flagId?: string;
    starts: string;
    ends: string;
    flag: string;
    note: string;
}


export type IndexedFlags = Record<string, Flag>;
