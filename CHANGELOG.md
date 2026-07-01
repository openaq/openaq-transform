# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.5.0] - unreleased

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
