import type { DecimalDigitGroup } from "../types/client";
import type {
	ClientParameters,
	Parameter,
	ParameterMap,
	UnitConverter,
} from "../types/metric";
import {
	HighValueError,
	LowValueError,
	MissingValueError,
	ProviderValueError,
	UnsupportedParameterError,
	UnsupportedUnitsError,
} from "./errors";
import { normalizeNumericString } from "./utils";

const noConversion = (d: number | string) => +d;
const ppbToPpm = (ppb: number | string) => +ppb / 1000;
const mgm3ToUgm3 = (mgm3: number | string) => +mgm3 * 1000;

// this should be tranform methods that all orgs will use
// regardless of what unit they use to store their data
// somewhere else we will need to define what unit to use for each parameter (not as a constant)
export const PARAMETERS: ParameterMap = {
	"pm1:mass": {
		name: "pm1",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"pm25:mass": {
		name: "pm25",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"pm4:mass": {
		name: "pm4",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"pm10:mass": {
		name: "pm10",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"no2:mass": {
		name: "no2",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"nox:mass": {
		name: "nox",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"so2:mass": {
		name: "so2",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"o3:parts": {
		name: "o3",
		numeric: true,
		units: "ppm",
		converters: {
			ppm: noConversion,
			ppb: ppbToPpm,
		},
	},
	"o3:mass": {
		name: "o3",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"co:mass": {
		name: "co",
		numeric: true,
		units: "ug/m3",
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"co:parts": {
		name: "co",
		numeric: true,
		units: "ppm",
		converters: {
			ppm: noConversion,
			ppb: ppbToPpm,
		},
	},
	"no2:parts": {
		name: "no2",
		numeric: true,
		units: "ppm",
		converters: {
			ppm: noConversion,
			ppb: ppbToPpm,
		},
	},
	"so2:parts": {
		name: "so2",
		numeric: true,
		units: "ppm",
		converters: {
			ppm: noConversion,
			ppb: ppbToPpm,
		},
	},
	temperature: {
		name: "temperature",
		numeric: true,
		units: "c",
		precision: 1,
		range: [-50, 50],
		converters: {
			c: noConversion,
			f: (d: number | string) => ((+d - 32) * 5) / 9,
		},
	},
	rh: {
		name: "rh",
		numeric: true,
		units: "%",
		precision: 1,
		range: [0, 100],
		converters: {
			"%": noConversion,
		},
	},
	pressure: {
		name: "pressure",
		numeric: true,
		units: "hpa",
		precision: 1,
		range: [800, 1100],
		converters: {
			hpa: noConversion,
			mb: noConversion,
			mbar: noConversion,
			kpa: (d: number | string) => +d * 10,
		},
	},
};

const PROVIDER_VALUE_FLAGS: Array<number | string> = [-99, -999, "-99", "-999"];

export const PARAMETER_DEFAULTS: ClientParameters = [
	{ parameter: "pm25", unit: "ugm3", key: "pm_25" },
	{ parameter: "o_3", unit: "ppm", key: "o3" },
];

export class Metric {
	key: string;
	parameter: Parameter;
	unit: string;
	numeric: boolean = true;
	precision?: number;
	converter: UnitConverter;
	#numberFormat: DecimalDigitGroup;

	constructor(
		parameter: string,
		unit: string,
		numberFormat: DecimalDigitGroup = { decimal: "point" },
	) {
		// check for parameter(s)
		// should either be one or two (parts & mass
		const parameterEntries = Object.entries(PARAMETERS).filter(
			([, p]) => p.name === parameter,
		);

		if (!parameterEntries.length) {
			throw new UnsupportedParameterError(parameter);
		}

		// now check those parameters for the right units
		const parameterEntry = parameterEntries.find(
			([, p]) => p.converters && Object.keys(p.converters).includes(unit),
		);

		if (!parameterEntry) {
			throw new UnsupportedUnitsError(parameter, unit);
		}

		const [key, resolvedParameter] = parameterEntry;

		this.key = key;
		this.parameter = resolvedParameter;
		this.unit = unit;
		this.numeric = this.parameter.numeric;
		this.#numberFormat = numberFormat;

		const converter = this.parameter.converters[this.unit];
		if (!converter) {
			throw new UnsupportedUnitsError(parameter, unit);
		}
		this.converter = converter;

		if (this.parameter?.precision) {
			this.precision = Math.round(this.parameter.precision);
		}
	}

	process(v: unknown): number | null {
		const range = this.parameter?.range;
		let nv = null;

		// first check if its some form of missing
		if (
			v === "" ||
			v === null ||
			v === undefined ||
			(typeof v === "number" && Number.isNaN(v))
		) {
			throw new MissingValueError(v);
		}

		if (typeof v !== "string" && typeof v !== "number") {
			throw new ProviderValueError(v);
		}

		if (typeof v === "string" && PROVIDER_VALUE_FLAGS.includes(v)) {
			throw new ProviderValueError(v);
		}
		if (typeof v === "number" && PROVIDER_VALUE_FLAGS.includes(v)) {
			throw new ProviderValueError(v);
		}

		if (typeof v === "string") {
			nv = normalizeNumericString(v, this.#numberFormat);
			if (Number.isNaN(Number(nv))) {
				throw new ProviderValueError(v);
			}
			nv = this.converter(nv);
		} else {
			nv = this.converter(v);
		}

		// next check if its a string but should be a number
		if (this.numeric && !Number.isFinite(nv)) {
			throw new ProviderValueError(nv);
		}

		// adjust the precision if needed
		if (this.precision) {
			const mult = Math.round(this.precision) * 10;
			nv = Math.round(nv * mult) / mult;
		}

		// check for issues and throw an error
		if (range && range.length === 2) {
			if (nv < range[0]) {
				throw new LowValueError(nv, range[0]);
			}
			if (nv > range[1]) {
				throw new HighValueError(nv, range[1]);
			}
		}
		return nv;
	}
}
