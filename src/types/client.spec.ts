import { describe, expect, test } from "vitest";
import { isConstantValue, isIndexedParser, isIndexedReader, isStructuredKey } from "./client";

describe('isStructuredKey', () => {
  test('returns true for a valid StructuredKey', () => {
    expect(isStructuredKey({ type: 'jmespath', value: 'foo' })).toBe(true);
  });

  test('returns false for null', () => {
    expect(isStructuredKey(null)).toBe(false);
  });

  test('returns false for a string', () => {
    expect(isStructuredKey('string')).toBe(false);
  });

  test('returns false when type is missing', () => {
    expect(isStructuredKey({ value: 'foo' })).toBe(false);
  });

  test('returns false when value is missing', () => {
    expect(isStructuredKey({ type: 'jmespath' })).toBe(false);
  });
});

describe('isConstantValue', () => {
  test('returns true for a ConstantValue with a string value', () => {
    expect(isConstantValue({ type: 'constant', value: 'foo' })).toBe(true);
  });

  test('returns true for a ConstantValue with a number value', () => {
    expect(isConstantValue({ type: 'constant', value: 42 })).toBe(true);
  });

  test('returns false for null', () => {
    expect(isConstantValue(null)).toBe(false);
  });

  test('returns false for a string', () => {
    expect(isConstantValue('constant')).toBe(false);
  });

  test('returns false when type is missing', () => {
    expect(isConstantValue({ value: 'foo' })).toBe(false);
  });

  test('returns false when value is missing', () => {
    expect(isConstantValue({ type: 'constant' })).toBe(false);
  });

  test('returns false when type is a PathExpression', () => {
    expect(isConstantValue({ type: 'jmespath', value: 'foo' })).toBe(false);
  });
});

describe('isIndexedReader', () => {
  test('returns true for a valid IndexedReader', () => {
    expect(isIndexedReader({ measurements: 'api' })).toBe(true);
  });

  test('returns true for a valid IndexedReader with multiple keys', () => {
    expect(isIndexedReader({ measurements: 'api', locations: 'api' })).toBe(true);
  });

  test('returns false for null', () => {
    expect(isIndexedReader(null)).toBe(false);
  });

  test('returns false for a primitive', () => {
    expect(isIndexedReader('reader')).toBe(false);
  });

  test('returns false for an array', () => {
    expect(isIndexedReader([{ measurements: 'api' }])).toBe(false);
  });

  test('returns false for an empty object', () => {
    expect(isIndexedReader({})).toBe(false);
  });
});

describe('isIndexedParser', () => {
  test('returns true for a valid IndexedParser', () => {
    expect(isIndexedParser({ measurements: 'xml' })).toBe(true);
  });

  test('returns true for a valid IndexedParser with multiple keys', () => {
    expect(isIndexedParser({ measurements: 'xml', locations: 'json' })).toBe(true);
  });

  test('returns false for null', () => {
    expect(isIndexedParser(null)).toBe(false);
  });

  test('returns false for a primitive', () => {
    expect(isIndexedParser('parser')).toBe(false);
  });

  test('returns false for an array', () => {
    expect(isIndexedParser([{ measurements: 'xml' }])).toBe(false);
  });

  test('returns false for an empty object', () => {
    expect(isIndexedParser({})).toBe(false);
  });
});