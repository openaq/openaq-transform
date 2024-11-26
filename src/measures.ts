import dayjs, { Dayjs } from './dayjs'


export class Measures {
    headers: string[];
    measures: Measure[];
    from?: string;
    to?: string;

    constructor(type: FixedMeasure | MobileMeasure) {
        this.measures = [];

        this.headers = type === FixedMeasure
        ? ['sensor_id', 'measure', 'timestamp']
        : ['sensor_id', 'measure', 'timestamp', 'longitude', 'latitude'];
    }

    add(measure: Measure) {
        this.to = this.to ? Math.max(this.to, measure.timestamp) : measure.timestamp;
        this.from = this.from ? Math.min(this.from, measure.timestamp) : measure.timestamp;
        this.measures.push(measure);
    }

    get length() {
        return this.measures.length;
    }

    json() {
        return this.measures.map((m) => ({
            sensor_id: m.sensorId,
            timestamp: m.timestamp.format(),
            value: m.measure,

        }));
    }
}


interface MeasureDefinition {
    sensorId: number;
    timestamp: Dayjs;
    measure: number;
    units: string;
    latitude?: number;
    longitude?: number;
}

export class Measure {
    sensorId: number;
    timestamp: Dayjs;
    measure: number;

    constructor(params: MeasureDefinition = {}) {
        this.sensorId = params.sensorId;
        this.timestamp = params.timestamp;
        this.measure = params.measure;
    }
}

/**
 * @class FixedMeasure
 */
export class FixedMeasure extends Measure {
    constructor(params: MeasureDefinition) {
        super(params);
    }
}

/**
 * @class MobileMeasure
 */
export class MobileMeasure extends Measure {
    latitude?: number;
    longitude?: number;

    constructor(params: MeasureDefinition) {
        super(params);

        this.latitude = params.latitude;
        this.longitude = params.longitude;
    }
}
