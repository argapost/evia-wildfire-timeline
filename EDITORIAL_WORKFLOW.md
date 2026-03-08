# Editorial Workflow

## Goal

Make it easy to keep adding and refining research materials after launch without turning the project into a developer-only system.

## Recommended editing model

Use **Keystatic** as the editor-facing layer on top of repository content.

That gives you:

- version control,
- human-readable content files,
- structured form-based editing,
- and the ability to review changes as commits / pull requests.

## Day-to-day workflow

### Add a new event

1. Create a new event entry in the `events` collection.
2. Fill in required metadata.
3. Link actors and places.
4. Add summary and optional extended commentary.
5. Add image(s) and source references.
6. Add geometry or a fallback place + viewport.
7. Save.

The build should validate the record automatically.

### Update an existing event

- edit the content entry
- keep the `id` stable
- update sources or commentary as needed
- avoid changing slugs casually once public URLs exist

### Add a new actor

Create actor entries whenever a recurring institution, person, company, donor, consultant, or collective appears more than once.

This keeps event data normalized and filterable.

### Add a new place

Create place entries for reusable territorial entities such as:

- North Evia
- Istiaia
- Limni
- Athens
- specific municipalities
- forests
- fire fronts

## Editorial rules

### Event titles

- factual, concise, not sensational
- should still make sense out of context

### Summaries

- 1–3 sentences
- written as a reader-facing abstract

### Commentary

- longer analytical note
- may include uncertainty, context, and dispute

### Categories

- choose from controlled vocabulary only
- do not invent ad hoc category names in entries

### Actors

- always link actors by ID, not by free text only

### Sources

- give each important source a stable source id if a source collection is used
- retain archive URLs where relevant
- note whether an event is verified, partially verified, or provisional

## Recommended statuses

Use `verificationStatus` values such as:

- `verified`
- `partially-verified`
- `provisional`
- `disputed`

## Recommended confidence levels

Use `confidence` values such as:

- `high`
- `medium`
- `low`

This is especially valuable for OSINT workflows.

## Naming conventions

### Event IDs

Use stable, descriptive ids:

- `evia-2021-masterplan-presentation`
- `evia-2021-heavy-rain-athina`
- `evia-1980-forest-policy-change-x`

### Actor IDs

- `actor-diazoma`
- `actor-greek-government`
- `actor-stavros-niarchos-foundation`

### Place IDs

- `place-north-evia`
- `place-istiaia`
- `place-athens`

## Media workflow

### Images

- upload optimized but high-quality source image
- always add alt text
- always add caption / source / credit
- avoid embedding important text only inside images if the text can also be transcribed

### Documents

- link supporting PDFs, reports, or archival documents as sources
- do not overload the event panel with too many embedded viewers in V1

## Quality control checklist

Before publishing a new event:

- is the title clear?
- is the date precision honest?
- are actors linked?
- is place linked?
- is at least one source attached?
- is the summary understandable to a first-time reader?
- does the map position make sense?
- is the event placed in the correct category?

## Suggested research workflow for ongoing intake

A good two-stage workflow is:

### Stage 1 — rough intake

Capture rough findings in a spreadsheet or notes system while researching.

### Stage 2 — publication entry

Move only validated / editorialized records into the Keystatic content collections.

This prevents the live site from becoming a raw dumping ground.

## Optional importer workflow

If desired, build a small import script later that reads a researcher spreadsheet and generates draft event files.

Use this only if it saves time and the schema remains strict.

## Governance recommendation

Keep one person responsible for taxonomy consistency.

This matters more over time than the software choice.
