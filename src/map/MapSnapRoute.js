import { useEffect, useId } from 'react';
import { map } from './core/MapView';

const MapSnapRoute = ({ positions, color = '#e91e63' }) => {
    const id = useId();

    useEffect(() => {
        map.addSource(id, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
        });
        map.addLayer({
            source: id,
            id: `${id}-line`,
            type: 'line',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.85 },
        });
        return () => {
            if (map.getLayer(`${id}-line`)) {
                map.removeLayer(`${id}-line`);
            }
            if (map.getSource(id)) {
                map.removeSource(id);
            }
        };
    }, [id, color]);

    useEffect(() => {
        const source = map.getSource(id);
        if (source) {
            source.setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: positions.map((p) => [p.longitude, p.latitude]),
                },
            });
        }
    }, [id, positions]);

    return null;
};

export default MapSnapRoute;