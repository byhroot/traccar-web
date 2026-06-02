/**
 * MapRouteCoordinatesCombined v4
 *
 * - route OLDUĞU GİBİ çizilir (filtreleme yok)
 * - Renk: cihaz attribute'undan değil, prop'tan alınır (DEVICE_COLORS paleti)
 * - Segment seçimi: tıklanan lngLat → en yakın position → trip aralığı tespiti
 * - Seçili segment: kalın + tam opaklık (sel layer üste)
 * - Diğer cihazların rotaları da sönük göstermek için hasAnySelection prop'u
 * - Seçim yokken tüm rotalar normal görünür
 *
 * Yerleştirme: src/map/MapRouteCoordinatesCombined.jsx
 */

import { useId, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { map } from './core/MapView';
import { findFonts } from './core/mapUtil';
import { useAttributePreference } from '../common/util/preferences';

/* ─── Kontak bucket'ları ─── */
const ON_EVENTS = new Set(['deviceOnline', 'ignitionOn', 'deviceMoving']);
const OFF_EVENTS = new Set(['deviceOffline', 'ignitionOff', 'deviceStopped']);

function buildTripRanges(events) {
  const relevant = events
    .filter((e) => ON_EVENTS.has(e.type) || OFF_EVENTS.has(e.type))
    .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));

  const clean = [];
  let last = null;
  for (const ev of relevant) {
    const bucket = ON_EVENTS.has(ev.type) ? 'on' : 'off';
    if (bucket === last) continue;
    clean.push({ ...ev, _bucket: bucket });
    last = bucket;
  }

  const ranges = [];
  for (let i = 0; i < clean.length; i++) {
    if (clean[i]._bucket !== 'on') continue;
    const fromTime = clean[i].eventTime;
    const toTime = clean[i + 1]?._bucket === 'off' ? clean[i + 1].eventTime : null;
    ranges.push({
      fromTime,
      toTime,
      fromMs: new Date(fromTime).getTime(),
      toMs: toTime ? new Date(toTime).getTime() : Infinity,
    });
  }
  return ranges;
}

function findTripForClick(clickLngLat, positions, tripRanges) {
  if (!positions.length || !tripRanges.length) return null;
  let minDist = Infinity;
  let nearest = null;
  for (const pos of positions) {
    const dx = pos.longitude - clickLngLat.lng;
    const dy = pos.latitude - clickLngLat.lat;
    const d = dx * dx + dy * dy;
    if (d < minDist) { minDist = d; nearest = pos; }
  }
  if (!nearest) return null;
  const t = new Date(nearest.fixTime || nearest.deviceTime).getTime();
  const tripIdx = tripRanges.findIndex((r) => t >= r.fromMs && t <= r.toMs);
  if (tripIdx === -1) return null;
  return { tripIdx, trip: tripRanges[tripIdx] };
}

function routeSliceForTrip(route, positions, tripRange) {
  if (!positions.length || !route.length) return { start: 0, end: route.length - 1 };
  const sorted = [...positions]
    .filter((p) => p.fixTime || p.deviceTime)
    .sort((a, b) => new Date(a.fixTime || a.deviceTime) - new Date(b.fixTime || b.deviceTime));
  if (sorted.length < 2) return { start: 0, end: route.length - 1 };
  const firstMs = new Date(sorted[0].fixTime || sorted[0].deviceTime).getTime();
  const lastMs = new Date(sorted[sorted.length - 1].fixTime || sorted[sorted.length - 1].deviceTime).getTime();
  const span = lastMs - firstMs || 1;
  const toIdx = (ms) => Math.round(((ms - firstMs) / span) * (route.length - 1));
  const start = Math.max(0, toIdx(tripRange.fromMs));
  const end = Math.min(route.length - 1, tripRange.toMs === Infinity ? route.length - 1 : toIdx(tripRange.toMs));
  return { start, end: Math.max(start + 1, end) };
}

