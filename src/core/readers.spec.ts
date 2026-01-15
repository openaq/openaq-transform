import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiReader } from './readers';
import { Resource } from './resource';

// Sample test data
const sampleData = [
  { id: 1, name: 'Station A', temperature: 20.5 },
  { id: 2, name: 'Station B', temperature: 22.3 },
  { id: 3, name: 'Station C', temperature: 19.8 },
];

const objectData = {
  stations: [
    { id: 1, name: 'Station A'},
    { id: 2, name: 'Station B'},
    { id: 3, name: 'Station C'},
  ],
  measurements: [
    { id: 1, temperature: 20.5 },
    { id: 2, temperature: 22.3 },
    { id: 3, temperature: 19.8 },
  ]
}

// Mock server setup
const handlers = [
  // endpoint that returns simple array (array)
  http.get('https://api.test.com/stations', async () => {
    return HttpResponse.json(sampleData);
  }),
  // endpoint that returns object with arrays (object)
  http.get('https://api.test.com/objects', async () => {
    return HttpResponse.json(objectData);
  }),
  // api that returns one page of data at a time (array)
  http.get('https://api.test.com/data', async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    if (page === '1') {
      return HttpResponse.json(sampleData.slice(0,2));
    } else if (page === '2') {
      return HttpResponse.json(sampleData.slice(2));
    }
    return HttpResponse.json([]);
  }),
  // api that returns one station object at a time (object)
  http.get('https://api.test.com/stations/:station', async ({ params }) => {
    const { station } = params;
    if (station === 'A') {
      return HttpResponse.json(objectData.stations[0]);
    } else if (station === 'B') {
      return HttpResponse.json(objectData.stations[1]);
    } else if (station === 'C') {
      return HttpResponse.json(objectData.stations[2]);
    }
  }),
  // this is a weird edge case I think
  http.get('https://api.test.com/pagedobjects', async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    if (page === '1') {
      return HttpResponse.json({
        stations: objectData.stations.slice(0,2),
        measurements: objectData.measurements.slice(0,2)
      });
    } else if (page === '2') {
      return HttpResponse.json({
        stations: objectData.stations.slice(2),
        measurements: objectData.measurements.slice(2)
      });
    }
    return HttpResponse.json([]);
  }),
];

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

describe('apiReader', () => {
  test('fetches and parses JSON data from a simple endpoint', async () => {
    // Create a resource pointing to our mock endpoint
    const resource = new Resource({ url: 'https://api.test.com/stations' });

    // Call the apiReader
    const result = await apiReader(
      { resource, readAs: 'json' },
      async ({ content }: any) => content,
      {}
    );

    // Verify the result
    expect(result as any).toEqual(sampleData);
  });

  test('auto-detects JSON content type when readAs is not specified', async () => {
    const resource = new Resource({ url: 'https://api.test.com/stations' });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    expect(result as any).toEqual(sampleData);
  });


  test('paginated endpoint with multiple URLs that each return arrays should flatten into single array', async () => {
    // Create a resource with URL template and parameters
    const resource = new Resource({
      url: 'https://api.test.com/data?page=:page',
      parameters: [{ page: 1 }, { page: 2 }]
    });

    // Parser just passes content through
    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Expect content to be a flattened array of all items from both pages
    expect(result as any).toEqual(sampleData);
  });

  test('multiple station URLs that each return an object should return array of objects', async () => {
    // Create a resource with URL template and parameters for different stations
    const resource = new Resource({
      url: 'https://api.test.com/stations/:station',
      parameters: [{ station: 'A' }, { station: 'B' }, { station: 'C' }]
    });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Expect content to be an array of station objects
    expect(result as any).toEqual(objectData.stations);

  });

  test('endpoint that returns object remains an object', async () => {
    const resource = new Resource({ url: 'https://api.test.com/objects' });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    expect(result as any).toEqual(objectData);

  });

  test('endpoint that returns paginated object remains an object', async () => {
    // this one might be overkill becaause I doubt we would run into this issue very often
    const resource = new Resource({
      url: 'https://api.test.com/pagedobjects?page=:page',
      parameters: [{ page: 1 }, { page: 2 }]
    });


    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Expect content to be an array of station objects
    expect(result as any).toEqual(objectData);

  });


});
