import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  actorFrontmatterSchema,
  eventFrontmatterSchema,
  mediaReferenceSchema,
  pageFrontmatterSchema,
  placeFrontmatterSchema,
  sourceReferenceSchema,
  type ActorFrontmatter,
  type EventFrontmatter,
  type Geometry,
  type MediaReference,
  type PageFrontmatter,
  type PlaceFrontmatter,
  type SourceReference
} from '../src/lib/data/schemas';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentRoot = join(repoRoot, 'src', 'content');
const referencesRoot = join(repoRoot, 'src', 'references');
const outputRoot = join(repoRoot, 'public', 'data');
const byYearRoot = join(outputRoot, 'events.by-year');

const validateOnly = process.argv.includes('--validate-only');

type RawEntry<T> = {
  filePath: string;
  data: T;
  body: string;
};

type RawReferenceEntry<T> = {
  filePath: string;
  data: T;
};

type CompiledEvent = EventFrontmatter & {
  body: string;
  startTs: number;
  endTs: number | null;
  durationDays: number | null;
  hasGeometry: boolean;
  actorCount: number;
  placeCount: number;
  year: number;
  decade: number;
  displayDate: string;
  sortKey: string;
  actorLabels: Array<{ id: string; name: string; slug: string }>;
  placeLabels: Array<{ id: string; name: string; slug: string }>;
};

type GeoJSONFeature = {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    title: string;
    category: string;
    start: string;
    end?: string;
    datePrecision: string;
    year: number;
    decade: number;
  };
  geometry: Geometry;
};

const ISO_YEAR = /^\d{4}$/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoLikeDate(value: string, endBoundary: boolean): number {
  if (ISO_YEAR.test(value)) {
    const year = Number(value);
    return Date.UTC(year, endBoundary ? 11 : 0, endBoundary ? 31 : 1, endBoundary ? 23 : 0, endBoundary ? 59 : 0, endBoundary ? 59 : 0);
  }

  const monthMatch = value.match(ISO_MONTH);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return Date.UTC(
      year,
      month - 1,
      endBoundary ? lastDay : 1,
      endBoundary ? 23 : 0,
      endBoundary ? 59 : 0,
      endBoundary ? 59 : 0
    );
  }

  const dayMatch = value.match(ISO_DAY);
  if (dayMatch) {
    const year = Number(dayMatch[1]);
    const month = Number(dayMatch[2]);
    const day = Number(dayMatch[3]);
    return Date.UTC(year, month - 1, day, endBoundary ? 23 : 0, endBoundary ? 59 : 0, endBoundary ? 59 : 0);
  }

  throw new Error(`Unsupported date format: ${value}`);
}

function cleanOptional(value: unknown): string | undefined {
  if (typeof value === 'number') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toRequiredString(value: unknown, fieldName: string): string {
  const normalized = cleanOptional(value);
  if (!normalized) {
    throw new Error(`Missing required string-like value for field "${fieldName}".`);
  }
  return normalized;
}

function normalizeIsoLikeDate(value: unknown, fieldName: string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return toRequiredString(value, fieldName);
}

function walkMarkdownFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(absolute));
      continue;
    }

    if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

function readCollection<T>(dirName: string, normalizer: (input: Record<string, unknown>) => Record<string, unknown>, parser: (input: unknown) => T): RawEntry<T>[] {
  const dirPath = join(contentRoot, dirName);
  const files = walkMarkdownFiles(dirPath);

  return files.map((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const parsed = matter(source);
    const normalized = normalizer(parsed.data as Record<string, unknown>);
    const data = parser(normalized);

    return {
      filePath,
      data,
      body: parsed.content.trim()
    };
  });
}

function readReferenceCollection<T>(fileName: string, parser: (input: unknown) => T): RawReferenceEntry<T>[] {
  const filePath = join(referencesRoot, fileName);
  if (!existsSync(filePath)) {
    return [];
  }

  const source = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(source) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Reference file ${relative(repoRoot, filePath)} must contain a JSON array.`);
  }

  return parsed.map((entry, index) => ({
    filePath: `${filePath}#${index}`,
    data: parser(entry)
  }));
}

