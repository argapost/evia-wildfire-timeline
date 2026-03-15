import 'maplibre-gl/dist/maplibre-gl.css';

import { useEffect, useRef, useState } from 'react';
import type {
  Map,
  StyleSpecification,
  ExpressionSpecification,
  GeoJSONSource,
  MapMouseEvent,
  MapGeoJSONFeature
} from 'maplibre-gl';
import type { ProcessedAlert } from '@/lib/alerts/schema';
import { MAP_CENTER, MAP_ZOOM, REGION_COLORS } from '@/lib/alerts/constants';
import { usePrefersReducedMotion } from '@/lib/utils/usePrefersReducedMotion';

// ── Types ──

type AlertsMapProps = {
  alerts: ProcessedAlert[];
  currentIndex: number;
  selectedAlert: ProcessedAlert | null;
  onSelectAlert: (alert: ProcessedAlert | null) => void;
};

type BasemapId = 'osm' | 'satellite';

// ── Source and layer IDs ──

const EVAC_POINTS_SOURCE = 'evac-points';
const EVAC_CURVES_SOURCE = 'evac-curves';
const EVAC_ARROWS_SOURCE = 'evac-arrows';

// Past layers (bottom)
const PAST_CURVES_LAYER = 'past-curves';
const PAST_ARROWS_LAYER = 'past-arrows';
const PAST_FROM_LAYER = 'past-from';
const PAST_TO_LAYER = 'past-to';

// Active layers (top)
const ACTIVE_CURVES_LAYER = 'active-curves';
const ACTIVE_ARROWS_LAYER = 'active-arrows';
const ACTIVE_FROM_LAYER = 'active-from';
const ACTIVE_TO_LAYER = 'active-to';

const ALL_LAYERS = [
  PAST_FROM_LAYER,
  ACTIVE_CURVES_LAYER, ACTIVE_ARROWS_LAYER, ACTIVE_FROM_LAYER, ACTIVE_TO_LAYER
];

// ── Map styles ──

const BASEMAP_SOURCES: Record<BasemapId, { tiles: string[]; attribution: string }> = {
  osm: {
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    attribution: '&copy; Esri'
  }
};

function buildStyle(basemap: BasemapId): StyleSpecification {
  const src = BASEMAP_SOURCES[basemap];
  return {
    version: 8,
    sources: {
      base: { type: 'raster', tiles: src.tiles, tileSize: 256, attribution: src.attribution }
    },
    layers: [{ id: 'base', type: 'raster', source: 'base', paint: {} }]
  };
}

// ── Region color match expression ──

function regionColorExpr(): ExpressionSpecification {
  const entries: (string | ExpressionSpecification)[] = ['match', ['get', 'fireRegion']];
  for (const [region, color] of Object.entries(REGION_COLORS)) {
    entries.push(region, color);
  }
  entries.push('#909090');
  return entries as unknown as ExpressionSpecification;
}

// ── Curve geometry helpers ──

function quadraticBezier(
  from: [number, number],
  to: [number, number],
  segments = 20
): [number, number][] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.0001) return [from, to];

  // Control point: perpendicular offset from midpoint (consistent curve direction)
  const offset = Math.min(dist * 0.28, 0.12);
  const mx = (from[0] + to[0]) / 2 + (dy / dist) * offset;
  const my = (from[1] + to[1]) / 2 - (dx / dist) * offset;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    points.push([
      u * u * from[0] + 2 * u * t * mx + t * t * to[0],
      u * u * from[1] + 2 * u * t * my + t * t * to[1]
    ]);
  }
  return points;
}

function arrowheadPolygon(
  curvePoints: [number, number][],
  sizeFactor = 0.08
): [number, number][] | null {
  const n = curvePoints.length;
  if (n < 2) return null;

  const tip = curvePoints[n - 1];
  const prev = curvePoints[n - 3] ?? curvePoints[n - 2];
  const dx = tip[0] - prev[0];
  const dy = tip[1] - prev[1];
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return null;

  // Size proportional to the full edge length, clamped
  const totalDx = curvePoints[n - 1][0] - curvePoints[0][0];
  const totalDy = curvePoints[n - 1][1] - curvePoints[0][1];
  const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
  const size = Math.max(0.004, Math.min(0.018, totalDist * sizeFactor));

  const ux = dx / len;
  const uy = dy / len;
  const bx = tip[0] - ux * size;
  const by = tip[1] - uy * size;
  const hw = size * 0.5;

  return [
    tip,
    [bx + uy * hw, by - ux * hw],
    [bx - uy * hw, by + ux * hw],
    tip
  ];
}

