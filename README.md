# @vanduo-oss/vd3-charts

<a href="https://snyk.io/?utm_source=open-source&utm_medium=pg-ptr&utm_campaign=ref-2501-osp&utm_content=pg-cta"><img src="https://raw.githubusercontent.com/vanduo-oss/vd3-charts/main/assets/scanned-by-snyk.png" alt="Scanned by Snyk" width="206" height="141"></a>

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

SVG bar, line, area, scatter, donut, and pie charts for Vue 3, plus a framework-agnostic core. Peer: `vue >=3.3.0`.

**Status: 1.2.0.** `VD_CHARTS_VERSION` matches the package version. Guides: [vd3.vanduo.dev](https://vd3.vanduo.dev/). Agents: [SKILL.md](./SKILL.md).

## Install

```sh
pnpm add @vanduo-oss/vd3-charts
```

## Import

```js
import { VdBarChart, VD_CHARTS_VERSION } from '@vanduo-oss/vd3-charts';
import '@vanduo-oss/vd3-charts/css';
```

Named exports only. Vue wrappers are the primary surface. Core factories, scales, and helpers are re-exported and do not import Vue. `vue` stays external. The build fails if anything other than `vue` is externalized.

Charts use Vanduo `--vd-*` tokens, with fallbacks. `@vanduo-oss/vd3` is not a dependency. Import `@vanduo-oss/vd3/css` or `@vanduo-oss/vd3/css/core` once when the app already uses vd3. `/css/core` is not tokens-only; token JSON is `@vanduo-oss/vd3/tokens.json`.

## Security

This repo is monitored with [Snyk](https://snyk.io/?utm_source=open-source&utm_medium=pg-ptr&utm_campaign=ref-2501-osp&utm_content=pg-cta).

- Nothing is bundled beyond the `vue` peer.
- Hardened `.npmrc`: `ignore-scripts`, `minimum-release-age`, `save-exact`, `strict-peer-dependencies`, `trust-policy=no-downgrade`, `block-exotic-subdeps`, and an explicit `registry`.
- [MIT](./LICENSE). No vendored third-party runtime code.

## Exports

| Export | Contents |
| --- | --- |
| `@vanduo-oss/vd3-charts` | Vue wrappers, core factories, scales, helpers, `VD_CHARTS_VERSION` |
| `@vanduo-oss/vd3-charts/css` | Stylesheet (`dist/vd3-charts.css`) |

## Development

Node 26 LTS (`nvm use` from `.nvmrc`) and pnpm >= 10. `engines.node` `>=20.19.0` is the consumer floor. `pnpm release:check` is the pre-publish gate. `pnpm test:types` and `pnpm test:e2e` need `pnpm build` first. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Documentation

- [vd3.vanduo.dev](https://vd3.vanduo.dev/)
- [SKILL.md](./SKILL.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

[MIT](./LICENSE) © Vanduo
