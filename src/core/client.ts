import {
  cleanKey,
  isFile,
  getMethod,
  getValueFromKey,
  formatValueForLog,
} from './utils';

import { Measurement, Measurements } from './measurement';
import { Location, Locations } from './location';
import { Sensor, Sensors } from './sensor';
import { System } from './system';
import {  PARAMETER_DEFAULTS } from './metric';
import { Datetime } from './datetime';
import { MissingAttributeError, UnsupportedParameterError } from './errors';
import { getReaderOptions } from './readers';
import debug from 'debug';
import { ClientConfiguration, ClientParser, ClientReader, DataDefinition, ErrorSummary, IndexedResource, LogEntry, ParseFunction, Resource, Summary } from '../types/client';
import { ParserMethods } from '../types/parsers';
import type { IndexedReaderOptions, ReaderMethods, ReaderOptions } from '../types/readers';
import { ClientParameters } from '../types/metric';

debug.enable('*');

const log1 = debug('client (core): v1');
const log2 = debug('client (core): v2');



export abstract class Client {
  provider!: string;
  resource?: Resource | IndexedResource;
  secrets?: object;
  reader: ClientReader = 'api';
  parser: ClientParser = 'json';
  abstract readers: ReaderMethods;
  abstract parsers: ParserMethods;
  readerOptions: ReaderOptions | IndexedReaderOptions = {};
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
  parameters: ClientParameters = PARAMETER_DEFAULTS;

  #measurements?: Measurements;
  #locations: Locations;
  #sensors: Sensors;
  // log object for compiling errors/warnings for later reference
  log: Map<string, Array<LogEntry>>;
  strict: boolean = true;

  constructor(params?: ClientConfiguration) {
    // update with config if the config was passed in
    // this will still behave oddly in our abstract/extend framework
    if (params) this.configure(params);

    // this should convert the clients set of expected parameter to something we can use
    // and include our transform methods
    //this._measurands = new Measurands(this.parameters)
    //this.#measurements = new Measurements(this.parameters);
    this.#locations = new Locations();
    this.#sensors = new Sensors();
    this.log = new Map();
  }

  configure(params: ClientConfiguration) {
    params?.resource && (this.resource = params.resource);
    params?.readerOptions && (this.readerOptions = params.readerOptions);
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
    params?.secrets && (this.secrets = params.secrets);

    // if we were able to pass more values in params we
    // could include the params in the postConfigure args
    this.postConfigure();
  }

  postConfigure() {
    // this is an opportunity for the developer to do some customizing
    // this is where you would update any properties based on secrets or other values
    log2('No post configuration provided');
  }

  get measurements() {
    if (!this.#measurements) {
      this.#measurements = new Measurements(this.parameters);
    }
    return this.#measurements;
  }

  /**
   * Provide a location based key
   */
  getLocationKey(data: DataDefinition): string {
    const locationKey =
      typeof this.locationIdKey === 'function'
        ? this.locationIdKey(data)
        : data[this.locationIdKey];
    return `${this.provider}-${locationKey}`;
  }

  /**
   * Provide a system based ingest id
   */
  getSystemKey(row: any): string {
    const manufacturer = cleanKey(getValueFromKey(row, this.manufacturerKey));
    const model = cleanKey(getValueFromKey(row, this.modelKey));
    const locationKey = this.getLocationKey(row);
    let key = '';
    if (manufacturer && model) {
      key = `-${manufacturer}:${model}`;
    } else if (!manufacturer && !model) {
      // key = 'default';
    } else {
      key = `-${manufacturer || model}`;
    }
    return `${locationKey}${key}`;
  }

  /**
   * Provide a sensor based ingest id
   *
   * @param {object} row - data for building key
   * @returns {string} - sensor id key
   */
  getSensorKey(row: any): string {
    const locationKey = this.getLocationKey(row);
    const measurand = row.metric;
    const version = cleanKey(row.version_date);
    const instance = cleanKey(row.instance);
    if (!measurand) {
      throw new Error(`Could not find measurand for ${row}`);
    }
    const key = [measurand.key];
    if (instance) key.push(instance);
    if (version) key.push(version);
    return `${locationKey}-${key.join(':')}`;
  }

