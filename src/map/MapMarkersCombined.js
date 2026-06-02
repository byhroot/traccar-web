/**
 * MapMarkersCombined v2
 *
 * Event tipine göre icon seçimi:
 *  - ignitionOn / deviceMoving / deviceOnline  → yeşil / hareket ikonu
 *  - ignitionOff / deviceStopped              → kırmızı / dur ikonu
 *  - deviceOffline                            → gri / çevrimdışı
 *  - alarm / geofenceEnter / geofenceExit     → uyarı ikonu
 *  - diğerleri                                → neutral
 *
 * Icon key'leri Traccar'ın preloadImages sistemine göre:
 *  default-neutral, default-alarm, default-arrow (hareket yönü için)
 *  + kategori tabanlı: animal, bicycle, boat, bus, car, crane, helicopter,
 *    motorcycle, offroad, person, pickup, plane, ship, tractor, train,
 *    tram, trolleybus, truck, van, default
 *
 * Yerleştirme: src/map/MapMarkersCombined.jsx
 */

import { useId, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';

/* ─── Event tipi → icon key + renk ─── */
const EVENT_ICON_MAP = {
  // Kontak / hareket
  ignitionOn: { image: 'default-arrow', color: '#4CAF50', label: 'Kontak Açık' },
  ignitionOff: { image: 'default-neutral', color: '#F44336', label: 'Kontak Kapalı' },
  deviceMoving: { image: 'default-arrow', color: '#2196F3', label: 'Hareket' },
  deviceStopped: { image: 'default-neutral', color: '#FF9800', label: 'Durdu' },
  deviceOnline: { image: 'default-arrow', color: '#4CAF50', label: 'Çevrimiçi' },
  deviceOffline: { image: 'default-neutral', color: '#9E9E9E', label: 'Çevrimdışı' },

  // Alarm
  deviceOverspeed: { image: 'default-alarm', color: '#F44336', label: 'Hız Aşımı' },
  deviceFuelDrop: { image: 'default-alarm', color: '#FF5722', label: 'Yakıt Düşüşü' },
  alarm: { image: 'default-alarm', color: '#E91E63', label: 'Alarm' },
  sos: { image: 'default-alarm', color: '#B71C1C', label: 'SOS' },

  // Geofence
  geofenceEnter: { image: 'default-arrow', color: '#00BCD4', label: 'Bölgeye Girdi' },
  geofenceExit: { image: 'default-alarm', color: '#FF5722', label: 'Bölgeden Çıktı' },

  // Bakım
  maintenance: { image: 'default-neutral', color: '#795548', label: 'Bakım' },

  // Varsayılan
  _default: { image: 'default-neutral', color: '#607D8B', label: 'Olay' },
};

function getEventMeta(eventType) {
  return EVENT_ICON_MAP[eventType] || EVENT_ICON_MAP._default;
}

/* ─── Popup HTML ─── */
function buildPopupHtml({ eventType, eventTime, deviceName, deviceId, replayParams, color, label }) {
  const timeStr = eventTime
    ? new Date(eventTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
    : '';

  const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:5px;flex-shrink:0"></span>`;

  const replayBtn = replayParams
    ? `<button
         onclick="window.__combinedReplay && window.__combinedReplay('${replayParams}')"
         style="margin-top:8px;padding:4px 10px;border:1.5px solid ${color};border-radius:6px;
                background:${color}18;color:${color};font-size:11px;font-weight:700;
                cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:4px">
         ▶ Replay
       </button>`
    : '';

  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;min-width:170px;line-height:1.6;padding:2px 0">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px;display:flex;align-items:center">
        ${dot}${deviceName || `#${deviceId}`}
      </div>
      <div style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:10px;
                  background:${color}18;border:1px solid ${color}40;margin-bottom:4px">
        <span style="color:${color};font-weight:700;font-size:11px">${label}</span>
      </div>
      <div style="color:#777;font-size:11px">${timeStr}</div>
      ${replayBtn}
    </div>`;
}

/* ══════════════════════════════════════════
   Component
══════════════════════════════════════════ */
const MapMarkersCombined = ({ markers, onMarkerClick, onReplayRequest }) => {
  const id = useId();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);
  const popupRef = useRef(null);

  /* ─── Source + Layer ─── */
  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': ['get', 'image'],   // ← event tipine göre dinamik
        'icon-size': iconScale,
        'icon-allow-overlap': true,
        // Küçük renkli nokta üstüne label — sadece masaüstünde
        'text-field': ['get', 'shortLabel'],
        'text-allow-overlap': true,
        'text-anchor': 'top',
        'text-offset': [0, 1.2],
        'text-font': findFonts(map),
        'text-size': 10,
      },
      paint: {
        'text-color': ['get', 'textColor'],
        'text-halo-color': 'white',
        'text-halo-width': 1,
      },
    });

    return () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, []);

  /* ─── Marker verilerini güncelle ─── */
  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: markers.map(({
        latitude, longitude,
        eventType, eventTime, deviceId, deviceName,
        fromTime, toTime,
      }) => {
        const meta = getEventMeta(eventType);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [longitude, latitude] },
          properties: {
            image: meta.image,
            textColor: meta.color,
            shortLabel: '',          // label'ı sadece popup'ta göster, harita temiz kalsın
            eventType,
            eventTime: eventTime || '',
            deviceId: String(deviceId || ''),
            deviceName: deviceName || '',
            fromTime: fromTime || '',
            toTime: toTime || '',
            color: meta.color,
            label: meta.label,
          },
        };
      }),
    });
  }, [markers]);

  /* ─── Click → Popup ─── */
  useEffect(() => {
    const handleClick = (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const {
        eventType, eventTime, deviceName, deviceId,
        fromTime, toTime, color, label,
      } = feature.properties;

      const coords = feature.geometry.coordinates.slice();

      if (popupRef.current) popupRef.current.remove();

      const replayParams = fromTime
        ? new URLSearchParams({
          from: fromTime,
          to: toTime || fromTime,
          deviceId: deviceId,
        }).toString()
        : null;

      const html = buildPopupHtml({ eventType, eventTime, deviceName, deviceId, replayParams, color, label });

      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        maxWidth: '240px',
        className: 'combined-event-popup',
      })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);

      if (onMarkerClick) onMarkerClick(feature.properties);
    };

    const cursorOn = () => { map.getCanvas().style.cursor = 'pointer'; };
    const cursorOff = () => { map.getCanvas().style.cursor = ''; };

    map.on('click', id, handleClick);
    map.on('mouseenter', id, cursorOn);
    map.on('mouseleave', id, cursorOff);

    return () => {
      map.off('click', id, handleClick);
      map.off('mouseenter', id, cursorOn);
      map.off('mouseleave', id, cursorOff);
    };
  }, [onMarkerClick]);

  /* ─── Global replay hook (popup butonu için) ─── */
  useEffect(() => {
    if (!onReplayRequest) return;
    window.__combinedReplay = (params) => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      onReplayRequest(params);
    };
    return () => { delete window.__combinedReplay; };
  }, [onReplayRequest]);

  return null;
};

export default MapMarkersCombined;