# Project Brief

## Project name

**Evia Wildfire Timeline**

## Core objective

Build a research website that maps the **long history and actor network around the 2021 Evia wildfire**, with an interactive timeline from **1970 to the present** and a spatial layer that lets each event be located, interpreted, and connected to the wider process before and after the fire.

This is not just a chronology of the fire itself. It is a platform for showing:

- long-term structural preconditions,
- policy and legislative changes,
- land, forestry, and planning processes,
- emergency response,
- recovery and reconstruction measures,
- contracts and institutional interventions,
- civil-society actions,
- and the relationships between public and private actors.

## Primary audience

- OSINT researchers
- journalists
- legal researchers
- architects / spatial investigators
- local communities and campaign groups
- readers who need a rigorous public record, not a spectacle product

## Primary research question

**How did a network of state, municipal, civil-society, consultant, donor, and private actors shape the conditions before, during, and after the 2021 Evia wildfire?**

## Editorial mode

The site should feel like a hybrid of:

- a research archive,
- an investigative publication,
- a spatial evidence viewer,
- and a living public record.

## V1 scope

The first release should include:

- an interactive horizontal timeline from 1970–today,
- event zoom from multi-decade view to year/month/day view,
- category and actor filtering,
- a detail drawer or panel on event click,
- event-linked map annotation,
- event-linked image/media,
- keyboard-accessible navigation,
- and an editor-friendly way to add events after launch.

## Out of scope for V1

Do not build these in the first pass unless time remains:

- user accounts for the public,
- public commenting,
- collaborative annotation in-browser,
- advanced graph/network visualization as a separate main view,
- multilingual support,
- 3D scenes,
- heavy storytelling scrollytelling.

These can come later.

## Key content dimensions

Each event should be able to capture:

- title
- date or date range
- date precision
- summary
- full text / commentary
- category
- actors involved
- place
- spatial annotation
- source references
- media
- confidence / verification status
- tags

## Categories suggested by the current mockup

The uploaded mockup already points toward a strong categorical structure for 2021, including tracks for government announcements, DIAZOMA meetings, forestry legislation changes, municipalities and state agencies, civil-society actions, forestry works, fire season, elections, spatial planning phases, signed contracts, floods, and private actors. This should be preserved as the starting point for the taxonomy, while being generalized so the system also works for 1970–today.

## Editorial principles

1. **Process over spectacle** — the project must make structural relations visible.
2. **Evidence-first** — every event should be sourceable and editable.
3. **Long-duration history** — the 2021 fire sits inside a larger temporal frame.
4. **Spatial specificity** — events should be locatable whenever possible.
5. **Minimal, precise design** — the interface must feel calm and authoritative.
6. **Ongoing research compatibility** — the system must welcome incomplete but well-scoped additions.

## Site structure

Recommended top-level routes:

- `/` — landing page with project framing and direct entry into timeline
- `/timeline` — main research interface
- `/about` — methodology, categories, editorial note
- `/sources` — source policy and archive notes
- `/actors` — optional index page in phase 2
- `/places` — optional index page in phase 2

## Functional summary

The website must answer three questions at once:

1. **What happened when?**
2. **Who was involved?**
3. **Where did it happen and how does it relate spatially?**
