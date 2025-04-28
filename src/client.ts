


import { cleanKey } from './utils';
import { Measurements } from './measurement';
import { Location, Locations } from './location'
import { Sensor, Sensors } from './sensor';
import { ParametersDefinition, PARAMETER_DEFAULTS } from './constants';
import { Datetime } from './datetime';

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
}

export interface Source {
    meta: MetaDefinition;
    provider: string;
    parameters: string[];
}

interface LocationDataDefinition {
    [key: string]: any
}

interface SensorDataDefinition {
    [key: string]: any
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


interface LogEntry {
    message: string;
    err?: Error;
};

interface LogDefintion {
    info?: LogEntry[];
    warning?: LogEntry[];
    error?: LogEntry[];
}


type ParseFunction = (data?: any) => string | number | object | boolean

interface LogDefinition {
    [key: string]: LogEntry[];
};



interface ClientDefinition {
    url: string;
    provider: string;
    fetched: boolean;
    source: Source;
    timezone: string;
    longFormat: boolean
    sourceProjection: string;
    datetimeFormat: string

    locationIdKey: string | ParseFunction;
    locationLabelKey: string | ParseFunction;
    parameterNameKey: string | ParseFunction;
    parameterValueKey: string | ParseFunction;
    latitudeKey: string | ParseFunction;
    longitudeKey: string | ParseFunction;
    manufacturerKey: string | ParseFunction;
    modelKey: string | ParseFunction;
    ownerKey: string | ParseFunction;
    datetimeKey: string | ParseFunction;
    licenseKey: string | ParseFunction;
    isMobileKey: string | ParseFunction;
    loggingIntervalKey : string | ParseFunction
    averagingIntervalKey : string | ParseFunction
    sensorStatusKey: string | ParseFunction

    datasources: object;
    missingDatasources: string[];
    parameters: ParametersDefinition;
}


export class Client {
    // Q how to handle secrets

    // constant across provider
    url: string;
    provider: string;
    fetched: boolean = false;
    // source: Source;
    timezone: string = 'UTC';
    longFormat: boolean = false;
    geometryProjectionKey : string;
    datetimeFormat: string = "yyyy-MM-dd'T'HH:mm:ssxxx";

    // mapped data variables
    locationIdKey: string | ParseFunction = 'location';
    locationLabelKey: string | ParseFunction = 'label';
    parameterNameKey: string | ParseFunction = 'parameter';
    parameterValueKey: string | ParseFunction = 'value';
    yGeometryKey: string | ParseFunction;
    xGeometryKey: string | ParseFunction;
    manufacturerKey: string | ParseFunction = 'manufacturer_name';
    modelKey: string | ParseFunction = 'model_name';
    ownerKey: string | ParseFunction = 'owner_name';
    datetimeKey: string | ParseFunction = 'datetime';
    licenseKey: string | ParseFunction = 'license';
    isMobileKey: string | ParseFunction;
    loggingIntervalKey : string | ParseFunction = 'logging_interval_seconds'
    averagingIntervalKey : string | ParseFunction = 'averaging_interval_seconds'
    sensorStatusKey: string | ParseFunction = 'status'

    datasources: object = {};
    missingDatasources: string[] = [];

  // this should be the list of parameters in the data and how to extract them
  // transforming could be later
    parameters: ParametersDefinition = PARAMETER_DEFAULTS;


    _measurements: Measurements;
    _locations: Locations;
    _sensors: Sensors;
    // log object for compiling errors/warnings for later reference
    log: LogDefinition;

    constructor(params?: ClientDefinition) {

      // update with config if the config was passed in
      // this will still behave oddly in our abstract/extend framework
      if(params) this.configure(params);

      // this should convert the clients set of expected parameter to something we can use
      // and include our transform methods
      //this._measurands = new Measurands(this.parameters)
        //this._measurements = new Measurements(this.parameters);
        this._locations = new Locations();
        this._sensors = new Sensors();
        this.log = {};

        //return this
    }

  configure(params: ClientDefinition) {

       params?.url && (this.url = params.url);
        params?.provider && (this.provider = params.provider);

        params?.datetimeFormat && (this.datetimeFormat = params.datetimeFormat);
        params?.timezone && (this.timezone = params.timezone);
        params?.longFormat && (this.longFormat = params.longFormat);

        // mapped data variables
        params?.locationIdKey && (this.locationIdKey = params.locationIdKey);
        params?.locationLabelKey && (this.locationLabelKey = params.locationLabelKey);
      // these are used for long format
        params?.parameterNameKey && (this.parameterNameKey = params.parameterNameKey);
        params?.parameterValueKey && (this.parameterValueKey = params.parameterValueKey);
        params?.yGeometryKey && (this.yGeometryKey = params.latitudeKey);
        params?.xGeometryKey && (this.xGeometryKey = params.longitudeKey);
        params?.geometryProjectionKey && (this.geometryProjectionKey);
        params?.manufacturerKey && (this.manufacturerKey = params.manufacturerKey);
        params?.modelKey && (this.modelKey = params.modelKey);
        params?.ownerKey && (this.ownerKey = params.ownerKey);
        params?.datetimeKey && (this.datetimeKey = params.datetimeKey);
        params?.licenseKey && (this.licenseKey = params.licenseKey);
        params?.isMobileKey && (this.isMobileKey = params.isMobileKey);
        params?.loggingIntervalKey && (this.loggingIntervalKey = params.loggingIntervalKey);
        params?.averagingIntervalKey && (this.averagingIntervalKey = params.averagingIntervalKey);
        params?.sensorStatusKey && (this.sensorStatusKey = params.sensorStatusKey);
        params?.parameters && (this.parameters = params.parameters)

  }


