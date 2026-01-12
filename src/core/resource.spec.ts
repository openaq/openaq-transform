import { expect, test } from 'vitest';
import { Resource } from './resource.ts';


test('resource with static parameters works', () => {
  const resource = new Resource({url:'https://example.com/locations/:locationsId', parameters: [
    { locationsId: 42 },
    { locationsId: 43 },
    { locationsId: 44 },
  ]});
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/locations/42' },
    { url: 'https://example.com/locations/43' },
    { url: 'https://example.com/locations/44' },
  ]);
});

test('resource with single static url works', () => {
  const resource = new Resource({url:'https://example.com/locations/2178'});
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/locations/2178' },
  ]);
});


test('resource with parameters function that returns static values works', () => {
  const resource = new Resource({ url:'https://example.com/locations/:locationsId', parameters:() => [{"locationsId": 42},{"locationsId": 43},{"locationsId": 44}]});
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/locations/42' },
    { url: 'https://example.com/locations/43' },
    { url: 'https://example.com/locations/44' },
  ]);
});


test('resource with dynamic function and data works', () => {
  const data = [{"locations": [{"locationsId": 42},{"locationsId": 43},{"locationsId": 44}]}]
  const parametersFunction = (d) => d[0].locations.map(o => o);
  const resource = new Resource({url:'https://example.com/locations/:locationsId', parameters: parametersFunction});
  resource.data = data;
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/locations/42' },
    { url: 'https://example.com/locations/43' },
    { url: 'https://example.com/locations/44' },
  ]);
});

test('resource with jmespath and data works', () => {
  const data = [{"locations": [{"locationsId": 42},{"locationsId": 43},{"locationsId": 44}]}]
  const resource = new Resource({ url:'https://example.com/locations/:locationsId', parameters: { type: 'jmespath', expression: '[0].locations'}});
  resource.data = data;
  const urls = resource.urls;
  expect(urls).toStrictEqual([
    { url: 'https://example.com/locations/42' },
    { url: 'https://example.com/locations/43' },
    { url: 'https://example.com/locations/44' },
  ]);
});
