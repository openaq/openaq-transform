import { expect, test } from 'vitest';
import { Resource } from './resource.ts';

test('', () => {
  const resource = new Resource(
    'https://example.com',
    [
      { foo: 'bar', baz: 'boo' },
      { foo: 'bar', baz: 'boo' },
      { foo: 'bar', baz: 'boo' },
    ],
    ['this', 'that', 'other']
  );
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/this?foo=bar&baz=boo' },
    { url: 'https://example.com/that?foo=bar&baz=boo' },
    { url: 'https://example.com/other?foo=bar&baz=boo' },
  ]);
});


test('', () => {
  const resource = new Resource(
    'https://example.com',
    [
      { foo: 'bar', baz: 'boo' },
    ],
    ['this', 'that', 'other']
  );
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/this?foo=bar&baz=boo' },
    { url: 'https://example.com/that' },
    { url: 'https://example.com/other' },
  ]);
});