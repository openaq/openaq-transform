// @vitest-environment happy-dom

import { expect, test, describe } from 'vitest';
import { BrowserClient as Client } from './client.ts';

import {
  widedata,
  csvdata,
  expectedOutput,
} from '../../tests/fixtures/sampledata.ts';


import { csv } from './parsers';
import type { Reader } from '../types/readers.ts';

test('test environment', () => {
  expect(typeof window).not.toBe('undefined');
});

// this is what is needed to parse the provided data correctly
class CustomClient extends Client {
  provider = 'testing';
  xGeometryKey = 'longitude';
  averagingIntervalKey = 'averaging';
  sensorStatusKey = () => 'asdf';
  yGeometryKey = 'latitude';
  locationIdKey = 'station';
  locationLabelKey = 'site_name';
  projectionKey = () => 'WSG84';
  ownerKey = () => 'test_owner';
  isMobileKey = () => false;
  parameters = {
    particulate_matter_25: { parameter: 'pm25', unit: 'ug/m3' },
    tempf: { parameter: 'temperature', unit: 'f' },
  };
}

// a simple file reader to read in the file data
const read = async ({ resource }) => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target!.result);
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsText(resource);
  });
};

// all the rest of these are just testing the different ways to provide
// the right read and parse methods
describe('reading one json file', () => {
  const file = new File([JSON.stringify(widedata)], 'data.json', {
    type: 'application/json',
  });

  class UploadClient extends CustomClient {
    reader = 'file';
    readers = {
      file: read as Reader,
    };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: file });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('reading one csv file', () => {
  const file = new File([csvdata.all], 'data.csv', { type: 'text/csv' });

  class UploadClient extends CustomClient {
    reader = 'file';
    parser = 'csv';
    readers = {
      file: read as Reader,
      csv: csv as Reader,
    };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: file });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('reading one json file v2', () => {
  const jsonBlob = new Blob([JSON.stringify(widedata)], {
    type: 'application/json',
  });
  const file = new File([jsonBlob], 'data.json', { type: 'application/json' });

  class UploadClient extends CustomClient {
    reader = read;
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: file });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('different files with the same parser', () => {
  let locations = new File(
    [JSON.stringify(widedata.locations)],
    'locations.json',
    { type: 'application/json' }
  );
  let measurements = new File(
    [JSON.stringify(widedata.measurements)],
    'measurements.json',
    { type: 'application/json' }
  );

  class UploadClient extends CustomClient {
    reader = 'file';
    parser = 'json';
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: { locations, measurements } });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('different files with different parsers', () => {
  let locations = new File(
    [JSON.stringify(widedata.locations)],
    'locations.json',
    { type: 'application/json' }
  );
  let measurements = new File([csvdata.measurements], 'measurements.csv', {
    type: 'text/csv',
  });

  class UploadClient extends CustomClient {
    reader = 'file';
    parser = { locations: 'json', measurements: 'csv' };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: { locations, measurements } });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('different files with different custom readers', () => {
  let locations = new File(
    [JSON.stringify(widedata.locations)],
    'locations.json',
    { type: 'application/json' }
  );
  let measurements = new File([csvdata.measurements], 'measurements.csv', {
    type: 'text/csv',
  });

  class UploadClient extends CustomClient {
    reader = { locations: 'filev1', measurements: 'filev2' };
    parser = { locations: 'json', measurements: 'csv' };
    readers = {
      filev1: read,
      filev2: read,
    };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: { locations, measurements } });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('different files with different custom readers v2', () => {
  let locations = new File(
    [JSON.stringify(widedata.locations)],
    'locations.json',
    { type: 'application/json' }
  );
  let measurements = new File([csvdata.measurements], 'measurements.csv', {
    type: 'text/csv',
  });

  class UploadClient extends CustomClient {
    reader = { locations: read, measurements: read };
    parser = { locations: 'json', measurements: 'csv' };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: { locations, measurements } });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('different files with custom parser and library parser', () => {
  let locations = new File(
    [JSON.stringify(widedata.locations)],
    'locations.json',
    { type: 'application/json' }
  );
  let measurements = new File([csvdata.measurements], 'measurements.csv', {
    type: 'text/csv',
  });
  let json2 = ({ text }) => {
    return JSON.parse(text);
  };

  class UploadClient extends CustomClient {
    reader = read;
    parser = { locations: 'json2', measurements: 'csv' };
    // we we override the parsers we remove the internal ones
    parsers = { json2, csv };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: { locations, measurements } });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});

describe('different files with custom parser and library parser v2', () => {
  let locations = new File(
    [JSON.stringify(widedata.locations)],
    'locations.json',
    { type: 'application/json' }
  );
  let measurements = new File([csvdata.measurements], 'measurements.csv', {
    type: 'text/csv',
  });
  let json2 = ({ text }) => {
    return JSON.parse(text);
  };

  class UploadClient extends CustomClient {
    reader = read;
    parser = {
      locations: json2,
      measurements: csv,
    };
  }

  test('parses file data', async () => {
    const client = new UploadClient();
    client.configure({ resource: { locations, measurements } });
    const data = await client.load();
    expect(data).toStrictEqual(expectedOutput);
  });
});
