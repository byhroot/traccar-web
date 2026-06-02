import { useId, useEffect, useRef } from 'react';
import { map } from './core/MapView';
import { useTranslation } from '../common/components/LocalizationProvider';
import maplibregl from 'maplibre-gl';

/* ─── Renk ─── */
const BUBBLE_COLORS = {
  alarm: '#f44336', ignitionOn: '#4caf50', ignitionOff: '#757575',
  deviceMoving: '#2196f3', deviceStopped: '#ff9800', deviceOverspeed: '#fc9d45',
  geofenceEnter: '#9c27b0', geofenceExit: '#9c27b0',
};
const bubbleColor = (type) => BUBBLE_COLORS[type] || '#607d8b';

/* ─── Image cache ─── */
const IMAGE_CACHE = new Map();
function getCached(key, fn) {
  if (!IMAGE_CACHE.has(key)) IMAGE_CACHE.set(key, fn());
  return IMAGE_CACHE.get(key);
}

/* ─── Baloncuk çizici (tek/çift satır ortak) ─── */
function drawBubble(ctx, w, h, th, tw, r, color) {
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(w / 2 + tw, h); ctx.lineTo(w / 2, th); ctx.lineTo(w / 2 - tw, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r); ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}

/* ─── Tek olaylı baloncuk ─── */
const singleBubble = (label, color) => getCached(`1:${label}:${color}`, () => {
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  const fs = 12, px = 10, py = 6, tailH = 18, tw = 4, r = 7;
  ctx.font = `bold ${fs}px sans-serif`;
  const w = Math.ceil(ctx.measureText(label).width + px * 2);
  const h = Math.ceil(fs + py * 2), th = h + tailH;
  c.width = w; c.height = th;
  ctx.font = `bold ${fs}px sans-serif`;
  drawBubble(ctx, w, h, th, tw, r, color);
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  ctx.fillText(label, px, h / 2);
  return { data: ctx.getImageData(0, 0, w, th).data, width: w, height: th };
});

/* ─── Çift satırlı baloncuk ─── */
const twoBubble = (devName, label, color) => getCached(`2:${devName}:${label}:${color}`, () => {
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  const ls = 12, ds = 10, px = 10, py = 5, gap = 2, tailH = 18, tw = 4, r = 7;
  ctx.font = `bold ${ls}px sans-serif`;
  const lw = ctx.measureText(label).width;
  ctx.font = `${ds}px sans-serif`;
  const dw = ctx.measureText(devName).width;
  const w = Math.ceil(Math.max(lw, dw) + px * 2);
  const dlh = ds + 2, llh = ls + 2, h = py * 2 + dlh + gap + llh, th = h + tailH;
  c.width = w; c.height = th;
  ctx.font = `bold ${ls}px sans-serif`;
  drawBubble(ctx, w, h, th, tw, r, color);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, w, py + dlh + gap / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `${ds}px sans-serif`; ctx.textBaseline = 'middle';
  ctx.fillText(devName, px, py + dlh / 2);
  ctx.fillStyle = '#fff'; ctx.font = `bold ${ls}px sans-serif`;
  ctx.fillText(label, px, py + dlh + gap + llh / 2);
  return { data: ctx.getImageData(0, 0, w, th).data, width: w, height: th };
});

/* ─── Grup baloncuğu: "N olay" — yuvarlak olmadan düz baloncuk ─── */
const groupBubble = (count, color) => getCached(`g:${count}:${color}`, () => {
  const label = `${count} olay`;
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  const fs = 12, px = 12, py = 6, tailH = 18, tw = 4, r = 7;
  ctx.font = `bold ${fs}px sans-serif`;
  const textW = ctx.measureText(label).width;
  const w = Math.ceil(textW + px * 2);
  const h = Math.ceil(fs + py * 2), th = h + tailH;
  c.width = w; c.height = th;
  ctx.font = `bold ${fs}px sans-serif`;
  drawBubble(ctx, w, h, th, tw, r, color);
  // İnce alt kenar vurgusu
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, h - 3, w, 3);
  // Metin
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  ctx.fillText(label, px, h / 2);
  return { data: ctx.getImageData(0, 0, w, th).data, width: w, height: th };
});

/* ─── Filter key ─── */
const FILTER_KEYS = {
  ignitionOn: 'ignition', ignitionOff: 'ignition',
  deviceMoving: 'movement', deviceStopped: 'movement',
  deviceOverspeed: 'speed', alarm: 'alarm',
  geofenceEnter: 'geofence', geofenceExit: 'geofence',
};
const getFilterKey = (type) => FILTER_KEYS[type] || 'other';

const getIconId = (type, alarmAttr, devSuffix) => {
  const base = (type === 'alarm' && alarmAttr) ? `bubble-alarm-${alarmAttr}` : `bubble-${type}`;
  return devSuffix ? `${base}-${devSuffix}` : base;
};

