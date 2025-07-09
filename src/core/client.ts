import { cleanKey, isFile, getMethod, getValueFromKey } from './utils';
import type { ReaderMethodsDefinition } from './readers';
import type { ParserMethodsDefinition } from './parsers';
import { Measurement, Measurements } from './measurement';
import { Location, Locations } from './location';
import { Sensor, Sensors } from './sensor';
import { System } from './system';
import { ParametersDefinition, PARAMETER_DEFAULTS } from './constants';
import { Datetime } from './datetime';
import { MissingAttributeError, UnsupportedParameterError } from './errors';
import { ParserObjectDefinition } from './parsers';
import type { BBox } from 'geojson';

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
  [key: string]: any;
}

interface SensorDataDefinition {
  [key: string]: any;
}

interface FetchedDataDefinition {
  [key: string]: any;
}

type ErrorSummaryDefinition = { [key: string]: number };

interface LocationsSummary {
  count: number;
  bounds: BBox | null;
}

interface MeasurementsSummary {
  count: number;
  from: string | null | undefined;
  to: string | null | undefined;
}

interface SummaryDefinition {
  sourceName: string;
  locations: LocationsSummary;
  systems: number;
  sensors: number;
  flags: number;
  measures: number;
  errors: ErrorSummaryDefinition;
  measurements: MeasurementsSummary;
}

interface LogEntry {
  message: string;
  err?: Error;
}

type ParseFunction = (data?: any) => string | number | object | boolean;

type resource = string | File

interface IndexedResourceDefinition {
  measurements: resource;
  locations?: resource;
}

interface ClientConfigDefinition {
  resource?: resource | IndexedResourceDefinition;
  reader?: string;
  parser?: string;
  provider?: string;
  fetched?: boolean;
  source?: Source;
  timezone?: string;
  longFormat?: boolean;
  sourceProjection?: string;
  datetimeFormat?: string;

  locationIdKey?: string | ParseFunction;
  locationLabelKey?: string | ParseFunction;
  parameterNameKey?: string | ParseFunction;
  parameterValueKey?: string | ParseFunction;
  xGeometryKey?: string | ParseFunction;
  yGeometryKey?: string | ParseFunction;
  geometryProjectionKey?: string | ParseFunction;
  manufacturerKey?: string | ParseFunction;
  modelKey?: string | ParseFunction;
  ownerKey?: string | ParseFunction;
  datetimeKey?: string | ParseFunction;
  licenseKey?: string | ParseFunction;
  isMobileKey?: string | ParseFunction;
  loggingIntervalKey?: string | ParseFunction;
  averagingIntervalKey?: string | ParseFunction;
  sensorStatusKey?: string | ParseFunction;

  datasources?: object;
  missingDatasources?: string[];
  parameters?: ParametersDefinition;
}

type ClientParserDefinition = string | Function | ParserObjectDefinition;

interface ClientReaderObjectDefinition {
  measurements: string;
  locations?: string;
}

type ClientReaderDefinition = string | Function | ClientReaderObjectDefinition;

export abstract class Client {
  provider!: string;
  resource?: string | File | IndexedResourceDefinition;
  reader: ClientReaderDefinition = 'api';
  parser: ClientParserDefinition = 'json';
  abstract readers: ReaderMethodsDefinition;
  abstract parsers: ParserMethodsDefinition;
  fetched: boolean = false;
  // source: Source;
  timezone?: string;
  longFormat: boolean = false;
  geometryProjectionKey: string | ParseFunction = 'projection';
  datetimeFormat: string = "yyyy-MM-dd'T'HH:mm:ssZZ";

  // mapped data variables
  locationIdKey: string | ParseFunction = 'location';
  locationLabelKey: string | ParseFunction = 'label';
  parameterNameKey: string | ParseFunction = 'parameter';
  parameterValueKey: string | ParseFunction = 'value';
  yGeometryKey: string | ParseFunction = 'y';
  xGeometryKey: string | ParseFunction = 'x';
  manufacturerKey: string | ParseFunction = 'manufacturer_name';
  modelKey: string | ParseFunction = 'model_name';
  ownerKey: string | ParseFunction = 'owner_name';
  datetimeKey: string | ParseFunction = 'datetime';
  licenseKey: string | ParseFunction = 'license';
  isMobileKey: string | ParseFunction = 'is_mobile';
  loggingIntervalKey: string | ParseFunction = 'logging_interval_seconds';
  averagingIntervalKey: string | ParseFunction = 'averaging_interval_seconds';
  sensorStatusKey: string | ParseFunction = 'status';

  datasources: object = {};
  missingDatasources: string[] = [];

  // TODO _secrets = {}

  // this should be the list of parameters in the data and how to extract them
  // transforming could be later
  parameters: ParametersDefinition = PARAMETER_DEFAULTS;

