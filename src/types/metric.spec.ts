import { describe, expect, test } from "vitest";
import { isPathExpression } from "./metric";

describe('isPathExpression', () => {
  test('returns true for a valid jmespath PathExpression', () => {
    expect(isPathExpression({ type: 'jmespath', value: 'measurements.o3.value' })).toBe(true);
  });

  test('returns false for null', () => {
    expect(isPathExpression(null)).toBe(false);
  });

  test('returns false for a string', () => {
    expect(isPathExpression('jmespath')).toBe(false);
  });

  test('returns false when type is missing', () => {
    expect(isPathExpression({ value: 'measurements.o3.value' })).toBe(false);
  });

  test('returns false when value is missing', () => {
    expect(isPathExpression({ type: 'jmespath' })).toBe(false);
  });

  test('returns false when type is not a supported expression language', () => {
    expect(isPathExpression({ type: 'xpath', value: '/measurements/o3/value' })).toBe(false);
  });

  test('returns false when value is not a string', () => {
    expect(isPathExpression({ type: 'jmespath', value: 42 })).toBe(false);
  });

  test('returns false for a ConstantValue', () => {
    expect(isPathExpression({ type: 'constant', value: 'foo' })).toBe(false);
  });
});