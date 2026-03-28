# OpenAQ Transform

A Typescript library for transforming air quality data sources into a single
standardized output.

> [!WARNING]
> OpenAQ Transform is a work in progress and may contain breaking changes until
> reaching a 1.0.0 version

## Overview

OpenAQ transform provides a declarative configuration layer to solve common
tasks for transforming, normalizing and reshaping air quality measurement data.

## Core Concepts

### Client

The `Client` class is the main entry point for defining how Transform fetches,
parses, and processes data from an external source. To connect a new data
source, you extend one of the platform-specific subclasses such as `NodeClient`
and configure it by setting properties on the class.

At minimum a client needs a `provider` name and a `resource` to fetch from:

```ts
export class Client extends NodeClient {
  provider = 'example';
  resource = new Resource({ url: 'https://api.example.com/data' });
}
```

Calling `client.load()` on an instance will fetch the resource, parse the
response, and return the processed data in a format ready for ingestion.

For sources that expose separate endpoints for locations and measurements,
`resource` can be an indexed object. Each key maps to a named resource, and the
results are accumulated and made available to subsequent resource reads via
`DataContext`:

```ts
export class Client extends NodeClient {
  provider = 'example';
  resource = {
    locations: new Resource({ url: 'https://api.example.com/locations' }),
    measurements: new Resource({ url: 'https://api.example.com/measurements' }),
  };
}
```

The `reader` and `parser` properties control how each resource is fetched and
transformed. The values default to `"api"` and `"json"` respectively, which
covers most REST APIs returning JSON. Custom readers and parsers can be provided
as functions, or as indexed objects to use different strategies per resource.

### Resource

The `Resource` class defines an external data source, either a remote URL or an
uploaded file, and provides it to a reader along with any configuration needed
to fetch it.

```ts
new Resource({
  url: 'https://api.example.com/data'
})
```

#### File resources

A `Resource` can also wrap an uploaded `File` object. Note that `parameters` and
`body` cannot be used with file resources.

```ts
new Resource({ file: uploadedFile })
```

#### Parameters

The `parameters` option generates one URL (and optional body) per parameter
object. In its simplest form it is a static array:

```ts
new Resource({
  url: 'https://api.example.com/data?page=:page',
  parameters: [{ page: 1 }, { page: 2 }, { page: 3 }]
})
```

Parameters can also be a function that receives the accumulated `DataContext`,
the combined result of all previously loaded resources, and returns an array of
parameter objects. This allows later resources to be parameterised using values
fetched by earlier ones:

```ts
new Resource({
  url: 'https://api.example.com/locations/:id/measurements',
  parameters: (d) => d.locations.map(location => ({ id: location.id }))
})
```

Parameters can also be a JMESPath expression evaluated against the same
`DataContext`:

```ts
new Resource({
  url: 'https://api.example.com/locations/:id/measurements',
  parameters: { type: 'jmespath', expression: 'locations[*].{id: id}' }
})
```

#### Body

For HTTP POST requests, `body` accepts a `string`, `URLSearchParams`, or
`FormData`. Template variables in the body are substituted using the same`:key`
syntax as the URL:

```ts
new Resource({
  url: 'https://api.example.com/data',
  body: JSON.stringify({ station: ':station' }),
  parameters: [{ station: 'ABC' }, { station: 'DEF' }]
})
```

#### Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | | URL template with optional `:key` placeholders |
| `file` | `File` | | Uploaded file object. Mutually exclusive with `url` |
| `parameters` | `Parameters[] \| function \| PathExpression` | | Generates one request per parameter object |
| `body` | `string \| URLSearchParams \| FormData` | | Request body for POST requests. URL resources only |
| `output` | `"array" \| "object"` | | How to combine responses from multiple URLs. See [API reader](#api-reader) |
| `readAs` | `"json" \| "text" \| "blob"` | | Overrides content-type detection |
| `strict` | `boolean` | `false` | If `true`, throws on first error. If `false`, errors are passed to `errorHandler` |

### Readers

Transform provides built-in readers to handle common methods of fetching data
including HTTP calls using the `fetch` API and file-based interfaces for Node.js
using `fs.readFile` or file uploads in the browser through the `File` API.

Readers are used in the context of a `Client` subclass, where the `reader`
property controls which reader is used when `client.load()` is called. The
`reader` property accepts:

- a string (e.g. `"api"`) — resolved to a built-in reader
- a function — a custom reader used for all resources
- an object of key → string or function — for indexed resources, one reader per
resource key

#### API reader

The `api` built-in reader fetches data from one or more URLs defined on a
`Resource`, with support for pagination, content-type detection, and flexible
output strategies.

##### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `resource` | `Resource` | required | Resource instance with `urls`, `output`, `readAs`, and `strict` |
| `options` | `RequestInit` | `{ method: "GET" }` | HTTP fetch options passed to `fetch()` |
| `concurrency` | `number` | `3` | Number of URLs fetched in parallel |
| `errorHandler` | `function` | `undefined` | `(error, strict) => void`; if omitted, errors are logged and thrown when `strict` is set |

##### Output

The `resource.output` property controls how responses from multiple URLs are combined:

| `output` | Behavior |
| --- | --- |
| `undefined` (default) | Returns response as-is; single URL → value, multiple URLs → array |
| `"array"` | Array responses are flattened; object responses are collected; always returns an array |
| `"object"` | All responses are merged by concatenating nested arrays; always returns an object |

##### Content-type detection

Unless `resource.readAs` is set explicitly, the reader auto-detects the read
format from the `Content-Type` response header.

#### Custom reader

A custom reader is an function assigned to the `reader` property of a `Client`
subclass. It must be an arrow function to correctly the Client `this` context
such as `this.readers`.

```ts
async ({ resource, options }, parser, data) => {
  // ...
}
```

Custom readers can call built-in readers via `this.readers`, which is useful for 
nwrapping API responses before they reach the field mapping stage:

```ts
export class Client extends NodeClient {
  provider = 'example';
  resource = {
    measurements: new Resource({ url: 'https://api.example.com/v1/measurements' }),
    locations: new Resource({ url: 'https://api.example.com/v1/locations' }),
  };
  parser = 'json';
  reader = {
    locations: async ({ resource, options }, parser, data) => {
      const res = await this.readers.api({ resource, options }, parser, data);
      return res.results;
    },
    measurements: async ({ resource, options }, parser, data) => {
      const res = await this.readers.api({ resource, options }, parser, data);
      return res.results;
    }
  };
}
```

In this example, the API returns an object like `{ results: [...] }`. Because
`resource.output` is not set to `"array"`, `apiReader` returns the object as-is,
and the custom reader unwraps `.results` before returning it for processing.

The `data` parameter contains the accumulated resource data from previously
loaded resources and can be forwarded to `this.readers.api` when later resources
depend on earlier ones. When no dependency exists, it can be passed as `{}` or
omitted.

### Parsers

Parsers are used to parse string data as returned from a reader and parse into
JavaScript objects for transformation. Parsers are provided to Readers as a
dependency to allow the reader to return deserialized data objects.

OpenAQ transform provides pre-built parsers for common serialized data formats
such as JSON, csv, and tsv. You can write  a custom parser to handle other
one-off cases as needed, but the core provided parsers are intended to handle
most cases.

### Field mappings

After data are read and parsed the transform Client can map fields from the
original form to create the standardized output. Data field lookups can be
defined in three different ways:

- Key lookups from a string e.g. 'locationId', 'datetime'
- A path expression using a DSL such a JMESpath to look up values e.g.
`.coordinates.latitude`
- A function for dynamically joining, reshaping or otherwise manipulating the
field values e.g. ```(d) => `${d.dateString}T${d.time}Z```

#### Parameter and unit mappings

OpenAQ transform provide built-in definitions for common air quality and
meteorological parameters, including PM, ozone, NOx, SO₂, CO, temperature,
relative humidity, and pressure. Each definition specifies a canonical parameter
name, a standard output unit, and a set of converters that normalize provider
data into that unit automatically.

To use a parameter, you supply a parameter mapping that tells `transform` how to
find and interpret values in your source data. Each mapping has three fields:

- `parameter` — The canonical parameter name used by `transform` (e.g. `"pm25"`,
`"o3"`, `"temperature"`).
- `unit` — The unit your source data uses (e.g. `"ug/m3"`, `"ppb"`, `"f"`).
   transform will convert this to the standard output unit automatically.
- `key` — The column name (wide format) or the value of the parameter name field
  (long format, set via `parameterNameKey`) that identifies this parameter in
  the source data.

e.g.

```ts
{ parameter: 'pm25', unit: 'ug/m3', key: 'pm25' }
```

## Guides

### Long format data

Data in long format is where each variable is a column and each observation is a
row. To handle data in the format openaq-transform needs information on the
column 

```ts
import { NodeClient } from 'openaq-transform/node';
import { Resource } from 'openaq-transform/core';


export class Client extends NodeClient {
  provider = 'example'
  resource = {
      locations: new Resource({ url: 'https://api.example.com/locations' }),
      measurements: new Resource({ url: 'https://api.example.com/measurements' })
  };
  parser = 'json';
  reader = 'api;
  averagingIntervalKey = () => 3600;
  isMobileKey = () => false;
  longFormat = true
  locationIdKey = 'locationId'
  datetimeKey = 'datetime'
  locationLabelKey = 'name'
  xGeometryKey = 'lon'
  yGeometryKey = 'lat'
  parameterNameKey = 'parameter'
  parameterValueKey = 'value'
  datetimeFormat = null
  parameters = [
    { parameter: 'pm25', unit: 'ug/m3', key: 'pm25' },
  ]
}

```


### Wide format data

```ts

```


## TransformData Output

`TransformData` is the main output of the transform client, returned by `client.load()`. It contains everything the ingestor needs to process a batch of air quality data.

### Structure

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

### `meta`

| Field | Type | Description |
| --- | --- | --- |
| `schema` | `string` | Schema version for the output format. |
| `sourceName` | `string` | The provider name, used to identify the data source. |
| `ingestMatchingMethod` | `"ingest-id"` \| `"source-spatial"` | How the ingestor should match incoming data to existing records. `"ingest-id"` matches on the sensor key; `"source-spatial"` matches on coordinates. |
| `startedOn` | `string \| undefined` | Timestamp when `load()` began. |
| `finishedOn` | `string \| undefined` | Timestamp when `load()` completed. |
| `exportedOn` | `string \| undefined` | Timestamp when the output was serialized. |
| `fetchSummary` | `Summary` | Counts of locations, systems, sensors, flags, measurements, datetime range, bounding box, and error totals. Useful for logging and debugging. |

### `measurements`

An array of `MeasurementJSON` objects. Each represents a single sensor reading:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | The sensor key this measurement belongs to. Composed of provider, site, system, and metric info. |
| `timestamp` | `string` | ISO 8601 timestamp of the reading. |
| `value` | `number \| null` | The measured value after unit conversion/validation. `null` if the value was flagged. |
| `flags` | `string[] \| undefined` | Optional flags applied during value processing (e.g., out-of-range). |
| `coordinates` | `object \| undefined` | Optional per-measurement coordinates, only present for mobile sensors. |

### `locations`

An array of `LocationJSON` objects. Each represents a monitoring site and its full sensor hierarchy:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Unique location key (`{provider}-{siteId}`). |
| `site_id` | `string` | The provider's identifier for this site. |
| `site_name` | `string` | Human-readable name for the site. |
| `coordinates` | `object` | Longitude and latitude of the site. |
| `ismobile` | `boolean` | Whether the station is mobile. |
| `systems` | `SystemJSON[]` | Nested array of sensor systems (manufacturer/model groupings), each containing an array of sensors with their metric, intervals, status, and any flags. |

### Key relationships

```
Location (site)
  └── System (manufacturer + model)
        └── Sensor (metric + version + instance)
              └── Measurements (timestamped values)
```

Measurements reference sensors by key. The ingestor uses this hierarchy to upsert location/system/sensor metadata and then append measurements.
