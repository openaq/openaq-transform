import type { BBox } from "geojson";
import type { IndexedReaderOptions, ReaderOptions } from "./readers";
import type { IndexedParser } from "./parsers";
import type { ClientParameters } from "./metric";
import { Resource } from "../core/resource";

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

export interface IndexedResource {
  measurements: Resource;
  locations?: Resource;
}



export interface IndexedFile {
  measurements: File;
  locations?: File;
}

export function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

export function isIndexed(resource: any): resource is IndexedResource | IndexedFile {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    !isFile(resource) &&
    !(resource instanceof Resource) &&
    'measurements' in resource
  );
}

export type IngestMatchingMethod = 'ingest-id' | 'source-spatial';

export interface ClientConfiguration {
  resource?: Resource | IndexedResource | File | IndexedFile;
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

export type ClientParser = string | Function | IndexedParser;

interface IndexedClientReader {
  measurements: string;
  locations?: string;
}

export type ClientReader = string | Function | IndexedClientReader;
