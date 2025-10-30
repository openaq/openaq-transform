// apiReader.spec.js
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiReader } from './readers.ts'; // Adjust import path

// Mock server setup
const server = setupServer();

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

describe('apiReader', () => {
  const TEST_URL = 'https://api.example.com/data';

  describe('successful responses (200)', () => {
    it('should fetch and parse JSON data by default', async () => {
      const mockData = { id: 1, name: 'Test User' };

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiReader({
        resource: TEST_URL
      });

      expect(result).toEqual(mockData);
    });

    it('should fetch JSON when explicitly specified', async () => {
      const mockData = { message: 'Success' };

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        readAs: 'json'
      });

      expect(result).toEqual(mockData);
    });

    it('should fetch text when specified', async () => {
      const mockText = 'Plain text response';

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.text(mockText);
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        readAs: 'text'
      });

      expect(result).toBe(mockText);
    });

    it('should fetch blob when specified', async () => {
      const mockBinary = new Uint8Array([1, 2, 3, 4]);

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.arrayBuffer(mockBinary, {
            headers: {
              'Content-Type': 'application/octet-stream'
            }
          });
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        readAs: 'blob'
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(4);
    });

    it('should return raw response when specified', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json({ data: 'test' });
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        readAs: 'response'
      });

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
    });

    it('should auto-detect JSON content type', async () => {
      const mockData = { auto: 'detected' };

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json(mockData, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          });
        })
      );

      const result = await apiReader({
        resource: TEST_URL
      });

      expect(result).toEqual(mockData);
    });

    it('should auto-detect text content type', async () => {
      const mockText = 'Auto-detected text';

      server.use(
        http.get(TEST_URL, () => {
          return new HttpResponse(mockText, {
            headers: {
              'Content-Type': 'text/plain'
            }
          });
        })
      );

      const result = await apiReader({
        resource: TEST_URL
      });

      expect(result).toBe(mockText);
    });

    it('should handle content type with charset', async () => {
      const mockData = { charset: 'handled' };

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json(mockData, {
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          });
        })
      );

      const result = await apiReader({
        resource: TEST_URL
      });

      expect(result).toEqual(mockData);
    });

    it('should pass through fetch options', async () => {
      const mockData = { method: 'POST' };

      server.use(
        http.post(TEST_URL, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ ...mockData, received: body });
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        options: {
          method: 'POST',
          body: JSON.stringify({ test: 'data' }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      });

      expect(result).toHaveProperty('method', 'POST');
      expect(result).toHaveProperty('received.test', 'data');
    });

    it('should default to json for unknown readAs parameter', async () => {
      const mockData = { fallback: 'json' };

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        readAs: 'unknown'
      });

      expect(result).toEqual(mockData);
    });

    it.only('no content', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return new HttpResponse({ message: 'no data found' }, {
            status: 204,
          });
        })
      );

      const result = await apiReader({
        resource: TEST_URL
      });

      expect(result).toEqual(undefined);
    });
  });

  describe('error responses', () => {
    it('should throw error for 404 response', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return new HttpResponse(null, { status: 404, statusText: 'Not Found' });
        })
      );

      await expect(
        apiReader({ resource: TEST_URL })
      ).rejects.toThrow('Not Found');
    });

    it('should throw error for 500 response', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error'
          });
        })
      );

      await expect(
        apiReader({ resource: TEST_URL })
      ).rejects.toThrow('Internal Server Error');
    });

    it('should throw error for 403 response', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return new HttpResponse(null, {
            status: 403,
            statusText: 'Forbidden'
          });
        })
      );

      await expect(
        apiReader({ resource: TEST_URL })
      ).rejects.toThrow('Forbidden');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        apiReader({ resource: TEST_URL })
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty response body', async () => {
      server.use(
        http.get(TEST_URL, () => {
          return new HttpResponse('', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain'
            }
          });
        })
      );

      const result = await apiReader({
        resource: TEST_URL,
        readAs: 'text'
      });

      expect(result).toBe('');
    });

    it('should handle large JSON response', async () => {
      const largeData = Array(1000).fill(null).map((_, i) => ({
        id: i,
        value: `item_${i}`
      }));

      server.use(
        http.get(TEST_URL, () => {
          return HttpResponse.json(largeData);
        })
      );

      const result = await apiReader({
        resource: TEST_URL
      });

      expect(result).toHaveLength(1000);
      expect(result[0]).toHaveProperty('id', 0);
    });
  });
});
