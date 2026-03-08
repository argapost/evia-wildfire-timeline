# Evia Wildfire Timeline — Codex Handoff Pack

This pack is the build brief for an interactive research website about the network of actors, decisions, processes, and aftermath surrounding the 2021 wildfire in Evia, within a longer historical timeline spanning **1970 to today**.

The website should let a user:

- scan the whole timeline at once,
- zoom into specific periods,
- filter by actor/category/place,
- click an event to open a detail panel,
- see the linked **map annotation**, **image(s)**, and **text** for that event,
- and continue expanding the dataset over time without rebuilding the project structure.

## Recommended build direction

**Use Astro + React + TypeScript + Keystatic + MapLibre GL JS + D3.**

Why this stack:

- **Astro** keeps the site fast and editorial, with minimal JavaScript by default.
- **React** is used only where stateful interaction is needed: timeline, filters, map, detail drawer.
- **Keystatic** gives a lightweight Git-based admin UI so events, actors, places, and media can be added later without turning the project into a heavy CMS.
- **MapLibre GL JS** handles interactive mapping and GeoJSON overlays efficiently.
- **D3** gives precise control over a custom zoomable timeline and brush interactions.

## Important strategic recommendation

Do **not** clone the original Forensic Architecture `timemap` repo as the main production path. Use it as a **reference**, not as the base application.

Reasons:

- It is a strong conceptual reference.
- It is explicitly marked as **not actively maintained** in its original repository.
- Bellingcat maintains a more active fork, but it is still a specialized product architecture rather than the cleanest starting point for a bespoke Evia investigation.

For this project, a custom implementation inspired by that lineage is the best balance of:

- performance,
- editorial control,
- maintainability,
- and long-term research usability.

## File index

1. `PROJECT_BRIEF.md` — high-level project definition
2. `REFERENCE_AUDIT.md` — audit of reference websites and tool findings
3. `PRODUCT_SPEC.md` — UX, features, and acceptance criteria
4. `TECH_ARCHITECTURE.md` — technical stack and build decisions
5. `DATA_MODEL.md` — content model, schemas, and storage strategy
6. `DESIGN_SYSTEM.md` — visual language and UI behavior
7. `EDITORIAL_WORKFLOW.md` — how to keep adding material over time
8. `IMPLEMENTATION_PLAN.md` — phased execution plan
9. `CONTENT_TEMPLATES.md` — example content entries
10. `CODEX_PROMPT.md` — direct build instructions for Codex

## Build priorities

Priority order for implementation:

1. Stable data model
2. Timeline overview + zoom
3. Detail drawer
4. Map integration
5. Filters/search
6. Editing workflow
7. Polish, accessibility, and performance

## Success criteria

The build is successful when:

- a historian/researcher can add a new event without changing application code,
- the timeline stays legible from 1970–today,
- event detail pages/panels can show narrative + actors + sources + map + media,
- the interface feels rigorous, restrained, and publication-ready,
- and the site remains lightweight enough to deploy statically.
