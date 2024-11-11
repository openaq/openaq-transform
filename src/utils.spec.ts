import { expect, test } from 'vitest';
import { cleanKey } from './utils.ts';

test('cleanKey replaces only if value is truthy', () => {
  expect(cleanKey('')).toBe('');
});

test('cleanKey removes leading and trailing whitespace', () => {
  expect(cleanKey(' foobar ')).toBe('foobar');
});

test('cleanKey replaces internal spaces with underscore', () => {
  expect(cleanKey('foo bar')).toBe('foo_bar');
});

test('cleanKey removes non-word characters', () => {
  expect(cleanKey('$foo#bar^')).toBe('foobar');
});

test('cleanKey changes string to lowercase', () => {
  expect(cleanKey('FOOBAR')).toBe('foobar');
});
