import {
  cleanKey,
  getMethod,
  getValueFromKey,
  formatValueForLog,
} from './utils';

import { Measurement, Measurements } from './measurement';
import { Location, Locations } from './location';
import { Sensor, Sensors } from './sensor';
import { PARAMETER_DEFAULTS } from './metric';
import { Datetime } from './datetime';
import { MissingAttributeError, UnsupportedParameterError } from './errors';
import { getReaderOptions } from './readers';
import debug from 'debug';
import {
  ClientConfiguration,
  ClientParser,
  ClientReader,
  DataDefinition,
  ErrorSummary,
  IndexedResource,
  LogEntry,
  ParseFunction,
  Summary,
  IngestMatchingMethod,
  IndexedFile,
  isIndexed,
  isFile,
} from '../types/client';
import { SystemData } from '../types/system';
import { ParserMethods } from '../types/parsers';
import type {
  IndexedReaderOptions,
  ReaderMethods,
  ReaderOptions,
} from '../types/readers';
import {
  ClientParameters,
  ParameterKeyFunction,
  PathExpression,
} from '../types/metric';
import { Resource } from './resource';

const log = debug('openaq-transform client (core): DEBUG');

export abstract class Client<
  R extends ReaderMethods = ReaderMethods,
  P extends ParserMethods = ParserMethods
