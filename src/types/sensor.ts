import type { Metric } from "../core/metric";
import type { ParameterUnit } from "./metric";

export interface SensorData {
  key: string;
  systemKey: string;
  metric: Metric | ParameterUnit;
  averagingIntervalSeconds: number;
  loggingIntervalSeconds: number;
  status: string;
  versionDate?: string;
  instance?: string;
}