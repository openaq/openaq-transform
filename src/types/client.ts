import type { BBox } from "geojson";
import { Resource } from "../core/resource";
import type { SourceRecord } from "./data";
import type { TimestampString } from "./datetime";
import type { ErrorJSON, ErrorSummary } from "./errors";
import type { LocationJSON } from "./location";
import type { MeasurementJSON } from "./measurement";
import type { ClientParameters } from "./metric";
import type { IndexedParser, Parser } from "./parsers";
import type { IndexedReaderOptions, Reader, ReaderOptions } from "./readers";
import type { ResourceKeys } from "./resource";

interface Meta {
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
	type: "function" | "field" | "jmespath";
	value: string | undefined;
}

export interface ClientInfoParameter {
	parameter: string;
	unit: string;
}

export interface ClientInfo {
	timezone: string | undefined;
	provider: string;
	isLongFormat: boolean;
	datetimeKey: ClientInfoKey;
	datetimeFormat: string;
	geometryProjectionKey: ClientInfoKey;
	xGeometryKey: ClientInfoKey;
	yGeometryKey: ClientInfoKey;
	manufacturerKey: ClientInfoKey;
	modelKey: ClientInfoKey;
	ownerKey: ClientInfoKey;
	licenseKey: ClientInfoKey;
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
	secrets?: object;

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
	parameters?: ClientParameters;
	ingestMatchingMethod?: IngestMatchingMethod;
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
