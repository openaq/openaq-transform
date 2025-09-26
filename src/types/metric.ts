
interface ConverterMap {
  [key: string]: (v: any) => any;
};

export interface Parameter {
  name: string;
  numeric: boolean;
  units?: string;
  converters: ConverterMap;
  range?: [number, number];
  precision?: number
}

export interface ParameterMap {
  [key: string]: Parameter;
};

export interface ParameterUnit {
  parameter: string;
  unit: string;
}

export interface ClientParameters{
    [key: string]: ParameterUnit
}