function assertNoDuplicateIds(entries: Array<{ filePath: string; data: { id: string } }>, collection: string): void {
  const seen = new Map<string, string>();

  for (const entry of entries) {
    const existing = seen.get(entry.data.id);
    if (existing) {
      throw new Error(
        `Duplicate ${collection} id "${entry.data.id}" found in ${relative(repoRoot, existing)} and ${relative(repoRoot, entry.filePath)}.`
      );
    }
    seen.set(entry.data.id, entry.filePath);
  }
}

function buildDisplayDate(event: EventFrontmatter): string {
  const prefix = event.datePrecision === 'approximate' ? '~' : '';
  const start = `${prefix}${event.start}`;

  if (event.end) {
    return `${start} to ${event.end}`;
  }

  if (event.isOngoing) {
    return `${start} to present`;
  }

  return start;
}

function ensureReferenceIntegrity(
  events: RawEntry<EventFrontmatter>[],
  actors: RawEntry<ActorFrontmatter>[],
  places: RawEntry<PlaceFrontmatter>[],
  sources: RawReferenceEntry<SourceReference>[],
  media: RawReferenceEntry<MediaReference>[]
): void {
  const actorIds = new Set(actors.map((entry) => entry.data.id));
  const placeIds = new Set(places.map((entry) => entry.data.id));
  const sourceIds = new Set(sources.map((entry) => entry.data.id));
  const mediaIds = new Set(media.map((entry) => entry.data.id));

  for (const event of events) {
    for (const actorId of event.data.actors) {
      if (!actorIds.has(actorId)) {
        throw new Error(
          `Event "${event.data.id}" references unknown actor "${actorId}" in ${relative(repoRoot, event.filePath)}.`
        );
      }
    }

    for (const placeId of event.data.places) {
      if (!placeIds.has(placeId)) {
        throw new Error(
          `Event "${event.data.id}" references unknown place "${placeId}" in ${relative(repoRoot, event.filePath)}.`
        );
      }
    }

    for (const sourceRefId of event.data.sourceRefs) {
      if (!sourceIds.has(sourceRefId)) {
        throw new Error(
          `Event "${event.data.id}" references unknown source "${sourceRefId}" in ${relative(repoRoot, event.filePath)}.`
        );
      }
    }

    for (const imageRefId of event.data.imageRefs) {
      if (!mediaIds.has(imageRefId)) {
        throw new Error(
          `Event "${event.data.id}" references unknown media "${imageRefId}" in ${relative(repoRoot, event.filePath)}.`
        );
      }
    }

    if (event.data.coverImage && !mediaIds.has(event.data.coverImage)) {
      throw new Error(
        `Event "${event.data.id}" references unknown cover image "${event.data.coverImage}" in ${relative(repoRoot, event.filePath)}.`
      );
    }

    const startTs = parseIsoLikeDate(event.data.start, false);
    if (event.data.end) {
      const endTs = parseIsoLikeDate(event.data.end, true);
      if (endTs < startTs) {
        throw new Error(`Event "${event.data.id}" has end before start in ${relative(repoRoot, event.filePath)}.`);
      }
    }
  }

  for (const actor of actors) {
    for (const parentId of actor.data.parentActors) {
      if (!actorIds.has(parentId)) {
        throw new Error(
          `Actor "${actor.data.id}" references unknown parent actor "${parentId}" in ${relative(repoRoot, actor.filePath)}.`
        );
      }
    }
  }

  for (const place of places) {
    if (place.data.parentPlace && !placeIds.has(place.data.parentPlace)) {
      throw new Error(
        `Place "${place.data.id}" references unknown parent place "${place.data.parentPlace}" in ${relative(repoRoot, place.filePath)}.`
      );
    }
  }

  for (const mediaEntry of media) {
    if (!mediaEntry.data.file.startsWith('/')) {
      continue;
    }

    const absoluteMediaPath = join(repoRoot, 'public', mediaEntry.data.file.replace(/^\//, ''));
    if (!existsSync(absoluteMediaPath)) {
      throw new Error(
        `Media "${mediaEntry.data.id}" file "${mediaEntry.data.file}" is missing at ${relative(repoRoot, absoluteMediaPath)}.`
      );
    }
  }
}

function compileData(): {
  actorsById: Record<string, ActorFrontmatter & { body: string }>;
  placesById: Record<string, PlaceFrontmatter & { body: string }>;
  pages: Record<string, PageFrontmatter & { body: string }>;
  sourcesById: Record<string, SourceReference>;
  mediaById: Record<string, MediaReference>;
  eventsIndex: CompiledEvent[];
  eventsGeoJSON: { type: 'FeatureCollection'; features: GeoJSONFeature[] };
  eventsByYear: Record<string, CompiledEvent[]>;
} {
  const eventEntries = readCollection<EventFrontmatter>(
    'events',
    (raw) => ({
      ...raw,
      start: normalizeIsoLikeDate(raw.start, 'start'),
      end: raw.end instanceof Date ? raw.end.toISOString().slice(0, 10) : cleanOptional(raw.end),
      coverImage: cleanOptional(raw.coverImage),
      confidence: cleanOptional(raw.confidence),
      verificationStatus: cleanOptional(raw.verificationStatus)
    }),
    (raw) => eventFrontmatterSchema.parse(raw)
  );

  const actorEntries = readCollection<ActorFrontmatter>(
    'actors',
    (raw) => ({
      ...raw,
      website: cleanOptional(raw.website)
    }),
    (raw) => actorFrontmatterSchema.parse(raw)
  );

  const placeEntries = readCollection<PlaceFrontmatter>(
    'places',
    (raw) => ({
      ...raw,
      parentPlace: cleanOptional(raw.parentPlace)
    }),
    (raw) => placeFrontmatterSchema.parse(raw)
  );

  const pageEntries = readCollection<PageFrontmatter>(
    'pages',
    (raw) => ({
      ...raw,
      updatedAt: cleanOptional(raw.updatedAt)
    }),
    (raw) => pageFrontmatterSchema.parse(raw)
  );

  const sourceEntries = readReferenceCollection<SourceReference>('sources.json', (raw) =>
    sourceReferenceSchema.parse(raw)
  );
  const mediaEntries = readReferenceCollection<MediaReference>('media.json', (raw) =>
    mediaReferenceSchema.parse(raw)
  );

  assertNoDuplicateIds(eventEntries, 'event');
  assertNoDuplicateIds(actorEntries, 'actor');
  assertNoDuplicateIds(placeEntries, 'place');
  assertNoDuplicateIds(pageEntries, 'page');
  assertNoDuplicateIds(sourceEntries, 'source reference');
  assertNoDuplicateIds(mediaEntries, 'media reference');

  ensureReferenceIntegrity(eventEntries, actorEntries, placeEntries, sourceEntries, mediaEntries);

  const actorsById = Object.fromEntries(
    actorEntries.map((entry) => [entry.data.id, { ...entry.data, body: entry.body }])
  ) as Record<string, ActorFrontmatter & { body: string }>;

  const placesById = Object.fromEntries(
    placeEntries.map((entry) => [entry.data.id, { ...entry.data, body: entry.body }])
  ) as Record<string, PlaceFrontmatter & { body: string }>;

  const pagesById = Object.fromEntries(
    pageEntries.map((entry) => [entry.data.id, { ...entry.data, body: entry.body }])
  ) as Record<string, PageFrontmatter & { body: string }>;

  const sourcesById = Object.fromEntries(sourceEntries.map((entry) => [entry.data.id, entry.data])) as Record<
    string,
    SourceReference
  >;

  const mediaById = Object.fromEntries(mediaEntries.map((entry) => [entry.data.id, entry.data])) as Record<
    string,
    MediaReference
  >;

  const nowTs = Date.now();

  const eventsIndex: CompiledEvent[] = eventEntries
    .map((entry) => {
      const startTs = parseIsoLikeDate(entry.data.start, false);
      const endTs = entry.data.end
        ? parseIsoLikeDate(entry.data.end, true)
        : entry.data.isOngoing
          ? nowTs
          : null;
      const durationDays = endTs === null ? null : Math.max(1, Math.round((endTs - startTs) / 86_400_000));

      const year = Number(entry.data.start.slice(0, 4));
      const decade = Math.floor(year / 10) * 10;

      const actorLabels = entry.data.actors.map((id) => {
        const actor = actorsById[id];
        return { id, name: actor.name, slug: actor.slug };
      });

      const placeLabels = entry.data.places.map((id) => {
        const place = placesById[id];
        return { id, name: place.name, slug: place.slug };
      });

      return {
        ...entry.data,
        body: entry.body,
        startTs,
        endTs,
        durationDays,
        hasGeometry: Boolean(entry.data.geometry),
        actorCount: entry.data.actors.length,
        placeCount: entry.data.places.length,
        year,
        decade,
        displayDate: buildDisplayDate(entry.data),
        sortKey: `${startTs}-${entry.data.id}`,
        actorLabels,
        placeLabels
      };
    })
    .sort((a, b) => {
      if (a.startTs !== b.startTs) {
        return a.startTs - b.startTs;
      }
      return a.id.localeCompare(b.id);
    });

  const eventIds = new Set(eventsIndex.map((event) => event.id));
  for (const event of eventsIndex) {
    for (const relatedId of event.relatedEvents) {
      if (!eventIds.has(relatedId)) {
        throw new Error(`Event "${event.id}" references unknown related event "${relatedId}".`);
      }
    }
  }

  const eventsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: eventsIndex
      .filter((event) => Boolean(event.geometry))
      .map((event) => ({
        type: 'Feature' as const,
        id: event.id,
        properties: {
          id: event.id,
          title: event.title,
          category: event.category,
          start: event.start,
          end: event.end ?? undefined,
          datePrecision: event.datePrecision,
          year: event.year,
          decade: event.decade
        },
        geometry: event.geometry as Geometry
      }))
  };

  const eventsByYear = eventsIndex.reduce<Record<string, CompiledEvent[]>>((acc, event) => {
    const key = String(event.year);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {});

  return {
    actorsById,
    placesById,
    pages: pagesById,
    sourcesById,
    mediaById,
    eventsIndex,
    eventsGeoJSON,
    eventsByYear
  };
}

function writeCompiledOutputs(compiled: ReturnType<typeof compileData>): void {
  mkdirSync(outputRoot, { recursive: true });
  if (existsSync(byYearRoot)) {
    rmSync(byYearRoot, { recursive: true, force: true });
  }
  mkdirSync(byYearRoot, { recursive: true });

  writeFileSync(join(outputRoot, 'actors.json'), JSON.stringify(compiled.actorsById, null, 2));
  writeFileSync(join(outputRoot, 'places.json'), JSON.stringify(compiled.placesById, null, 2));
  writeFileSync(join(outputRoot, 'pages.json'), JSON.stringify(compiled.pages, null, 2));
  writeFileSync(join(outputRoot, 'sources.json'), JSON.stringify(compiled.sourcesById, null, 2));
  writeFileSync(join(outputRoot, 'media.json'), JSON.stringify(compiled.mediaById, null, 2));
  writeFileSync(join(outputRoot, 'events.index.json'), JSON.stringify(compiled.eventsIndex, null, 2));
  writeFileSync(join(outputRoot, 'events.geojson'), JSON.stringify(compiled.eventsGeoJSON, null, 2));

  for (const [year, events] of Object.entries(compiled.eventsByYear)) {
    writeFileSync(join(byYearRoot, `${year}.json`), JSON.stringify(events, null, 2));
  }
}

function main(): void {
  const compiled = compileData();

  if (validateOnly) {
    console.log(
      `Content validation passed: ${compiled.eventsIndex.length} events, ${Object.keys(compiled.actorsById).length} actors, ${Object.keys(compiled.placesById).length} places, ${Object.keys(compiled.sourcesById).length} sources, ${Object.keys(compiled.mediaById).length} media refs.`
    );
    return;
  }

  writeCompiledOutputs(compiled);
  console.log(
    `Compiled data written to public/data: ${compiled.eventsIndex.length} events, ${Object.keys(compiled.eventsByYear).length} yearly chunks.`
  );
}

main();

