import type { BBox } from "geojson";
import type { IndexedReaderOptions, Reader, ReaderOptions } from "./readers";
import type { IndexedParser, Parser } from "./parsers";
import type { ClientParameters } from "./metric";
import { Resource } from "../core/resource";
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

export type DataDefinition = Record<string, any>;

export type ErrorSummary = Record<string, number>;


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
  datetimeFrom: string | undefined
}

export interface LogEntry {
  message: string;
  err?: Error;
}

export type ParseFunction = (data?: any) => string | number | object | boolean;

export type IndexedResource = {
  measurements: Resource;
} & Partial<Record<Exclude<ResourceKeys, 'measurements'>, Resource>>;

export function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

export function isIndexed(resource: any): resource is IndexedResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    !(resource instanceof Resource) &&
    'measurements' in resource
  );
}

export type IngestMatchingMethod = 'ingest-id' | 'source-spatial';

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

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const objectKeys = Object.keys(value);

  if (objectKeys.length === 0) {
    return false;
  }

  return true;
}


export function isIndexedParser<T>(value: unknown): value is IndexedParser<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
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
export type ClientReader<T> = keyof T | Reader | IndexedReader<T>

export type ClientParser<T> = keyof T | Parser | IndexedParser<T>
