# audit-reliability Specification

## Purpose
Reliability behavior accepted from the charts audit: preserving factory
defaults when Vue props are omitted, reconciling resize observation on
updates, preserving logical mark focus across redraws, and supporting theme
refresh.

## Requirements

### Requirement: Reviewed improvements preserve supported integrations

The package SHALL implement the accepted audit changes without silently discarding user state or breaking documented imports.

#### Scenario: Existing consumer updates

- **GIVEN** a consumer using the documented package imports
- **WHEN** the audited interactions and updates are exercised
- **THEN** the behavior MUST meet the item-specific acceptance criteria in the audit backlog and have regression coverage

### Requirement: Pie wrappers preserve factory defaults

Generic and typed Vue pie exports SHALL keep a filled pie when `innerRadiusRatio` is absent. Donut SHALL keep its hole.

#### Scenario: Built pie exports without an explicit radius

- **GIVEN** the built package pie wrappers
- **WHEN** `innerRadiusRatio` is omitted or the Vue prop is removed
- **THEN** each ordinary slice MUST render one outer arc and donut MUST retain its inner hole

### Requirement: Chart updates keep observation, focus, and theme refresh

Responsive observation SHALL follow the current option. Data redraws SHALL keep logical focus when the mark still exists. Vue `refresh()` SHALL redraw after CSS-only theme changes.

#### Scenario: Responsive false then true then false

- **GIVEN** a Vue chart wrapper
- **WHEN** `responsive` changes false → true → false and data or size updates
- **THEN** ResizeObserver usage, surviving mark focus, and `refresh()` MUST match the documented contract
