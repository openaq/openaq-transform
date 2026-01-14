import type { BBox } from "geojson";
import type { IndexedReaderOptions, Reader, ReaderOptions } from "./readers";
import type { IndexedParser, Parser } from "./parsers";
import type { ClientParameters } from "./metric";
import { Resource } from "../core/resource";
import { ResourceKeys } from "./resource";

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

export type IndexedClientReader<T> = Partial<Record<ResourceKeys, keyof T | Reader>>;

export function isIndexedClientReader<T>(value: unknown): value is IndexedClientReader<T> {

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const allowedKeys: ResourceKeys[] = ['measurements', 'locations', 'meta', 'flags', 'sensors'];
  const allowedKeysSet = new Set(allowedKeys);

  const objectKeys = Object.keys(value);

  if (objectKeys.length === 0) {
    return false;
  }

  // What is the validity of returning false here? At this point we know its an object with keys
  // and so if one of the keys is not in our set I think we should throw an error here instead of false
  // so that the client fails and explains why
  for (const key of objectKeys) {
    if (!allowedKeysSet.has(key as ResourceKeys)) {
      // change to custom error
      throw new Error(`${key} is a not a valid key for an indexed ClientReader`)
      return false;
    }
  }

  for (const key of objectKeys) {
    const val = (value as any)[key];
    if (typeof val === 'string') {
      continue;
    }
    if (typeof val === 'function') {
      // a function should have 2+ arguments or else its not valid
      // do we really need 2+ arguments, wouldnt it be ok if a custom reader ignored parser and data?
      // and what if it has more than 3? Should that throw an error?
      if(val.length < 2) {
        // change to custom error
        throw new Error('Client reader functions should have more 2 or more arguments')
      }
      continue;
    }
    return false;
  }

  return true;
}

export type IndexedClientParser<T> = Partial<Record<ResourceKeys, keyof T | Parser>>;

export function isIndexedClientParser<T>(value: unknown): value is IndexedClientParser<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const allowedKeys: ResourceKeys[] = ['measurements', 'locations', 'meta', 'flags', 'sensors'];
  const allowedKeysSet = new Set(allowedKeys);

  const objectKeys = Object.keys(value);

  if (objectKeys.length === 0) {
    return false;
  }

  for (const key of objectKeys) {
    if (!allowedKeysSet.has(key as ResourceKeys)) {
      return false;
    }
  }

  for (const key of objectKeys) {
    const val = (value as any)[key];
    if (typeof val === 'string') {
      continue;
    }
    if (typeof val === 'function' && val.length === 1) {
      continue;
    }
    return false;
  }

  return true;
}

// I think it would be clearer if IndexedClientReader was called IndexedReader
// then we have 'A ClientReader can be a key, a Reader, or an IndexedReader'
export type ClientReader<T> = keyof T | Reader | IndexedClientReader<T>

export type ClientParser<T> = keyof T | Parser | IndexedClientParser<T>
