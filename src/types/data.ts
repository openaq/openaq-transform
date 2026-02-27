import type { ResourceKeys } from "./resource";

export type SourceRecord = Record<string, unknown>;
export type ResourceData = Partial<Record<ResourceKeys, SourceRecord[]>>;