  get measurements() {
    if(!this._measurements) {
      this._measurements = new Measurements(this.parameters);
    }
    return this._measurements
  }

    // needs some guardrails
    // setKey(key: string, value: any) {
    //     this[key] = value;
    // }



    getValueFromKey(data: any, key: Function | string) {
        return typeof key === 'function' ? key(data) : data[key];
    }


    /**
     * Provide a location based ingest id
     */
    getLocationIngestId(data: LocationDataDefinition) {
        const locationId = typeof this.locationIdKey === 'function' ? this.locationIdKey(data) : data[this.locationIdKey];
        return `${this.provider}-${locationId}`;
    }

    /**
     * Provide a system based ingest id
    */
    getSystemId(row) : string {
        const manufacturer = cleanKey(row[this.manufacturerKey]);
        const model = cleanKey(row[this.modelKey]);
        const location_id = this.getLocationIngestId(row);
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
    getSensorIngestId(row) {
        const location_id = this.getLocationIngestId(row);
        const measurand = row.metric;
        const version = cleanKey(row.version_date);
        const instance = cleanKey(row.instance);
        if (!measurand) {
            throw new Error(`Could not find measurand for ${row.metric}`);
        }
        const key = [measurand.internalParameter];
        if (instance) key.push(instance);
        if (version) key.push(version);
        return `${location_id}-${key.join(':')}`;
    }


    /**
     * Get location by key
     *
     * @param {(string|object)} key - key or data to build location
     * @returns {object} - location object
     */
    getLocation(key: LocationDataDefinition) {
        let loc = null;
        let data = {};
        if (typeof(key) === 'object') {
            data = { ...key };
            key = this.getLocationIngestId(data);
        }
        loc = this._locations.get(key);
        if (!loc) {
            loc = this.addLocation({ locationId: key, ...data });
        }

        return loc;
    }


    /**
     * Get sensor by key or by data needed to build a key
     *
     * @param {(string|object)} key - key or data to build sensor
     * @returns {object} - sensor object
     */
    getSensor(key: string | object, addIfNotFound: boolean = true) {
        let sensor = null;
        let data = {};
        if (typeof(key) === 'object') {
            data = { ...key };
            key = this.getSensorIngestId(data);
        }
        sensor = this._sensors.get(key);
        if (!sensor && addIfNotFound) {
            sensor = this.addSensor(data);
        }
        return sensor;
    }

    /**
     * Create a proper timestamp
     *
     * @param {*} row - data with fields to create timestamp
     * @returns {string} - formated timestamp string
     */
    getDatetime(row) {
        const dt_string = row[this.datetimeKey];
        if(!dt_string) {
            throw new Error(`Missing date/time field. Looking in ${this.datetimeKey}`);
        }
        const dt = new Datetime(dt_string, this.datetimeFormat, this.timezone);
        //if(!dt.isValid()) {
        //     throw new Error(`A valid date could not be made from ${dt_string} using ${this.datetimeFormat}`);
       // }
        return dt;
    }



    /**
     * fetches data and convert to json
     *
     */
    async fetchData() {
        // if its a non-json string it should be a string that represents a location
        // local://..
        // s3://
        // google://
        // if its binary than it should be an uploaded file
        // if its an object then ...
        const res = await fetch(this.url)
        return await res.json()
    }

    logMessage(type: "warning" | "error", message: string, err: Error | undefined) {
        // check if warning or error
        // if strict then throw error, otherwise just log for later
        if(!this.log[type]) this.log[type] = [];
        this.log[type].push({ message, err});
        throw err
        console.debug(`${type}:`, err && err.message);
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
        }
        if (data.sensors) {
            this.processSensorsData(data.sensors);
        }
        if (data.measurements) {
            this.processMeasurementsData(data.measurements);
        }
        if (data.flags) {
            this.processFlagsData(data.flags);
        }
        return this.data();
    }