// ── GeoJSON builders ──

type PointFC = GeoJSON.FeatureCollection<GeoJSON.Point>;
type LineFC = GeoJSON.FeatureCollection<GeoJSON.LineString>;
type PolyFC = GeoJSON.FeatureCollection<GeoJSON.Polygon>;

function buildPointsGeoJSON(alerts: ProcessedAlert[], maxIndex: number): PointFC {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  const seen = new Set<string>(); // dedup by coord key + role

  for (const alert of alerts) {
    if (alert.chronologicalIndex > maxIndex) continue;

    const props = {
      fireRegion: alert.fireRegion,
      chronologicalIndex: alert.chronologicalIndex,
      tweetId: alert.tweetId
    };

    if (alert.evacuationEdges.length > 0) {
      for (const edge of alert.evacuationEdges) {
        const fromKey = `from:${edge.from[0]},${edge.from[1]}:${alert.chronologicalIndex}`;
        if (!seen.has(fromKey)) {
          seen.add(fromKey);
          features.push({
            type: 'Feature',
            properties: { ...props, role: 'from' },
            geometry: { type: 'Point', coordinates: edge.from }
          });
        }

        const toKey = `to:${edge.to[0]},${edge.to[1]}:${alert.chronologicalIndex}`;
        if (!seen.has(toKey)) {
          seen.add(toKey);
          features.push({
            type: 'Feature',
            properties: { ...props, role: 'to' },
            geometry: { type: 'Point', coordinates: edge.to }
          });
        }
      }
    } else {
      // Non-evacuation alerts: show FROM locations as standalone markers
      for (const loc of alert.fromLocations) {
        const key = `from:${loc.lon},${loc.lat}:${alert.chronologicalIndex}`;
        if (!seen.has(key)) {
          seen.add(key);
          features.push({
            type: 'Feature',
            properties: { ...props, role: 'from' },
            geometry: { type: 'Point', coordinates: [loc.lon, loc.lat] }
          });
        }
      }
    }
  }

  return { type: 'FeatureCollection', features };
}

