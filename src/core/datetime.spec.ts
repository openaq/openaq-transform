import { expect, test } from 'vitest';
import { Datetime } from './datetime';

test('ISO format parses correctly by default', () => {
    const datetime = new Datetime('2025-01-01T00:00:00-07:00')
    expect(datetime.toUTC()).toBe('2025-01-01T07:00:00Z');
});

test('datetime string, with no timezone parse correctly from UTC to UTC equivalent tiemzone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'UTC', locationTimezone: 'Africa/Banjul' })
    expect(datetime.toString()).toBe('2025-01-01T00:00:00+00:00');
});

test('UTC datetime correctly outputs to different timezone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'UTC', locationTimezone: 'America/Denver' })
    expect(datetime.toString()).toBe('2024-12-31T17:00:00-07:00');
});

test('Datetime correctly outputs to location timezone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'America/Denver', locationTimezone: 'America/Denver' })
    expect(datetime.toString()).toBe('2025-01-01T00:00:00-07:00');
});

test('Datetime correctly outputs to UTC timezone', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'America/Denver', locationTimezone: 'America/Denver' })
    expect(datetime.toUTC()).toBe('2025-01-01T07:00:00Z');
});

test('Local datetime correctly outputs to local timezone when locationTimezone not included', () => {
    const datetime = new Datetime('2025-01-01 00:00', { format: 'yyyy-MM-dd HH:mm', timezone: 'America/Denver' })
    expect(datetime.toString()).toBe('2025-01-01T00:00:00-07:00');
});

test('datetime string with Z correctly throws when timezone is also included', () => {
    expect(() => new Datetime('2025-01-01 00:00Z', { format: 'yyyy-MM-dd HH:mmZ', timezone: 'America/Denver', locationTimezone: 'America/Denver' })).toThrow(TypeError)
});

test('unix timestamp number (seconds) parses correctly', () => {
    const datetime = new Datetime(1746736701)
    expect(datetime.toString()).toBe('2025-05-08T20:38:21Z');
});

test('unix timestamp number (second) parses and is transformed to custom timezone', () => {
    const datetime = new Datetime(1746736701, { locationTimezone: 'America/Denver' })
    expect(datetime.toString()).toBe('2025-05-08T14:38:21-06:00');
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
