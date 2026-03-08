import 'maplibre-gl/dist/maplibre-gl.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type LngLatBoundsLike, type Map } from 'maplibre-gl';
import type { TimelineEvent } from '@/lib/timeline/types';

type EventMapPanelProps = {
  selectedEvent: TimelineEvent | null;
  events: TimelineEvent[];
};

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

const selectedSourceId = 'selected-event-source';
const selectedFillLayerId = 'selected-event-fill';
const selectedLineLayerId = 'selected-event-line';
const selectedCircleLayerId = 'selected-event-circle';

const subduedStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'base',
      type: 'raster',
      source: 'base',
      paint: {
        'raster-opacity': 0.92,
        'raster-saturation': -0.65,
        'raster-contrast': -0.1
      }
    }
  ]
};

function getMotionDuration(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
}

function extractCoordinatePairs(input: unknown, acc: [number, number][]): void {
  if (!Array.isArray(input)) {
    return;
  }

  if (
    input.length === 2 &&
    typeof input[0] === 'number' &&
    typeof input[1] === 'number' &&
    Number.isFinite(input[0]) &&
    Number.isFinite(input[1])
  ) {
    acc.push([input[0], input[1]]);
    return;
  }

  for (const item of input) {
    extractCoordinatePairs(item, acc);
  }
}

function getGeometryBounds(geometry: TimelineEvent['geometry']): LngLatBoundsLike | null {
  if (!geometry) {
    return null;
  }

  const coordinates: [number, number][] = [];
  extractCoordinatePairs(geometry.coordinates, coordinates);

  if (coordinates.length === 0) {
    return null;
  }

  let minLon = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLon = coordinates[0][0];
  let maxLat = coordinates[0][1];

  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLon, minLat],
    [maxLon, maxLat]
  ];
}

function toSelectedFeatureCollection(selectedEvent: TimelineEvent | null): FeatureCollection {
  if (!selectedEvent?.geometry) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: selectedEvent.id,
        properties: {
          id: selectedEvent.id,
          title: selectedEvent.title
        },
        geometry: selectedEvent.geometry as GeoJSON.Geometry
      }
    ]
  };
}

function ensureSelectionLayers(map: Map): void {
  if (!map.getSource(selectedSourceId)) {
    map.addSource(selectedSourceId, {
      type: 'geojson',
      data: toSelectedFeatureCollection(null)
    });
  }

  if (!map.getLayer(selectedFillLayerId)) {
    map.addLayer({
      id: selectedFillLayerId,
      type: 'fill',
      source: selectedSourceId,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': '#8f2f23',
        'fill-opacity': 0.22
      }
    });
  }

  if (!map.getLayer(selectedLineLayerId)) {
    map.addLayer({
      id: selectedLineLayerId,
      type: 'line',
      source: selectedSourceId,
      paint: {
        'line-color': '#6f241b',
        'line-width': 2
      }
    });
  }

  if (!map.getLayer(selectedCircleLayerId)) {
    map.addLayer({
      id: selectedCircleLayerId,
      type: 'circle',
      source: selectedSourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#8f2f23',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#1b1a18'
      }
    });
  }
}

function applySelectionToMap(map: Map, selectedEvent: TimelineEvent | null): void {
  const source = map.getSource(selectedSourceId) as maplibregl.GeoJSONSource | undefined;
  if (!source) {
    return;
  }

  source.setData(toSelectedFeatureCollection(selectedEvent));

  if (!selectedEvent) {
    return;
  }

  const duration = getMotionDuration();
  const geometryBounds = getGeometryBounds(selectedEvent.geometry);

  if (geometryBounds) {
    map.fitBounds(geometryBounds, {
      padding: 40,
      duration,
      maxZoom: 10
    });
    return;
  }

  if (selectedEvent.mapViewport) {
    map.easeTo({
      center: selectedEvent.mapViewport.center,
      zoom: selectedEvent.mapViewport.zoom,
      duration
    });
  }
}

function getDefaultViewport(events: TimelineEvent[]): { center: [number, number]; zoom: number } {
  for (const event of events) {
    if (event.mapViewport) {
      return {
        center: event.mapViewport.center,
        zoom: event.mapViewport.zoom
      };
    }
  }

  return {
    center: [23.6, 38.62],
    zoom: 6.8
  };
}

export default function EventMapPanel({ selectedEvent, events }: EventMapPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const defaultViewport = useMemo(() => getDefaultViewport(events), [events]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    try {
      const map = new maplibregl.Map({
        container,
        style: subduedStyle,
        center: defaultViewport.center,
        zoom: defaultViewport.zoom,
        attributionControl: false
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }));
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        ensureSelectionLayers(map);
        applySelectionToMap(map, selectedEvent);
        setIsReady(true);
      });

      map.on('error', (event) => {
        const message = event.error instanceof Error ? event.error.message : 'Map rendering error.';
        setMapError(message);
      });

      mapRef.current = map;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown MapLibre initialization error.';
      setMapError(message);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [defaultViewport.center, defaultViewport.zoom, selectedEvent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    applySelectionToMap(map, selectedEvent);
  }, [isReady, selectedEvent]);

  return (
    <section className="map-panel" aria-label="Map panel">
      <header className="map-panel-header">
        <p className="detail-eyebrow">Map</p>
        <h2>Spatial annotation</h2>
        <p>{selectedEvent ? `Focused on: ${selectedEvent.title}` : 'Select an event to focus its spatial context.'}</p>
      </header>

      {mapError ? <p className="map-error">{mapError}</p> : null}

      <div
        ref={containerRef}
        className="map-canvas"
        tabIndex={0}
        aria-label="Interactive map showing selected event geometry"
      />
    </section>
  );
}
