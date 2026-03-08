# Reference Audit

## Goal of this audit

Identify which ideas and tooling are most relevant from the reference projects, and translate them into a clean build direction for the Evia timeline.

## 1) Smouldering Grounds

**URL:** https://smouldering-grounds.com/

### What it does well

- Splits the investigation into distinct but related interfaces: **Archive**, **Timeline**, **Map**, **Media**, and additional material.
- Treats the site as a **public repository**, not just a narrative article.
- Makes spatial and temporal indexing central to the research structure.
- Shows how a research platform can remain sparse and academically grounded.

### What to borrow

- Separate but connected views for archive / timeline / map.
- Clear editorial framing that explains why the dataset exists.
- Research-first tone rather than commercial app tone.
- Lightweight interface and minimal ornament.

### What not to copy directly

- Avoid splitting the Evia interface too much in V1. The Evia project should prioritize a **single integrated timeline + detail + map workflow** first.
- Do not make users jump between pages for core research actions if the same action can happen in one interface.

### Technical finding

The accessible public materials confirm that the site includes dedicated **map**, **timeline**, **archive**, and **media** views, but the exact production stack could not be independently verified from accessible sources alone. Treat it as a design and information-architecture reference rather than a directly reusable software base.

---

## 2) Index of Repression

**URL:** https://www.index-of-repression.org/uk/platform

### What it does well

- Uses the web platform as a structured evidence interface rather than a blog.
- Emphasizes filtering, categorization, and repeated comparable entries.
- Frames each item as part of a wider systemic pattern.

### What to borrow

- Consistent metadata across entries.
- Strong taxonomy and filter logic.
- Dense but controlled visual hierarchy.
- The sense that the interface is an instrument for analysis, not just display.

### Technical finding

This platform is associated with Forensis / Forensic Architecture. Forensic Architecture publicly documents that its interactive platforms are built with a stack that includes **Node, Python, Go, React, Vue, and ThreeJS**, and explicitly points to its open-source tools **Timemap** and **Datasheet Server** as part of that ecosystem. The exact deployed bundle for the live Index site was not independently verifiable from accessible sources, so the tool identification here should be read as the **documented family of tools** used by the team, not a guaranteed line-by-line reverse engineering of the live deployment.

---

## 3) Drift-backs in the Aegean Sea

**URL:** https://aegean.forensic-architecture.org/

### What it does well

- Combines cartographic evidence with a long-running event dataset.
- Treats mapping as argumentation, not decoration.
- Presents a large number of incidents through a controlled visual system.
- Works well as a precedent for a public-facing investigative map with a long temporal scope.

### What to borrow

- Spatial evidence as a first-class object.
- Clear relationship between map state and event selection.
- Calm visual styling despite a dense dataset.
- Public documentation tone combined with strong interaction design.

### Technical finding

Forensic Architecture describes this class of work as part of its interactive-platform practice and documents **Timemap** / **Datasheet Server** as key open-source components in that ecosystem. The Aegean platform therefore strongly suggests the same lineage, but the exact deployed libraries on the live site were not independently inspectable from accessible public sources.

---

## 4) What Forensic Architecture explicitly documents

### Timemap

Forensic Architecture’s original `timemap` repository describes the tool as:

- a standalone frontend for exploring events in **time and space**,
- using **Leaflet** and **D3**,
- with **OpenStreetMap** imagery by default,
- and optional **Mapbox** configuration.

It supports:

- map visualization,
- adjustable zoomable timelines,
- filtering by type / category / tag,
- and JSON-backed data.

### Datasheet Server

Forensic Architecture’s `datasheet-server` is documented as a **Node server** that turns spreadsheet data into a structured API. It exists specifically so researchers can keep editing spreadsheet-based source data without breaking the frontend.

This is highly relevant to the Evia project because the research workflow is ongoing and editorial users need to keep adding material after launch.

### Important caveat

The original `timemap` repository is explicitly marked as **no longer actively maintained**.

### Relevant active fork

Bellingcat maintains a more active `ukraine-timemap` fork. Its repository confirms a practical continuation of the same approach and exposes useful configuration concepts such as:

- timeline zoom ranges,
- default map state,
- clustering,
- JSON APIs,
- and style configuration.

This makes it an excellent **reference model**, but not necessarily the cleanest base for a brand-new bespoke product.

---

## Recommendation from the audit

### Best path

Build a **new custom frontend** inspired by the Forensic Architecture / Bellingcat lineage rather than forking old code directly.

### Why

- The interaction pattern is proven.
- The original open-source base is aging.
- A bespoke build will better fit your design direction, content model, and long-term editing workflow.
- A modern static-first architecture will be cleaner and faster.

### Recommended conceptual borrowings

Borrow these ideas:

- timeline + map as a single analytical interface,
- dense metadata with filterable categories,
- public-research tone,
- explicit source-aware structure,
- and restrained visual design.

Do not borrow blindly:

- legacy app architecture,
- hidden data contracts,
- over-specific styling rules from older projects,
- or infrastructure choices that make editing harder.

---

## Final build recommendation

### Interface pattern

- One main **timeline workspace**.
- Right-side or bottom **event detail panel**.
- Synchronized **map pane**.
- Filter rail for categories, actors, places, and date range.

### Tool pattern

- **Astro** for shell + content pages.
- **React** for stateful interactive components.
- **D3** for the custom timeline.
- **MapLibre GL JS** for map rendering and GeoJSON overlays.
- **Keystatic** for editor-facing Git-based content management.
- A build-time content compiler that produces fast static JSON / GeoJSON.

---

## Source notes

Useful references consulted while preparing this handoff:

- Forensic Architecture interactive-platforms methodology page
- Forensic Architecture `timemap` repository
- Forensic Architecture `datasheet-server` repository
- Bellingcat `ukraine-timemap` repository
- Smouldering Grounds public site pages