/* ═══════════════════════════════════════════
   Component
═══════════════════════════════════════════ */
const MapRouteCoordinatesCombined = ({
  item,              // { deviceId, events, positions, route }
  name,
  color,             // DEVICE_COLORS[idx] — dışarıdan gelir
  selectedSegment,   // number | null — bu cihazda seçili trip index
  hasAnySelection,   // boolean — herhangi bir cihazda seçim var mı (bu değilse solar)
  onSegmentClick,    // ({ segmentIndex, fromTime, toTime }) => void
}) => {
  const id = useId();
  const theme = useTheme();

  const mapLineWidth = useAttributePreference('mapLineWidth', 2);
  const mapLineOpacity = useAttributePreference('mapLineOpacity', 1);

  const route = item.route || [];
  const events = item.events || [];
  const positions = item.positions || [];
  const tripRanges = buildTripRanges(events);

  /* ─── Source + Layer kurulumu (mount once) ─── */
  useEffect(() => {
    // Tam rota
    map.addSource(`${id}-full`, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
    });
    map.addLayer({
      id: `${id}-full-line`, source: `${id}-full`, type: 'line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    });
    map.addLayer({
      id: `${id}-full-title`, source: `${id}-full`, type: 'symbol',
      layout: { 'text-field': '{name}', 'text-font': findFonts(map), 'text-size': 12 },
      paint: { 'text-halo-color': 'white', 'text-halo-width': 1 },
    });
    // Hit area (tıklamayı kolaylaştırır)
    map.addLayer({
      id: `${id}-full-hit`, source: `${id}-full`, type: 'line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': 'rgba(0,0,0,0)', 'line-width': 20, 'line-opacity': 0.1 },
    });

    // Seçili segment (üste, başlangıçta boş)
    map.addSource(`${id}-sel`, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
    });
    map.addLayer({
      id: `${id}-sel-line`, source: `${id}-sel`, type: 'line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': ['get', 'opacity'],
      },
    });

    return () => {
      [`${id}-full-title`, `${id}-full-hit`, `${id}-full-line`, `${id}-sel-line`].forEach((lid) => {
        if (map.getLayer(lid)) map.removeLayer(lid);
      });
      [`${id}-full`, `${id}-sel`].forEach((sid) => {
        if (map.getSource(sid)) map.removeSource(sid);
      });
    };
  }, []);

  /* ─── Veri + opaklık güncelle ─── */
  useEffect(() => {
    const isThisSelected = selectedSegment !== null && selectedSegment !== undefined;
    // Bu cihazda seçim var → full solar, sel parlak
    // Başka cihazda seçim var → bu cihaz da solar
    // Hiç seçim yok → normal
    const fullOpacity = isThisSelected
      ? mapLineOpacity * 0.2          // bu cihazın full rotası solar (segment öne çıkacak)
      : hasAnySelection
        ? mapLineOpacity * 0.2        // başka cihaz seçili, bu da solar
        : mapLineOpacity;

    const fullWidth = hasAnySelection && !isThisSelected
      ? Math.max(1, mapLineWidth - 1) // diğer cihazlar incelir
      : mapLineWidth;

    map.getSource(`${id}-full`)?.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: route },
      properties: { name, color, width: fullWidth, opacity: fullOpacity },
    });

    // Seçili segment
    if (isThisSelected && tripRanges[selectedSegment]) {
      const { start, end } = routeSliceForTrip(route, positions, tripRanges[selectedSegment]);
      const sliceCoords = route.slice(start, end + 1);
      map.getSource(`${id}-sel`)?.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: sliceCoords },
        properties: { name, color, width: mapLineWidth + 4, opacity: 1 },
      });
    } else {
      map.getSource(`${id}-sel`)?.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] },
        properties: {},
      });
    }
  }, [theme, route, selectedSegment, hasAnySelection, color, name, mapLineWidth, mapLineOpacity, tripRanges, positions]);

  /* ─── Click handler ─── */
  useEffect(() => {
    if (!onSegmentClick) return;

    const handleClick = (e) => {
      const result = findTripForClick(e.lngLat, positions, tripRanges);
      if (!result) return;
      const { tripIdx, trip } = result;
      onSegmentClick({ segmentIndex: tripIdx, fromTime: trip.fromTime, toTime: trip.toTime });
    };
    const cursorOn = () => { map.getCanvas().style.cursor = 'pointer'; };
    const cursorOff = () => { map.getCanvas().style.cursor = ''; };

    map.on('click', `${id}-full-hit`, handleClick);
    map.on('click', `${id}-full-line`, handleClick);
    map.on('mouseenter', `${id}-full-hit`, cursorOn);
    map.on('mouseleave', `${id}-full-hit`, cursorOff);

    return () => {
      map.off('click', `${id}-full-hit`, handleClick);
      map.off('click', `${id}-full-line`, handleClick);
      map.off('mouseenter', `${id}-full-hit`, cursorOn);
      map.off('mouseleave', `${id}-full-hit`, cursorOff);
    };
  }, [onSegmentClick, positions, tripRanges, id]);

  return null;
};

export default MapRouteCoordinatesCombined;