/* ─── Replay penceresi ─── */
function findReplayWindow(evTimeStr, sortedPos, marginMs) {
  const evMs = new Date(evTimeStr).getTime();
  const inRange = sortedPos.filter((p) => {
    const t = new Date(p.fixTime || p.deviceTime).getTime();
    return t >= evMs - marginMs && t <= evMs + marginMs;
  });
  if (inRange.length) return {
    from: inRange[0].fixTime || inRange[0].deviceTime,
    to: inRange[inRange.length - 1].fixTime || inRange[inRange.length - 1].deviceTime,
  };
  const before = sortedPos.filter((p) => new Date(p.fixTime || p.deviceTime).getTime() < evMs);
  const after = sortedPos.filter((p) => new Date(p.fixTime || p.deviceTime).getTime() > evMs);
  const fromP = before.length ? before[before.length - 1] : after[0];
  const toP = after.length ? after[0] : before[before.length - 1];
  if (!fromP) return null;
  return { from: fromP.fixTime || fromP.deviceTime, to: toP.fixTime || toP.deviceTime };
}

/* ─── Popup HTML ─── */
function replayBtn(color, from, to, deviceId, marginMin) {
  return `<button onclick="window.__mreReplay&&window.__mreReplay('${from}','${to}','${deviceId}')"
    style="margin-top:6px;width:100%;padding:5px 8px;border:1.5px solid ${color};border-radius:7px;
    background:${color};color:#fff;font-size:11px;font-weight:700;cursor:pointer;
    box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:4px">
    ▶ Replay (±${marginMin}dk)</button>`;
}

function singlePopupHtml(label, color, timeStr, replayHtml) {
  return `<div style="font-family:system-ui,sans-serif;font-size:13px;min-width:160px;max-width:220px;line-height:1.5">
    <div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:14px;margin-bottom:3px">
      <span style="width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block"></span>
      <span style="background:rgba(255,255,255,0.92);color:#111;padding:1px 6px;border-radius:4px">${label}</span>
    </div>
    <div style="font-size:11px;background:rgba(255,255,255,0.85);color:#333;padding:1px 6px;border-radius:4px;display:inline-block">${timeStr}</div>
    ${replayHtml}
  </div>`;
}

function groupPopupHtml(eventsArr, sortedPos, marginMin, onReplayRequest) {
  const rows = eventsArr.map((ev) => {
    const color = bubbleColor(ev.type);
    const timeStr = ev.eventTime
      ? new Date(ev.eventTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' }) : '';
    let btn = '';
    if (onReplayRequest && ev.eventTime) {
      const win = findReplayWindow(ev.eventTime, sortedPos, marginMin * 60000);
      if (win) btn = replayBtn(color, win.from, win.to, String(ev.deviceId || ''), marginMin);
    }
    return `<div style="border-bottom:1px solid #f0f0f0;padding:6px 0">
      <div style="display:flex;align-items:center;gap:5px;font-weight:600;font-size:12px">
        <span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0"></span>
        <span style="background:rgba(255,255,255,0.92);color:#111;padding:1px 4px;border-radius:3px">${ev._label}</span>
      </div>
      <div style="font-size:10px;background:rgba(255,255,255,0.85);color:#333;padding:1px 4px;border-radius:3px;display:inline-block;margin-left:12px">${timeStr}</div>
      ${btn}
    </div>`;
  }).join('');

  return `<div style="font-family:system-ui,sans-serif;font-size:12px;max-width:240px;max-height:300px;overflow-y:auto">
    <div style="font-weight:700;font-size:12px;color:#555;margin-bottom:4px;padding-bottom:4px;border-bottom:2px solid #eee">
      ${eventsArr.length} Olay
    </div>
    ${rows}
  </div>`;
}

/* ─── Pixel gruplama ─── */
const PIXEL_THRESHOLD = 48;

function groupByPixel(features) {
  if (!features.length || !map?.project) return []; // ← map.project ekle
  const pts = features.map((f) => map.project(f.geometry.coordinates));

  // Union-Find
  const parent = features.map((_, i) => i);
  function find(i) { return parent[i] === i ? i : (parent[i] = find(parent[i])); }
  function union(i, j) { parent[find(i)] = find(j); }

  // Her çift arasındaki mesafeyi kontrol et
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < PIXEL_THRESHOLD) union(i, j);
    }
  }

  // Grupları topla
  const map2 = new Map();
  features.forEach((_, i) => {
    const root = find(i);
    if (!map2.has(root)) map2.set(root, []);
    map2.get(root).push(i);
  });
  return [...map2.values()];
}

function ensureImage(imgId, imgData) {
  if (!map?.hasImage) return; // ← ekle

  if (!map.hasImage(imgId))
    map.addImage(imgId, { data: new Uint8Array(imgData.data), width: imgData.width, height: imgData.height });
}

