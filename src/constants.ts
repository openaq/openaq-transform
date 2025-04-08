


type TransformFunction = (value: number) => number

interface UnitTransformationDefinition {
    [units: string]: TransformFunction
}


export interface ParametersTransformDefinition {
    [parameter: string]: UnitTransformationDefinition
}

export const PARAMETERS: ParametersTransformDefinition = {
    'pm25': {
        'ugm3': (d: number) => d
    },
    'o3': {
        'ppm': (d: number) => d,
        'ppb': (d: number) => d
    }
}
