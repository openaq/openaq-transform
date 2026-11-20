/** A value, or a function that returns it when needed. */
export type Lazy<T> = T | (() => T);
