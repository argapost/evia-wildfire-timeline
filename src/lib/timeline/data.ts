import { compiledEventsSchema, type TimelineEvent } from './types';

export function toTimelineEvents(raw: unknown): TimelineEvent[] {
  const parsed = compiledEventsSchema.parse(raw);

  return parsed
    .map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      category: event.category,
      startTs: event.startTs,
      endTs: event.endTs,
      isDuration: Boolean(event.endTs) || event.isOngoing,
      displayDate: event.displayDate,
      datePrecision: event.datePrecision,
      featured: event.featured,
      actorLabels: event.actorLabels,
      placeLabels: event.placeLabels,
      mapViewport: event.mapViewport,
      geometry: event.geometry
    }))
    .sort((a, b) => {
      if (a.startTs !== b.startTs) {
        return a.startTs - b.startTs;
      }
      return a.id.localeCompare(b.id);
    });
}

export async function fetchTimelineEvents(signal?: AbortSignal): Promise<TimelineEvent[]> {
  const response = await fetch('/data/events.index.json', { signal });
  if (!response.ok) {
    throw new Error(`Failed to load timeline data: HTTP ${response.status}`);
  }

  const raw = await response.json();
  return toTimelineEvents(raw);
}

