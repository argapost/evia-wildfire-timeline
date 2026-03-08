# Content Templates

## Event template

```md
---
id: evia-YYYY-short-slug
slug: short-slug
title: Clear factual event title
start: YYYY-MM-DD
end:
datePrecision: day
isOngoing: false
category: legislation
actors:
  - actor-example
places:
  - place-example
summary: >-
  One to three sentence summary of the event.
tags:
  - tag-one
  - tag-two
sourceRefs:
  - src-example-001
imageRefs:
  - img-example-001
coverImage: img-example-001
confidence: high
verificationStatus: verified
geometry:
  type: Point
  coordinates: [23.0000, 38.0000]
mapViewport:
  center: [23.0000, 38.0000]
  zoom: 8
relatedEvents: []
featured: false
---

Longer commentary in Markdown.

Use this space for context, interpretation, and relation to other processes.
```

## Duration event template

```md
---
id: evia-YYYY-duration-example
slug: duration-example
title: Duration event title
start: 2021-08-01
end: 2021-08-13
datePrecision: day
isOngoing: false
category: wildfire
actors:
  - actor-fire-brigade
places:
  - place-north-evia
summary: >-
  Summary of the duration event.
tags:
  - fire-front
sourceRefs:
  - src-example-002
imageRefs: []
confidence: high
verificationStatus: verified
geometry:
  type: Polygon
  coordinates: []
mapViewport:
  center: [23.4, 38.85]
  zoom: 9
relatedEvents: []
featured: true
---

Extended commentary.
```

## Actor template

```md
---
id: actor-example
slug: example
name: Example Actor
type: state-agency
aliases: []
parentActors: []
summary: >-
  Short description of the actor and why it matters.
tags:
  - governance
website:
---
```

## Place template

```md
---
id: place-example
slug: example
name: Example Place
type: municipality
center: [23.0000, 38.0000]
bbox: [22.9000, 37.9000, 23.1000, 38.1000]
parentPlace:
notes: >-
  Short note about the place.
---
```

## Source template

```yaml
id: src-example-001
title: Example source title
type: government-document
publisher: Example Publisher
date: 2021-08-12
url: https://example.org/source
accessDate: 2026-03-08
archiveUrl:
language: en
notes: Optional note
```

## Media template

```yaml
id: img-example-001
type: image
file: /images/events/example.jpg
alt: Concise but descriptive alt text
caption: Caption explaining why the image matters
credit: Photographer / archive / source
sourceUrl: https://example.org/image
license:
focalPoint: [0.5, 0.5]
```