  _measurements?: Measurements;
  _locations: Locations;
  _sensors: Sensors;
  // log object for compiling errors/warnings for later reference
  log: Map<string, Array<LogEntry>>;
  strict: boolean = true;

  constructor(params?: ClientConfigDefinition) {
    // update with config if the config was passed in
    // this will still behave oddly in our abstract/extend framework
    if (params) this.configure(params);

    // this should convert the clients set of expected parameter to something we can use
    // and include our transform methods
    //this._measurands = new Measurands(this.parameters)
    //this._measurements = new Measurements(this.parameters);
    this._locations = new Locations();
    this._sensors = new Sensors();
    this.log = new Map();

  }

  configure(params: ClientConfigDefinition) {
    params?.resource && (this.resource = params.resource);
    params?.provider && (this.provider = params.provider);

    params?.datetimeFormat && (this.datetimeFormat = params.datetimeFormat);
    params?.timezone && (this.timezone = params.timezone);
    params?.longFormat && (this.longFormat = params.longFormat);

    params?.reader && (this.reader = params.reader);
    params?.parser && (this.parser = params.parser);

    // mapped data variables
    params?.locationIdKey && (this.locationIdKey = params.locationIdKey);
    params?.locationLabelKey &&
      (this.locationLabelKey = params.locationLabelKey);
    // these are used for long format
    params?.parameterNameKey &&
      (this.parameterNameKey = params.parameterNameKey);
    params?.parameterValueKey &&
      (this.parameterValueKey = params.parameterValueKey);
    params?.yGeometryKey && (this.yGeometryKey = params.yGeometryKey);
    params?.xGeometryKey && (this.xGeometryKey = params.xGeometryKey);
    params?.geometryProjectionKey &&
      (this.geometryProjectionKey = params.geometryProjectionKey);
    params?.manufacturerKey && (this.manufacturerKey = params.manufacturerKey);
    params?.modelKey && (this.modelKey = params.modelKey);
    params?.ownerKey && (this.ownerKey = params.ownerKey);
    params?.datetimeKey && (this.datetimeKey = params.datetimeKey);
    params?.licenseKey && (this.licenseKey = params.licenseKey);
    params?.isMobileKey && (this.isMobileKey = params.isMobileKey);
    params?.loggingIntervalKey &&
      (this.loggingIntervalKey = params.loggingIntervalKey);
    params?.averagingIntervalKey &&
      (this.averagingIntervalKey = params.averagingIntervalKey);
    params?.sensorStatusKey && (this.sensorStatusKey = params.sensorStatusKey);
    params?.parameters && (this.parameters = params.parameters);

  }

  get measurements() {
    if (!this._measurements) {
      this._measurements = new Measurements(this.parameters);
    }
    return this._measurements;
  }

  /**
   * Provide a location based ingest id
   */
  getLocationIngestId(data: LocationDataDefinition) {
    const locationId =
      typeof this.locationIdKey === 'function'
        ? this.locationIdKey(data)
        : data[this.locationIdKey];
    return `${this.provider}-${locationId}`;
  }

