import debug from "debug";

const log = debug("openaq-transform measurements: DEBUG");

import type { BBox } from "geojson";
import type { MeasurementData, MeasurementJSON } from "../types/measurement";
import type {
	ClientParameters,
	ParameterKeyFunction,
	PathExpression,
} from "../types/metric";
import { type Coordinates, updateBounds } from "./coordinates";
import type { Datetime } from "./datetime";

import { MissingAttributeError, TransformError } from "./errors";
import { Metric, PARAMETER_DEFAULTS } from "./metric";
import type { Sensor } from "./sensor";

export class Measurements {
	headers: string[];
	#measurements: Map<string, Measurement>;
	from?: Datetime;
	to?: Datetime;
	bounds?: BBox | null;
	parameters: Map<string | PathExpression | ParameterKeyFunction, Metric>;

	constructor(parameters: ClientParameters = PARAMETER_DEFAULTS) {
		this.#measurements = new Map<string, Measurement>();
		this.headers = [
			"sensor_id",
			"measure",
			"timestamp",
			"longitude",
			"latitude",
		];
		// build a map that goes from the client parameter key
		// to the api parameter
		this.parameters = new Map<
			string | PathExpression | ParameterKeyFunction,
			Metric
		>();
		for (const p of parameters) {
			const { parameter, unit, key } = p;
			this.parameters.set(key, new Metric(parameter, unit));
		}
	}

	parameterKeys() {
		return Array.from(this.parameters.keys());
	}

	metricFromProviderKey(key: string): Metric | undefined {
		return this.parameters.get(key);
	}

	add(measurement: Measurement) {
		if (measurement.coordinates) {
			this.bounds = updateBounds(measurement.coordinates, this.bounds);
		}

		if (this.to) {
			this.to = measurement.timestamp.greaterOf(this.to);
		} else {
			this.to = measurement.timestamp;
		}
		if (this.from) {
			this.from = measurement.timestamp.lesserOf(this.from);
		} else {
			this.from = measurement.timestamp;
		}

		log(
			`Adding measurement (${measurement.key})/${measurement.value} to measurements (total: ${this.length})`,
		);
		this.#measurements.set(measurement.key, measurement);
	}

	get length(): number {
		return this.#measurements.size;
	}

	json() {
		return Array.from(this.#measurements.values(), (m) => {
			const measurement: MeasurementJSON = {
				key: m.sensor?.key,
				timestamp: m.timestamp.toString(),
				value: m.value,
			};
			if (m.flags) measurement.flags = m.flags;
			if (m.coordinates) measurement.coordinates = m.coordinates.json();
			return measurement;
		});
	}
}

export class Measurement {
	sensor: Sensor;
	timestamp: Datetime;
	value: number | null;
	coordinates?: Coordinates;
	flags?: Array<string>;

	constructor(data: MeasurementData) {
		if (!data.sensor) throw new MissingAttributeError("sensor", data);
		if (!data.timestamp) throw new MissingAttributeError("timestamp", data);

		this.value = null;
		this.sensor = data.sensor;
		this.timestamp = data.timestamp;
		// the csv parser does not convert values to numbers
		// should we do something here to do that?
		// the only issue I see is if we expect a flag here, in which case we could catch an error?
		// at this stage we only want to get everything organized
		// if we are sure that a flag was passed as a value we make it null
		// and then add a flag

		try {
			this.value = this.sensor?.metric.process(data.value);
		} catch (e: unknown) {
			if (e instanceof TransformError) {
				if (e?.flag) {
					this.flags = [String(e.flag)];
				}
				this.value = typeof e.value === "number" ? e.value : null;
			}
		}

		if (data.coordinates) {
			this.coordinates = data.coordinates;
		}
	}

	get key(): string {
		return `${this.sensor.key}-${this.timestamp.toString()}`;
	}
}
