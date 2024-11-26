import { describe, test, expect, beforeAll } from 'vitest';
import { http, HttpResponse, rest } from 'msw';
import { setupServer } from 'msw/node';
import dayjs from 'dayjs'

import { Client } from './client.ts'

// mock server
const handlers = [
  http.get("https://blah.org/wide", async ({ request }) => {
    return HttpResponse.json({
        locations: [{ station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121, averaging: 3600 }],
        measurements: [{ station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', particulate_matter_25: 10, tempf: 80 }]
    });
  }),
  http.get("https://blah.org/long", async ({ request }) => {
    return HttpResponse.json({
        locations: [{ station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121, averaging: 3600 }],
        measurements: [
            { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', parameter: 'particulate_matter_25', value: 10 },
            { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', parameter: 'tempf', value: 80 },
        ]
    });
  }),
  http.get("https://blah.org/withsensors", async ({ request }) => {
    return HttpResponse.json({
        locations: [{ station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121, averaging: 3600 }],
        sensors: [
            { station: 'ts1', parameter: 'particulate_matter_25'},
            { station: 'ts1', parameter: 'tempf'},
        ],
        measurements: [
            { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', parameter: 'particulate_matter_25', value: 10 },
            { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', parameter: 'tempf', value: 80 },
        ]
    });
  }),
];

const server = setupServer(...handlers);
server.listen()

const expectedOutput = {
    meta: {
        matching_method: "ingest-id",
        schema: "v0.1",
        source: "testing",
    },
    locations: [
        {
            location_id: 'testing-ts1',
            site_id: 'ts1',
            site_name: 'test site #1',
            coordinates: {
                lat: 45.56665,
                lon: -123.12121,
                proj: 'WSG84',
            },
            ismobile: false,
            systems: [
                {
                    system_id: 'testing-ts1',
                    manufacturer_name: 'default',
                    model_name: 'default',
                    sensors: [
                        {
                            sensor_id: 'testing-ts1-pm25',
                            parameter: 'pm25',
                            units: 'ug/m3',
                            averaging_interval_secs: 3600,
                            logging_interval_secs: 3600,
                            status: 'asdf',
                            flags: [],
                        },
                        {
                            sensor_id: 'testing-ts1-temperature',
                            parameter: 'temperature',
                            units: 'f',
                            averaging_interval_secs: 3600,
                            logging_interval_secs: 3600,
                            status: 'asdf',
                            flags: [],
                        },
                    ]
                },
            ],
        }
    ],
    measures: [
        {
            sensor_id: 'testing-ts1-pm25',
            timestamp: '2024-01-01T00:00:00-08:00',
            value: 10,
        },
        {
            sensor_id: 'testing-ts1-temperature',
            timestamp: '2024-01-01T00:00:00-08:00',
            value: 80,
        }
    ]
};

describe('Client with data in wide format', () => {

    class JsonClient extends Client{
        url = 'https://blah.org/wide';
        provider = 'testing';
        // mapping data
        longitudeKey = 'longitude';
        averagingIntervalKey = 'averaging';
        sensorStatusKey = (d) => 'asdf'
        latitudeKey = 'latitude';
        locationIdKey = 'station';
        locationLabelKey = 'site_name';
        projectionKey = (d) => 'WSG84';
        ownerKey = (d) => 'test_owner';
        isMobileKey = (d) => false;
        parameters = {
            pm25: ["particulate_matter_25","ug/m3"],
            temperature: ["tempf", "f"],
        }
    }

    test('Url check', () => {
        const cln = new JsonClient()
        expect(cln.url).toBe('https://blah.org/wide');
    });

    test('outputs correct format', async () => {
        const cln = new JsonClient()
        const data = await cln.fetch();
        expect(data).toStrictEqual(expectedOutput);
    })

    test.todo('missing averaging interval throws error')
    test.todo('parameter mismatch throws error')
    test.todo('status mismatch throws error')

})

describe('Client with data in long format', () => {

    class JsonClient extends Client{
        url = 'https://blah.org/long';
        provider = 'testing';
        // mapping data
        longFormat = true;
        longitudeKey = 'longitude';
        latitudeKey = 'latitude';
        averagingIntervalKey = 'averaging';
        sensorStatusKey = (d) => 'asdf'
        locationIdKey = 'station';
        locationLabelKey = 'site_name';
        projectionKey = (d) => 'WSG84';
        ownerKey = (d) => 'test_owner';
        isMobileKey = (d) => false;
        parameters = {
            pm25: ["particulate_matter_25","ug/m3"],
            temperature: ["tempf", "f"],
        }
    }

    test('outputs correct format', async () => {
        const cln = new JsonClient()
        const data = await cln.fetch();
        expect(data).toStrictEqual(expectedOutput);
    })

})


describe('Provider that passes sensor data', () => {

    class JsonClient extends Client{
        url = 'https://blah.org/withsensors';
        provider = 'testing';
        // mapping data
        longFormat = true;
        longitudeKey = 'longitude';
        latitudeKey = 'latitude';
        averagingIntervalKey = 'averaging';
        sensorStatusKey = (d) => 'asdf'
        locationIdKey = 'station';
        locationLabelKey = 'site_name';
        projectionKey = (d) => 'WSG84';
        ownerKey = (d) => 'test_owner';
        isMobileKey = (d) => false;
        parameters = {
            pm25: ["particulate_matter_25","ug/m3"],
            temperature: ["tempf", "f"],
        }
    }

    test('outputs correct format', async () => {
        const cln = new JsonClient()
        const data = await cln.fetch();
        expect(data).toStrictEqual(expectedOutput);
    })

})

describe('Dynamic adapter that gets mapping from initial config', () => {

    class JsonClient extends Client{
        url = 'https://blah.org/withsensors';
        provider = 'testing';
        longFormat = true;
        parameters = {
            pm25: ["particulate_matter_25","ug/m3"],
            temperature: ["tempf", "f"],
        }
    }


    test('outputs correct format', async () => {
        const cln = new JsonClient({
            longitudeKey: 'longitude',
            latitudeKey: 'latitude',
            averagingIntervalKey: 'averaging',
            sensorStatusKey: (d) => 'asdf',
            locationIdKey: 'station',
            locationLabelKey: 'site_name',
            projectionKey: (d) => 'WSG84',
            ownerKey: (d) => 'test_owner',
            isMobileKey: (d) => false,
        })
        const data = await cln.fetch();
        expect(data).toStrictEqual(expectedOutput);
    })

});

describe('Dynamic adapter that gets mapping from delayed configure', () => {

    class JsonClient extends Client{
        url = 'https://blah.org/withsensors';
        provider = 'testing';
        longFormat = true;
        parameters = {
            pm25: ["particulate_matter_25","ug/m3"],
            temperature: ["tempf", "f"],
        }
    }


    test('outputs correct format', async () => {
        const cln = new JsonClient()
        // Do some other things for whatever reasone
        // configure by passing a map
        cln.configure({
            longitudeKey: 'longitude',
            latitudeKey: 'latitude',
            averagingIntervalKey: 'averaging',
            sensorStatusKey: (d) => 'asdf',
            locationIdKey: 'station',
            locationLabelKey: 'site_name',
            projectionKey: (d) => 'WSG84',
            ownerKey: (d) => 'test_owner',
            isMobileKey: (d) => false,
        })

        const data = await cln.fetch();
        expect(data).toStrictEqual(expectedOutput);
    })

});


describe.todo('Adapter that requires custom fetch data method');

describe.todo('Provider with Locations that have different averaging times');
describe.todo('Provider with both fixed and mobile locations');
