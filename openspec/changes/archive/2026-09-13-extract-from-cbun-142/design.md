# Design

Flatten `vd3-cbun/src/charts/*` to `src/`. Single-entry build with isolation
guard (all inputs under `src/`, only `vue` external). Package identity
`@vanduo-oss/vd3-charts`. Scaffold follows cbun widget QA plus vd3 hygiene
(stylelint, CONTRIBUTING, markdown CI skip).
