import { useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
import MapPadding from '../map/MapPadding';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import MapScale from '../map/MapScale';
import MapNotification from '../map/notification/MapNotification';
import useFeatures from '../common/util/useFeatures';

import { TourProvider, useTour } from "@reactour/tour";

const MapStyleTutorial = () => {
  const { setIsOpen } = useTour();

  useEffect(() => {
    const done = localStorage.getItem("map_style_tutorial_done");

    if (done) return;

    const closeTutorial = () => {
      localStorage.setItem("map_style_tutorial_done", "true");
      setIsOpen(false);
    };

    const timer = setTimeout(() => {
      const el = document.querySelector(".maplibregl-style-switcher");

      if (el) {
        setIsOpen(true);

        document.addEventListener("click", closeTutorial, {
          once: true,
        });
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", closeTutorial);
    };
  }, []);

  return null;
};

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);
  const steps = [
    {
      selector: ".maplibregl-style-switcher",
      content: "Buradan harita görünümünü değiştirebilirsiniz.",
      position: "left",
    },
  ];
  const features = useFeatures();

  const onMarkerClick = useCallback(
    (_, deviceId) => {
      dispatch(devicesActions.selectId(deviceId));
    },
    [dispatch],
  );

  return (
    <TourProvider
      steps={steps}
      spotlightClicks
      disableInteraction={false}
      disableDotsNavigation
      styles={{
        popover: (base) => ({
          ...base,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: theme.shape.borderRadius * 2,
          boxShadow: theme.shadows[8],
        }),
        arrow: (base) => ({
          ...base,
          color: theme.palette.background.paper,
        }),
      }}
    >
      <MapStyleTutorial />

      <>
        <MapView>
          <MapOverlay />
          <MapGeofence />
          <MapAccuracy positions={filteredPositions} />
          <MapLiveRoutes deviceIds={filteredPositions.map((p) => p.deviceId)} />
          <MapPositions
            positions={filteredPositions}
            onMarkerClick={onMarkerClick}
            selectedPosition={selectedPosition}
            showStatus
          />
          <MapDefaultCamera />
          <MapSelectedDevice />
          <PoiMap />
        </MapView>
        <MapScale />
        <MapCurrentLocation />
        <MapGeocoder />
        {!features.disableEvents && (
          <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
        )}
        {desktop && (
          <MapPadding
            start={
              parseInt(theme.dimensions.drawerWidthDesktop, 10) + parseInt(theme.spacing(1.5), 10)
            }
          />
        )}
      </>
    </TourProvider>
  );
};

export default MainMap;
