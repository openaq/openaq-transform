
export const RESOURCE_KEYS = ['measurements', 'locations', 'meta', 'flags', 'sensors'] as const;

export type ResourceKeys = typeof RESOURCE_KEYS[number];

/**
 * Special Body type for Resource.
 * @remarks 
 * Extends standard BodyInit but removes the Blob type from the union.
 * Passed to the fetch API when making HTTP requests.
 */
export type Body = Exclude<BodyInit, Blob>;
