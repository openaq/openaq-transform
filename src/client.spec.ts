import { describe, test, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { widedata, expectedOutput, measurementErrors }  from './tests/fixtures/sampledata.ts';
import { Client } from './client.ts'
console.log(process.cwd())

// mock server
const handlers = [
  http.get("https://blah.org/wide", async () => {
    return HttpResponse.json(widedata);
  }),
  http.get("https://blah.org/wideerrors", async () => {
    return HttpResponse.json(measurementErrors);
  }),
  http.get("https://blah.org/test-provider/stations", async () => {
    return HttpResponse.json([
        { station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121, averaging: 3600 }
    ]);
  }),
  http.get("https://blah.org/test-provider/measurements", async () => {
    return HttpResponse.json([
        { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', particulate_matter_25: 10, tempf: 80 }
    ]);
  }),
  http.get("https://blah.org/long", async () => {
    return HttpResponse.json({
      locations: [{ station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121, averaging: 3600 }],
      measurements: [
        { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', parameter: 'particulate_matter_25', value: 10 },
        { station: 'ts1', datetime: '2024-01-01T00:00:00-08:00', parameter: 'tempf', value: 80 },
      ]
    });
  }),
  http.get("https://blah.org/withsensors", async () => {
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


describe('Simple client example', () => {

  class FakeClient extends Client {
    url: string = 'fake.url';
  }

  test('url is updated', () => {
    const cln = new FakeClient()
    expect(cln.url).toBe('fake.url');
  });

  test('abstract defaults persist', () => {
    const cln = new FakeClient()
    expect(cln.reader).toBe('api');
  });

  test('passed provider overrides default', () => {
    const provider = 'my-provider'
    const cln = new FakeClient({ provider })
    expect(cln.provider).toBe(provider);
  });

  test('url cant be overidden', () => {
    const url = 'different.fake.url'
    const provider = 'my-provider'
    const cln = new FakeClient({ url, provider })
    expect(cln.url).toBe('fake.url');
    expect(cln.provider).toBe(provider);
  });


})

describe('Client with data in wide format', () => {


  class JsonClient extends Client {
    url = 'https://blah.org/wide';
    provider = 'testing';
    // mapping data
    xGeometryKey = 'longitude';
    averagingIntervalKey = 'averaging';
    sensorStatusKey = () => 'asdf'
    yGeometryKey = 'latitude';
    locationIdKey = 'station';
    locationLabelKey = 'site_name';
    projectionKey = () => 'WSG84';
    ownerKey = () => 'test_owner';
    isMobileKey = () => false;
    parameters = {
      particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
      tempf: { parameter: "temperature", unit: "f" },
    };

  }

  test('Url check', () => {
    const cln = new JsonClient()
    expect(cln.url).toBe('https://blah.org/wide');
  });


  test('parameter check', () => {
    const cln = new JsonClient()
    expect(Object.keys(cln.parameters)).toStrictEqual(['particulate_matter_25','tempf']);
    //expect(Object.keys(cln.parameters)).toStrictEqual(['pm25','temperature']);
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


describe('Client with data split between two different urls', () => {


  class JsonClient extends Client {
    url = {
        // name of the node and then the src url
        locations: 'https://blah.org/test-provider/stations',
        measurements: 'https://blah.org/test-provider/measurements',
    };
    provider = 'testing';
    // mapping data
    xGeometryKey = 'longitude';
    averagingIntervalKey = 'averaging';
    sensorStatusKey = () => 'asdf'
    yGeometryKey = 'latitude';
    locationIdKey = 'station';
    locationLabelKey = 'site_name';
    projectionKey = () => 'WSG84';
    ownerKey = () => 'test_owner';
    isMobileKey = () => false;
    parameters = {
      particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
      tempf: { parameter: "temperature", unit: "f" },
    };

  }

  test('outputs correct format', async () => {
    const cln = new JsonClient()
    const data = await cln.fetch();
    expect(data).toStrictEqual(expectedOutput);
  })

})

describe('Client with data in long format', () => {

  class JsonClient extends Client{
    url = 'https://blah.org/long';
    provider = 'testing';
    // mapping data
    longFormat = true;
    xGeometryKey = 'longitude';
    yGeometryKey = 'latitude';
    averagingIntervalKey = 'averaging';
    sensorStatusKey = () => 'asdf'
    locationIdKey = 'station';
    locationLabelKey = 'site_name';
    projectionKey = () => 'WSG84';
    ownerKey = () => 'test_owner';
    isMobileKey = () => false;
    parameters = {
      particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
      tempf: { parameter: "temperature", unit: "f" },
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
    xGeometryKey = 'longitude';
    yGeometryKey = 'latitude';
    averagingIntervalKey = 'averaging';
    sensorStatusKey = () => 'asdf'
    locationIdKey = 'station';
    locationLabelKey = 'site_name';
    projectionKey = () => 'WSG84';
    ownerKey = () => 'test_owner';
    isMobileKey = () => false;
    parameters = {
      particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
      tempf: { parameter: "temperature", unit: "f" },
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
      particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
      tempf: { parameter: "temperature", unit: "f" },
    }
  }


  test('outputs correct format', async () => {
    const cln = new JsonClient({
      xGeometryKey: 'longitude',
      yGeometryKey: 'latitude',
      averagingIntervalKey: 'averaging',
      sensorStatusKey: () => 'asdf',
      locationIdKey: 'station',
      locationLabelKey: 'site_name',
      projectionKey: () => 'WSG84',
      ownerKey: () => 'test_owner',
      isMobileKey: () => false,
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
  }


  test('outputs correct format', async () => {
    const cln = new JsonClient()
    // Do some other things for whatever reasone
    // configure by passing a map
    cln.configure({
        parameters: {
            particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
            tempf: { parameter: "temperature", unit: "f" },
        },
      xGeometryKey: 'longitude',
      yGeometryKey: 'latitude',
      averagingIntervalKey: 'averaging',
      sensorStatusKey: () => 'asdf',
      locationIdKey: 'station',
      locationLabelKey: 'site_name',
      projectionKey: () => 'WSG84',
      ownerKey: () => 'test_owner',
      isMobileKey: () => false,
    })

    const data = await cln.fetch();
    expect(data).toStrictEqual(expectedOutput);
  })

});

describe.only('Client with measurement errors', () => {

  const rawdata = {
      locations: [
        { station: 'ts1', site_name: 'test site #1', latitude: 45.56665, longitude: -123.12121, averaging: 3600 }
      ],
      measurements: [
        {
          station: 'ts1',
          datetime: '2024-01-01T00:00:00-08:00',
          parameter: 'particulate_matter_25',
          value: 10
        },
        {
          station: 'ts1',
          datetime: '2024-01-01T00:00:00-08:00',
          parameter: 'tempf',
          value: 80
        },
        {
          station: "ts1",
          datetime: "2024-01-01T01:00:00-08:00",
          parameter: 'tempf',
          value: null, // missing value
        },
        {
          station: "ts1",
          datetime: "2024-01-01T03:00:00-08:00",
          parameter: 'tempf',
          value: -99, // numeric error code
        },
        {
          station: "ts1",
          datetime: "2024-01-01T04:00:00-08:00",
          parameter: 'tempf',
          value: 'TOO_HIGH', // string error code
        },
        {
          station: "ts1",
          datetime: "2024-01-01T05:00:00-08:00",
          parameter: 'tempf',
          value: '65', // number as string
        },
        {
          station: "ts1",
          datetime: "2024-01-01T06:00:00-08:00",
          parameter: 'tempc', // unsupported parameter
          value: '22',
        },
      ]
  }


  const expected = {
    meta: expectedOutput.meta,
    locations: expectedOutput.locations,
    measurements: [
      ...expectedOutput.measurements,
      {
        sensor_id: "testing-ts1-temperature",
        timestamp: "2024-01-01T01:00:00-08:00",
        value: null, // missing value
      },
      {
        sensor_id: "testing-ts1-temperature",
        timestamp: "2024-01-01T03:00:00-08:00",
        value: null, // numeric error code
        flags: ['-99']
      },
      {
        sensor_id: "testing-ts1-temperature",
        timestamp: "2024-01-01T04:00:00-08:00",
        value: null, // string error code
        flags: ['TOO_HIGH']
      },
      {
        sensor_id: "testing-ts1-temperature",
        timestamp: "2024-01-01T05:00:00-08:00",
        value: 65, // number as string
      },
    ]
  };


  class JsonClient extends Client {
    url = 'https://blah.org/wideerrors';
    provider = 'testing';
    strict = false;
    longFormat = true;
    xGeometryKey = 'longitude';
    averagingIntervalKey = 'averaging';
    sensorStatusKey = () => 'asdf'
    yGeometryKey = 'latitude';
    locationIdKey = 'station';
    locationLabelKey = 'site_name';
    projectionKey = () => 'WSG84';
    ownerKey = () => 'test_owner';
    isMobileKey = () => false;
    parameters = {
      particulate_matter_25: { parameter: "pm25", unit: "ug/m3"},
      tempf: { parameter: "temperature", unit: "f" },
    };

  }

  test('parameter check', () => {
    const cln = new JsonClient()
    expect(Object.keys(cln.parameters)).toStrictEqual(['particulate_matter_25','tempf']);
  });

  test('outputs correct format', async () => {
    const cln = new JsonClient()
    cln.process(rawdata);
    const data = cln.data();
    const errors = cln.log.get('MissingValueError')
    // currently we are adding
    expect(data.measurements.length).toBe(6)
    expect(errors.length).toBe(1)

    console.log(cln.log)
    //expect(data.flags.length).toBe(2)

    console.log(data.measurements)
    expect(data).toStrictEqual(expected);
  })


})


// describe.todo('Adapter that requires custom fetch data method');

// describe.todo('Provider with Locations that have different averaging times');
// describe.todo('Provider with both fixed and mobile locations');
