import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import fs from 'fs/promises';
import { Client } from '../client.ts';
import { parse } from 'csv-parse/sync';


const handlers = [
  http.get('https://example.com/eea', async ({ request }) => {
    const data = await fs.readFile('src/tests/fixtures/eea.csv');
    return new HttpResponse(data.toString(), {
        status: 200,
        headers: {
           'Content-Type': 'text/csv',
        }
        
      })
  }),
];

const server = setupServer(...handlers);
server.listen();

describe('Simple client example', () => {
  class EeaClient extends Client {
    async fetchData() {
      const res = await fetch(this.url!);
      const data = await res.text();
      const records = parse(data, {
        columns: true,
        skip_empty_lines: true
      });
      return {measurements: records}
    }
  }

  test('url is updated', async () => {
    const cln = new EeaClient({
      url: 'https://example.com/eea',
      locationIdKey: 'STATIONCODE',
      provider: 'eea',
      locationLabelKey: 'STATIONNAME',
      xGeometryKey: 'LONGITUDE',
      yGeometryKey: 'LATITUDE',
      geometryProjectionKey: (d) => "EPSG:3857",
      parameterNameKey: 'PROPERTY',
      parameterValueKey: 'VALUE_NUMERIC',
      datetimeKey: "DATETIME_END",
      datetimeFormat: 'yyyyMMddHHmmss',
      longFormat: true,
      parameters: {
        NO2: { parameter: 'no2', unit: 'ugm3' },
      },
    });
    expect(cln.url).toBe('https://example.com/eea');
    const f = await cln.fetch();
    expect(f).toBe('');
  });
});
