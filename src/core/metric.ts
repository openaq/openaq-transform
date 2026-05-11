import type {
	ClientParameters,
	DecimalDigitGroup,
	Parameter,
	ParameterMap,
	UnitConverter,
	ValueFlagMap,
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
const ppmToPpb = (ppm: number | string) => +ppm * 1000;
const mgm3ToUgm3 = (mgm3: number | string) => +mgm3 * 1000;
const ugm3ToMgm3 = (mgm3: number | string) => +ugm3 / 1000;

// this should be tranform methods that all orgs will use
// regardless of what unit they use to store their data
// somewhere else we will need to define what unit to use for each parameter (not as a constant)
export const PARAMETERS: ParameterMap = {
	"bc": { // typically in the 0-3,000 ng/m3 range
		name: "bc",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"bc@370": {
		name: "bc_370",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"bc@375": {
		name: "bc_375",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"bc@470": {
		name: "bc_470",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"bc@528": {
		name: "bc_528",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"bc@625": {
		name: "bc_625",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"bc@880": {
		name: "bc_880",
		numeric: true,
		units: "ng/m3",
		range: [0, 10000],
		converters: {
			"ng/m3": noConversion,
		},
	},
	"ch4:parts": {
		name: "ch4",
		numeric: true,
		units: "ppb",
		range: [0, 10000],
		converters: {
			"ppb": noConversion,
      "ppm": ppmToPpb,
		},
	},
	"co:mass": { // units reported by WHO
		name: "co",
		numeric: true,
		units: "mg/m3",
		range: [0, 100000],
		converters: {
			"mg/m3": noConversion,
			"ug/m3": ugm3ToMgm3,
		},
	},
	"co:parts": {
		name: "co",
		numeric: true,
		units: "ppm",
		range: [0, 100000],
		converters: {
			ppm: noConversion,
			ppb: ppbToPpm,
		},
	},
	"no:mass": {
		name: "no",
		numeric: true,
		units: "ug/m3",
		range: [0, 500],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"no2:mass": { // units reported by WHO
		name: "no2",
		numeric: true,
		units: "ug/m3",
		range: [0, 500],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"nox:mass": {
		name: "nox",
		numeric: true,
		units: "ug/m3",
		range: [0, 1000],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"no:parts": {
		name: "no",
		numeric: true,
		units: "ppb",
		range: [0, 500],
		converters: {
			ppb: noConversion,
			ppm: ppmToPpb,
		},
	},
	"no2:parts": {
		name: "no2",
		numeric: true,
		units: "ppb",
		range: [0, 500],
		converters: {
			ppb: noConversion,
			ppm: ppmToPpb,
		},
	},
	"nox:parts": {
		name: "nox",
		numeric: true,
		units: "ppb",
		range: [0, 5000],
		converters: {
			ppb: noConversion,
			ppm: ppmToPpb,
		},
	},
	"pm1:mass": {
		name: "pm1",
		numeric: true,
		units: "ug/m3",
		range: [0, 1000],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"pm4:mass": { // only sentate
		name: "pm4",
		numeric: true,
		units: "ug/m3",
		range: [0, 1000],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"pm10:mass": {
		name: "pm1",
		numeric: true,
		units: "ug/m3",
		range: [0, 1500],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"pm25:mass": {
		name: "pm25",
		numeric: true,
		units: "ug/m3",
		range: [0, 1000],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"um003:conc": { // only airgradient
		name: "um003",
		numeric: true,
		units: "particles/cm3",
		range: [0, 1500000],
		converters: {
			"particles/cm3": noConversion,
		},
	},
	"ufp:conc": { // only bay_area_mobile_analysis
		name: "ufp",
		numeric: true,
		units: "particles/cm3",
		range: [0, 1000000],
		converters: {
			"particles/cm3": noConversion,
		},
	},
	"um010:conc": { // only nyc_mobile_mit_city_scanner
		name: "um010",
		numeric: true,
		units: "particles/cm3",
		range: [0, 500000],
		converters: {
			"particles/cm3": noConversion,
		},
	},
	"um025:conc": { // only houston_mobile
		name: "um025",
		numeric: true,
		units: "particles/cm3",
		range: [0, 100000],
		converters: {
			"particles/cm3": noConversion,
		},
	},
	"um100:conc": { // only nyc_mobile_mit_city_scanner
		name: "um100",
		numeric: true,
		units: "particles/cm3",
		range: [0, 10000],
		converters: {
			"particles/cm3": noConversion,
		},
	},
	"so2:mass": { // units reported by WHO
		name: "so2",
		numeric: true,
		units: "ug/m3",
		range: [0, 2000],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	"so2:parts": {
		name: "so2",
		numeric: true,
		units: "ppb",
		range: [0, 2000],
		converters: {
			ppb: noConversion,
			ppm: ppmToPpb,
		},
	},
	"o3:parts": {
		name: "o3",
		numeric: true,
		units: "ppb",
		range: [0, 500],
		converters: {
			ppb: noConversion,
			ppm: ppmToPpb,
		},
	},
	"o3:mass": { // units reported by WHO
		name: "o3",
		numeric: true,
		units: "ug/m3",
		range: [0, 500],
		converters: {
			"ug/m3": noConversion,
			"mg/m3": mgm3ToUgm3,
		},
	},
	ws: {
		name: "ws",
		numeric: true,
		units: "m/s",
		precision: 1,
		range: [0, 115],
		converters: {
			"m/s": noConversion,
		},
	},
	wd: {
		name: "wd",
		numeric: true,
		units: "deg",
		precision: 1,
		range: [0, 360],
		converters: {
			"deg": noConversion,
		},
	},
	temperature: {
		name: "temperature",
		numeric: true,
		units: "c",
		precision: 1,
		range: [-50, 60],
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

export const PARAMETER_DEFAULTS: ClientParameters = [
	{ parameter: "pm25", unit: "ugm3", key: "pm_25" },
	{ parameter: "o_3", unit: "ppm", key: "o3" },
];

export const FLAG_DEFAULTS: ValueFlagMap = new Map<string | number, string>([
	[-99, "ERROR"],
	[-999, "ERROR"],
	["-99", "ERROR"],
	["-999", "ERROR"],
]);

export class Metric {
	key: string;
	parameter: Parameter;
	unit: string;
	numeric: boolean = true;
	precision?: number;
	converter: UnitConverter;
	#numberFormat: DecimalDigitGroup;
	#providerFlags: ValueFlagMap = new Map();

	constructor(
		parameter: string,
		unit: string,
		providerFlags?: ValueFlagMap,
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

		for (const [key, value] of providerFlags ?? []) {
			this.#providerFlags.set(key, value);
		}

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

		if (this.#providerFlags.has(v)) {
			// get the flag value that corresponds to the key
			throw new ProviderValueError(this.#providerFlags.get(v));
		}

		if (typeof v === "string") {
			nv = normalizeNumericString(v, this.#numberFormat);
			// this is an extra check to deal with numeric error codes
			// so that we dont have to have both -99 and '-99'
			if (this.#providerFlags.has(Number(nv))) {
				// get the flag value that corresponds to the key
				throw new ProviderValueError(this.#providerFlags.get(Number(nv)));
			} else if (Number.isNaN(Number(nv))) {
				// pass the original value back as the flag
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
