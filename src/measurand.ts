
const VERBOSE = true;


interface MeasurandParameters {
    internalParameter: string;
    parameter: string;
    unit: string;
}

export class Measurand {

    internalParameter: string;
    parameter: string;
    unit: string;

    constructor({ internalParameter, parameter, unit }: MeasurandParameters) {
        // How a measurand is described by external source (e.g. "CO")
        this.internalParameter = internalParameter;
        // How a measurand is described internally (e.g. "co")
        this.parameter = parameter;
        // Unit for measurand (e.g "ppb")
        this.unit = unit;
    }


    /**
     * Given a map of lookups from an input parameter (i.e. how a data provider
     * identifies a measurand) to a tuple of a measurand parameter (i.e. how we
     * identify a measurand internally) and a measurand unit, generate an array
     * Measurand objects that are supported by the OpenAQ API.
     *
     * @param {*} lookups, e.g. {'CO': ['co', 'ppb'] }
     * @returns { Measurand[] }
     */
    static async getSupportedMeasurands(lookups: { [key: string]: [string,string]; } ): Promise<Measurand[]> {
        const supportedMeasurandParameters = [
            'pm10','pm25','o3','co','no2','so2','no2','co','so2','o3','bc','co2','no2','bc','pm1','co2','wind_direction','nox','no','rh','nox','ch4','pn','o3','ufp','wind_speed','no','pm','ambient_temp','pressure','pm25-old','relativehumidity','temperature','so2','co','um003','um010','temperature','um050','um025','pm100','pressure','um005','humidity','um100','voc','ozone','nox','bc','no','pm4','so4','ec','oc','cl','no3','pm25','bc_375','bc_470','bc_528','bc_625','bc_880', 'as', 'cd', 'fe', 'k', 'ni', 'pb', 'v'];

        // Filter provided lookups
        const supportedLookups = Object.entries(lookups).filter(
            ([measurandParameter, _]) => {
                return supportedMeasurandParameters.includes(measurandParameter)
            }

        );

        if (!supportedLookups.length) throw new Error('No measurands supported.');

        return supportedLookups.map(
            ([internalParameter, [parameter, unit]]) =>
                new Measurand({ internalParameter, parameter, unit })
        );
    }

    /**
     * Given a map of lookups from an input parameter (i.e. how a data provider
     * identifies a measurand) to a tuple of a measurand parameter (i.e. how we
     * identify a measurand internally) and a measurand unit, generate an object
     * of Measurand objects that are supported by the OpenAQ API, indexed by their
     * input parameter.
     */
    static async getIndexedSupportedMeasurands(lookups: { [key: string]: [string, string]; }) {
        const measurands = await Measurand.getSupportedMeasurands(lookups);
        return Object.assign(
            {},
            ...measurands.map((measurand) => ({ [measurand.parameter]: measurand }))
        );
    }
}
