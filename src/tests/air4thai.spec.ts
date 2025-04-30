import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { Client } from '../client.ts';

import data from './fixtures/air4thai.json';

const handlers = [
  http.get('https://example.com/air4thai', async ({ request }) => {
    return HttpResponse.json(data);
  }),
];

const server = setupServer(...handlers);
server.listen();

interface Air4ThaiStation {
  stationID: string;
  nameTH: string;
  nameEN: string;
  areaTH: string;
  areaEN: string;
  stationType: string;
  lat: string;
  long: string;
  forecast: any[];
  AQILast: Aqilast;
}

interface Aqilast {
  date: string;
  time: string;

  PM25: Measurement;
  PM10: Measurement;
  O3: Measurement;
  CO: Measurement;
  NO2: Measurement;
  SO2: Measurement;
  AQI: Measurement;
}

interface Measurement {
  color_id: string;
  aqi: string;
  value: string;
}

interface Station {
  stationID: string;
  nameTH: string;
  nameEN: string;
  areaTH: string;
  areaEN: string;
  stationType: string;
  lat: string;
  long: string;
  forecast: any[];
  datetime?: string;
  value?: string;
  parameter?: string;
}

type ParameterKeys = 'PM25' | 'PM10' | 'O3' | 'NO2' | 'SO2' | 'AQI';

describe('Simple client example', () => {
  class Air4ThaiClient extends Client {
    async fetchData() {
      const res = await fetch(this.url!);
      const data = await res.json();
      const stations: Air4ThaiStation[] = data.stations;
      const flattenedStations: Station[] = [];

      stations.forEach((station) => {
        const { AQILast, ...locationAttributes } = station;

        if (AQILast) {
          const { date, time, ...parameters } = AQILast;
          const parameterKeys: ParameterKeys[] = Object.keys(
            parameters
          ) as ParameterKeys[];
          for (const parameter of parameterKeys) {
            if (parameters.hasOwnProperty(parameter)) {
              const parameterData = parameters[parameter];
              flattenedStations.push({
                ...locationAttributes,
                datetime: `${date} ${time}`,
                value: parameterData.value,
                parameter: parameter,
              });
            }
          }
        } else {
          flattenedStations.push(locationAttributes);
        }
      });
      return { measurements: flattenedStations };
    }
  }

  test('url is updated', async () => {
    const cln = new Air4ThaiClient({
      url: 'https://example.com/air4thai',
      locationIdKey: 'stationID',
      provider: 'air4thai',
      locationLabelKey: 'nameTH',
      xGeometryKey: 'long',
      yGeometryKey: 'lat',
      parameterNameKey: 'parameter',
      parameterValueKey: 'value',
      datetimeFormat: 'yyyy-MM-dd HH:mm',
      parameters: {
        PM25: { parameter: 'pm25', unit: 'ugm3' },
        PM10: { parameter: 'pm10', unit: 'ugm3' },
        O3: { parameter: 'O3', unit: 'ppm' },
      },
    });
    expect(cln.url).toBe('https://example.com/air4thai');
    const f = await cln.fetch();
    expect(f).toBe('');
  });
});
