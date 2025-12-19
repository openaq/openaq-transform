/**
 * Special Body type for Resource.
 * @remarks 
 * Extends standard BodyInit but removes the Blob type from the union.
 * Passed to the fetch API when making HTTP requests.
 */
export type Body = Exclude<BodyInit, Blob>;
