import { expect, test } from 'vitest';
import { Metric } from './metric';

import {
  MissingValueError,
  UnsupportedParameterError,
  UnsupportedUnitsError,
  ProviderValueError,
  HighValueError,
  LowValueError,
} from './errors'


test('unsupported parameter returns error', () => {
  expect(() => new Metric('aqi','unitless')).toThrowError(UnsupportedParameterError);
})

test('unsupported units returns error', () => {
  expect(() => new Metric('temperature','kelvin')).toThrowError(UnsupportedUnitsError);
})


test('unsupported units returns error #2', () => {
  expect(() => new Metric('pm25','kelvin')).toThrowError(UnsupportedUnitsError);
})


test('parameter supported with both mass and parts distinquishes without explicitly providing key', () => {
  const m = new Metric('o3', 'ppm')
  expect(m.key).toBe('o3:parts')
})

test('supported parameter and units returned rounded', () => {
  const m = new Metric('temperature','c')
  expect(m.process(18.3333333)).toBe(18.3)
})

test('supported paramter with differing units returned transformed', () => {
  const m = new Metric('temperature','f')
  expect(m.process(65)).toBe(18.3)
})

test('low values throw range error', () => {
  const m = new Metric('temperature','c')
  expect(() => m.process(-100)).toThrowError(LowValueError)
})

test('high values throw range error', () => {
  const m = new Metric('temperature','c')
  expect(() => m.process(100)).toThrowError(HighValueError)
})

test('Error flag (-99) as values throw flag error (f)', () => {
  const m = new Metric('temperature','f')
  expect(() => m.process(-99)).toThrowError(ProviderValueError)
})

test('Error flag (-99) as values throw flag error (c)', () => {
  const m = new Metric('temperature','c')
  expect(() => m.process(-99)).toThrowError(ProviderValueError)
})

test('Non-numeric string throws provider value error', () => {
  const m = new Metric('temperature','c')
  const v = 'TOO_HIGH'
  expect(() => m.process(v)).toThrowError(ProviderValueError)
})

test('Undefined throws missing value error', () => {
  const m = new Metric('temperature','c')
  const v = undefined
  expect(() => m.process(v)).toThrowError(MissingValueError)
})

test('null throws missing value error', () => {
  const m = new Metric('temperature','c')
  const v = null
  expect(() => m.process(v)).toThrowError(MissingValueError)
})

test('empty string throws missing value error', () => {
  const m = new Metric('temperature','c')
  const v = ''
  expect(() => m.process(v)).toThrowError(MissingValueError)
})


test.todo('missing value throws range error')
