


type TransformFunction = (value: number) => number

interface UnitTransformationDefinition {
    [units: string]: TransformFunction
}


export interface ParametersTransformDefinition {
    [parameter: string]: UnitTransformationDefinition
}

export interface ParameterUnitDefinition {
    parameter: string;
    unit: string
}

export interface ParametersDefinition {
    [key: string]: ParameterUnitDefinition
}

// this should be tranform methods that all orgs will use
// regardless of what unit they use to store their data
// somewhere else we will need to define what unit to use for each parameter (not as a constant)
export const PARAMETERS: ParametersTransformDefinition = {
  'pm25': {
    'ugm3': (d: number) => d
  },
  'o3': {
    'ppm': (d: number) => d,
    'ppb': (d: number) => d
  },
  'temp': {}
}

// and this will be a default set of parameters to use
export const PARAMETER_DEFAULTS: ParametersDefinition = {
  'pm25': { parameter: 'pm_25', unit: 'ugm3'},
  'o3': { parameter: 'o_3', unit: 'ppm'},
}
