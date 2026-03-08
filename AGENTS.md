# AGENTS.md — Evia Wildfire Timeline

## Mission
Build a production-quality investigative research website called **Evia Wildfire Timeline**.

The product is a minimal, publication-grade research interface for understanding the network of actors, decisions, processes, and aftermath surrounding the 2021 Evia wildfire within a longer timeline from **1970 to today**.

## Read these files first before writing code
In this order:

1. `README.md`
2. `PROJECT_BRIEF.md`
3. `PRODUCT_SPEC.md`
4. `TECH_ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `DESIGN_SYSTEM.md`
7. `IMPLEMENTATION_PLAN.md`
8. `CONTENT_TEMPLATES.md`
9. `REFERENCE_AUDIT.md`
10. `CODEX_PROMPT.md`

Before coding, summarize the constraints you extracted from these files.

## Non-negotiable product rules
- Use **Astro** for the site shell.
- Use **React + TypeScript** for interactive UI only.
- Use **D3** for the custom timeline.
- Use **MapLibre GL JS** for the map.
- Use **Keystatic** for content editing.
- Do **not** use a generic off-the-shelf timeline component as the main solution.
- Keep the visual language restrained, analytical, and publication-grade.
- Keep most pages static and hydrate only the interactive workspace.
- Build around structured content, not hardcoded event data.

## Data rules
- Support point events and duration events.
- Support exact, month-only, and year-only dates.
- Support approximate and ongoing processes.
- Support actor references, place references, source references, media references, and GeoJSON geometry.
- New events must be addable without changing application code.

## UX rules
- Timeline must zoom from full-range overview to detailed views.
- Clicking an event must open a detail panel with text, actors, places, sources, and image(s).
- Map must synchronize with the selected event.
- Filtering must support category, actor, place, tags, and date range.
- Core interactions must be keyboard accessible.

## Design rules
- Think **Forensic Architecture + Financial Times + New York Times**, not SaaS dashboard.
- Strong typography, quiet palette, minimal chrome.
- Motion must be subtle and optional.
- No decorative complexity.

## Engineering rules
- Use TypeScript throughout.
- Keep components small, explicit, and testable.
- Validate content at build time.
- Fail fast on invalid content.
- Prefer simple architecture over novelty.
- Avoid dependency bloat.
- After every step, commit your changes.

## Working method
- Work in small phases.
- At the start of each task, state: files read, plan, deliverables.
- At the end of each task, report: files changed, commands run, tests run, known gaps.
- When context is limited, re-read the canonical docs listed above instead of guessing.

## Phase order
1. scaffold + schemas
2. editorial shell
3. timeline engine
4. detail panel
5. map integration
6. filters/search
7. editorial workflow hardening
8. polish + QA

## Definition of done for each task
A task is only complete when:
- the requested feature works,
- the code remains consistent with the architecture docs,
- relevant validation/tests/build steps pass,
- and the change does not hardcode content that should live in collections.
