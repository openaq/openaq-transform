import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { Client } from '../client.ts';

import data from './fixtures/air4thai.json';

const handlers = [
  // return just the one so we can check result for formating errors
  http.get('https://example.com/air4thai/02t', async ({ request }) => {
    const d = { stations: [ data.stations.find(s => s.stationID === '02t')] }
    return HttpResponse.json(d);
  }),
  // return a larger set so we can check summary stats at the end
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

interface StationMeasurement {
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

//type ParameterKeys = 'PM25' | 'PM10' | 'O3' | 'NO2' | 'SO2' | 'AQI';

describe.only('Simple client example', () => {


  class Air4ThaiClient extends Client {
      url = 'https://example.com/air4thai'
      longFormat = true
      locationIdKey = 'stationID'
      provider = 'air4thai'
      locationLabelKey = 'nameTH'
      xGeometryKey = 'long'
      yGeometryKey = 'lat'
      parameterNameKey = 'parameter'
      parameterValueKey = 'value'
      datetimeFormat = 'yyyy-MM-dd HH:mm'
      parameters = {
        PM25: { parameter: 'pm25', unit: 'ugm3' },
        PM10: { parameter: 'pm10', unit: 'ugm3' },
        O3: { parameter: 'O3', unit: 'ppm' },
      }

    async fetchData() {
      const res = await fetch(this.url!);

      const data = await res.json();
      const stations: Air4ThaiStation[] = data.stations;
      const flattenedStationMeasurements: StationMeasurement[] = [];

      stations.forEach((station) => {

        const { AQILast, ...locationAttributes } = station;

        if (AQILast) {
          const { date, time, ...parameters } = AQILast;
          for (const parameter of Object.keys(this.parameters)) {
            if (parameters.hasOwnProperty(parameter)) {
              const parameterData = parameters[parameter];
              flattenedStationMeasurements.push({
                ...locationAttributes,
                datetime: `${date} ${time}`,
                value: parameterData.value,
                parameter: parameter,
              });
            }
          }
        } else {
          flattenedStationMeasurements.push(locationAttributes);
        }
      });
      return { measurements: flattenedStationMeasurements };
    }
  }

  test.only('builds correct format', async () => {
    const cln = new Air4ThaiClient();
    cln.configure({ url: 'https://example.com/air4thai/02t'});
    const f = await cln.fetch();
    expect(f).toBe('');
  });

  test('handles all the data', async () => {
    const cln = new Air4ThaiClient();
    expect(cln.url).toBe('https://example.com/air4thai');
    const f = await cln.fetch();
    expect(f).toBe('');
  });

});
