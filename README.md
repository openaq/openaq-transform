OpenAQ Transform

# TransformData Output

`TransformData` is the main output of the transform client, returned by `client.load()`. It contains everything the ingestor needs to process a batch of air quality data.

## Structure

```json
{
  "meta": {
    "schema": "v0.1",
    "sourceName": "provider-name",
    "ingestMatchingMethod": "ingest-id" | "source-spatial",
    "startedOn": "2024-01-01T00:00:00+00:00",
    "finishedOn": "2024-01-01T00:00:05+00:00",
    "exportedOn": "2024-01-01T00:00:05+00:00",
    "fetchSummary": { ... }
  },
  "measurements": [ ... ],
  "locations": [ ... ]
}
```

## `meta`

| Field | Type | Description |
|---|---|---|
| `schema` | `string` | Schema version for the output format. |
| `sourceName` | `string` | The provider name, used to identify the data source. |
| `ingestMatchingMethod` | `"ingest-id"` \| `"source-spatial"` | How the ingestor should match incoming data to existing records. `"ingest-id"` matches on the sensor key; `"source-spatial"` matches on coordinates. |
| `startedOn` | `string \| undefined` | Timestamp when `load()` began. |
| `finishedOn` | `string \| undefined` | Timestamp when `load()` completed. |
| `exportedOn` | `string \| undefined` | Timestamp when the output was serialized. |
| `fetchSummary` | `Summary` | Counts of locations, systems, sensors, flags, measurements, datetime range, bounding box, and error totals. Useful for logging and debugging. |

## `measurements`

An array of `MeasurementJSON` objects. Each represents a single sensor reading:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | The sensor key this measurement belongs to. Composed of provider, site, system, and metric info. |
| `timestamp` | `string` | ISO 8601 timestamp of the reading. |
| `value` | `number \| null` | The measured value after unit conversion/validation. `null` if the value was flagged. |
| `flags` | `string[] \| undefined` | Optional flags applied during value processing (e.g., out-of-range). |
| `coordinates` | `object \| undefined` | Optional per-measurement coordinates, only present for mobile sensors. |

## `locations`

An array of `LocationJSON` objects. Each represents a monitoring site and its full sensor hierarchy:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Unique location key (`{provider}-{siteId}`). |
| `site_id` | `string` | The provider's identifier for this site. |
| `site_name` | `string` | Human-readable name for the site. |
| `coordinates` | `object` | Longitude and latitude of the site. |
| `ismobile` | `boolean` | Whether the station is mobile. |
| `systems` | `SystemJSON[]` | Nested array of sensor systems (manufacturer/model groupings), each containing an array of sensors with their metric, intervals, status, and any flags. |

## Key relationships

```
Location (site)
  └── System (manufacturer + model)
        └── Sensor (metric + version + instance)
              └── Measurements (timestamped values)
```

Measurements reference sensors by key. The ingestor uses this hierarchy to upsert location/system/sensor metadata and then append measurements.
