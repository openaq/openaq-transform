import type { BBox } from "geojson";
import { Resource } from "../core/resource";
import type { SourceRecord } from "./data";
import type { TimestampString } from "./datetime";
import type { ErrorJSON, ErrorSummary } from "./errors";
import type { LocationJSON } from "./location";
import type { MeasurementJSON } from "./measurement";
import type {
	ClientParameters,
	DecimalDigitGroup,
	SupportedExpressionLanguages,
	ValueFlagMap,
} from "./metric";
import type { IndexedParser, Parser } from "./parsers";
import type { IndexedReaderOptions, Reader, ReaderOptions } from "./readers";
import type { ResourceKeys } from "./resource";

interface Meta {
	locationId: string;
	locationLabel: string;
	parameter: string;
	value: string;
	projection: string;
	latitude: string;
	longitude: string;
	manufacturer: string;
	model: string;
	owner: string;
	license: string;
	timestamp: string;
	datetimeFormat: string;
	timezone: string;
}

export interface Source {
	meta: Meta;
	provider: string;
	parameters: string[];
}

export interface Summary {
	sourceName: string;
	bounds: BBox | null;
	locations: number;
	systems: number;
	sensors: number;
	flags: number;
	measurements: number;
	errors: ErrorSummary;
	datetimeTo: string | undefined;
	datetimeFrom: string | undefined;
}

export interface TransformData {
	meta: {
		schema: string;
		sourceName: string;
		ingestMatchingMethod: IngestMatchingMethod;
		startedOn: TimestampString | undefined;
		finishedOn: TimestampString | undefined;
		exportedOn: TimestampString | undefined;
		fetchSummary: Summary;
	};
	measurements: MeasurementJSON[];
	locations: LocationJSON[];
	errors: ErrorJSON;
}

export interface ClientInfoKey {
	type: "function" | "field" | "constant" | SupportedExpressionLanguages;
	value: string | number | boolean | undefined;
}

export interface ClientInfoParameter {
	parameter: string;
	unit: string;
}

export interface ClientInfo {
	timezone: string | undefined;
	provider: string;
	isLongFormat: boolean;
	datetime: ClientInfoKey;
	datetimeFormat: string;
	geometryProjection: ClientInfoKey;
	xGeometry: ClientInfoKey;
	yGeometry: ClientInfoKey;
	manufacturer: ClientInfoKey;
	model: ClientInfoKey;
	owner: ClientInfoKey;
	license: ClientInfoKey;
	ingestMatchingMethod: string;
	isMobile: ClientInfoKey;
	loggingInterval: ClientInfoKey;
	averagingInterval: ClientInfoKey;
	parameters: ClientInfoParameter[];
}

export interface LogEntry {
	message: string;
	err?: Error;
}

/**
 * An shared interface for keyed values.
 */
export interface StructuredKey {
	type: string;
	value: unknown;
}

/**
 * Type guard to check if a value is a {@link StructuredKey}.
 *
 * @param value - The value to check
 * @returns `true` if the value is a valid StructuredKey, otherwise `false`
 *
 */
export function isStructuredKey(value: unknown): value is StructuredKey {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"value" in value
	);
}

/**
 * An interface for defining constant values.
 *
 * @example
 * ```ts
 * const value: ConstantValue = {
 *   type: 'constant',
 *   value: 3600
 * }
 * ```
 */
export interface ConstantValue<T = string | boolean | number>
	extends StructuredKey {
	type: "constant";
	value: T;
}

/**
 * Type guard to check if a value is a {@link ConstantValue}.
 *
 * @param value - The value to check
 * @returns `true` if the value is a valid ConstantValue, otherwise `false`
 *
 */
export function isConstantValue(value: unknown): value is ConstantValue {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"value" in value &&
		(value as ConstantValue).type === "constant"
	);
}

export type ParseFunction = (
	data?: SourceRecord,
) => string | number | object | boolean;

export type IndexedResource = {
	measurements: Resource;
} & Partial<Record<Exclude<ResourceKeys, "measurements">, Resource>>;

export function isIndexed(resource: unknown): resource is IndexedResource {
	return (
		typeof resource === "object" &&
		resource !== null &&
		!(resource instanceof Resource) &&
		"measurements" in resource
	);
}

export type IngestMatchingMethod = "ingest-id" | "source-spatial";

export interface ClientConfiguration {
	resource?: Resource | IndexedResource;
	readerOptions?: ReaderOptions | IndexedReaderOptions;
	reader?: string;
	parser?: string;
	provider?: string;
	fetched?: boolean;
	source?: Source;
	timezone?: string;
	longFormat?: boolean;
	sourceProjection?: string;
	datetimeFormat?: string;
	timeEnding: boolean;
	secrets?: object;

	locationId?: string | ParseFunction;
	locationLabel?: string | ParseFunction;
	parameterName?: string | ParseFunction;
	parameterValue?: string | ParseFunction;
	flags?: string | ParseFunction;
	numberFormat?: DecimalDigitGroup;
	xGeometry?: string | ParseFunction;
	yGeometry?: string | ParseFunction;
	geometryProjection?: string | ParseFunction;
	manufacturer?: string | ParseFunction;
	model?: string | ParseFunction;
	owner?: string | ParseFunction;
	datetime?: string | ParseFunction;
	license?: string | ParseFunction;
	isMobile?: string | ParseFunction;
	loggingInterval?: string | ParseFunction;
	averagingInterval?: string | ParseFunction;
	sensorStatus?: string | ParseFunction;
	providerFlags?: ValueFlagMap;

	datasources?: object;
	missingDatasources?: string[];
	parameters?: ClientParameters;
	ingestMatchingMethod?: IngestMatchingMethod;

	datetimeFrom?: string;
	datetimeTo?: string;
	offset?: number;
}

export type IndexedReader<T> = Partial<Record<ResourceKeys, keyof T | Reader>>;

export function isIndexedReader<T>(value: unknown): value is IndexedReader<T> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const objectKeys = Object.keys(value);

	if (objectKeys.length === 0) {
		return false;
	}

	return true;
}

export function isIndexedParser<T>(value: unknown): value is IndexedParser<T> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const objectKeys = Object.keys(value);

	if (objectKeys.length === 0) {
		return false;
	}

	return true;
}

// I think it would be clearer if IndexedReader was called IndexedReader
// then we have 'A ClientReader can be a key, a Reader, or an IndexedReader'
export type ClientReader<T> = keyof T | Reader | IndexedReader<T>;

export type ClientParser<T> = keyof T | Parser | IndexedParser<T>;
