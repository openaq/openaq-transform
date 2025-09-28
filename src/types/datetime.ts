/**
 * Represents options for instantiating the Datetime class.
 *
 * @example
 * ```ts
 *
 * const options: DatetimeOptions = { 
 *     format: 'yyyy-MM-dd HH:mm', 
 *     timezone: 'UTC', 
 *     locationTimezone: 'Africa/Banjul' 
 * };
 * ```
 */
export interface DatetimeOptions {
  /**
   * The format of the timestamp string if the input was a string and a format was provided.
   * Follows the conventions set by Luxon: https://moment.github.io/luxon/#/parsing.
   */
  format?: string;
  /**
   * The IANA timezone identifier representing the timezone of the timestamp string
   * as it was interpreted during parsing. e.g.: 'UTC' or 'America/Denver'.
   */
  timezone?: string;
  /**
   * The IANA timezone identifier representing the timezone of the measurement location.
   * This defaults to `timezone` if not explicitly set, or 'UTC' if `input` was a number.
   */
  locationTimezone?: string;
}

/**
 * Represents a time offset with optional time units.
 *
 * @example
 * ```ts
 * // Offset by 30 minutes
 * const offset1: TimeOffset = { minutes: 30 };
 *
 * // Offset by 2 days and 3 hours
 * const offset2: TimeOffset = { days: 2, hours: 3 };
 *
 * // Offset by 1 hour and 45 minutes
 * const offset3: TimeOffset = { hours: 1, minutes: 45 };
 * ```
 */
export interface TimeOffset {
  /** The number of minutes to offset */
  minutes?: number;
  /** The number of days to offset */
  days?: number;
  /** The number of hours to offset */
  hours?: number;
}

/**
 * Type guard function that checks if an object is a valid TimeOffset.
 *
 * Validates that the object:
 * - Is a non-null object (not an array)
 * - Has at least one of the TimeOffset properties (minutes, days, hours)
 * - All present properties are numbers or undefined
 *
 * @param obj - The value to check
 * @returns `true` if the object is a valid TimeOffset, `false` otherwise
 *
 * @example
 * ```ts
 * // Valid TimeOffset objects
 * isTimeOffset({ minutes: 30 }); // true
 * isTimeOffset({ days: 2, hours: 3 }); // true
 * isTimeOffset({ hours: 1, minutes: 45, days: 0 }); // true
 *
 * // Invalid objects
 * isTimeOffset(null); // false
 * isTimeOffset({}); // false (no TimeOffset properties)
 * isTimeOffset({ minutes: "30" }); // false (string instead of number)
 * isTimeOffset([{ minutes: 30 }]); // false (array)
 * isTimeOffset({ seconds: 30 }); // false (invalid property)
 * ```
 */
export function isTimeOffset(obj: any): obj is TimeOffset {
  return (
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    ('minutes' in obj || 'days' in obj || 'hours' in obj) &&
    (obj.minutes === undefined || typeof obj.minutes === 'number') &&
    (obj.days === undefined || typeof obj.days === 'number') &&
    (obj.hours === undefined || typeof obj.hours === 'number')
  );
}
