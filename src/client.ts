

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {cleanKey} from './utils';
import { FixedMeasure, MobileMeasure } from './measures';
import { Location } from './location.ts'
import { truthy, parseData } from './utils.ts'

dayjs.extend(utc);


export interface MetaDefinition {
    locationIdKey: string;
    locationLabelKey: string;
    parameterKey: string;
    valueKey: string;
    projection: string;
    latitudeKey: string;
    longitudeKey: string;
    manufacturerKey: string;
    modelKey: string;
    ownerKey: string;
    licenseKey: string;
    timestampKey: string;
    datetimeFormat: string;
    timezone: string;
    measurandMap: [];
}

export interface Source {
    meta: MetaDefinition;
    provider: string;
    parameters: string[];
}


type ErrorSummaryDefinition = { [key: string]: number; }

interface SummaryDefinition {
    source_name: string;
    locations: number;
    systems: number;
    sensors: number;
    flags: number;
    measures: number;
    errors: ErrorSummaryDefinition;
    from: string;
    to: string;
}

type MobileMeasureArray = MobileMeasure[];
type FixedMeasureArray = FixedMeasure[];

type MeasuresType = MobileMeasureArray | FixedMeasureArray;

interface LogEntry {
    message: string;
    err?: Error;
};

interface LogDefinition {
    [key: string]: LogEntry[];
};

export class Client {
    url: string;
    fetched: boolean = false;
    source: Source;
    locationIdKey: string = 'location';
    locationLabelKey: string = 'label';
    parameterKey: string = 'parameter';
    valueKey: string = 'value';
    sourceProjection: string = 'WGS84';
    latitudeKey: string = 'lat';
    longitudeKey: string = 'lng';
    manufacturerKey: string = 'manufacturer_name';
    modelKey: string = 'model_name';
    ownerKey: string = 'owner_name';
    licenseKey: string = 'license';
    datetimeKey: string = 'datetime';
    datetimeFormat: string = 'YYYY-MM-DDTHH:mm:ssZ';
    timezone: string = 'UTC';

    datasources: object = {};
    missingDatasources: string[] = [];
    parameters: string[] = [];

    // keyed set of expected parameters for this client
    measurands = null;
    // list type for holding measurements
    measures: MeasuresType =  [];
    // keyed locations, sensors etc for internal tracking and retrieval
    _locations: object = {};
    _sensors: object = {};
    // log object for compiling errors/warnings for later reference
    log: LogDefinition = {};

    constructor() {
        // ??
    }

    get provider() {
        return cleanKey(this.source.provider);
    }

    get locations() {
        return Object.values(this._locations);
    }

    async fetchMeasurands() {
        this.measurands = await Measurand.getIndexedSupportedMeasurands(this.parameters);
    }

    /**
     * Provide a location based ingest id
     *
     * @param {object} row - data for building key
     * @returns {string} - location id key
     */
    getLocationId(row) {
        const location = cleanKey(row[this.locationIdKey]);
        return `${this.provider}-${location}`;
    }

    /**
     * Provide a system based ingest id
    */
    getSystemId(row) : string {
        const manufacturer = cleanKey(row[this.manufacturerKey]);
        const model = cleanKey(row[this.modelKey]);
        const location_id = this.getLocationId(row);
        let key = '';
        if (manufacturer && model) {
            key = `-${manufacturer}:${model}`;
        } else if (!manufacturer & !model) {
            // key = 'default';
        } else {
            key = `-${manufacturer || model}`;
        }
        return `${location_id}${key}`;
    }

    /**
     * Provide a sensor based ingest id
     *
     * @param {object} row - data for building key
     * @returns {string} - sensor id key
     */
    getSensorId(row) {
        const measurand = this.measurands[row.metric];
        const location_id = this.getLocationId(row);
        const version = cleanKey(row.version_date);
        const instance = cleanKey(row.instance);
        if (!measurand) {
            throw new Error(`Could not find measurand for ${row.metric}`);
        }
        const key = [measurand.parameter];
        if (instance) key.push(instance);
        if (version) key.push(version);
        return `${location_id}-${key.join(':')}`;
    }


