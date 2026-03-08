# Technical Architecture

## Recommended stack

### Frontend shell

- **Astro**
- **TypeScript**
- **Tailwind CSS** or a very small CSS-token system

### Interactive components

- **React** for timeline, filters, detail drawer, and synchronized map state
- **D3** for the custom time scale, zoom, brushing, and layout logic
- **MapLibre GL JS** for the map and GeoJSON overlays

### Content / editing

- **Keystatic** in GitHub mode for editing events, actors, places, and pages

### Validation / build pipeline

- **Zod** schemas or equivalent typed validation at build time
- custom content compiler to emit optimized JSON / GeoJSON artifacts

### Deployment

- static deployment via **Cloudflare Pages**, **Netlify**, or **Vercel**
- object storage optional later if the media library becomes large

## Why this stack is the best fit

## 1) Astro for the shell

This site is not a pure SaaS application. It is a **publication-grade research website** with a few highly interactive areas.

Astro is the best fit because:

- it keeps most pages static by default,
- supports a strong editorial layout layer,
- and lets us hydrate only the interactive parts.

That means the timeline page can still use React where necessary without turning the entire site into a heavy SPA.

## 2) React only where interaction is real

React is appropriate for:

- timeline state
- selection state
- filters
- synchronized map/detail behavior
- URL state

Using React only inside islands keeps the interface maintainable without sacrificing performance.

## 3) D3 for the timeline

Do not use a generic timeline plugin as the core interaction layer.

Reasons:

- you need custom lane logic,
- mixed precision dates,
- point and duration events,
- dense periods around 2021,
- and a design language closer to FT / NYT / FA than a library default.

D3 is the right low-level tool because it gives full control over:

- time scales,
- axis ticks,
- lane packing,
- brushing,
- zoom transforms,
- and custom rendering.

## 4) MapLibre over legacy map defaults

MapLibre GL JS is the best map choice for this project because it provides:

- performant interactive mapping,
- modern vector styling,
- GeoJSON source support,
- and precise control over overlays and viewport changes.

It is better suited than a simpler plugin-based stack when the map is part of the analytical argument and not just a pin board.

## 5) Keystatic for editing

You want to continue gathering and editing material after launch.

Keystatic is a strong fit because it:

- lets non-developers edit **Markdown / JSON / YAML in the repo**,
- works locally or through GitHub,
- supports image fields,
- supports structured collections,
- and avoids the complexity of a separate heavyweight CMS.

This gives you a clean Git-tracked research archive and a friendly editing UI.

## Why not fork Forensic Architecture Timemap directly

Timemap is a very important reference and informs the architecture conceptually.

But for this project it should not be the main base because:

- the original repo is marked **not actively maintained**,
- it carries older assumptions and internal data contracts,
- and a custom build will be cleaner for your exact research needs.

The better use of Timemap is:

- study the interaction model,
- borrow the useful abstractions,
- and implement a new project with a modern, simpler content pipeline.

## Recommended application architecture

### Layer 1 — content source

Canonical source files live in the repository:

- `src/content/events/*`
- `src/content/actors/*`
- `src/content/places/*`
- `src/content/pages/*`
- `src/assets/images/*`

These are edited through Keystatic.

### Layer 2 — validation and compilation

A build script should:

- validate schemas,
- resolve references,
- normalize dates,
- create derived fields,
- emit `events.json`, `events.geojson`, and lookup tables,
- and fail loudly on invalid records.

### Layer 3 — presentation

The app reads the compiled artifacts rather than raw content files in the browser.

This keeps the runtime fast and predictable.

## Runtime state model

Use a small central client store for:

- selected event id
- selected filters
- timeline range
- zoom level
- hovered event id
- map viewport

Keep this small and explicit.

Avoid introducing a global state framework unless genuinely needed. React context plus a lightweight store is enough.

## Data delivery strategy

### Recommended for V1

Static prebuilt data files:

- `/data/events.index.json`
- `/data/events.by-year/2021.json`
- `/data/events.geojson`
- `/data/actors.json`
- `/data/places.json`

This supports fast deployment and simple caching.

### Optional V2

If the project later needs multi-editor workflow, large asset sets, or dynamic querying:

- move media to object storage,
- optionally mirror event data into Postgres / PostGIS,
- and keep the Git-based content model as the editorial source.

## Media strategy

### Images

- store originals in the repo only if the media library remains modest
- otherwise place originals in cloud storage and keep optimized derivatives local or CDN-served
- always generate responsive sizes
- always require alt text or editorial description

### Documents

- support linking to PDFs and external evidence, but do not force the timeline app to ingest everything inline

## Performance rules

- hydrate only the timeline page widgets
- lazy-load the map module
- lazy-load full-size images
- virtualize or cull labels when density is high
- precompute lane positions where practical
- prefer CSS transforms for motion

## Testing requirements

- schema validation tests
- URL state tests
- timeline zoom tests
- filter interaction tests
- map-event synchronization tests
- visual regression screenshots for core states

## Future-safe extension path

The architecture should be compatible with future additions like:

- actor profile pages
- place pages
- relationship graph view
- source index
- bilingual content
- a print-friendly research dossier mode

These should be possible without rebuilding the entire system.

## Official documentation / reference links

- Astro: https://docs.astro.build/
- Keystatic: https://keystatic.com/docs/introduction
- MapLibre GL JS: https://www.maplibre.org/maplibre-gl-js/docs/
- D3: https://d3js.org/
- Forensic Architecture Timemap: https://github.com/forensic-architecture/timemap
- Forensic Architecture Datasheet Server: https://github.com/forensic-architecture/datasheet-server
- Bellingcat Ukraine TimeMap: https://github.com/bellingcat/ukraine-timemap
