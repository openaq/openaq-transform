import { expect, test } from 'vitest';
import { Datetime } from './datetime';

test('constructor throws when no input', () => {
    expect(() => new Datetime('')).toThrow(TypeError);
})

test('constructor throws when Date with no timezone provided', () => {
    expect(() => new Datetime(new Date())).toThrow(TypeError);
})

test('constructor throws when Date is in the future', () => {
    expect(() => new Datetime('2099-01-01')).toThrow(RangeError);
    expect(() => new Datetime(new Date('2099-01-01'), {timezone: 'America/Lima'})).toThrow(RangeError);
})

test('constructor throws when Date/time is in the future', () => {
  const ftime = new Date(Date.now() + 10000).toISOString()
  // console.debug(ftime)
  expect(() => new Datetime(ftime)).toThrow(RangeError);
})

test('constructor throws when Date/time with timezone is in the future', () => {
  const ftime = new Date(Date.now() + 1000).toISOString()
  console.log(ftime, new Date(ftime))
  //console.log(new Datetime(ftime, {timezone: 'America/Lima'}).toString())
  expect(() => new Datetime(ftime, {timezone: 'America/Lima'})).toThrow(RangeError);
  expect(() => new Datetime(new Date(ftime), {timezone: 'America/Lima'})).toThrow(RangeError);
})

test('parseDate throws when invalid string passed', () => {
    expect(() => new Datetime('2025-01-01T25:00:00Z')).toThrow(TypeError);
})

test('Date input outputs correctly to set timezone', () => {
    const date = new Date(2025,0,1,0,0,0);
    const datetime = new Datetime(date, {timezone: 'America/Lima'})
    expect(datetime.toUTC()).toBe('2025-01-01T05:00:00Z')
    expect(datetime.toLocal()).toBe('2025-01-01T00:00:00-05:00')
})

test('ISO format parses correctly by default', () => {
    const datetime = new Datetime('2025-01-01T00:00:00-05:00')
    expect(datetime.toUTC()).toBe('2025-01-01T05:00:00Z');
    expect(datetime.toLocal()).toBe('2025-01-01T00:00:00-05:00');
});

test('datetime string, with no timezone parse correctly from UTC to UTC equivalent tiemzone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'UTC', locationTimezone: 'Africa/Banjul' })
    expect(datetime.toLocal()).toBe('2025-01-01T00:00:00+00:00');
});

test('UTC datetime correctly outputs to different timezone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'UTC', locationTimezone: 'America/Denver' })
    expect(datetime.toLocal()).toBe('2024-12-31T17:00:00-07:00');
});

test('Datetime correctly outputs to location timezone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'America/Denver', locationTimezone: 'America/Denver' })
    expect(datetime.toLocal()).toBe('2025-01-01T00:00:00-07:00');
});

test('Datetime correctly outputs to UTC timezone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'America/Denver', locationTimezone: 'America/Denver' })
    expect(datetime.toUTC()).toBe('2025-01-01T07:00:00Z');
});

test('Local datetime correctly outputs to local timezone when locationTimezone not included', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'America/Denver' })
    expect(datetime.toLocal()).toBe('2025-01-01T00:00:00-07:00');
});

test('datetime string with Z correctly throws when timezone is also included', () => {
    expect(() => new Datetime('2025-01-01 00:00Z', { format: 'yyyy-MM-dd HH:mmZ', timezone: 'America/Denver', locationTimezone: 'America/Denver' })).toThrow(TypeError)
});

test('Datetime string with Z correctly parses and adds timezone offset when format is provided', () => {
    const datetime = new Datetime('2025-01-01T00:00:00-05:00', { format: "yyyy-MM-dd'T'HH:mm:ssZZ" })
    expect(datetime.toUTC()).toBe('2025-01-01T05:00:00Z');
    expect(datetime.toLocal()).toBe('2025-01-01T00:00:00-05:00');
});


test('unix timestamp number (seconds) parses correctly', () => {
    const datetime = new Datetime(1746736701)
    expect(datetime.toUTC()).toBe('2025-05-08T20:38:21Z');
    expect(datetime.toLocal()).toBe('2025-05-08T20:38:21Z');
});

test('unix timestamp number (second) parses and is transformed to custom timezone', () => {
    const datetime = new Datetime(1746736701, { locationTimezone: 'America/Denver' })
    expect(datetime.toUTC()).toBe('2025-05-08T20:38:21Z');
    expect(datetime.toLocal()).toBe('2025-05-08T14:38:21-06:00');
});

test('isGreaterThan works', () => {
    const datetime1 = new Datetime(1746736701)
    const datetime2 = new Datetime(1746736700)
    expect(datetime1.isGreaterThan(datetime2)).toBeTruthy();
});

test('isLessThan works', () => {
    const datetime1 = new Datetime(1746736701)
    const datetime2 = new Datetime(1746736700)
    expect(datetime2.isLessThan(datetime1)).toBeTruthy();
});

test('lesserOf works', () => {
    const datetime1 = new Datetime(1746736701);
    const datetime2 = new Datetime(1746736700);
    expect(datetime2.lesserOf(datetime1)).toEqual(datetime2);
});

test('lesserOf works when values equal', () => {
    const datetime1 = new Datetime(1746736700);
    const datetime2 = new Datetime(1746736700);
    expect(datetime2.lesserOf(datetime1)).toEqual(datetime2);
});

test('greaterOf works when values equal', () => {
    const datetime1 = new Datetime(1746736700);
    const datetime2 = new Datetime(1746736700);
    expect(datetime1.greaterOf(datetime2)).toEqual(datetime1);
})

test('toDate works', () => {
    const datetime = new Datetime('2025-01-01T00:00:00-07:00')
    const date = new Date('2025-01-01T00:00:00-07:00')
    expect(datetime.toDate()).toStrictEqual(date)
})

test('toDate works with Date input', () => {
    const date = new Date(2025,0,1,0,0,0);
    const datetime = new Datetime(date, {timezone: 'America/Lima'})
    const d = new Date('2025-01-01T05:00:00Z')
    expect(datetime.toDate()).toStrictEqual(d)
})