    /**
     *  Create a label for this location
     *
     * @param {object} row - data to use
     * @returns {string} - label
     */
    getLabel(row) {
        return row[this.locationLabelKey];
    }


    /**
     * Get location by key
     *
     * @param {(string|object)} key - key or data to build location
     * @returns {object} - location object
     */
    getLocation(key) {
        let loc = null;
        let data = {};
        if (typeof(key) === 'object') {
            data = { ...key };
            key = this.getLocationId(data);
        }
        loc = this._locations[key];
        if (!loc) {
            loc = this.addLocation({ locationId: key, ...data });
        }

        return loc;
    }


    /**
     * Get sensor by key
     *
     * @param {(string|object)} key - key or data to build sensor
     * @returns {object} - sensor object
     */
    getSensor(key) {
        let sensor = null;
        let data = {};
        if (typeof(key) === 'object') {
            data = { ...key };
            key = this.getSensorId(data);
        }
        sensor = this.sensors[key];
        if (!sensor) {
            //sensor = this.addSensor({ sensor_id: key, ...data });
        }
        return sensor;
    }

    /**
     * Create a proper timestamp
     *
     * @param {*} row - data with fields to create timestamp
     * @returns {string} - formated timestamp string
     */
    getDatetime (row) {
        const dt_string = row[this.datetimeKey];
        if(!dt_string) {
            throw new Error(`Missing date/time field. Looking in ${this.datetimeKey}`);
        }
        const dt = dayjs.utc(dt_string, this.datetimeFormat);
        if(!dt.isValid()) {
            throw new Error(`A valid date could not be made from ${dt_string} using ${this.datetimeFormat}`);
        }
        return dt;
    }

    /**
     * fetches data and convert to json
     *
     * @param {*} f -
     * @returns {*} -
     */
    async fetchData (f) {
        // if its a non-json string it should be a string that represents a location
        // local://..
        // s3://
        // google://
        // if its binary than it should be an uploaded file
        // if its an object then ...
        const res = await fetch(this.url)
        return await res.json()
    }

    logMessage(type: string, message: string, err: Error | undefined) {
        // check if warning or error
        // if strict than throw error, otherwise just log for later
        if(!this.log[type]) this.log[type] = [];
        this.log[type].push({ message, err});
        if (VERBOSE) console.log(`${type}:`, err && err.message);
    }

    /**
     * Entry point for processing data
     *
     * @param {(string|file|object)} file - file path, object or file
     */
    async fetch() {
        const data = await this.fetchData();
        if (!data) {
            throw new Error('No data was returned from file');
        }
        if (data.locations) {
            this.processLocationsData(data.locations);
        } else if (data.sensors) {
            this.processSensorsData(data.sensors);
        } else if (data.measurements) {
            this.processMeasurementsData(data.measurements);
        } else if (data.flags) {
            this.processFlagsData(data.flags);
        }
    }


    /**
     * Add a location to our list
     *
     * @param {object} data - location data
     * @returns {*} - location object
     */
    addLocation(data) {
        const key = this.getLocationId(data);
        if (!this._locations[key]) {
            // process data through the location map
            console.debug(`Adding location: ${key}`)
            this._locations[key] = new Location({
                location_id: key,
                label: parseData(data, this.locationLabelKey),
                ismobile: parseData(data, this.isMobileKey),
                lon: parseData(data, this.longitudeKey),
                lat: parseData(data, this.longitudeKey),
                ...data,
            });
        }
        return this._locations[key];
    }

    /**
     * Process a list of locations
     *
     * @param {array} locations - list of location data
     */
    async processLocationsData(locations) {
        console.debug(`Processing ${locations.length} locations`);
        locations.map((d) => {
            try {
                this.addLocation(d);
            } catch (e) {
                console.warn(`Error adding location: ${e.message}`);
            }
        });
    }

