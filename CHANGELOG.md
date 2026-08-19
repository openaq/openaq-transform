# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.5.0] - unreleased

### Added
- `Client`, `NodeClient`, and `BrowserClient` now accept a generic `secrets` type parameter (`Client<R, P, S>`), letting subclasses declare an interface for API keys/tokens/credentials.
- New `datetimeType` client option (`"string" | "seconds" | "milliseconds"`) for parsing Unix timestamps directly.
- `Resource` now accepts a `context` option for access context from parameters or previous data.
- New `ConfigError` and `DatetimeError` error classes.
- `pressure` parameter now supports an `mmhg` unit converter, and its range was widened to `[475, 1100]`.

### Changed
- **Breaking:** All generated keys (`Location`, `System`, `Sensor`, `Measurement`, `Flag`) now use `/` as the segment delimiter instead of `-` (e.g. `provider/siteId` instead of `provider-siteId`). Any code or downstream consumers that parse or compare these keys will need to be updated.
- **Breaking:** `System.manufacturerName`/`modelName` no longer default to the string `"default"`, defaults to `undefined.` slashes and colons stripped/collapsed are sanitized before being used in a key.
-  Measurement processing checks blank values through a single `isBlank()` check.

### Fixed
- `Coordinates` no longer incorrectly rejects a valid `(0, 0)` coordinate.

## [0.4.0] - 2026-06-26

### Added

* Added `jmespath()` helper function as the preferred method to define a JMESPath query.
* Added `constant()` helper function as the preferred method to define a constant.
* Performance optimization flag `"sideEffects": false` to `package.json` to
improve bundler tree-shaking capabilities.

### Changed

* **[BREAKING]** Changed package name from `openaq-transform` to `@openaq/transform`
* **[BREAKING]** Renamed all mapping properties on the `Client` configuration
and instance levels to drop the `Key` suffix for cleaner naming conventions:
  * `locationIdKey` to `locationId`
  * `locationLabelKey` to `locationLabel`
  * `parameterNameKey` to `parameterName`
  * `parameterValueKey` to `parameterValue`
  * `flagsKey` to `flags`
  * `yGeometryKey` to `yGeometry`
  * `xGeometryKey` to `xGeometry`
  * `geometryProjectionKey` to `geometryProjection`
  * `manufacturerKey` to `manufacturer`
  * `modelKey` to `model`
  * `ownerKey` to `owner`
  * `datetimeKey` to `datetime`
  * `licenseKey` to `license`
  * `isMobileKey` to `isMobile`
  * `loggingIntervalKey` to `loggingInterval`
  * `averagingIntervalKey` to `averagingInterval`
  * `sensorStatusKey` to `sensorStatus`
* Made `PARAMETERS` map available as export and configurable at the `Client`.
* Updated mapping properties to support accepting primitive literals (`boolean`,
`number`, or `ConstantValue`) as constants when dynamic lookups or function
maps are unnecessary.
* Changed signature for JMESPath PathExpressions, removing `expression` field
in favor of `value`.
* Enforced a stricter, updated minimum Node runtime engine requirement based on 
[security releases](https://nodejs.org/en/blog/vulnerability/june-2026-security-releases)
* Replaced the internal `debug` logger utility with the `obug` library for core
client diagnostic logging.
