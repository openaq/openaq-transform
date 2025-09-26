export interface DatetimeOptions {
  format?: string;
  timezone?: string;
  locationTimezone?: string;
}

export interface TimeOffset {
  minutes?: number;
  days?: number;
  hours?: number;
}


/* 
*
*/
export function isTimeOffset(obj: any): obj is TimeOffset {
  return obj && 
         typeof obj === 'object' && 
         !Array.isArray(obj) &&
         ('minutes' in obj || 'days' in obj || 'hours' in obj) &&
         (obj.minutes === undefined || typeof obj.minutes === 'number') &&
         (obj.days === undefined || typeof obj.days === 'number') &&
         (obj.hours === undefined || typeof obj.hours === 'number');
}