function buildCurvesGeoJSON(alerts: ProcessedAlert[], maxIndex: number): LineFC {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (const alert of alerts) {
    if (alert.chronologicalIndex > maxIndex) continue;

    for (const edge of alert.evacuationEdges) {
      const curveCoords = quadraticBezier(edge.from, edge.to);
      features.push({
        type: 'Feature',
        properties: {
          fireRegion: alert.fireRegion,
          chronologicalIndex: alert.chronologicalIndex,
          tweetId: alert.tweetId
        },
        geometry: { type: 'LineString', coordinates: curveCoords }
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

function buildArrowheadsGeoJSON(alerts: ProcessedAlert[], maxIndex: number): PolyFC {
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

  for (const alert of alerts) {
    if (alert.chronologicalIndex > maxIndex) continue;

    for (const edge of alert.evacuationEdges) {
      const curveCoords = quadraticBezier(edge.from, edge.to);
      const head = arrowheadPolygon(curveCoords);
      if (!head) continue;

      features.push({
        type: 'Feature',
        properties: {
          fireRegion: alert.fireRegion,
          chronologicalIndex: alert.chronologicalIndex
        },
        geometry: { type: 'Polygon', coordinates: [head] }
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

// ── Colors ──

const FROM_COLOR = '#c74949'; // red — danger/origin
const TO_COLOR = '#3a6fb5';   // blue — safe destination
const PAST_COLOR = '#aaaaaa'; // grey — past alerts

// ── Map layer setup ──

const PAST_FILTER: ExpressionSpecification = ['!=', ['get', 'chronologicalIndex'], -1];
const ACTIVE_FILTER: ExpressionSpecification = ['==', ['get', 'chronologicalIndex'], -1];

function ensureLayers(map: Map): void {
  const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

  // Sources
  if (!map.getSource(EVAC_CURVES_SOURCE))
    map.addSource(EVAC_CURVES_SOURCE, { type: 'geojson', data: empty });
  if (!map.getSource(EVAC_ARROWS_SOURCE))
    map.addSource(EVAC_ARROWS_SOURCE, { type: 'geojson', data: empty });
  if (!map.getSource(EVAC_POINTS_SOURCE))
    map.addSource(EVAC_POINTS_SOURCE, { type: 'geojson', data: empty });

  // ── Past layers (only FROM markers, grey, no curves/TO/arrows) ──

  if (!map.getLayer(PAST_FROM_LAYER))
    map.addLayer({
      id: PAST_FROM_LAYER,
      type: 'circle',
      source: EVAC_POINTS_SOURCE,
      filter: ['all', PAST_FILTER, ['==', ['get', 'role'], 'from']],
      paint: {
        'circle-radius': 4,
        'circle-color': PAST_COLOR,
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.6
      }
    });

  // ── Active layers ──

  // Dashed curved lines (blue)
  if (!map.getLayer(ACTIVE_CURVES_LAYER))
    map.addLayer({
      id: ACTIVE_CURVES_LAYER,
      type: 'line',
      source: EVAC_CURVES_SOURCE,
      filter: ACTIVE_FILTER,
      paint: {
        'line-color': TO_COLOR,
        'line-width': 2,
        'line-opacity': 0.7,
        'line-dasharray': [2, 2]
      }
    });

  // Arrowheads (blue, filled)
  if (!map.getLayer(ACTIVE_ARROWS_LAYER))
    map.addLayer({
      id: ACTIVE_ARROWS_LAYER,
      type: 'fill',
      source: EVAC_ARROWS_SOURCE,
      filter: ACTIVE_FILTER,
      paint: {
        'fill-color': TO_COLOR,
        'fill-opacity': 0.8
      }
    });

  // FROM markers (red filled circles)
  if (!map.getLayer(ACTIVE_FROM_LAYER))
    map.addLayer({
      id: ACTIVE_FROM_LAYER,
      type: 'circle',
      source: EVAC_POINTS_SOURCE,
      filter: ['all', ACTIVE_FILTER, ['==', ['get', 'role'], 'from']],
      paint: {
        'circle-radius': 6,
        'circle-color': FROM_COLOR,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff'
      }
    });

  // TO markers (blue filled circles)
  if (!map.getLayer(ACTIVE_TO_LAYER))
    map.addLayer({
      id: ACTIVE_TO_LAYER,
      type: 'circle',
      source: EVAC_POINTS_SOURCE,
      filter: ['all', ACTIVE_FILTER, ['==', ['get', 'role'], 'to']],
      paint: {
        'circle-radius': 6,
        'circle-color': TO_COLOR,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff'
      }
    });
}

// ── Data updaters ──

function updateSourceData(map: Map, alerts: ProcessedAlert[], currentIndex: number): void {
  const pointsSrc = map.getSource(EVAC_POINTS_SOURCE) as GeoJSONSource | undefined;
  if (pointsSrc) pointsSrc.setData(buildPointsGeoJSON(alerts, currentIndex));

  const curvesSrc = map.getSource(EVAC_CURVES_SOURCE) as GeoJSONSource | undefined;
  if (curvesSrc) curvesSrc.setData(buildCurvesGeoJSON(alerts, currentIndex));

  const arrowsSrc = map.getSource(EVAC_ARROWS_SOURCE) as GeoJSONSource | undefined;
  if (arrowsSrc) arrowsSrc.setData(buildArrowheadsGeoJSON(alerts, currentIndex));

  // Update filters to highlight the active alert
  for (const id of ALL_LAYERS) {
    const layer = map.getLayer(id);
    if (!layer) continue;

    const isPast = id.startsWith('past-');
    const isFrom = id.endsWith('-from');
    const isTo = id.endsWith('-to');

    let filter: ExpressionSpecification;

    if (isPast) {
      const base: ExpressionSpecification = ['<', ['get', 'chronologicalIndex'], currentIndex];
      if (isFrom) filter = ['all', base, ['==', ['get', 'role'], 'from']] as ExpressionSpecification;
      else if (isTo) filter = ['all', base, ['==', ['get', 'role'], 'to']] as ExpressionSpecification;
      else filter = base;
    } else {
      const base: ExpressionSpecification = ['==', ['get', 'chronologicalIndex'], currentIndex];
      if (isFrom) filter = ['all', base, ['==', ['get', 'role'], 'from']] as ExpressionSpecification;
      else if (isTo) filter = ['all', base, ['==', ['get', 'role'], 'to']] as ExpressionSpecification;
      else filter = base;
    }

    map.setFilter(id, filter);
  }
}

// ── Component ──

export default function AlertsMap({
  alerts,
  currentIndex,
  selectedAlert,
  onSelectAlert
}: AlertsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const isReadyRef = useRef(false);

  const [mapError, setMapError] = useState<string | null>(null);
  const [basemap, setBasemap] = useState<BasemapId>('osm');

  const prefersReducedMotion = usePrefersReducedMotion();

  const onSelectAlertRef = useRef(onSelectAlert);
  onSelectAlertRef.current = onSelectAlert;

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // ── Initialization ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;

    import('maplibre-gl').then((maplibregl) => {
      if (cancelled || !containerRef.current) return;

      try {
        const map = new maplibregl.Map({
          container,
          style: buildStyle('osm'),
          center: MAP_CENTER,
          zoom: MAP_ZOOM,
          attributionControl: false
        });

        map.addControl(new maplibregl.AttributionControl({ compact: true }));
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('load', () => {
          ensureLayers(map);
          updateSourceData(map, alertsRef.current, currentIndex);
          isReadyRef.current = true;

          // Fit viewport to all evacuation points
          const bounds = new maplibregl.LngLatBounds();
          let hasPoints = false;
          for (const a of alertsRef.current) {
            for (const edge of a.evacuationEdges) {
              bounds.extend(edge.from as [number, number]);
              bounds.extend(edge.to as [number, number]);
              hasPoints = true;
            }
            if (a.evacuationEdges.length === 0 && a.centroid) {
              bounds.extend(a.centroid as [number, number]);
              hasPoints = true;
            }
          }
          if (hasPoints) {
            map.fitBounds(bounds, { padding: 40, maxZoom: 10 });
          }
        });

        map.on('error', (event) => {
          console.warn('MapLibre error:', event.error);
        });

        // Click handler for markers
        const handleClick = (
          e: MapMouseEvent & { features?: MapGeoJSONFeature[] }
        ) => {
          const feature = e.features?.[0];
          if (!feature || !feature.properties) return;

          const tweetId = feature.properties.tweetId as string;
          const alert = alertsRef.current.find((a) => a.tweetId === tweetId) ?? null;
          onSelectAlertRef.current(alert);
        };

        for (const id of [PAST_FROM_LAYER, PAST_TO_LAYER, ACTIVE_FROM_LAYER, ACTIVE_TO_LAYER]) {
          map.on('click', id, handleClick);
          map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
        }

        mapRef.current = map;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown MapLibre initialization error.';
        setMapError(message);
      }
    }).catch((error) => {
      if (!cancelled) {
        const message =
          error instanceof Error ? error.message : 'Failed to load map library.';
        setMapError(message);
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      isReadyRef.current = false;
    };
  }, []);

  // ── Switch basemap ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReadyRef.current) return;

    map.setStyle(buildStyle(basemap));
    map.once('style.load', () => {
      ensureLayers(map);
      updateSourceData(map, alertsRef.current, currentIndexRef.current);
    });
  }, [basemap]);

  // ── Update data on currentIndex change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReadyRef.current) return;

    updateSourceData(map, alerts, currentIndex);
  }, [alerts, currentIndex]);

  // ── Fly to selected alert ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReadyRef.current) return;

    if (!selectedAlert) return;

    // Fly to the first FROM location, or centroid as fallback
    const target: [number, number] | null =
      selectedAlert.evacuationEdges[0]?.from ??
      selectedAlert.centroid;

    if (!target) return;

    if (prefersReducedMotion) {
      map.jumpTo({ center: target, zoom: Math.max(map.getZoom(), 9) });
    } else {
      map.flyTo({ center: target, zoom: Math.max(map.getZoom(), 9), duration: 600 });
    }
  }, [selectedAlert, prefersReducedMotion]);

  // ── Render ──
  if (mapError) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'var(--color-text, #1f2f8f)',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '0.85rem'
          }}
        >
          <p>Map could not be loaded: {mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        aria-label="Interactive map showing 112 emergency alert locations"
      />
      {/* Basemap toggle */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: '4px',
          padding: '6px 10px',
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: '11px',
          lineHeight: '18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          zIndex: 1
        }}
      >
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            name="basemap"
            checked={basemap === 'osm'}
            onChange={() => setBasemap('osm')}
            style={{ margin: 0 }}
          />
          OpenStreetMap
        </label>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            name="basemap"
            checked={basemap === 'satellite'}
            onChange={() => setBasemap('satellite')}
            style={{ margin: 0 }}
          />
          Satellite
        </label>
      </div>
    </div>
  );
}
