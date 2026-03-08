import { createContext, useContext } from 'react';
import type { TimelineEvent } from './types';

export type TimelineSelectionState = {
  events: TimelineEvent[];
  selectedEventId: string | null;
  selectedEvent: TimelineEvent | null;
  setSelectedEventId: (eventId: string | null) => void;
};

export const TimelineSelectionContext = createContext<TimelineSelectionState | null>(null);

export function useTimelineSelection(): TimelineSelectionState {
  const context = useContext(TimelineSelectionContext);
  if (!context) {
    throw new Error('useTimelineSelection must be used inside TimelineWorkspace.');
  }

  return context;
}

