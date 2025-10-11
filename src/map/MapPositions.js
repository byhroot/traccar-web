import { useId, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';

const MapPositions = ({ positions, onClick, showStatus, selectedPosition, titleField }) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;
  const pulseLayer = `${id}-pulse`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const userLiveRoutes = useSelector((state) => state.session?.user?.attributes['mapLiveRoutes']);

  const mapCluster = useAttributePreference('mapCluster', false);
  const directionType = useAttributePreference('mapDirection', 'selected');
  const mapLiveRoutes = useAttributePreference('mapLiveRoutes', 'all');
  const pulseRef = useRef(0);

  // 🧠 Feature oluşturma
  const createFeature = (devices, position, selectedPositionId) => {
    const device = devices[position.deviceId];
    const category = position?.attributes?.blocked ? 'locked' : device.category;

    let showDirection;
    switch (directionType) {
      case 'none':
        showDirection = false;
        break;
      case 'all':
        showDirection = position.course > 0;
        break;
      default:
        showDirection = selectedPositionId === position.id && position.course > 0;
        break;
    }

    return {
      id: position.id,
      deviceId: position.deviceId,
      name: device.name,
      fixTime: formatTime(position.deviceTime, 'seconds'),
      category: mapIconKey(category),
      color: showStatus
        ? device.status === 'online'
          ? device.motionState
            ? 'success'
            : 'greyy'
          : 'error'
        : position.attributes.color ||
          (position.attributes.blocked ? 'error' : getStatusColor(device.status)),
      rotation: position.course,
      direction: showDirection,
      isOnline: device.status === 'online',
      motionState: !!device.motionState,
      pulseStep: 0,
    };
  };

  // 🖱️ İmleç kontrolü
  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  // 🗺️ Boş alana tıklama → seçimi iptal et
  const onMapClick = useCallback(
    (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [id, selected, clusters],
      });
      if (features.length === 0 && onClick) onClick(null, null);
    },
    [onClick],
  );

  // 📍 Marker tıklama
  const onMarkerClick = useCallback(
    (event) => {
      event.preventDefault();
      const feature = event.features[0];
      if (onClick) {
        onClick(feature.properties.id, feature.properties.deviceId);
      }
    },
    [onClick],
  );

  // 🔘 Cluster genişletme
  const onClusterClick = useCatchCallback(
    async (event) => {
      event.preventDefault();
      const features = map.queryRenderedFeatures(event.point, { layers: [clusters] });
      const clusterId = features[0].properties.cluster_id;
      const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
      map.easeTo({ center: features[0].geometry.coordinates, zoom });
    },
    [clusters],
  );

  // 🌍 Layer ve kaynak oluşturma
  useEffect(() => {
    if (!map?.getSource) return;

    // Ana kaynak
    map.addSource(id, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addSource(selected, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Ana ve seçili cihaz layer'ları
    [id, selected].forEach((source) => {
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{category}-{color}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'text-field': `{${titleField || 'name'}}`,
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -2 * iconScale],
          'text-size': 12,
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });

      // Yön oku
      map.addLayer({
        id: `direction-${source}`,
        type: 'symbol',
        source,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });

      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClick);
    });

    // Cluster layer
    map.addLayer({
      id: clusters,
      type: 'symbol',
      source: id,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': iconScale,
        'text-field': '{point_count_abbreviated}',
        'text-size': 14,
      },
    });

    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClick);

    // 🔵 Pulse layer (GPU animasyon)
    if ((userLiveRoutes === undefined && mapLiveRoutes === 'all') || userLiveRoutes === 'all') {
      map.addLayer({
      id: pulseLayer,
      type: 'circle',
      source: id,
      filter: [
        'all',
        ['!has', 'point_count'],
        ['==', 'motionState', true],
        ['==', 'isOnline', true],
      ],
      paint: {
        // Başlangıçta küçük (ikonun hemen dışında) → dışa doğru büyür
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'pulseStep'],
          0, 10,   // ikonun hemen dışı
          1, 35,   // dışa kadar yayılır
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#00bcd4',
        'circle-stroke-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'pulseStep'],
          0, 0.9,
          1, 0.0,
        ],
        // iç dolgu çok hafif olsun
        'circle-color': '#00bcd4',
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'pulseStep'],
          0, 0.2,
          1, 0,
        ],
      },
    });
  }
    // 🔁 GPU optimizasyonlu animasyon döngüsü
    let frame;
    const animate = () => {
      pulseRef.current += 0.01;
      if (pulseRef.current > 1) pulseRef.current = 0;
    
      const src = map.getSource(id);
      if (src?._data?.features) {
        src._data.features.forEach((f) => {
          if (f.properties.motionState && f.properties.isOnline) {
            f.properties.pulseStep = pulseRef.current;
          }
        });
        src.setData(src._data);
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    

    // Cleanup
    return () => {
      cancelAnimationFrame(frame);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClick);

      if (map.getLayer(pulseLayer)) map.removeLayer(pulseLayer);
      if (map.getLayer(clusters)) map.removeLayer(clusters);

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClick);
        if (map.getLayer(source)) map.removeLayer(source);
        if (map.getLayer(`direction-${source}`)) map.removeLayer(`direction-${source}`);
        if (map.getSource(source)) map.removeSource(source);
      });
    };
  }, [mapCluster, iconScale, onMarkerClick, onClusterClick, onMapClick]);

  // 🔄 Verileri güncelle (render azaltılmış)
  useEffect(() => {
    const sources = [id, selected];
    for (const source of sources) {
      const src = map.getSource(source);
      if (!src) continue;

      const filteredPositions = positions.filter((it) =>
        devices.hasOwnProperty(it.deviceId),
      );
      const features = filteredPositions
        .filter((it) =>
          source === id
            ? it.deviceId !== selectedDeviceId
            : it.deviceId === selectedDeviceId,
        )
        .map((position) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [position.longitude, position.latitude],
          },
          properties: createFeature(devices, position, selectedPosition?.id),
        }));

      src.setData({ type: 'FeatureCollection', features });
    }
  }, [devices, positions, selectedDeviceId, selectedPosition]);

  return null;
};

export default MapPositions;