  /**
   * Provide a system based ingest id
   */
  getSystemId(row: any): string {
    const manufacturer = cleanKey(getValueFromKey(row, this.manufacturerKey));
    const model = cleanKey(getValueFromKey(row, this.modelKey));
    const location_id = this.getLocationIngestId(row);
    let key = '';
    if (manufacturer && model) {
      key = `-${manufacturer}:${model}`;
    } else if (!manufacturer && !model) {
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
  getSensorIngestId(row: any): string {
    const location_id = this.getLocationIngestId(row);
    const measurand = row.metric;
    const version = cleanKey(row.version_date);
    const instance = cleanKey(row.instance);
    if (!measurand) {
      throw new Error(`Could not find measurand for ${row}`);
    }
    const key = [measurand.parameter];
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
  getLocation(key: LocationDataDefinition | string) {
    let loc: Location | undefined;
    let data = {};
    if (typeof key === 'object') {
      data = { ...key };
      key = this.getLocationIngestId(data);
    }
    loc = this._locations.get(key);
    if (!loc) {
      loc = this.addLocation({ locationId: key, ...data });
    }

    return loc;
  }

  // getSecret() {

  // }

  /**
   * Get sensor by key or by data needed to build a key
   *
   * @param {(string|object)} key - key or data to build sensor
   * @returns {object} - sensor object
   */
  getSensor(key: string | object): Sensor | undefined {
    let sensor: Sensor | undefined;
    let data = {};
    if (typeof key === 'object') {
      data = { ...key };
      key = this.getSensorIngestId(data);
    }
    if (this._sensors.has(key)) {
      sensor = this._sensors.get(key);
    } else {
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
  getDatetime(row: any) {
    const dtString: string = getValueFromKey(row, this.datetimeKey);
    if (!dtString) {
      throw new Error(
        `Missing date/time field. Looking in ${this.datetimeKey}`
      );
    }
    const dt = new Datetime(dtString, {
      format: this.datetimeFormat,
      timezone: this.timezone,
    });
    return dt;
  }

  /**
   * fetches data and convert to json
   *
   */
  async loadResources() {
    // if its a non-json string it should be a string that represents a location
    // local://..
    // s3://
    // google://
    // if its binary than it should be an uploaded file
    // if its an object then ...

    if (typeof this.resource === 'object' && !isFile(this.resource)) {
      // loop through all those keys to create the data object
      const data: FetchedDataDefinition = {};

      for (const [key, resource] of Object.entries(this.resource)) {
        const reader = getMethod(
          key as keyof IndexedResourceDefinition,
          this.reader,
          this.readers
        );
        const parser = getMethod(
          key as keyof IndexedResourceDefinition,
          this.parser,
          this.parsers
        );

        const text = await reader({ resource });
        const d = await parser({ text });
        // check to make sure the parser did something
        // need a better check here
        if (typeof d !== 'object')
          throw new Error('Parser did not return an object');
        data[key] = d;
      }
      return data;
    } else {
      // assume is should just be passed to the reader method
      let reader;
      let parser;
      let resource = this.resource;
      if (typeof this.resource === 'object' && isFile(this.resource)) {
        reader = getMethod('measurements', this.reader, this.readers);
        parser = getMethod('measurements', this.parser, this.parsers);
      } else {
        resource = this.resource;
        reader = getMethod(null, this.reader, this.readers);
        parser = getMethod(null, this.parser, this.parsers);
      }
      const text = await reader({ resource });
      const d = await parser({ text });

      if (typeof d !== 'object')
        throw new Error('Parser did not return an object');

      // at this point its possible that we dont have data in the format
      //  {
      //   measurements: ...,
      //   locations: ...,
      //   ...
      //  }
      const acceptedKeys = new Set([
        'locations',
        'sensors',
        'measurements',
        'flags',
      ]);
      if (!Object.keys(d).every((key) => acceptedKeys.has(key))) {
        // assume that we have data in wide format that is not properly keyed
        return { measurements: d };
      } else {
        return d;
      }
    }
  }

  // the error handler should process all errors and do whatever is appropriate based on context
  // e.g.
  // fetching in production - log error and move on
  // fetching in upload tool - throw error if strict is on
  // developing - throw error
  errorHandler(err: string | unknown) {
    // types: error, warning, info
    // check if warning or error
    // if strict then throw error, otherwise just log for later

    let type: string = 'UknownError';
    let message: string = 'unknown error message';

    // everything should throw an error that we handle here
    // but until that is the case we will convert the strings
    if (typeof err === 'string') {
      message = err;
      err = new Error(message);
    } else if (err instanceof Error) {
      type = err.name ?? 'UK';
      message = err.message;
    } else {
      err = new Error('Original error was neither a string or an error');
    }

    if (err instanceof Error) {
      if (!this.log.has(type)) this.log.set(type, []);
      this.log.get(type)!.push({ message, err }); // line above means type will always exist
    }

    console.error(`** ERROR (${type}):`, message);

    if (this.strict) {
      throw err;
    }
  }

  /**
   * Entry point for processing data
   *
   * @param {(string|file|object)} file - file path, object or file
   */
  async load() {
    const data = await this.loadResources();
    this.process(data);
    return this.data();
  }

  process(data: FetchedDataDefinition) {
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
  }

  /**
   * Add a location to our list
   */
  addLocation(data: LocationDataDefinition) {
    const key = this.getLocationIngestId(data);
    const location = this._locations.get(key);

    if (!location) {
      // process data through the location map
      const l = new Location({
        locationId: key,
        siteId: getValueFromKey(data, this.locationIdKey),
        siteName: getValueFromKey(data, this.locationLabelKey),
        ismobile: getValueFromKey(data, this.isMobileKey),
        x: getValueFromKey(data, this.xGeometryKey),
        y: getValueFromKey(data, this.yGeometryKey),
        projection: getValueFromKey(data, this.geometryProjectionKey),
        // the following are for passing along to sensors
        averagingIntervalSeconds: getValueFromKey(
          data,
          this.averagingIntervalKey,
          true
        ),
        loggingIntervalSeconds: getValueFromKey(
          data,
          this.loggingIntervalKey,
          true
        ),
        status: getValueFromKey(data, this.sensorStatusKey),
        owner: getValueFromKey(data, this.ownerKey),
        label: getValueFromKey(data, this.locationLabelKey),
        ...data,
      });
      this._locations.add(l);
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
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.warn(`Error adding location: ${e.message}`);
        }
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

  private addSensor(data: SensorDataDefinition): Sensor {
    if (!data.metric) {
      let metricName = getValueFromKey(data, this.parameterNameKey);
      data.metric = this.measurements.metricFromProviderKey(metricName);
    }

    const sensorId = this.getSensorIngestId(data);
    const systemId = this.getSystemId(data);
    const location = this.getLocation(data);
    // check for averaging data but fall back to the location values
    const averagingIntervalSeconds =
      getValueFromKey(data, this.averagingIntervalKey, true) ??
      location.averagingIntervalSeconds;
    const loggingIntervalSeconds =
      getValueFromKey(data, this.loggingIntervalKey, true) ??
      location.loggingIntervalSeconds;
    const status =
      getValueFromKey(data, this.sensorStatusKey) ?? location.sensorStatus;
    // maintain a way to get the sensor back without traversing everything
    const sensor = new Sensor({
      sensorId,
      systemId,
      metric: data.metric,
      averagingIntervalSeconds,
      loggingIntervalSeconds,
      //versionDate,
      //instance,
      status,
    });
    location.add(sensor);
    this._sensors.add(sensor);
    return sensor;
  }

  /**
   * Process a list of measurements
   *
   * @param {array} measurements - list of measurement data
   */
  async processMeasurementsData(measurements: any) {
    console.debug(`Processing ${measurements.length} measurement(s)`);
    // if we provided a parameter column key we use that
    // otherwise we use the list of parameters
    // the end goal is just an array of parameter names to loop through
    const params: Array<string> = this.longFormat
      ? [getValueFromKey(null, this.parameterNameKey)]
      : Object.keys(this.measurements.measurands());

    measurements.forEach((meas: any) => {
      try {
        const datetime = this.getDatetime(meas);

        params.map((p) => {
          let metric, value, metricName, valueName;

          if (this.longFormat) {
            // for long format data we will need to extract the parameter name from the field
            metricName = getValueFromKey(meas, p);
            valueName = this.parameterValueKey;
          } else {
            // for wide format they are both the same value
            metricName = p;
            valueName = p;
          }

          value = getValueFromKey(meas, valueName);

          if (value !== undefined) {
            metric = this.measurements.metricFromProviderKey(metricName);

            if (!metric) {
              this.errorHandler(
                new UnsupportedParameterError(metricName)
              );
              return;
            }
            // get the approprate sensor, or create it
            const sensor = this.getSensor({ ...meas, metric });

            if (!sensor) {
              this.errorHandler(
                new MissingAttributeError('sensor', { ...meas, metric })
              );
              return;
            }
            this.measurements.add(
              new Measurement({
                sensor: sensor,
                timestamp: datetime,
                value: value,
              })
            );
          }
        });
      } catch (e: unknown) {
        this.errorHandler(e);
        //if( e instanceof Error) {
        //    this.logMessage(MEASUREMENT_ERROR, 'error', e);
        //}
      }
    });
  }

  /**
   * PLACEHOLDER
   *
   * @param {*} flags -
   * @returns {*} -
   */
  async processFlagsData(flags: Array<any>) {
    console.debug(`Processing ${flags.length} flags`);
    flags.map((d: any) => {
      try {
        const sensor = this.getSensor({
          location: getValueFromKey(d, this.locationIdKey),
          metric: getValueFromKey(d, this.parameterNameKey),
          ...d,
        });

        if (sensor) {
          sensor.add(d);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.warn(`Error adding flag: ${e.message}`);
        }
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
        matching_method: 'ingest-id',
      },
      measurements: this.measurements.json(),
      locations: this._locations.json(),
    };
  }

  /**
   * Dump a summary that we can pass back to the log
   */
  summary(): SummaryDefinition {
    const errorSummary: ErrorSummaryDefinition = {};
    this.log.forEach((v, k) => {
      errorSummary[k] = v.length;
    });
    return {
      sourceName: this.provider,
      locations: {
        count: this._locations.length,
        bounds: this._locations.bounds,
      },
      systems: Object.values(this._locations)
        .map((l: Location) => Object.values(l.systems).length)
        .flat()
        .reduce((d, i) => d + i),
      sensors: Object.values(this._locations)
        .map((l: Location) =>
          Object.values(l.systems).map(
            (s: System) => Object.values(s.sensors).length
          )
        )
        .flat()
        .reduce((d, i) => d + i),
      // taking advantage of the sensor object list
      flags: Object.values(this._sensors)
        .map((s: Sensor) => Object.values(s.flags).length)
        .flat()
        .reduce((d, i) => d + i),
      measures: this.measurements.length,
      errors: errorSummary,
      measurements: {
        count: this.measurements.length,
        from: this.measurements.from?.toString(),
        to: this.measurements.to?.toString(),
      },
    };
  }
}
