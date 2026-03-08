# Data Model

## Goal

The data model must support two things at the same time:

1. **easy ongoing editing** by a researcher,
2. **efficient frontend reading** by the website.

The best way to achieve this is to separate:

- **authoring format** from
- **compiled delivery format**.

## Recommended content strategy

### Authoring format

Human-edited content in Markdown-based files with structured frontmatter.

Use these collections:

- `events`
- `actors`
- `places`
- `pages`

### Delivery format

Build step compiles these into:

- normalized JSON lookups
- flattened timeline event arrays
- GeoJSON for map rendering
- optional by-year chunks for faster loading

This preserves editability without making the browser parse your raw editorial structure.

## Canonical entities

## 1) Event

This is the core record.

### Required fields

- `id`
- `title`
- `slug`
- `start`
- `datePrecision`
- `summary`
- `category`
- `actors`
- `places`

### Recommended optional fields

- `end`
- `isOngoing`
- `body`
- `commentary`
- `tags`
- `sourceRefs`
- `imageRefs`
- `coverImage`
- `geometry`
- `mapViewport`
- `confidence`
- `verificationStatus`
- `relatedEvents`
- `featured`

### Event frontmatter example

```md
---
id: evia-2021-direct-assignment-benos
slug: direct-assignment-benos
title: Direct assignment of North Evia regeneration program to S. Benos
start: 2021-08-12
end:
datePrecision: day
isOngoing: false
category: reconstruction-governance
actors:
  - actor-stavros-benos
  - actor-greek-government
places:
  - place-athens
  - place-north-evia
summary: >-
  The government directly assigned the regeneration program for North Evia to Stavros Benos,
  shaping the institutional architecture of post-fire reconstruction.
tags:
  - governance
  - reconstruction
  - committee
sourceRefs:
  - src-gov-announcement-2021-08-12
imageRefs:
  - img-benos-announcement-01
coverImage: img-benos-announcement-01
confidence: high
verificationStatus: verified
geometry:
  type: Point
  coordinates: [23.7275, 38.0]
mapViewport:
  center: [23.7275, 38.0]
  zoom: 7.5
relatedEvents:
  - evia-2021-masterplan-presentation
featured: true
---

Optional extended commentary goes here in Markdown.

Use this area for:

- context,
- implications,
- contested interpretations,
- and links to related processes.
```

## 2) Actor

An actor can be a person, ministry, municipality, NGO, donor, consultant, company, committee, union, or informal collective.

### Actor fields

- `id`
- `name`
- `slug`
- `type`
- `summary`
- `aliases`
- `parentActors`
- `tags`
- `website`

### Actor example

```md
---
id: actor-diazoma
slug: diazoma
name: DIAZOMA
type: civil-society-organization
aliases: []
parentActors: []
summary: >-
  Organization involved in meetings, plans, and reconstruction-related processes in North Evia.
tags:
  - reconstruction
  - culture
  - planning
website:
---
```

## 3) Place

A place is not just a label. It should support cartographic behavior.

### Place fields

- `id`
- `name`
- `slug`
- `type`
- `center`
- `bbox`
- `geometry` (optional)
- `parentPlace`
- `notes`

### Place example

```md
---
id: place-north-evia
slug: north-evia
name: North Evia
type: region
center: [23.4, 38.85]
bbox: [22.9, 38.55, 24.1, 39.2]
parentPlace: place-evia
notes: >-
  Main territorial frame for the 2021 wildfire and reconstruction process.
---
```

## 4) Source reference

Sources can be stored as inline event metadata in V1, but the model should be ready for a dedicated source collection.

### Recommended source fields

- `id`
- `title`
- `type`
- `publisher`
- `date`
- `url`
- `accessDate`
- `archiveUrl`
- `language`
- `notes`

## 5) Media reference

Keep media as structured metadata rather than only raw files.

### Media fields

- `id`
- `type`
- `file`
- `alt`
- `caption`
- `credit`
- `sourceUrl`
- `license`
- `focalPoint`

## Category taxonomy

Start with a normalized taxonomy that generalizes the uploaded 2021 mockup.

### Recommended category keys

- `wildfire`
- `fire-season`
- `suppression`
- `evacuation`
- `weather`
- `flood`
- `forestry-policy`
- `legislation`
- `spatial-planning`
- `reconstruction-governance`
- `contract`
- `donation`
- `municipal-action`
- `state-agency-action`
- `civil-society-action`
- `protest`
- `election`
- `private-actor`
- `study-report`
- `infrastructure`

## Date model

Use ISO-like strings wherever possible.

### Rules

- `start` required
- `end` optional
- `datePrecision` required and one of:
  - `year`
  - `month`
  - `day`
  - `approximate`
- `isOngoing` boolean

### Rendering rules

- point event: `end` absent
- duration event: `end` present or `isOngoing=true`
- approximate dates should render with visual distinction

## Spatial model

Store mapable data as GeoJSON-compatible structures.

### Acceptable geometry types

- `Point`
- `LineString`
- `Polygon`
- `MultiPolygon`

If exact geometry is unknown, provide:

- `places` reference,
- fallback `mapViewport`,
- and optional `center` point.

## Folder structure

```text
src/
  content/
    events/
      1970/
      1980/
      1990/
      2000/
      2010/
      2020/
    actors/
    places/
    pages/
  assets/
    images/
      events/
      actors/
      places/
public/
  data/
    events.index.json
    events.geojson
    actors.json
    places.json
    events.by-year/
```

## Compiled outputs

### `events.index.json`

A flattened, presentation-friendly array with resolved actor/place labels and derived fields.

### `events.geojson`

Map-ready features for events with geometry.

### `actors.json`

Lookup table keyed by actor id.

### `places.json`

Lookup table keyed by place id.

## Derived fields to compute at build time

- `startTs`
- `endTs`
- `durationDays`
- `hasGeometry`
- `actorCount`
- `placeCount`
- `year`
- `decade`
- `displayDate`
- `sortKey`

## Validation rules

The build must fail if:

- an event references a missing actor
- an event references a missing place
- `end` is before `start`
- required fields are missing
- geometry is invalid
- duplicate ids exist
- unknown category keys are used

## Best editorial practice

Keep the authoring model strict.

A rigid schema is a benefit here, not a burden. It prevents the archive from becoming inconsistent over time.

## Optional phase 2 database model

If the project grows beyond Git-based editing:

- mirror events to Postgres
- store geometry in PostGIS
- keep Git files as the editorial canonical source or as a synced source

But for V1, files + compiled JSON is the right level of complexity.
