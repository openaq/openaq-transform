import { describe, expect, test } from "vitest";

import {isTimeOffset} from './datetime';

describe('isTimeOffset', () => {
  test('returns true for a TimeOffset with minutes', () => {
    expect(isTimeOffset({ minutes: 42 })).toBe(true);
  });

  test('returns true for a TimeOffset with days', () => {
    expect(isTimeOffset({ days: 2 })).toBe(true);
  });

  test('returns true for a TimeOffset with hours', () => {
    expect(isTimeOffset({ hours: 1 })).toBe(true);
  });

  test('returns true for a TimeOffset with multiple properties', () => {
    expect(isTimeOffset({ days: 2, hours: 3, minutes: 42 })).toBe(true);
  });

  test('returns true for a TimeOffset with zero values', () => {
    expect(isTimeOffset({ hours: 0, minutes: 0 })).toBe(true);
  });

  test('returns false for null', () => {
    expect(isTimeOffset(null)).toBe(false);
  });

  test('returns false for a primitive', () => {
    expect(isTimeOffset(30)).toBe(false);
  });

  test('returns false for an array', () => {
    expect(isTimeOffset([{ minutes: 30 }])).toBe(false);
  });

  test('returns false for an empty object', () => {
    expect(isTimeOffset({})).toBe(false);
  });

  test('returns false when no valid TimeOffset properties are present', () => {
    expect(isTimeOffset({ seconds: 30 })).toBe(false);
  });

  test('returns false when minutes is a string', () => {
    expect(isTimeOffset({ minutes: '30' })).toBe(false);
  });

  test('returns false when days is a string', () => {
    expect(isTimeOffset({ days: '2' })).toBe(false);
  });

  test('returns false when hours is a string', () => {
    expect(isTimeOffset({ hours: '1' })).toBe(false);
  });
});

