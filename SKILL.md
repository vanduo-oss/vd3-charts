---
name: vanduo-vd3-charts
description: Add or update Vue 3 SVG charts using @vanduo-oss/vd3-charts, including data, events, themes, and responsive behavior.
---

# Vanduo charts

Install `@vanduo-oss/vd3-charts` alongside Vue. Import the named component and
`@vanduo-oss/vd3-charts/css`; no global registration is needed. The stylesheet
has token fallbacks. If the app uses VD3, import its base CSS once in the app
entry to share the theme; choose `/css` or `/css/core`, not both.

## Tasks

- [Interactive bar chart](recipes/bar.vue): complete rows, field accessors,
  title/description, a visible data table, and the `bar-click` event.
- [Pie with theme refresh](recipes/pie.vue): complete data and a template ref.
  A pie defaults to a filled center; a donut defaults to a 0.62 inner radius.

Copy a recipe and replace its data. Keep stable row `id` values when data may
reorder; mark focus follows the id, then category/x and series. Removing a
focused mark moves focus to a remaining neighbor; an empty chart focuses its SVG.

Changing props redraws the chart. After ancestor CSS/theme changes that do not
change a prop, await Vue's next tick and call `chartRef.refresh()`. Every Vue
chart export exposes it. Core callers use `instance.render()`. Responsive
observation follows the current `responsive` option.

Verify keyboard arrows, Enter/Space events, a data update while focused, resize,
and touch details. Describe the chart's takeaway in prose; value labels and a
data table alone do not establish page accessibility.

Use [Vue declarations](dist/vue.d.ts) for props/events and
[core declarations](dist/core.d.ts) for factories, scales, and options. The
core factories share the root export and need a browser element; Vue components
create them on mount and can render an SSR shell. Always destroy manually
created core instances when their host is removed.
