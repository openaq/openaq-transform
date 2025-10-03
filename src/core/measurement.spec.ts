import { expect, test } from 'vitest';
import { Measurement } from './measurement';
import { Datetime } from './datetime';
import { Sensor } from './sensor';
import { MissingAttributeError } from './errors';

test('Measurement to initialize correctly', () => {
  const m = new Measurement({
    sensor: new Sensor({
      systemKey: 'system-key',
      metric: {
        parameter: 'temperature',
        unit: 'f',
      },
      status: 'active',
      averagingIntervalSeconds: 3600,
      loggingIntervalSeconds: 3600,
    }),
    timestamp: new Datetime('2025-01-01T00:00:00-05:00'),
    value: 4,
  });
  // just track that it worked
  expect(m.key).toEqual('system-key-temperature-2025-01-01T00:00:00-05:00');
});

test('Measurement without sensorKey throws error', () => {
  const m = { value: 4 };
  // @ts-expect-error Testing null input validation
  expect(() => new Measurement(m)).toThrowError(MissingAttributeError);
});

test('Measurement without timestamp throws error', () => {
  const m = {
    sensor: new Sensor({
      systemKey: 'system-key',
      metric: {
        parameter: 'temperature',
        unit: 'f',
      },
      status: 'active',
      averagingIntervalSeconds: 3600,
      loggingIntervalSeconds: 3600,
    }),
    value: 4,
  };
  // @ts-expect-error Testing null input validation
  expect(() => new Measurement(m)).toThrowError(MissingAttributeError);
});

test('Measurement with incorrect units gets converted', () => {
  const m = new Measurement({
    sensor: new Sensor({
      systemKey: 'system-key',
      metric: {
        parameter: 'temperature',
        unit: 'f',
      },
      status: 'active',
      averagingIntervalSeconds: 3600,
      loggingIntervalSeconds: 3600,
    }),
    timestamp: new Datetime('2025-01-01T00:00:00-05:00'),
    value: 65,
  });
  expect(m.value).toBe(18.3);
});
