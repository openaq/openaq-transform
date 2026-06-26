import debug from "debug";
import {
	type ClientConfiguration,
	type ClientInfo,
	type ClientInfoKey,
	type ClientParser,
	type ClientReader,
	type ConstantValue,
	type IndexedResource,
	type IngestMatchingMethod,
	isIndexed,
	isIndexedParser,
	isIndexedReader,
	type LogEntry,
	type ParseFunction,
	type Summary,
	type TransformData,
} from "../types/client";
import type { ResourceData, SourceRecord } from "../types/data";
import type { FlagInput } from "../types/flag";
import type {
	ClientParameters,
	DecimalDigitGroup,
	PathExpression,
	ValueFlagMap,
} from "../types/metric";
import { isParser, type Parser, type ParserMethods } from "../types/parsers";
import { isReader, type Reader, type ReaderMethods } from "../types/readers";
import type { BearerAuth, ResourceKeys } from "../types/resource";
import type { SystemData } from "../types/system";
import { Datetime } from "./datetime";
import type { TransformError } from "./errors";
import {
	Errors,
	FetchError,
	MissingAttributeError,
	UnsupportedParameterError,
} from "./errors";
import { Location, Locations } from "./location";
import { Measurement, Measurements } from "./measurement";
import { FLAG_DEFAULTS, type Metric, PARAMETER_DEFAULTS } from "./metric";
import type { Resource } from "./resource";
import { Sensor, Sensors } from "./sensor";

import {
	cleanKey,
	formatValueForLog,
	getArray,
	getBoolean,
	getNumber,
	getString,
	getValueFromKey,
} from "./utils";

const log = debug("openaq-transform client (core): DEBUG");

export abstract class Client<
	R extends ReaderMethods = ReaderMethods,
	P extends ParserMethods = ParserMethods,