    /**
     * Add a location to our list
     */
    addLocation(data: LocationDataDefinition) {
        const key = this.getLocationIngestId(data);
        const location = this._locations.get(key);
        if (!location) {
            // process data through the location map
            console.debug(`Adding location: ${key}`)
            const l = new Location({
                locationId: key,
                siteId: this.getValueFromKey(data, this.locationIdKey),
                siteName: this.getValueFromKey(data, this.locationLabelKey),
                ismobile: this.getValueFromKey(data, this.isMobileKey),
                x:this.getValueFromKey(data, this.xGeometryKey),
                y:this.getValueFromKey(data, this.yGeometryKey),
                projection:this.getValueFromKey(data, this.geometryProjectionKey),
                // the following are for passing along to sensors
                averagingIntervalSeconds: this.getValueFromKey(data, this.averagingIntervalKey),
                loggingIntervalSeconds: this.getValueFromKey(data, this.loggingIntervalKey),
                status: this.getValueFromKey(data, this.sensorStatusKey),
                owner: this.getValueFromKey(data, this.ownerKey),
                label: this.getValueFromKey(data, this.locationLabelKey),
                ...data,
            });
            this._locations.add(l)
            return l;
        }
        return location;
    }

    /**
     * Process a list of locations
     */
    async processLocationsData(locations: LocationDataDefinition[]) {
        console.debug(`Processing ${locations.length} locations`);
        for (const location of locations) {
            try {
                this.addLocation(location);
            } catch (e: any) {
                console.warn(`Error adding location: ${e.message}`);
            }
        }
    }

    /**
     * Process a list of sensors
     *
     * @param {array} sensors - list of sensor data
     */
    async processSensorsData(sensors: SensorDataDefinition[]) {
        console.debug(`Processing ${sensors.length} sensors`);
        for (const sensor of sensors) {
            this.addSensor(sensor);
        }
    }


    private addSensor(data: SensorDataDefinition) {
      console.debug('adding sensor', data)
        try {
            // check if we already found the right metric
            // if
            let { metric } = data
            if(metric) {
                const metricName = this.getValueFromKey(data, this.parameterNameKey)
                metric = this.parameters[metricName]
            }
            const sensorId = this.getSensorIngestId({ ...data })
            const systemId = this.getSystemId(data);
            const location = this.getLocation(data);
            // check for averaging data but fall back to the location values
            const averagingIntervalSeconds = this.getValueFromKey(data, this.averagingIntervalKey) ?? location.averagingIntervalSeconds;
            const loggingIntervalSeconds = this.getValueFromKey(data, this.loggingIntervalKey) ?? location.loggingIntervalSeconds;
            const status = this.getValueFromKey(data, this.sensorStatusKey) ?? location.status
            // maintain a way to get the sensor back without traversing everything
            const sensor = new Sensor(
                {
                    sensorId,
                    systemId,
                    metric,
                    averagingIntervalSeconds,
                    loggingIntervalSeconds,
                    //versionDate,
                    //instance,
                    status
                }
            );

            this._sensors.add(sensorId, sensor);
            return sensor
        } catch (err:unknown) {
            if (err instanceof Error) {
            this.logMessage('error',`Error adding sensor: ${err.message}`, err);
            }
            console.debug(sensor, this.parameterNameKey, this.longFormat)
        }
    }

    /**
     * Process a list of measurements
     *
     * @param {array} measurements - list of measurement data
     */
    async processMeasurementsData(measurements) {
        console.debug(`Processing ${measurements.length} row of measurements`, this.measurements.measurands());
        // if we provided a parameter column key we use that
        // otherwise we use the list of parameters
        // the end goal is just an array of parameter names to loop through
        const params = this.longFormat
            ? [this.parameterNameKey]
            : Object.keys(this.measurements.measurands());


        measurements.map( (meas) => {
            try {
                const datetime = this.getDatetime(meas);
                const location = this.getLocation(meas);

                params.map((p) => {
                    let metric, value;
                  // for long format data we will need to extract the parameter name from the field
                    if(this.longFormat) {
                        let metric_name = this.getValueFromKey(meas, this.parameterNameKey)
                        metric = this.measurements.measurand(metric_name)
                        value = this.getValueFromKey(meas, this.parameterValueKey)
                    } else {
                        metric = this.measurements.measurand(p);
                        value = meas[metric.parameter];
                    }

                    if (value) {
                        // get the approprate sensor, or create it
                        const sensor = this.getSensor({ ...meas, metric })
                        this.measurements.add({
                            sensorId: sensor.id,
                            timestamp: datetime,
                            value: value,
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
      console.log(this._locations)
        return {
            meta: {
                schema: 'v0.1',
                source: this.provider,
                matching_method: 'ingest-id'
            },
            measurements: this.measurements.json(),
            locations: this._locations.json(),
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
            locations: this._locations.length,
            systems: Object.values(this._locations).map((l) => Object.values(l.systems).length).flat().reduce((d,i) => d + i),
            sensors: Object.values(this._locations).map((l) => Object.values(l.systems).map((s) => Object.values(s.sensors).length)).flat().reduce((d,i) => d + i),
            // taking advantage of the sensor object list
            flags: Object.values(this._sensors).map((s) => Object.values(s.flags).length).flat().reduce((d,i) => d + i),
            measures: this.measurements.length,
            errors: errorSummary,
            from: this.measurements.from && this.measurements.from.utc().format(),
            to: this.measurements.to && this.measurements.to.utc().format(),
        };
    }
}
