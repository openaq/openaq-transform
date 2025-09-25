import { expect, test } from 'vitest';
import { Measurement } from './measurement';
import { Datetime } from './datetime'
import { Sensor } from './sensor'
import { MissingAttributeError } from './errors'


test('Measurement to initialize correctly', () => {
  const m = new Measurement({
    sensor: new Sensor({
      sensorId :'sensor-id',
      metric: {
        parameter: 'temperature',
        unit: 'f'
      }
    }),
    timestamp: new Datetime('2025-01-01T00:00:00-05:00'),
    value: 4,
  });
  // just track that it worked
  expect(m.id).toEqual('sensor-id-2025-01-01T00:00:00-05:00')
});

test('Measurement without sensorId throws error', () => {
  const m = { value: 4 }
  expect(() => new Measurement(m)).toThrowError(MissingAttributeError);
});

test('Measurement without timestamp throws error', () => {
  const m = {
    sensor: new Sensor({
      sensorId :'sensor-id',
      metric: {
        parameter: 'temperature',
        unit: 'f'
      }
    }),
    value: 4,
  };
  expect(() => new Measurement(m)).toThrowError(MissingAttributeError);
});


test('Measurement with incorrect units gets converted', () => {

  const m = new Measurement({
    sensor: new Sensor({
      sensorId :'sensor-id',
      metric: {
        parameter: 'temperature',
        unit: 'f'
      }
    }),
    timestamp: new Datetime('2025-01-01T00:00:00-05:00'),
    value: 65,
  });

  expect(m.value).toBe(18.3);
})
