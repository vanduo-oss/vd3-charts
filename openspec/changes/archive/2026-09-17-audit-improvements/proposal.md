# Reliable chart defaults and updates

## Why

The September 16 audit reproduced defects and identified avoidable integration and documentation costs.

## What changes

Absent options retain factory defaults. Updates reconcile resize observation, preserve logical mark focus, and support explicit theme refresh and touch details.

## Impact

Initial defect fixes preserve existing imports and need no migration from the Vue package. Additive APIs will be documented and require a minor release; release numbers are deferred until local QA is approved. No runtime dependencies are added.

## Non-goals

No remote writes, publication, deployment, new widget families, or replacement rendering engines. No edits to the old-line reference repositories.
