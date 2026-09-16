## ADDED Requirements

### Requirement: Reviewed improvements preserve supported integrations

The package SHALL implement the accepted audit changes without silently discarding user state or breaking documented imports.

#### Scenario: Existing consumer updates

- **Given** a consumer using the documented package imports
- **When** the audited interactions and updates are exercised
- **Then** the behavior MUST meet the item-specific acceptance criteria in the audit backlog and have regression coverage

### Requirement: Pie wrappers preserve factory defaults

Generic and typed Vue pie exports SHALL keep a filled pie when `innerRadiusRatio` is absent. Donut SHALL keep its hole.

#### Scenario: Built pie exports without an explicit radius

- **Given** the built package pie wrappers
- **When** `innerRadiusRatio` is omitted or the Vue prop is removed
- **Then** each ordinary slice MUST render one outer arc and donut MUST retain its inner hole

### Requirement: Chart updates keep observation, focus, and theme refresh

Responsive observation SHALL follow the current option. Data redraws SHALL keep logical focus when the mark still exists. Vue `refresh()` SHALL redraw after CSS-only theme changes.

#### Scenario: Responsive false then true then false

- **Given** a Vue chart wrapper
- **When** `responsive` changes false → true → false and data or size updates
- **Then** ResizeObserver usage, surviving mark focus, and `refresh()` MUST match the documented contract
