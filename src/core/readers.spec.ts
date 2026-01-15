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
  // endpoints for error handling tests
  http.get('https://api.test.com/error-data', async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    if (page === '1') {
      return HttpResponse.json(sampleData.slice(0, 2));
    } else if (page === '2') {
      // Return an error status
      return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
    } else if (page === '3') {
      return HttpResponse.json(sampleData.slice(2));
    }
    return HttpResponse.json([]);
  }),
  // endpoint that returns invalid JSON to trigger parse error
  http.get('https://api.test.com/parse-error-data', async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    if (page === '1') {
      return HttpResponse.json(sampleData.slice(0, 2));
    } else if (page === '2') {
      // Return valid data that will cause parser to throw
      return HttpResponse.json(sampleData.slice(2));
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
      { resource },
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
      parameters: [{ page: 1 }, { page: 2 }],
      output: 'array'
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
    // Default behavior (no output): multiple URLs return array of responses
    const resource = new Resource({
      url: 'https://api.test.com/stations/:station',
      parameters: [{ station: 'A' }, { station: 'B' }, { station: 'C' }]
    });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Default: multiple URLs return array of their responses
    expect(result as any).toEqual(objectData.stations);

  });

  test('endpoint that returns object remains an object', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/objects',
      output: 'object'
    });

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
      parameters: [{ page: 1 }, { page: 2 }],
      output: 'object'
    });


    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Expect content to be an array of station objects
    expect(result as any).toEqual(objectData);

  });

  test('non-strict mode (default) continues on error and collects errors', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/error-data?page=:page',
      parameters: [{ page: 1 }, { page: 2 }, { page: 3 }],
      output: 'array',
      strict: false // explicit, though this is the default
    });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Should have data from page 1 and page 3 (page 2 failed)
    expect(result).toEqual([
      ...sampleData.slice(0, 2), // page 1
      ...sampleData.slice(2)      // page 3
    ]);

    // Errors are stored on the resource
    expect(resource.hasErrors).toBe(true);
    expect(resource.errors).toHaveLength(1);
    expect(resource.errors[0]).toHaveProperty('url');
    expect(resource.errors[0]).toHaveProperty('error');
    expect(resource.errors[0].url).toContain('page=2');
  });

  test('strict mode throws on first error', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/error-data?page=:page',
      parameters: [{ page: 1 }, { page: 2 }, { page: 3 }],
      output: 'array',
      strict: true
    });

    await expect(async () => {
      await apiReader(
        { resource },
        async ({ content }: any) => content,
        {}
      );
    }).rejects.toThrow();
  });

  test('distinguishes between fetch errors and parse errors', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/parse-error-data?page=:page',
      parameters: [{ page: 1 }, { page: 2 }],
      output: 'array',
      strict: false
    });

    // Parser that throws on page 2
    const result = await apiReader(
      { resource },
      async ({ content }: any) => {
        if (Array.isArray(content) && content.length > 0 && content[0].id === 3) {
          throw new Error('Parser failed to process data');
        }
        return content;
      },
      {}
    );

    // Should have data from page 1 only (page 2 had parse error)
    expect(result).toEqual(sampleData.slice(0, 2));

    // Should have one parse error
    expect(resource.hasErrors).toBe(true);
    expect(resource.errors).toHaveLength(1);
    expect(resource.errors[0].type).toBe('parse');
    expect(resource.errors[0].url).toContain('page=2');
    expect(resource.errors[0].error).toContain('Parser failed');
  });

  test('fetch errors include status code', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/error-data?page=:page',
      parameters: [{ page: 1 }, { page: 2 }],
      output: 'array',
      strict: false
    });

    await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // Should have one fetch error with status code
    expect(resource.hasErrors).toBe(true);
    expect(resource.errors).toHaveLength(1);
    expect(resource.errors[0].type).toBe('fetch');
    expect(resource.errors[0].statusCode).toBe(500);
  });

  test('default behavior (no output): single URL returns response directly', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/objects'
    });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // With no output specified, single URL returns the response directly
    expect(result).toEqual(objectData);
  });

  test('default behavior (no output): multiple URLs return array of responses', async () => {
    const resource = new Resource({
      url: 'https://api.test.com/data?page=:page',
      parameters: [{ page: 1 }, { page: 2 }]
      // No output specified - should return array of responses
    });

    const result = await apiReader(
      { resource },
      async ({ content }: any) => content,
      {}
    );

    // With no output specified, multiple URLs return array of their responses
    // Each response is an array, so we get an array of arrays
    expect(result).toEqual([
      sampleData.slice(0, 2), // page 1 response
      sampleData.slice(2)     // page 2 response
    ]);
  });


});
