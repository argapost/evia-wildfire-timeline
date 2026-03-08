# Product Specification

## Product summary

Create a minimal, research-grade web interface centered on a zoomable timeline from **1970 to today**, connected to a synchronized map and an event detail panel.

## Primary user stories

### As a researcher

- I want to see the whole historical arc at once.
- I want to zoom into specific periods.
- I want to compare overlapping processes, not just isolated incidents.
- I want to filter by actor, category, place, and time.
- I want to add events later without changing application code.

### As a reader

- I want to understand why an event matters.
- I want to see who was involved.
- I want to see where it happened.
- I want to inspect images and supporting material without losing my place on the timeline.

### As an editor

- I want a clear schema for entering new events.
- I want validation so bad data does not silently break the app.
- I want media and map annotations to stay linked to events.

## Core interface

### A. Timeline workspace

The main page should include:

- a horizontal timeline spanning 1970–today,
- major and minor tick marks that change by zoom level,
- category lanes or category grouping,
- support for both **point events** and **duration events**,
- panning and zooming,
- and visible selection state.

### B. Event detail panel

When an event is selected, open a panel that shows:

- title
- date / date range
- summary
- full description / commentary
- actor list
- category
- sources
- image(s)
- linked place
- map viewport / annotation
- related events (optional in V1 if cheap)

### C. Map pane

The map must be synchronized with selection.

It should:

- fly or fit to the event geometry,
- highlight the selected event,
- display point / line / polygon GeoJSON,
- allow a fallback center point when exact geometry is unavailable,
- and show multiple events if the user is in overview mode.

### D. Filters

Minimum filters:

- category
- actor
- place
- date range
- tags

Optional but valuable:

- event type: point / duration
- confidence level
- source type

## Interaction rules

### Timeline zoom

The user should be able to move between:

- full range view: 1970–today
- decade view
- year view
- month view
- day-level focus when needed

Zoom must work via:

- mouse wheel / trackpad
- drag pan
- keyboard controls
- explicit reset button
- optional brush / navigator mini-map

### Event selection

Clicking an event must:

- select it on the timeline,
- open its detail panel,
- update the map,
- and preserve URL state if feasible.

### URL state

Prefer a route or query-state model like:

- `/timeline?event=fire-season-2021-start`
- `/timeline?from=2021-07-01&to=2021-10-01&actors=diazoma,government`

This supports sharing and citation.

## Data behavior

### Event density handling

Because the timeline spans decades, the visualization must handle dense periods elegantly.

Rules:

- low zoom: aggregate or stack events to avoid unreadable overlap
- medium zoom: show simplified labels
- high zoom: show individual labels and duration bars
- keep lanes stable where possible to reduce visual jitter

### Date precision handling

Some events may only be known to year or month.

The system must support:

- exact day
- month only
- year only
- approximate / inferred dates
- open-ended durations

Display rules should make this explicit rather than pretending all dates are exact.

## Editorial structure

Each event must support short and long text:

- **summary**: 1–3 sentences
- **body/commentary**: optional longer research note

This lets the interface remain readable while still storing analytical depth.

## Accessibility requirements

- keyboard navigable timeline and filters
- visible focus states
- screen-reader labels for event items
- no color-only meaning
- reduced-motion mode for map/timeline transitions
- high contrast palette

## Performance requirements

- initial page load should remain light
- timeline interactions should remain smooth on mid-range laptops
- precompile data rather than compute everything on the client
- lazy-load large media and non-critical assets
- use code splitting for heavy interactive modules

## V1 acceptance criteria

The product is ready for handoff when:

1. A seed dataset of sample Evia events loads from content files.
2. The timeline renders the full 1970–today range.
3. The user can zoom, pan, and reset.
4. Events can be point or duration.
5. Clicking an event opens the detail panel.
6. The map updates to the event geometry or fallback location.
7. Filters update the visible set without breaking selection.
8. A new event can be added through content files or admin UI without touching component code.
9. Lighthouse/performance is reasonable for a media-rich editorial site.
10. The interface looks publication-ready, not like a dashboard template.