/* ═══════════════════════════════════════
   Component
═══════════════════════════════════════ */
const MapRouteEvents = ({
  positions, events, filters,
  replayMarginMin = 15, onReplayRequest,
  deviceName = '', showDeviceName = false,
  deviceColor = '#607d8b',
}) => {
  const id = useId();
  const t = useTranslation();
  const popupRef = useRef(null);
  const sortedPosRef = useRef([]);
  const rawFeaturesRef = useRef([]);
  const activeFiltersRef = useRef(null);

  const devSuffix = showDeviceName && deviceName
    ? deviceName.replace(/[^a-z0-9]/gi, '').slice(0, 12) : '';

  const getLabel = (ev) => {
    if (ev.type === 'alarm' && ev.attributes?.alarm)
      return t(`alarm${ev.attributes.alarm[0].toUpperCase()}${ev.attributes.alarm.slice(1)}`);
    return t(`event${ev.type[0].toUpperCase()}${ev.type.slice(1)}`);
  };

  const makeBubble = (ev) => {
    const label = getLabel(ev), color = bubbleColor(ev.type);
    return showDeviceName && deviceName ? twoBubble(deviceName, label, color) : singleBubble(label, color);
  };

  const closePopup = () => { popupRef.current?.remove(); popupRef.current = null; };

  /* ── Popup: tek olay ── */
  const openSinglePopup = (lngLat, ev) => {
    closePopup();
    const color = bubbleColor(ev.type);
    const timeStr = ev.eventTime
      ? new Date(ev.eventTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' }) : '';
    let btnHtml = '';
    if (onReplayRequest && ev.eventTime) {
      const win = findReplayWindow(ev.eventTime, sortedPosRef.current, replayMarginMin * 60000);
      if (win) btnHtml = replayBtn(color, win.from, win.to, String(ev.deviceId || ''), replayMarginMin);
    }
    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '230px' })
      .setLngLat(lngLat)
      .setHTML(singlePopupHtml(ev._label || getLabel(ev), color, timeStr, btnHtml))
      .addTo(map);
  };

  /* ── Popup: grup ── */
  const openGroupPopup = (lngLat, eventsArr) => {
    closePopup();
    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
      .setLngLat(lngLat)
      .setHTML(groupPopupHtml(eventsArr, sortedPosRef.current, replayMarginMin, onReplayRequest))
      .addTo(map);
  };

  const applyFilter = (ak) => {
    if (!map?.getSource) return; // ← ekle
    const raw = rawFeaturesRef.current;
    if (!raw.length || !map.getSource(`${id}-s`)) return;

    const features = groupByPixel(raw).flatMap((grpIdxs) => {
      if (grpIdxs.length === 1) {
        // Tek olay — filterKey eşleşmiyorsa dışla
        const f = raw[grpIdxs[0]];
        return ak.has(f.properties.filterKey) ? [f] : [];
      }
      // Grup — içindeki eventleri filtrele
      const filtered = grpIdxs.filter((i) => ak.has(raw[i].properties.filterKey));
      if (!filtered.length) return []; // hiç eşleşen yok → grubu gizle
      if (filtered.length === 1) return [raw[filtered[0]]]; // tek kalan → normal baloncuk
      // Birden fazla kalan → yeni grup baloncuğu
      const first = raw[filtered[0]];
      const groupEvs = filtered.map((i) => raw[i].properties._ev);
      const filterKeys = [...new Set(filtered.map((i) => raw[i].properties.filterKey))];
      const iconId = `grp-${filtered.length}-${deviceColor.slice(1)}`;
      ensureImage(iconId, groupBubble(filtered.length, deviceColor));
      return [{
        type: 'Feature',
        geometry: first.geometry,
        properties: { iconId, filterKey: filterKeys[0], filterKeys: filterKeys.join(','), isGroup: true, groupEvsJson: JSON.stringify(groupEvs) },
      }];
    });

    map.getSource(`${id}-s`)?.setData({ type: 'FeatureCollection', features });
    try { if (map?.getLayer?.(`${id}-u`)) map?.setFilter?.(`${id}-u`, ['all']); } catch (_) { }
  }

  /* ── Gruplama → source güncelle ── */
  const rebuildGroupedFeatures = () => {
    if (!map?.getSource) return; // ← ekle

    const raw = rawFeaturesRef.current;
    if (!raw.length || !map.getSource(`${id}-s`)) return;

    const features = groupByPixel(raw).map((grpIdxs) => {
      if (grpIdxs.length === 1) return raw[grpIdxs[0]];

      const first = raw[grpIdxs[0]];
      const groupEvs = grpIdxs.map((i) => raw[i].properties._ev);
      // Grup içindeki tüm filterKey'leri topla — filtre uygulanırken herhangi biri eşleşirse göster
      const filterKeys = [...new Set(grpIdxs.map((i) => raw[i].properties.filterKey))];
      const iconId = `grp-${grpIdxs.length}-${deviceColor.slice(1)}`;
      ensureImage(iconId, groupBubble(grpIdxs.length, deviceColor));
      return {
        type: 'Feature',
        geometry: first.geometry,
        properties: {
          iconId,
          filterKey: filterKeys[0],           // MapLibre expression için tek değer
          filterKeys: filterKeys.join(','),     // virgülle birleşik string — JS tarafında parse
          isGroup: true,
          groupEvsJson: JSON.stringify(groupEvs),
        },
      };
    });

    // Aktif filtre varsa uygula, yoksa tüm feature'ları göster
    if (activeFiltersRef.current) {
      applyFilter(activeFiltersRef.current);
    } else {
      map.getSource(`${id}-s`)?.setData({ type: 'FeatureCollection', features });
    }
  };

  /* ── Layer kurulum ── */
  useEffect(() => {
    map.addSource(`${id}-s`, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: `${id}-u`, type: 'symbol', source: `${id}-s`, filter: ['all'],
      layout: {
        'icon-image': ['get', 'iconId'],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      }
    });

    map.on('zoomend', rebuildGroupedFeatures);

    const onBg = (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [`${id}-u`] });
      if (!hit.length) closePopup();
    };
    map.on('click', onBg);

    return () => {
      map.off('zoomend', rebuildGroupedFeatures);
      map.off('click', onBg);
      closePopup();
      try { if (map?.getLayer?.(`${id}-u`)) map?.removeLayer(`${id}-u`); } catch (_) { }
      try { if (map?.getSource?.(`${id}-s`)) map?.removeSource(`${id}-s`); } catch (_) { }
    };
  }, []);

  /* ── Replay hook ── */
  useEffect(() => {
    if (!onReplayRequest) return;
    window.__mreReplay = onReplayRequest;
    return () => { delete window.__mreReplay; };
  }, [onReplayRequest]);

  /* ── Veri yükle ── */
  useEffect(() => {
    if (!positions?.length || !events?.length) return;

    sortedPosRef.current = [...positions]
      .filter((p) => p.fixTime || p.deviceTime)
      .sort((a, b) => new Date(a.fixTime || a.deviceTime) - new Date(b.fixTime || b.deviceTime));

    const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));

    rawFeaturesRef.current = events.reduce((acc, ev) => {
      const p = posMap[ev.positionId];
      if (!p) return acc;
      const label = getLabel(ev);
      const iconId = getIconId(ev.type, ev.attributes?.alarm, devSuffix);
      ensureImage(iconId, makeBubble(ev));
      acc.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: {
          iconId,
          filterKey: getFilterKey(ev.type),
          _ev: ev,
          _label: label,
          _color: bubbleColor(ev.type),
        },
      });
      return acc;
    }, []);

    rebuildGroupedFeatures();

    return () => {
      const ids = new Set(events.map((e) => getIconId(e.type, e.attributes?.alarm, devSuffix)));
      ids.forEach((iconId) => { try { if (map.hasImage?.(iconId)) map.removeImage?.(iconId); } catch (_) { } });
    };
  }, [positions, events]);

  /* ── Click handler'lar ── */
  useEffect(() => {
    const onPoint = (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: [`${id}-u`] });
      if (!feats.length) return;
      const p = feats[0].properties;
      const coords = feats[0].geometry.coordinates;
      if (p.isGroup) {
        try {
          const evs = JSON.parse(p.groupEvsJson);
          evs.forEach((ev) => { ev._label = getLabel(ev); });
          openGroupPopup(coords, evs);
        } catch (_) { }
      } else {
        const ev = typeof p._ev === 'string' ? JSON.parse(p._ev) : p._ev;
        if (ev) { ev._label = p._label; openSinglePopup(coords, ev); }
      }
    };

    const on = () => { map.getCanvas().style.cursor = 'pointer'; };
    const off = () => { map.getCanvas().style.cursor = ''; };

    map.on('click', `${id}-u`, onPoint);
    map.on('mouseenter', `${id}-u`, on); map.on('mouseleave', `${id}-u`, off);

    return () => {
      map.off('click', `${id}-u`, onPoint);
      map.off('mouseenter', `${id}-u`, on); map.off('mouseleave', `${id}-u`, off);
    };
  }, [onReplayRequest, replayMarginMin]);

  /* ── Filtre ── */
  useEffect(() => {
    if (!filters) return;
    const ak = new Set(Object.entries(filters).filter(([, v]) => v).map(([k]) => k));
    activeFiltersRef.current = ak;
    applyFilter(ak);
  }, [filters]);

  ;

  return null;
};

export default MapRouteEvents;