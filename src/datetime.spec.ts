import { expect, test } from 'vitest';
import { Datetime } from './datetime';

test('', () => {
    const datetime = new Datetime('2025-01-01 00:00', {format: 'yyyy-MM-dd HH:mm', timezoneParse: 'UTC', timezoneOut: 'Africa/Banjul'})
    expect(datetime.toString()).toBe('2025-01-01T00:00:00.000+00:00');
});

test('', () => {
    const datetime = new Datetime('2025-01-01 00:00', {format: 'yyyy-MM-dd HH:mm', timezoneParse:'UTC',timezoneOut:  'America/Denver'})
    expect(datetime.toString()).toBe('2024-12-31T17:00:00.000-07:00');
});

test('', () => {
    expect(() => new Datetime('2025-01-01 00:00Z', { format: 'yyyy-MM-dd HH:mmZ', timezoneParse:'America/Denver',timezoneOut: 'America/Denver'})).toThrow(TypeError)
});

test('', () => {
    const datetime = new Datetime(1746736701)
    expect(datetime.toString()).toBe('2025-05-08T20:38:21.000Z');
});

test('', () => {
    const datetime = new Datetime(1746736701, {timezoneOut:'America/Denver'})
    expect(datetime.toString()).toBe('2025-05-08T14:38:21.000-06:00');
});


test('', () => {
    const datetime1 = new Datetime(1746736701)
    const datetime2 = new Datetime(1746736700)

    expect(datetime1.isGreaterThan(datetime2)).toBeTruthy();
});

test('', () => {
    const datetime1 = new Datetime(1746736701)
    const datetime2 = new Datetime(1746736700)

    expect(datetime2.isLessThan(datetime1)).toBeTruthy();
});