/**
 * MapViewCombined
 * MapView'ın combined rapor sayfasına özel versiyonu.
 * Fark: `onMapReady` prop ile harita hazır olduğunda dışarıya map instance döner.
 *
 * Yerleştirme: src/map/core/MapViewCombined.jsx
 */

import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import React, { useRef, useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { SwitcherControl } from '../switcher/switcher';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import usePersistedState, { savePersistedState } from '../../common/util/usePersistedState';
import { mapImages } from './preloadImages';
import useMapStyles from './useMapStyles';
import { useEffectAsync } from '../../reactHelper';

// Orijinal MapView ile AYNI singleton map objesini paylaşıyoruz —
// iki ayrı map instance oluşturmuyoruz, sadece container'ı taşıyoruz.
import { map } from './MapView';

// Modül-level ready state (orijinaldeki gibi global tutuyoruz ki diğer bileşenler etkilenmesin)
let _ready = true;
const _listeners = new Set();

const _addListener = (fn) => { _listeners.add(fn); fn(_ready); };
const _removeListener = (fn) => _listeners.delete(fn);
const _setReady = (val) => { _ready = val; _listeners.forEach((fn) => fn(val)); };

const _initMap = () => {
  if (_ready) return;
  if (!map.hasImage('background')) {
    Object.entries(mapImages).forEach(([key, value]) => {
      map.addImage(key, value, { pixelRatio: window.devicePixelRatio });
    });
  }
};

const MapViewCombined = ({ children, onMapReady }) => {
  const theme = useTheme();
  const containerEl = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const mapStyles = useMapStyles();
  const activeMapStyles = useAttributePreference(
    'activeMapStyles',
    'custom,darkCarto,googleRoad,googleHybrid,googleSatellite,carto,openTopoMap,locationIqStreets,locationIqDark,osm,yandexMap',
  );
  const [defaultMapStyle] = usePersistedState('selectedMapStyle', usePreference('map', 'custom'));
  const mapboxAccessToken = useAttributePreference('mapboxAccessToken');
  const maxZoom = useAttributePreference('web.maxZoom');

  const switcher = useMemo(
    () =>
      new SwitcherControl(
        () => _setReady(false),
        (styleId) => savePersistedState('selectedMapStyle', styleId),
        () => {
          map.once('styledata', () => {
            const waiting = () => {
              if (!map.loaded()) { setTimeout(waiting, 33); }
              else { _initMap(); _setReady(true); }
            };
            waiting();
          });
        },
      ),
    [],
  );

  useEffectAsync(async () => {
    if (theme.direction === 'rtl') maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js');
  }, [theme.direction]);

  useEffect(() => {
    const attribution = new maplibregl.AttributionControl({ compact: true });
    const navigation = new maplibregl.NavigationControl();
    map.addControl(attribution, theme.direction === 'rtl' ? 'bottom-left' : 'bottom-right');
    map.addControl(navigation, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    map.addControl(switcher, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => {
      map.removeControl(switcher);
      map.removeControl(navigation);
      map.removeControl(attribution);
    };
  }, [theme.direction, switcher]);

  useEffect(() => { if (maxZoom) map.setMaxZoom(maxZoom); }, [maxZoom]);
  useEffect(() => { maplibregl.accessToken = mapboxAccessToken; }, [mapboxAccessToken]);

  useEffect(() => {
    const filtered = mapStyles.filter((s) => s.available && activeMapStyles.includes(s.id));
    const styles = filtered.length ? filtered : mapStyles.filter((s) => s.id === 'osm');
    switcher.updateStyles(styles, defaultMapStyle);
  }, [mapStyles, defaultMapStyle, activeMapStyles, switcher]);

  useEffect(() => {
    const listener = (val) => {
      setMapReady(val);
      // Harita hazır olduğunda map instance'ı dışarıya ver
      if (val && onMapReady) onMapReady(map);
    };
    _addListener(listener);
    return () => _removeListener(listener);
  }, [onMapReady]);

  useLayoutEffect(() => {
    const currentEl = containerEl.current;
    const mapEl = map.getContainer();
    currentEl.appendChild(mapEl);
    map.resize();
    return () => {
      if (currentEl.contains(mapEl)) currentEl.removeChild(mapEl);
    };
  }, [containerEl]);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={containerEl}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type.handlesMapReady) {
          return React.cloneElement(child, { mapReady });
        }
        return mapReady ? child : null;
      })}
    </div>
  );
};

export default MapViewCombined;