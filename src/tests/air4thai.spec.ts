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

type ParameterKeys = 'PM25' | 'PM10' | 'O3' | 'NO2' | 'SO2' | 'AQI';


const expectedOutput = {
  meta: {
    matching_method: "ingest-id",
    schema: "v0.1",
    source: "air4thai",
  },
  locations: [
    {
      location_id: 'air4thai-02t',
      site_id: '02t',
      site_name: 'มหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา',
      coordinates: {
        latitude: 13.732846,
        longitude: 100.487662,
        proj: 'EPSG:4326',
      },
      ismobile: false,
      systems: [
        {
          system_id: 'air4thai-02t',
          manufacturer_name: 'default',
          model_name: 'default',
          sensors: [
            {
              sensor_id: 'air4thai-02t-pm25',
              parameter: 'pm25',
              units: 'ug/m3',
              averaging_interval_secs: 3600,
              logging_interval_secs: 3600,
              flags: [],
            },
            {
              sensor_id: 'air4thai-02t-pm10',
              parameter: 'pm10',
              units: 'ug/m3',
              averaging_interval_secs: 3600,
              logging_interval_secs: 3600,
              flags: [],
            },
            {
              sensor_id: 'air4thai-02t-o3',
              parameter: 'o3',
              units: 'ppm',
              averaging_interval_secs: 3600,
              logging_interval_secs: 3600,
              flags: [],
            },
          ]
        },
      ],
    }
  ],
  measurements: [
    {
      sensor_id: 'air4thai-02t-pm25',
      timestamp: '2025-04-30T01:00:00+07:00',
      value: 22.9,
    },
    {
      sensor_id: 'air4thai-02t-pm10',
      timestamp: '2025-04-30T01:00:00+07:00',
      value: -1,
    },
    {
      sensor_id: 'air4thai-02t-o3',
      timestamp: '2025-04-30T01:00:00+07:00',
      value: -1,
    }
  ]
};


describe('Simple client example', () => {


  class Air4ThaiClient extends Client {
      url = 'https://example.com/air4thai'
      averagingIntervalKey = () => 3600;
      isMobileKey = () => false;
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
        PM25: { parameter: 'pm25', unit: 'ug/m3' },
        PM10: { parameter: 'pm10', unit: 'ug/m3' },
        O3: { parameter: 'o3', unit: 'ppm' },
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
          const parameterKeys: ParameterKeys[] = Object.keys(
            parameters) as ParameterKeys[] ;
          for (const parameter of parameterKeys) {
            if (parameters.hasOwnProperty(parameter)) {
              const parameterData = parameters[parameter];
              flattenedStationMeasurements.push({
                ...locationAttributes,
                datetime: `${date} ${time}`,
                value: parameterData.value*1,
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

    test('builds correct format', async () => {
        const cln = new Air4ThaiClient();
        cln.configure({ url: 'https://example.com/air4thai/02t'});
        const data = await cln.fetch();
        expect(data).toStrictEqual(expectedOutput);
    });

    test.only('handles all the data', async () => {
        const cln = new Air4ThaiClient();
        expect(cln.url).toBe('https://example.com/air4thai');
        const f = await cln.fetch();
        expect(f.locations.length).toBe(187)
        expect(f.measurements.length).toBe(559)
    });

});
