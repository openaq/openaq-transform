import { describe, test, expect, beforeAll } from 'vitest';
import { http, HttpResponse, rest } from 'msw';
import { setupServer } from 'msw/node';


import { Client } from './client.ts'

// mock server
const handlers = [
  http.get("https://blah.org/json", async ({ request }) => {
    return HttpResponse.json({
        locations: [{ station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121 }],
        measurements: [{ station: 'ts1', datetime: '2024-01-01T00:00:00-00:08', particulate_matter_25: 10 }]
    });
  }),
];

const server = setupServer(...handlers);
server.listen()

describe('Adapter for static provider', () => {

    // A an example client that could be created to fetch some aq data in json format
    // from a provider where everything is very predictable
    class JsonClient extends Client{
        url = 'https://blah.org/json';
        longitudeKey = 'longitude';
        latitudeKey = 'latitude';
        locationIdKey = 'station';
        locationLabelKey = 'site_name';
        provider = 'testing'
    }

    test('Url check', () => {
        const cln = new JsonClient()
        expect(cln.url).toBe('https://blah.org/json');
    });

    test('Adds one location', async () => {
        const cln = new JsonClient()
        const data = await cln.fetch();
        const locations = cln.locations
        expect(locations.length).toBe(1);
    });

    test.only('Shapes location correctly', async () => {
        const cln = new JsonClient()
        const data = await cln.fetch();
        const loc = cln.locations[0]
        expect(loc).toStrictEqual({
            location_id: '',
            label: '',
            coordinates: {
                lat: 45.56665,
                lng: -123.12121,
                proj: 'WGS84',
            },
            ismobile: false,
        });
    });

    test('Adds one measurement', async () => {
        const cln = new JsonClient()
        const data = await cln.fetch();
        const meas = cln.measurements
        expect(meas.length).toStrictEqual(1);
    })


    test.todo('Shapes measurements correctly')


})

describe.todo('Adapter that requires custom fetch data method');
describe.todo('Dynamic adapter that gets mapping from config');