    /**
     * Process a list of sensors
     *
     * @param {array} sensors - list of sensor data
     */
    async processSensorsData(sensors) {
        console.debug(`Processing ${sensors.length} sensors`);
        sensors.map((d) => {
            try {

                const sensor_id = this.getSensorId({
                    location: d[this.location_key],
                    metric: d[this.parameter_key],
                    ...d,
                });

                const system_id = this.getSystemId(d);
                const location = this.getLocation(d);
                // maintain a way to get the sensor back without traversing everything
                this.sensors[sensorId] = location.add({ sensor_id, system_id, ...d });

            } catch (e) {
                this.logMessage(`Error adding sensor: ${e.message}`, 'error');
            }
        });
    }

    /**
     * Process a list of measurements
     *
     * @param {array} measurements - list of measurement data
     */
    async processMeasurementsData(measurements) {
        console.debug(`Processing ${measurements.length} measurements`);
        // if we provided a parameter column key we use that
        // otherwise we use the list of parameters
        let params = [];
        let long_format = false;

        if (measurements.length) {
            const keys = Object.keys(measurements[0]);
            long_format = keys.includes(this.parameter_key) && keys.includes(this.value_key);
            if (long_format) {
                params = [this.parameter_key];
            } else {
                params = Object.keys(this.parameters);
            }
        }

        measurements.map( (meas) => {
            try {
                const datetime = this.getDatetime(meas);
                const location = meas[this.locationIdKey];
                params.map((p) => {
                    const value = long_format ? meas[this.valueKey] : meas[p];
                    const metric = long_format ? meas[p] : p;
                    const m = {
                        location,
                        value,
                        metric,
                    };
                    if (m.value) {
                        this.measures.push({
                            sensor_id: this.getSensorId(m),
                            timestamp: datetime,
                            measure: this.normalize(m),
                        });
                    } else {
                        this.logMessage('VALUE_NOT_FOUND', 'error');
                    }
                });
            } catch (e) {
                this.logMessage('MEASUREMENT_ERROR', 'error', e);
            }
        });
    }

    /**
     * PLACEHOLDER
     *
     * @param {*} flags -
     * @returns {*} -
     */
    async processFlagsData(flags) {
        console.debug(`Processing ${flags.length} flags`);
        flags.map((d) => {
            try {

                const sensor = this.getSensor({
                    location: d[this.locationIdKey],
                    metric: d[this.parameterKey],
                    ...d,
                });

                if(sensor) {
                    sensor.add(d);
                }

            } catch (e) {
                console.warn(`Error adding flag: ${e.message}`);
            }
        });
    }


    /**
     * Method to dump data to format that we can ingest
     *
     * @returns {object} - data object formated for ingestion
     */
    data() {
        return {
            meta: {
                schema: 'v0.1',
                source: this.provider,
                matching_method: 'ingest-id'
            },
            measures: this.measures.json(),
            locations: Object.values(this._locations).map((l)=>l.json())
        };
    }

    /**
     * Dump a summary that we can pass back to the log
    */
    summary(): SummaryDefinition {
        const errorSummary: ErrorSummaryDefinition = {} ;
        Object.keys(this.log).map((k) => errorSummary[k] = this.log[k].length);
        return {
            source_name: this.provider,
            locations: this.locations.length,
            systems: Object.values(this._locations).map((l) => Object.values(l.systems).length).flat().reduce((d,i) => d + i),
            sensors: Object.values(this._locations).map((l) => Object.values(l.systems).map((s) => Object.values(s.sensors).length)).flat().reduce((d,i) => d + i),
            // taking advantage of the sensor object list
            flags: Object.values(this.sensors).map((s) => Object.values(s.flags).length).flat().reduce((d,i) => d + i),
            measures: this.measures.length,
            errors: errorSummary,
            from: this.measures.from && this.measures.from.utc().format(),
            to: this.measures.to && this.measures.to.utc().format(),
        };
    }
}
