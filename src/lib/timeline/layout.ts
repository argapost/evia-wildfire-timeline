import type { CategoryLane, LaneEvent, TimelineEvent } from './types';
import { categoryOrder } from './categories';

type LayoutOptions = {
  lanePadding: number;
  rowGap: number;
  eventHeight: number;
  subLaneGap: number;
  pointCollisionMs: number;
};

const defaultOptions: LayoutOptions = {
  lanePadding: 10,
  rowGap: 12,
  eventHeight: 12,
  subLaneGap: 5,
  pointCollisionMs: 86_400_000
};

function getEventEndTs(event: TimelineEvent, pointCollisionMs: number): number {
  if (event.endTs) {
    return event.endTs;
  }

  return event.startTs + pointCollisionMs;
}

function packCategoryEvents(
  events: TimelineEvent[],
  categoryIndex: number,
  y: number,
  options: LayoutOptions
): { positioned: LaneEvent[]; lane: CategoryLane } {
  const sorted = [...events].sort((a, b) => {
    if (a.startTs !== b.startTs) {
      return a.startTs - b.startTs;
    }

    const aEnd = getEventEndTs(a, options.pointCollisionMs);
    const bEnd = getEventEndTs(b, options.pointCollisionMs);
    if (aEnd !== bEnd) {
      return bEnd - aEnd;
    }

    return a.id.localeCompare(b.id);
  });

  const laneEndTs: number[] = [];
  const positioned: LaneEvent[] = sorted.map((event) => {
    const startTs = event.startTs;
    const eventEndTs = getEventEndTs(event, options.pointCollisionMs);

    let laneIndex = laneEndTs.findIndex((laneEnd) => laneEnd + options.pointCollisionMs < startTs);
    if (laneIndex === -1) {
      laneIndex = laneEndTs.length;
      laneEndTs.push(eventEndTs);
    } else {
      laneEndTs[laneIndex] = eventEndTs;
    }

    const laneY = y + options.lanePadding + laneIndex * (options.eventHeight + options.subLaneGap);

    return {
      ...event,
      laneIndex,
      categoryIndex,
      laneY,
      laneHeight: options.eventHeight
    };
  });

  const subLaneCount = Math.max(1, laneEndTs.length);
  const height = options.lanePadding * 2 + subLaneCount * options.eventHeight + (subLaneCount - 1) * options.subLaneGap;

  return {
    positioned,
    lane: {
      category: events[0].category,
      categoryIndex,
      y,
      height,
      subLaneCount
    }
  };
}

export function computeLaneLayout(
  events: TimelineEvent[],
  inputOptions?: Partial<LayoutOptions>
): {
  categories: CategoryLane[];
  events: LaneEvent[];
  totalHeight: number;
} {
  const options = { ...defaultOptions, ...inputOptions };

  const grouped = new Map<TimelineEvent['category'], TimelineEvent[]>();
  for (const event of events) {
    const bucket = grouped.get(event.category);
    if (bucket) {
      bucket.push(event);
    } else {
      grouped.set(event.category, [event]);
    }
  }

  const orderedCategories = [...categoryOrder].filter((category) => grouped.has(category));

  let y = 0;
  const categories: CategoryLane[] = [];
  const positionedEvents: LaneEvent[] = [];

  for (const [categoryIndex, category] of orderedCategories.entries()) {
    const categoryEvents = grouped.get(category) ?? [];
    const { positioned, lane } = packCategoryEvents(categoryEvents, categoryIndex, y, options);

    categories.push(lane);
    positionedEvents.push(...positioned);

    y += lane.height + options.rowGap;
  }

  const totalHeight = Math.max(120, y + options.rowGap);

  return {
    categories,
    events: positionedEvents,
    totalHeight
  };
}

