# Implementation Plan

## Development approach

Build the project in clear phases. Do not try to perfect everything at once.

## Phase 0 — scaffold and data contract

### Goals

- initialize Astro + React + TypeScript project
- install Keystatic
- define content collections
- define validation schemas
- create seed data for actors, places, and events

### Deliverables

- working project shell
- content schema
- basic example records
- linting / formatting / type checking

## Phase 1 — static editorial shell

### Goals

- build landing page
- build base layout
- build typography, spacing, and color tokens
- create page routes: `/`, `/timeline`, `/about`, `/sources`

### Deliverables

- design system foundations
- responsive layout
- publication-ready static shell

## Phase 2 — timeline engine

### Goals

- build the timeline component with D3
- support point and duration events
- add zoom and pan
- add adaptive tick density
- add event selection state

### Deliverables

- custom timeline UI
- smooth overview-to-detail zoom behavior
- lane logic for categories or tracks

## Phase 3 — detail panel

### Goals

- build event detail drawer / side panel
- connect selected event to rendered content
- support image, summary, commentary, actors, places, and sources

### Deliverables

- stable event detail view
- keyboard and focus behavior
- URL state support if feasible

## Phase 4 — map integration

### Goals

- add MapLibre map
- render event GeoJSON
- sync map with timeline selection
- support point / line / polygon events
- implement fallback viewport behavior

### Deliverables

- synchronized map + timeline
- selected geometry highlight
- subdued basemap styling

## Phase 5 — filters and search

### Goals

- category filters
- actor filters
- place filters
- date range filter
- tag filter
- reset behavior

### Deliverables

- usable filtering system
- clear empty state handling
- stable selected-event behavior under filtering

## Phase 6 — editorial workflow hardening

### Goals

- refine Keystatic collections
- validate media workflow
- ensure non-developer editing works
- add sample instructions in repo

### Deliverables

- editor-friendly content operations
- sample records and templates
- build errors that are readable

## Phase 7 — polish and QA

### Goals

- accessibility pass
- responsive pass
- performance pass
- visual refinement
- metadata / SEO basics

### Deliverables

- reduced-motion support
- image optimization
- sensible Lighthouse scores
- final publication polish

## Engineering rules

- keep components small and explicit
- prefer typed data everywhere
- no unnecessary dependency bloat
- avoid generic chart/timeline packages unless clearly justified
- fail fast on bad content data

## Recommended repository shape

```text
/
  src/
    components/
    layouts/
    pages/
    content/
    assets/
    lib/
      data/
      timeline/
      map/
      utils/
  public/
    data/
  scripts/
    build-data.ts
  keystatic.config.ts
  astro.config.mjs
```

## Definition of done for V1

V1 is done when:

- the interface is visually coherent
- the timeline is fully interactive
- the map is synchronized
- content is editable through structured files / admin UI
- sample Evia entries demonstrate the whole workflow
- and the site is fit for serious review and iteration