> {
  provider!: string;
  resource?: Resource | IndexedResource | File | IndexedFile;
  secrets?: object;
  reader: ClientReader = 'api';
  parser: ClientParser = 'json';
  abstract readers: R;
  abstract parsers: P;
  readerOptions: ReaderOptions | IndexedReaderOptions = {};
  fetched: boolean = false;
  // source: Source;
  timezone?: string;
  longFormat: boolean = false;
  geometryProjectionKey: string | PathExpression | ParseFunction = 'projection';
  datetimeFormat: string = "yyyy-MM-dd'T'HH:mm:ssZZ";

  // mapped data variables
  locationIdKey: string | PathExpression | ParseFunction = 'location';
  locationLabelKey: string | PathExpression | ParseFunction = 'label';
  // if longFormat = false this value is ignored
  parameterNameKey: string | PathExpression | ParseFunction = 'parameter';
  parameterValueKey: string | PathExpression | ParseFunction = 'value';
  yGeometryKey: string | PathExpression | ParseFunction = 'y';
  xGeometryKey: string | PathExpression | ParseFunction = 'x';
  manufacturerKey: string | PathExpression | ParseFunction =
    'manufacturer_name';
  modelKey: string | PathExpression | ParseFunction = 'model_name';
  ownerKey: string | PathExpression | ParseFunction = 'owner_name';
  datetimeKey: string | PathExpression | ParseFunction = 'datetime';
  licenseKey: string | PathExpression | ParseFunction = 'license';
  isMobileKey: string | PathExpression | ParseFunction = 'is_mobile';
  loggingIntervalKey: string | PathExpression | ParseFunction =
    'logging_interval_seconds';
  averagingIntervalKey: string | PathExpression | ParseFunction =
    'averaging_interval_seconds';
  sensorStatusKey: string | PathExpression | ParseFunction = 'status';
  ingestMatchingMethod: IngestMatchingMethod = 'ingest-id';

  datasources: object = {};
  missingDatasources: string[] = [];

  // TODO _secrets = {}

  // this should be the list of parameters in the data and how to extract them
  // transforming could be later
  parameters: ClientParameters = PARAMETER_DEFAULTS;

  #startedOn?: Datetime;
  #finishedOn?: Datetime;
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
    if (params?.resource) {
      this.resource = params.resource;
    }
    if (params?.readerOptions) {
      this.readerOptions = params.readerOptions;
    }
    if (params?.provider) {
      this.provider = params.provider;
    }

    if (params?.datetimeFormat) {
      this.datetimeFormat = params.datetimeFormat;
    }
    if (params?.timezone) {
      this.timezone = params.timezone;
    }
    if (params?.longFormat) {
      this.longFormat = params.longFormat;
    }

    if (params?.reader) {
      this.reader = params.reader;
    }
    if (params?.parser) {
      this.parser = params.parser;
    }

    // mapped data variables
    if (params?.locationIdKey) {
      this.locationIdKey = params.locationIdKey;
    }
    if (params?.locationLabelKey) {
      this.locationLabelKey = params.locationLabelKey;
    }
    // these are used for long format
    if (params?.parameterNameKey) {
      this.parameterNameKey = params.parameterNameKey;
    }
    if (params?.parameterValueKey) {
      this.parameterValueKey = params.parameterValueKey;
    }
    if (params?.yGeometryKey) {
      this.yGeometryKey = params.yGeometryKey;
    }
    if (params?.xGeometryKey) {
      this.xGeometryKey = params.xGeometryKey;
    }
    if (params?.geometryProjectionKey) {
      this.geometryProjectionKey = params.geometryProjectionKey;
    }
    if (params?.manufacturerKey) {
      this.manufacturerKey = params.manufacturerKey;
    }
    if (params?.modelKey) {
      this.modelKey = params.modelKey;
    }
    if (params?.ownerKey) {
      this.ownerKey = params.ownerKey;
    }
    if (params?.datetimeKey) {
      this.datetimeKey = params.datetimeKey;
    }
    if (params?.licenseKey) {
      this.licenseKey = params.licenseKey;
    }
    if (params?.isMobileKey) {
      this.isMobileKey = params.isMobileKey;
    }
    if (params?.loggingIntervalKey) {
      this.loggingIntervalKey = params.loggingIntervalKey;
    }
    if (params?.averagingIntervalKey) {
      this.averagingIntervalKey = params.averagingIntervalKey;
    }
    if (params?.sensorStatusKey) {
      this.sensorStatusKey = params.sensorStatusKey;
    }
    if (params?.ingestMatchingMethod) {
      this.ingestMatchingMethod = params.ingestMatchingMethod;
    }
    if (params?.parameters) {
      this.parameters = params.parameters;
    }
    if (params?.secrets) {
      this.secrets = params.secrets;
    }

    // if we were able to pass more values in params we
    // could include the params in the postConfigure args
    this.postConfigure();
  }

  postConfigure() {
    // this is an opportunity for the developer to do some customizing
    // this is where you would update any properties based on secrets or other values
    log('No post configuration provided');
  }

  get measurements() {
    if (!this.#measurements) {
      this.#measurements = new Measurements(this.parameters);
    }
    return this.#measurements;
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
    log(`Loading resources`);
    // if its a non-json string it should be a string that represents a location
    // local://..
    // s3://
    // google://
    // if its binary than it should be an uploaded file
    // if its an object then ...

    if (this.resource === undefined) {
      throw new Error('No resource provided');
    }
    if (isIndexed(this.resource)) {
      return await this.loadIndexedResources(this.resource);
    } else {
      return await this.loadSingleResource(this.resource);
    }
  }

  private async loadIndexedResources(
    resource: IndexedResource | IndexedFile
  ): Promise<DataDefinition> {
    let data: DataDefinition = {};

    const keys = ['locations', 'measurements'] as const;

    for (const key of keys) {
      const res = resource[key];
      log(`Loading ${key} using ${res}`);

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
      const options = getReaderOptions(
        this.readerOptions,
        key as keyof IndexedReaderOptions
      );

      const text = await reader({ resource: res, options }, data);
      const d = await parser({ text, data });

      if (Array.isArray(d)) {
        // Parser returned an array - index it by key
        data[key] = d;
      } else {
        // Parser returned an object - replace entire data object
        data = d;
      }
    }

    return data;
  }

  private async loadSingleResource(
    resource: Resource | File
  ): Promise<DataDefinition> {
    let reader;
    let parser;

    if (isFile(resource)) {
      // File object (uploaded binary file)
      reader = getMethod('measurements', this.reader, this.readers);
      parser = getMethod('measurements', this.parser, this.parsers);
    } else {
      // Resource class instance
      reader = getMethod(null, this.reader, this.readers);
      parser = getMethod(null, this.parser, this.parsers);
    }

    const text = await reader({ resource });
    const d = await parser({ text });

    if (typeof d !== 'object') {
      throw new Error('Parser did not return an object');
    }

    return this.normalizeDataStructure(d);
  }

  private normalizeDataStructure(d: any): DataDefinition {
    const acceptedKeys = new Set([
      'locations',
      'sensors',
      'measurements',
      'flags',
    ]);

    // Check if data is already in the expected indexed format
    if (Object.keys(d).every((key) => acceptedKeys.has(key))) {
      return d;
    } else {
      // Data is in wide format, wrap it as measurements
      return { measurements: d };
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
    log(`Starting the load process`);
    // start the fetch clock
    this.#startedOn = Datetime.now();
    const data = await this.loadResources();
    this.process(data);
    log(`Finished load + process`);
    this.#finishedOn = Datetime.now();
    return this.data();
  }

  private process(data: DataDefinition) {
    log(`Processing data`, Object.keys(data), Array.isArray(data));
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
  getLocation(data: DataDefinition) {
    const siteId = getValueFromKey(data, this.locationIdKey);
    // BUILDING KEY
    const key = Location.createKey({ provider: this.provider, siteId });
    let location: Location | undefined = this.#locations.get(key);

    if (!location) {
      // process data through the location map
      location = new Location({
        ...data,
        siteId,
        provider: this.provider,
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
      this.#locations.add(location);
    }
    return location;
  }

  /**
   * Process a list of locations
   */
  processLocationsData(locations: DataDefinition[]) {
    log(`Processing ${locations.length} locations`);
    for (const location of locations) {
      try {
        this.getLocation(location);
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
    log(`Processing ${sensors.length} sensors`);
    for (const sensor of sensors) {
      this.getSensor(sensor);
    }
  }

  private getSensor(data: DataDefinition): Sensor {
    if (!data.metric) {
      let metricName = getValueFromKey(data, this.parameterNameKey);
      data.metric = this.measurements.metricFromProviderKey(metricName);
    }

    // get or add then get the location
    let sensor: Sensor | undefined;
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

    const manufacturerName = cleanKey(
      getValueFromKey(data, this.manufacturerKey)
    );
    const modelName = cleanKey(getValueFromKey(data, this.modelKey));
    const versionDate = cleanKey(data.version_date);
    const instance = cleanKey(data.instance);

    // now use the location to get or add system
    const system = location.getSystem({
      manufacturerName,
      modelName,
    } as SystemData);

    // check if the sensor exists
    const key = Sensor.createKey({
      systemKey: system.key,
      metric: data.metric,
      versionDate,
      instance,
    });

    if (this.#sensors.has(key)) {
      sensor = this.#sensors.get(key);
    } else {
      sensor = new Sensor({
        systemKey: system.key,
        metric: data.metric,
        averagingIntervalSeconds,
        loggingIntervalSeconds,
        versionDate,
        instance,
        status,
      });
      location.add(sensor);
      this.#sensors.add(sensor);
    }

    if (!sensor) {
      throw new Error(`Could not find or create sensor`);
    }

    return sensor;
  }

  /**
   * Process a list of measurements
   *
   * @param {array} measurements - list of measurement data
   */
  processMeasurementsData(measurements: any) {
    log(`Processing ${measurements.length} measurement(s)`);
    // if we provided a parameter column key we use that
    // otherwise we use the list of parameters
    // the end goal is just an array of parameter names to loop through
    const params: Array<string | ParameterKeyFunction> = this.longFormat
      ? // for long format we will just pass the parameter name key and use that each time
        [this.parameterNameKey]
      : this.measurements.parameterKeys();

    measurements.forEach((measurementRow: any) => {
      try {
        const datetime = this.getDatetime(measurementRow);

        params.map((p) => {
          let metric, value, metricName, valueName;

          if (this.longFormat) {
            // for long format data we will need to extract the parameter name from the field
            metricName = getValueFromKey(measurementRow, p);
            valueName = this.parameterValueKey;
          } else {
            // for wide format they are both the same value
            metricName = p;
            valueName = p;
          }

          value = getValueFromKey(measurementRow, valueName);

          // for wide format data we will not assume that null is a real measurement
          // but for long format data we will assume it is valid
          if (value !== undefined && (value || this.longFormat)) {
            metric = this.measurements.metricFromProviderKey(metricName);
            if (!metric) {
              this.errorHandler(new UnsupportedParameterError(metricName));
              return;
            }

            // get the approprate sensor from or reference list,
            // or create it, which in turn with create the location and system
            const sensor = this.getSensor({ ...measurementRow, metric });
            if (!sensor) {
              this.errorHandler(
                new MissingAttributeError('sensor', {
                  ...measurementRow,
                  metric,
                })
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
    log(`Processing ${flags.length} flags`);
    flags.map((d: any) => {
      try {
        const metric = getValueFromKey(d, this.parameterNameKey);
        const sensor = this.getSensor({
          metric,
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
   * Dump a summary that we can pass back to the log
   */
  summary(): Summary {
    const errorSummary: ErrorSummary = {};
    this.log.forEach((v, k) => {
      errorSummary[k] = v.length;
    });
    return {
      sourceName: this.provider,
      locations: this.#locations.length,
      bounds: this.#locations.bounds,
      systems: this.#locations.systemsLength,
      sensors: this.#sensors.length,
      flags: this.#sensors.flagsLength,
      measurements: this.measurements.length,
      datetimeFrom: this.measurements.from?.toString(),
      datetimeTo: this.measurements.to?.toString(),
      errors: errorSummary,
    };
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
        sourceName: this.provider,
        ingestMatchingMethod: this.ingestMatchingMethod,
        startedOn: this.#startedOn?.toString(),
        finishedOn: this.#finishedOn?.toString(),
        exportedOn: Datetime.now().toString(),
        fetchSummary: this.summary(),
      },
      measurements: this.measurements.json(),
      locations: this.#locations.json(),
    };
  }
}