  /**
   * Get location by key
   *
   * @param {(string|object)} key - key or data to build location
   * @returns {object} - location object
   */
  getLocation(key: DataDefinition | string) {
    let location: Location | undefined;
    let data = {};
    if (typeof key === 'object') {
      data = { ...key };
      key = this.getLocationKey(data);
    }
    location = this.#locations.get(key);
    if (!location) {
      location = this.addLocation({ key, ...data });
    }

    return location;
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
      key = this.getSensorKey(data);
    }
    if (this.#sensors.has(key)) {
      sensor = this.#sensors.get(key);
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
        `Missing date/time field. Looking in ${formatValueForLog(
          this.datetimeKey
        )}`
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
    log1(`Loading resources`);
    // if its a non-json string it should be a string that represents a location
    // local://..
    // s3://
    // google://
    // if its binary than it should be an uploaded file
    // if its an object then ...

    if (typeof this.resource === 'object' && !isFile(this.resource)) {
      // loop through all those keys to create the data object
      let data: DataDefinition = {};

      for (const [key, resource] of Object.entries(this.resource)) {
        log2(`Loading ${key} using ${resource}`);

        const reader = getMethod(
          key as keyof IndexedResource,
          this.reader,
          this.readers
        );

        const parser = getMethod(
          key as keyof IndexedResource,
          this.parser,
          this.parsers
        );

        // we need a way to get the secrets injected here
        const options = getReaderOptions(
          this.readerOptions,
          key as keyof IndexedReaderOptions
        );

        // pass existing data to the current resource
        const text = await reader({ resource, options });
        //const d = await parser({ text, data });
        // we want to pass the current data object to the parsers in case they are needed
        // and the parsers are expected to either build the data object
        // which would mean we just overwrite the data object
        // or it could be the more traditional method of returning an array
        // so we need to do a check and
        const d = await parser({ text, data });
        if (Array.isArray(d)) {
          // method returned a list and we need to index it
          data[key] = d;
        } else {
          // method returned an object that should replace the old one
          // we could check the keys (e.g. key in d) but I am not sure that it matters
          // might be best to create a property of the client like `overwriteFetchedData`
          data = d;
        }

        // check to make sure the parser did something
        // need a better check here
        //if (typeof d !== 'object')
        //  throw new Error('Parser did not return an object');
        //data[key] = d;
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
  errorHandler(err: string | Error) {
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

  process(data: DataDefinition) {
    log2(`Processing data`, Object.keys(data), Array.isArray(data));
    if (!data) {
      throw new Error('No data was returned from file');
    }
    if (
      !(
        'locations' in data ||
        'sensors' in data ||
        'measurements' in data ||
        'flags' in data
      )
    ) {
      throw new Error(
        `Data is not in the correct format to be processed. Current object has the following keys: ${Object.keys(
          data
        ).join(', ')}`
      );
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
  addLocation(data: DataDefinition) {
    const key = this.getLocationKey(data);
    const location = this.#locations.get(key);

    if (!location) {
      // process data through the location map
      const l = new Location({
        ...data, // if sommething like key is in here we want the key to override it
        key: key,
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
      });
      this.#locations.add(l);
      return l;
    }
    return location;
  }

  /**
   * Process a list of locations
   */
  processLocationsData(locations: DataDefinition[]) {
    log2(`Processing ${locations.length} locations`);
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
  processSensorsData(sensors: DataDefinition[]) {
    log2(`Processing ${sensors.length} sensors`);
    for (const sensor of sensors) {
      this.addSensor(sensor);
    }
  }

  private addSensor(data: DataDefinition): Sensor {
    if (!data.metric) {
      let metricName = getValueFromKey(data, this.parameterNameKey);
      data.metric = this.measurements.metricFromProviderKey(metricName);
    }

    const sensorKey = this.getSensorKey(data);
    const systemKey = this.getSystemKey(data);
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
      key: sensorKey,
      systemKey,
      metric: data.metric,
      averagingIntervalSeconds,
      loggingIntervalSeconds,
      //versionDate,
      //instance,
      status,
    });
    location.add(sensor);
    this.#sensors.add(sensor);
    return sensor;
  }

  /**
   * Process a list of measurements
   *
   * @param {array} measurements - list of measurement data
   */
  processMeasurementsData(measurements: any) {
    console.debug(`Processing ${measurements.length} measurement(s)`);
    // if we provided a parameter column key we use that
    // otherwise we use the list of parameters
    // the end goal is just an array of parameter names to loop through
    const params: Array<string> = this.longFormat
      ? [getValueFromKey(null, this.parameterNameKey)]
      : this.measurements.parameterKeys();

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
              this.errorHandler(new UnsupportedParameterError(metricName));
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
        if (e instanceof Error || typeof e === 'string') {
          this.errorHandler(e);
        }
      }
    });
  }

  /**
   * PLACEHOLDER
   *
   * @param {*} flags -
   * @returns {*} -
   */
  processFlagsData(flags: Array<any>) {
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
      locations: this.#locations.json(),
    };
  }

  /**
   * Dump a summary that we can pass back to the log
   */
  summary(): Summary {
    const errorSummary: ErrorSummary = {};
    this.log.forEach((v, k) => {
      errorSummary[k] = v.length;
    });
    return {
      sourceName: this.provider,
      locations: {
        count: this.#locations.length,
        bounds: this.#locations.bounds,
      },
      systems: Object.values(this.#locations)
        .map((l: Location) => Object.values(l.systems).length)
        .flat()
        .reduce((d, i) => d + i),
      sensors: Object.values(this.#locations)
        .map((l: Location) =>
          Object.values(l.systems).map(
            (s: System) => Object.values(s.sensors).length
          )
        )
        .flat()
        .reduce((d, i) => d + i),
      // taking advantage of the sensor object list
      flags: Object.values(this.#sensors)
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
