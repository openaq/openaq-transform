import type { Coordinates } from "../core/coordinates";
import type { Datetime } from "../core/datetime";
import type { Sensor } from "../core/sensor";
import { CoordinatesJSON } from "./coordinates";

export interface MeasurementData {
  sensor: Sensor;
  timestamp: Datetime;
  value: number | null;
  coordinates?: Coordinates;
  flags?: Array<string>;
  //units: string;
}

export interface MeasurementJSON {
  key: string;
  timestamp: string | undefined; // this is just temp to solve a typing issue
  value: number | null;
  coordinates?: CoordinatesJSON;
  flags?: Array<string>;
}