> {
	provider!: string;
	resource?: Resource | IndexedResource;
	secrets?: object;
	reader: ClientReader<R> = "api";
	parser: ClientParser<P> = "json";
	protected readonly readers: R;
	protected readonly parsers: P;
	fetched: boolean = false;
	// source: Source;
	timezone?: string;
	longFormat: boolean = false;
	geometryProjection: string | PathExpression | ConstantValue | ParseFunction =
		"projection";
	datetimeFormat: string = "yyyy-MM-dd'T'HH:mm:ssZZ";
	timeEnding: boolean = true;

	// mapped data variables
	locationId: string | PathExpression | ConstantValue | ParseFunction =
		"location";
	locationLabel: string | PathExpression | ConstantValue | ParseFunction =
		"label";
	// if longFormat = false this value is ignored
	parameterName: string | PathExpression | ConstantValue | ParseFunction =
		"parameter";
	parameterValue: string | PathExpression | ConstantValue | ParseFunction =
		"value";
	flags: string | PathExpression | ConstantValue | ParseFunction = "flags";
	numberFormat: DecimalDigitGroup = { decimal: "point" };
	yGeometry: string | PathExpression | ConstantValue | ParseFunction | number =
		"y";
	xGeometry: string | PathExpression | ConstantValue | ParseFunction | number =
		"x";
	manufacturer: string | PathExpression | ConstantValue | ParseFunction =
		"manufacturer_name";
	model: string | PathExpression | ConstantValue | ParseFunction = "model_name";
	owner: string | PathExpression | ConstantValue | ParseFunction = "owner_name";
	datetime: string | PathExpression | ConstantValue | ParseFunction =
		"datetime";
	license: string | PathExpression | ConstantValue | ParseFunction = "license";
	isMobile: string | PathExpression | ConstantValue | ParseFunction | boolean =
		"is_mobile";
	loggingInterval:
		| string
		| PathExpression
		| ConstantValue
		| ParseFunction
		| number = "logging_interval_seconds";
	averagingInterval:
		| string
		| PathExpression
		| ConstantValue
		| ParseFunction
		| number = "averaging_interval_seconds";
	sensorStatus: string | PathExpression | ConstantValue | ParseFunction =
		"status";
	providerFlags?: ValueFlagMap = FLAG_DEFAULTS;
	ingestMatchingMethod: IngestMatchingMethod = "ingest-id";

	datasources: object = {};
	missingDatasources: string[] = [];

	// this should be the list of parameters in the data and how to extract them
	// transforming could be later
	parameters: ClientParameters = PARAMETER_DEFAULTS;

	protected getNumber = (
		data: SourceRecord,
		key: string | number | PathExpression | ConstantValue | ParseFunction,
	) => getNumber(data, key, this.numberFormat);

	#startedOn?: Datetime;
	#finishedOn?: Datetime;
	#measurements?: Measurements;
	#locations: Locations;
	#sensors: Sensors;
	#errors: Errors;
	#params: ClientConfiguration;
	// offset, to, from support
	// limit the returned values to the following periods
	#datetimeTo: Datetime;
	#datetimeFrom?: Datetime;
	#offset?: number;

	// log object for compiling errors/warnings for later reference
	log: Map<string, Array<LogEntry>>;
	strict: boolean = false;

	constructor(params?: ClientConfiguration) {
		// update with config if the config was passed in
		// this will still behave oddly in our abstract/extend framework
		this.configure(params as ClientConfiguration);
	}

	configure(params: ClientConfiguration) {
		if (params && typeof params === "object") {
			this.#params = { ...this.#params, ...params };
			this.setup();
		}
	}

	setup() {
		if (this.#params?.resource) {
			this.resource = this.#params.resource;
		}
		if (this.#params?.provider) {
			this.provider = this.#params.provider;
		}
		if (this.#params?.datetimeFormat) {
			this.datetimeFormat = this.#params.datetimeFormat;
		}
		if (this.#params?.timezone) {
			this.timezone = this.#params.timezone;
		}
		if (this.#params?.longFormat) {
			this.longFormat = this.#params.longFormat;
		}
		if (this.#params?.reader) {
			this.reader = this.#params.reader;
		}
		if (this.#params?.parser) {
			this.parser = this.#params.parser;
		}
		// mapped data variables
		if (this.#params?.locationId) {
			this.locationId = this.#params.locationId;
		}
		if (this.#params?.locationLabel) {
			this.locationLabel = this.#params.locationLabel;
		}
		// these are used for long format
		if (this.#params?.parameterName) {
			this.parameterName = this.#params.parameterName;
		}
		if (this.#params?.parameterValue) {
			this.parameterValue = this.#params.parameterValue;
		}
		if (this.#params?.flags) {
			this.flags = this.#params.flags;
		}
		if (this.#params?.numberFormat) {
			this.numberFormat = this.#params.numberFormat;
		}
		if (this.#params?.yGeometry) {
			this.yGeometry = this.#params.yGeometry;
		}
		if (this.#params?.xGeometry) {
			this.xGeometry = this.#params.xGeometry;
		}
		if (this.#params?.geometryProjection) {
			this.geometryProjection = this.#params.geometryProjection;
		}
		if (this.#params?.manufacturer) {
			this.manufacturer = this.#params.manufacturer;
		}
		if (this.#params?.model) {
			this.model = this.#params.model;
		}
		if (this.#params?.owner) {
			this.owner = this.#params.owner;
		}
		if (this.#params?.datetime) {
			this.datetime = this.#params.datetime;
		}
		if (this.#params?.timeEnding !== undefined) {
			this.timeEnding = this.#params.timeEnding;
		}
		if (this.#params?.license) {
			this.license = this.#params.license;
		}
		if (this.#params?.isMobile) {
			this.isMobile = this.#params.isMobile;
		}
		if (this.#params?.loggingInterval) {
			this.loggingInterval = this.#params.loggingInterval;
		}
		if (this.#params?.averagingInterval) {
			this.averagingInterval = this.#params.averagingInterval;
		}
		if (this.#params?.sensorStatus) {
			this.sensorStatus = this.#params.sensorStatus;
		}
		if (this.#params?.ingestMatchingMethod) {
			this.ingestMatchingMethod = this.#params.ingestMatchingMethod;
		}
		if (this.#params?.parameters) {
			this.parameters = this.#params.parameters;
		}
		if (this.#params?.providerFlags) {
			this.providerFlags = this.#params.providerFlags;
		}
		if (this.#params?.secrets) {
			this.secrets = this.#params.secrets;
		}
		if (this.#params?.datetimeFrom) {
			try {
				this.#datetimeFrom = new Datetime(this.#params.datetimeFrom);
			} catch (e) {
				throw new Error(
					`Config error: could not parse datetimeFrom value - ${e instanceof Error ? e.message : String(e)}`,
				);
			}
		}
		if (this.#params?.datetimeTo) {
			try {
				this.#datetimeTo = new Datetime(this.#params.datetimeTo);
			} catch (e) {
				throw new Error(
					`Config error: could not parse datetimeTo value - ${e instanceof Error ? e.message : String(e)}`,
				);
			}
		}
		if (this.#params?.offset !== undefined) {
			if (typeof this.#params.offset !== "number" || this.#params.offset <= 0) {
				throw new Error(
					`Config error: offset must be a positive number, got ${this.#params.offset}`,
				);
			}
			this.#offset = this.#params.offset;
		}

		// if there is no datetimeTo we default to now
		// minus any buffer to deal with hourly data that might be time begining
		if (!this.#datetimeTo) {
			this.#datetimeTo = Datetime.now();
		}

		// if there is no datetimeFrom but we have an offset
		// we default to using datetimeTo - offset
		if (!this.#datetimeFrom && this.#offset) {
			this.#datetimeFrom = this.#datetimeTo.minus(this.#offset);
		}

		this.#locations = new Locations();
		this.#sensors = new Sensors();
		this.#errors = new Errors();
	}

	private async initAuth() {
		if (!this.resource || isIndexed(this.resource)) {
			return;
		}
		const resource = this.resource;

		const { auth } = resource;
		if (auth?.type !== "Bearer") {
			return;
		}
		if (!auth.tokenUrl) {
			return;
		}

		if (auth.token) {
			await this.refreshAuth(resource);
			return;
		}

		await this.fetchBearerToken(resource, auth.tokenUrl, auth);
	}

	private async refreshAuth(resource: Resource) {
		const { auth } = resource;
		if (auth?.type !== "Bearer") {
			return;
		}
		if (!auth.token) {
			return;
		}
		if (!auth.expiresAt) {
			return;
		}

		const isExpired = Math.floor(Date.now() / 1000) > auth.expiresAt - 30;
		if (!isExpired) {
			return;
		}

		if (auth.refreshToken) {
			const refreshUrl = auth.refreshUrl ?? auth.tokenUrl;
			if (!refreshUrl) {
				return;
			}
			await this.fetchBearerToken(
				resource,
				refreshUrl,
				auth,
				auth.refreshToken,
			);
		} else if (auth.tokenUrl) {
			await this.fetchBearerToken(resource, auth.tokenUrl, auth);
		}
	}

	private async fetchBearerToken(
		resource: Resource,
		url: string,
		auth: BearerAuth,
		refreshToken?: string,
	) {
		try {
			const body = refreshToken
				? JSON.stringify({
						grant_type: "refresh_token",
						refresh_token: refreshToken,
					})
				: undefined;

			const res = await fetch(url, {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
					...Object.fromEntries(auth.headers ?? []),
				}),
				...(body && { body }),
			});

			if (!res.ok) {
				throw new FetchError(
					`Failed to obtain Bearer token: ${res.status} ${res.statusText}`,
					url,
					res.status,
				);
			}

			const keys = auth.tokenResponseKeys ?? {};
			const tokenKey = keys.token ?? "access_token";
			const expiresKey = keys.expiresIn ?? "expires_in";
			const refreshKey = keys.refreshToken ?? "refresh_token";

			const data = await res.json();
			const token = data[tokenKey];

			if (!token) {
				throw new Error(
					`Bearer token response did not contain expected field "${tokenKey}"`,
				);
			}

			const expiresIn = data[expiresKey]; // duration in seconds from now
			const newRefreshToken = data[refreshKey]; // provider may rotate the refresh token

			resource.auth = {
				...auth,
				token,
				// expiresIn is seconds-from-now, convert to absolute unix timestamp
				...(expiresIn && {
					expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
				}),
				// use rotated refresh token if provider returned one, otherwise keep existing
				...(newRefreshToken
					? { refreshToken: newRefreshToken }
					: refreshToken
						? { refreshToken }
						: {}),
			};
		} catch (err) {
			this.errorHandler(err instanceof Error ? err : new Error(String(err)));
		}
	}

	async preLoad() {
		await this.initAuth();
	}

	get measurements(): Measurements {
		if (!this.#measurements) {
			this.#measurements = new Measurements(
				this.parameters,
				this.providerFlags,
				this.numberFormat,
			);
		}
		return this.#measurements;
	}

	/**
	 * Create a proper timestamp
	 *
	 * @param {*} row - data with fields to create timestamp
	 * @returns {string} - formated timestamp string
	 */
	getDatetime(
		row: SourceRecord,
		averagingIntervalSeconds: number | undefined,
	): Datetime {
		const dtString = getValueFromKey(row, this.datetime);
		log(`getDatetime`, dtString);
		if (typeof dtString !== "string" || !dtString) {
			throw new Error(
				`Missing date/time field. Looking in ${formatValueForLog(this.datetime)}`,
			);
		}
		let dt = new Datetime(dtString, {
			format: this.datetimeFormat,
			timezone: this.timezone,
		});
		if (!this.timeEnding) {
			if (!averagingIntervalSeconds) {
				throw new Error(
					"averagingIntervalSeconds required when timeEnding is false",
				);
			}
			dt = dt.add(averagingIntervalSeconds);
		}
		return dt;
	}

	/**
	 * fetches data and convert to json
	 *
	 */
	async loadResources(): Promise<ResourceData> {
		log(`Loading resources`);
		// if its a non-json string it should be a string that represents a location
		// local://..
		// s3://
		// gs://
		// rs://
		// if its binary than it should be an uploaded file
		// if its an object then ...

		if (this.resource === undefined) {
			throw new Error("No resource provided");
		} else if (typeof this.resource === "string") {
			// in development this can be a helpful check
			throw new Error(
				"A resource must use the resource class and not a string",
			);
		}

		if (isIndexed(this.resource)) {
			return await this.loadIndexedResources(this.resource);
		} else {
			return await this.loadSingleResource(this.resource);
		}
	}

	private async loadIndexedResources(
		indexedResource: IndexedResource,
	): Promise<ResourceData> {
		let data: ResourceData = {};
		log("Loading indexed resources");
		// I think we should use the devs resource order here and just check to make sure the keys match
		// this way the dev can control the order of the resource calls, for example, for clarity we
		// need to hit the meta resource first
		// I am indifferent to how we do it though, so feel free to change what I did
		for (const key of Object.keys(indexedResource) as Array<
			keyof typeof indexedResource
		>) {
			const resource = indexedResource[key];
			if (resource) {
				const reader = isIndexedReader<R>(this.reader)
					? this.getReaderMethod(this.reader, key)
					: this.getReaderMethod(this.reader);

				const parser = isIndexedParser<P>(this.parser)
					? this.getParserMethod(this.parser, key)
					: this.getParserMethod(this.parser);

				let d = await reader(
					{ resource, errorHandler: this.errorHandler.bind(this) },
					parser,
					data,
				);

				if (resource.responsePath) {
					const responsePath = resource.responsePath;
					d = getValueFromKey(d as SourceRecord, responsePath);
				}

				if (Array.isArray(d)) {
					data[key] = d as SourceRecord[];
				} else {
					// if its not a source record we assume its a ResourceData object
					// and it should replace the current data object
					data = d as ResourceData;
				}
			} // should we do something here if there is no resource?
		}

		return data;
	}

	// must return parsed data in keyed format
	private async loadSingleResource(resource: Resource): Promise<ResourceData> {
		let reader: Reader;
		let parser: Parser;
		const data: ResourceData = {};

		if (resource.isFileResource()) {
			log("loading single file resource");
			// File Resource class instance (uploaded binary file)
			reader = this.getReaderMethod(this.reader);
			parser = this.getParserMethod(this.parser);
		} else {
			// URL Resource class instance
			log("loading single URL resource");
			reader = this.getReaderMethod(this.reader);
			parser = this.getParserMethod(this.parser);
		}

		let d = await reader(
			{ resource, errorHandler: this.errorHandler.bind(this) },
			parser,
			data,
		);

		if (d === null || d === undefined) {
			throw new Error("Reader returned null or undefined");
		}

		if (typeof d !== "object") {
			throw new Error("Reader did not return an object");
		}

		if (resource.responsePath) {
			const responsePath = resource.responsePath;

			d = getValueFromKey(d as SourceRecord, responsePath);
		}

		return this.normalizeDataStructure(
			d as
				| Partial<
						Record<
							"measurements" | "locations" | "meta" | "flags" | "sensors",
							SourceRecord[]
						>
				  >
				| SourceRecord[],
		);
	}

	private normalizeDataStructure(
		d: ResourceData | SourceRecord[],
	): ResourceData {
		const acceptedKeys = new Set([
			"locations",
			"sensors",
			"measurements",
			"flags",
		]);

		//Check if data is already in the expected indexed format
		if (
			!Array.isArray(d) &&
			Object.keys(d).every((key) => acceptedKeys.has(key))
		) {
			return d;
		} else {
			// Data is in wide format, wrap it as measurements
			return { measurements: d as SourceRecord[] };
		}
	}

	// the error handler should process all errors and do whatever is appropriate based on context
	// e.g.
	// fetching in production - log error and move on
	// fetching in upload tool - throw error if strict is on
	// developing - throw error
	errorHandler(err: TransformError | Error | string, strict: boolean = false) {
		const transformError: TransformError = this.#errors.add(err);
		if (strict || this.strict || transformError.strict) {
			// rethrow if we are in strict mode
			// or if the context is strict
			// or if the error itself is marked strict
			throw err;
		}
	}

	/**
	 * Entry point for processing data
	 */
	async load() {
		log(`Starting the load process`);
		// update the config with anything added
		// after init
		this.setup();
		await this.preLoad();
		// start the fetch clock
		this.#startedOn = Datetime.now();
		const data = await this.loadResources();
		this.process(data);
		log(`Finished load + process`);
		this.#finishedOn = Datetime.now();
		return this.data();
	}

	private process(data: ResourceData) {
		log(`Processing data`, Object.keys(data), Array.isArray(data));
		if (!data) {
			throw new Error("No data was returned from file");
		}
		if (
			!(
				"locations" in data ||
				"sensors" in data ||
				"measurements" in data ||
				"flags" in data
			)
		) {
			throw new Error(
				`Data is not in the correct format to be processed. Current object has the following keys: ${Object.keys(
					data,
				).join(", ")}`,
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
	getLocation(data: SourceRecord) {
		const siteId = getString(data, this.locationId) ?? "";
		// BUILDING KEY
		const key = Location.createKey({ provider: this.provider, siteId });

		let location: Location | undefined = this.#locations.get(key);

		if (!location) {
			// process data through the location map
			location = new Location({
				...data,
				siteId,
				provider: this.provider,
				siteName: getString(data, this.locationLabel) ?? "",
				ismobile: getBoolean(data, this.isMobile),
				x: this.getNumber(data, this.xGeometry),
				y: this.getNumber(data, this.yGeometry),
				projection: getString(data, this.geometryProjection),
				averagingIntervalSeconds: this.getNumber(data, this.averagingInterval),
				loggingIntervalSeconds: this.getNumber(data, this.loggingInterval),
				status: getString(data, this.sensorStatus) ?? "",
				owner: getString(data, this.owner) ?? "",
				label: getString(data, this.locationLabel) ?? "",
			});
			this.#locations.add(location);
		}
		return location;
	}

	/**
	 * Process a list of locations
	 */
	processLocationsData(locations: SourceRecord[]) {
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
	processSensorsData(sensors: SourceRecord[]) {
		log(`Processing ${sensors.length} sensors`);
		for (const sensor of sensors) {
			this.getSensor(sensor);
		}
	}

	private getSensor(data: SourceRecord): Sensor {
		const metricName = getValueFromKey(data, this.parameterName) as string;
		const metric =
			(data.metric as Metric | undefined) ??
			this.measurements.metricFromProviderKey(metricName);

		if (!metric) {
			throw new Error(`Could not resolve metric for parameter: ${metricName}`);
		}

		// get or add then get the location
		const location = this.getLocation(data);

		const status = getString(data, this.sensorStatus) ?? location.sensorStatus;

		// maintain a way to get the sensor back without traversing everything

		const manufacturerName = cleanKey(getValueFromKey(data, this.manufacturer));
		const modelName = cleanKey(getValueFromKey(data, this.model));
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
			metric,
			versionDate,
			instance,
		});

		let sensor: Sensor | undefined;

		if (this.#sensors.has(key)) {
			sensor = this.#sensors.get(key);
		} else {
			sensor = new Sensor({
				systemKey: system.key,
				metric,
				averagingIntervalSeconds:
					this.getNumber(data, this.averagingInterval) ??
					location.averagingIntervalSeconds,
				loggingIntervalSeconds:
					this.getNumber(data, this.loggingInterval) ??
					location.loggingIntervalSeconds,
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
	processMeasurementsData(measurements: SourceRecord[]) {
		log(`Processing ${measurements.length} measurement(s)`);
		// if we provided a parameter column key we use that
		// otherwise we use the list of parameters
		// the end goal is just an array of parameter names to loop through
		const params: Array<
			string | PathExpression | ConstantValue | ParseFunction
		> = this.longFormat
			? // for long format we will just pass the parameter name key and use that each time
				[this.parameterName]
			: this.measurements.parameterKeys();

		measurements.forEach((measurementRow: SourceRecord) => {
			try {
				params.forEach((p) => {
					// for long format data we will need to extract the parameter name from the field
					// for wide format they are both the same value
					const metricName = this.longFormat
						? getValueFromKey(measurementRow, p)
						: p;

					const valueName = this.longFormat ? this.parameterValue : p;

					const value = getValueFromKey(measurementRow, valueName);
					// flags must be an array so we need to check that somewhere
					const flags = getArray(measurementRow, this.flags)?.map((f) => {
						if (this.providerFlags?.has(f)) {
							return this.providerFlags.get(f);
						} else {
							return `${this.provider}::${f}`;
						}
					});

					// for wide format data we will not assume that null is a real measurement
					// but for long format data we will assume it is valid
					if (value !== undefined && (value || this.longFormat)) {
						const metric = this.measurements.metricFromProviderKey(
							metricName as string,
						);

						if (!metric) {
							if (!this.longFormat) {
								this.errorHandler(
									new UnsupportedParameterError(metricName as string),
								);
							}
							return;
						}

						// get the approprate sensor from or reference list,
						// or create it, which in turn with create the location and system
						const sensor = this.getSensor({ ...measurementRow, metric });
						if (!sensor) {
							this.errorHandler(
								new MissingAttributeError("sensor", {
									...measurementRow,
									metric,
								}),
							);
							return;
						}
						const averagingIntervalSeconds = sensor.averagingIntervalSeconds;
						const datetime = this.getDatetime(
							measurementRow,
							averagingIntervalSeconds,
						);
						if (
							datetime.isGreaterThan(this.#datetimeTo) ||
							(this.#datetimeFrom && datetime.isLessThan(this.#datetimeFrom))
						) {
							return;
						}
						this.measurements.add(
							new Measurement({
								sensor: sensor,
								timestamp: datetime,
								value: value,
								flags: flags?.filter((f): f is string => f !== undefined),
							}),
						);
					}
				});
			} catch (e: unknown) {
				if (e instanceof Error || typeof e === "string") {
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
	processFlagsData(flags: SourceRecord[]) {
		log(`Processing ${flags.length} flags`);
		flags.forEach((d: SourceRecord) => {
			try {
				const metric = getValueFromKey(d, this.parameterName);
				const sensor = this.getSensor({
					metric,
					...d,
				});

				if (sensor) {
					const flagInput: FlagInput = {
						starts: getValueFromKey(d, "starts") as string,
						ends: getValueFromKey(d, "ends") as string,
						flag: getValueFromKey(d, "flag") as string,
						note: getValueFromKey(d, "note") as string,
					};
					sensor.add(flagInput);
				}
			} catch (e: unknown) {
				if (e instanceof Error) {
					console.warn(`Error adding flag: ${e.message}`);
				}
			}
		});
	}

	private getParserMethod(method: Parser): Parser;

	private getParserMethod(method: keyof P): Parser;

	private getParserMethod(
		method: Partial<Record<ResourceKeys, keyof P | Parser>>,
		key: ResourceKeys,
	): Parser;

	private getParserMethod(method: ClientParser<P>): Parser;

	private getParserMethod(method: ClientParser<P>, key?: ResourceKeys): Parser {
		if (isParser(method)) {
			return method;
		}

		if (typeof method === "string" && method in this.parsers) {
			const parser = this.parsers[method];
			if (!parser) {
				throw new Error(`parser "${method}" is undefined`);
			}
			return parser;
		}

		if (key && isIndexedParser<R>(method)) {
			const value = method[key];

			if (!value) {
				throw new Error(`No value found for key "${key}" in indexed parser`);
			}

			if (isParser(value)) {
				return value;
			}

			if (typeof value === "string" && value in this.parsers) {
				const parser = this.parsers[value];
				if (!parser) {
					throw new Error(`Parser "${value}" is undefined`);
				}
				return parser;
			}

			throw new Error(
				`Invalid value type for key "${key}": expected Parser or valid parser name`,
			);
		}

		throw new Error(
			`Invalid parser method: ${JSON.stringify(method)}${
				key ? ` with key "${key}"` : ""
			}`,
		);
	}

	private getReaderMethod(method: Reader): Reader;

	private getReaderMethod(method: keyof R): Reader;

	private getReaderMethod(
		method: Partial<Record<ResourceKeys, keyof R | Reader>>,
		key: ResourceKeys,
	): Reader;

	private getReaderMethod(method: ClientReader<R>): Reader;

	private getReaderMethod(method: ClientReader<R>, key?: ResourceKeys): Reader {
		if (isReader(method)) {
			return method;
		}

		if (typeof method === "string" && method in this.readers) {
			const reader = this.readers[method];
			if (!reader) {
				throw new Error(`Reader "${method}" is undefined`);
			}
			return reader;
		}

		if (key && isIndexedReader<R>(method)) {
			const value = method[key];

			if (!value) {
				throw new Error(`No value found for key "${key}" in indexed reader`);
			}

			if (isReader(value)) {
				return value;
			}

			if (typeof value === "string" && value in this.readers) {
				const reader = this.readers[value];
				if (!reader) {
					throw new Error(`Reader "${value}" is undefined`);
				}
				return reader;
			}

			throw new Error(
				`Invalid value type for key "${key}": expected Reader or valid reader name`,
			);
		}

		throw new Error(
			`Invalid reader method: ${JSON.stringify(method)}${
				key ? ` with key "${key}"` : ""
			}`,
		);
	}

	/**
	 * Dump a summary that we can pass back to the log
	 */
	summary(): Summary {
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
			errors: this.#errors.summary(),
		};
	}

	/**
	 * Method to dump data to format that we can ingest
	 *
	 * @returns {object} - data object formated for ingestion
	 */
	data(): TransformData {
		return {
			meta: {
				schema: "v0.1",
				sourceName: this.provider,
				ingestMatchingMethod: this.ingestMatchingMethod,
				startedOn: this.#startedOn?.toString(),
				finishedOn: this.#finishedOn?.toString(),
				exportedOn: Datetime.now().toString(),
				fetchSummary: this.summary(),
			},
			measurements: this.measurements.json(),
			locations: this.#locations.json(),
			errors: this.#errors.json(),
		};
	}

	/**
	 * Returns a summary of the client's configuration for display or debugging purposes.
	 */
	info(): ClientInfo {
		const translateKey = (
			key:
				| string
				| number
				| boolean
				| PathExpression
				| ConstantValue
				| ParseFunction,
		): ClientInfoKey => {
			let type: ClientInfoKey["type"];
			let value: string | number | boolean | undefined;
			if (typeof key === "function") {
				type = "function";
				value = String(getValueFromKey({}, key));
			} else if (typeof key === "string") {
				type = "field";
				value = key;
			} else if (typeof key === "object" && "value" in key) {
				type = key.type;
				value = key.value;
			} else {
				type = "field";
				value = undefined;
			}
			return { type, value };
		};

		return {
			provider: this.provider,
			datetime: translateKey(this.datetime),
			timezone: this.timezone,
			datetimeFormat: this.datetimeFormat,
			geometryProjection: translateKey(this.geometryProjection),
			yGeometry: translateKey(this.yGeometry),
			xGeometry: translateKey(this.xGeometry),
			manufacturer: translateKey(this.manufacturer),
			model: translateKey(this.model),
			owner: translateKey(this.owner),
			license: translateKey(this.license),
			isLongFormat: this.longFormat,
			isMobile: translateKey(this.isMobile),
			loggingInterval: translateKey(this.loggingInterval),
			averagingInterval: translateKey(this.averagingInterval),
			ingestMatchingMethod: this.ingestMatchingMethod,
			parameters: this.parameters.map((p) => ({
				parameter: p.parameter,
				unit: p.unit,
			})),
		};
	}
}
