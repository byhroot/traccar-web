import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { TourProvider, useTour } from "@reactour/tour";
import {
  Divider,
  Typography,
  IconButton,
  Toolbar,
  Paper,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from 'tss-react/mui';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';

import MapView from '../map/core/MapView';
import MapCurrentLocation from '../map/MapCurrentLocation';
import MapGeofenceEdit from '../map/draw/MapGeofenceEdit';
import GeofencesList from './GeofencesList';
import { useTranslation } from '../common/components/LocalizationProvider';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import QuizIcon from '@mui/icons-material/Quiz';

const useStyles = makeStyles()((theme) => ({
  root: { height: '100%', display: 'flex', flexDirection: 'column' },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',      // 🔥 en kritik
    minHeight: 0,            // 🔥 flex scroll fix
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
    },
  },
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,  // 🔥 kritik

    [theme.breakpoints.up('sm')]: {
      width: theme.dimensions.drawerWidthDesktop,
    },
    [theme.breakpoints.down('sm')]: {
      height: theme.dimensions.drawerHeightPhone,
    },
  },
  mapContainer: {
    flexGrow: 1,
    position: 'relative',
  },
  title: {
    flexGrow: 1,
  },
  fileInput: {
    display: 'none',
  },
}));

// 🔥 INNER
const GeofencesPageInner = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const { setIsOpen, setCurrentStep } = useTour();

  const [selectedGeofenceId, setSelectedGeofenceId] = useState();

  // 🔥 STORE
  const geofences = useSelector((state) => state.geofences.items);

  const hasGeofence = Object.keys(geofences || {}).length > 0;

  // 🔥 BAŞLATMA KOŞULU
  useEffect(() => {
    const done = localStorage.getItem("geofence_tutorial_done");

    if (!done || !hasGeofence) {
      setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
      }, 700);
    }
  }, [hasGeofence]);

  // polygon
  useEffect(() => {
    const handler = () => {
      maxVertexRef.current = 0;
      setCurrentStep(1);
    };

    window.addEventListener("tutorial_polygon", handler);

    return () => window.removeEventListener("tutorial_polygon", handler);
  }, []);
  const maxVertexRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      const count = e.detail;

      console.log("👉 vertex:", count);

      if (count >= 1) setCurrentStep(1);
      if (count >= 2) setCurrentStep(2);
      if (count >= 3) setCurrentStep(3);
      if (count >= 4) setCurrentStep(4);
      if (count >= 5) setCurrentStep(5);
    };

    window.addEventListener("tutorial_vertex", handler);

    return () => window.removeEventListener("tutorial_vertex", handler);
  }, []);
  // finish
  useEffect(() => {
    const handler = () => {
      localStorage.setItem("geofence_tutorial_done", "true");
      setIsOpen(false);
    };
    window.addEventListener("tutorial_close", handler);


    window.addEventListener("tutorial_finish", handler);
    return () => window.removeEventListener("tutorial_finish", handler);
  }, []);

  // reset
  const handleResetTutorial = () => {
    localStorage.removeItem("geofence_tutorial_done");
    window.dispatchEvent(new Event("tutorial_restart"));
    setCurrentStep(0);
    setIsOpen(true);
  };

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Paper className={classes.drawer}>
          <Toolbar>
            <IconButton onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>

            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
              {t('sharedGeofences')}
            </Typography>

            {/* upload */}
            <IconButton component="label">
              <input hidden type="file" />
              <UploadFileIcon />
            </IconButton>

            {/* reset */}
            <Tooltip title="Tutorialı yeniden başlat">
              <IconButton onClick={handleResetTutorial}>
                <QuizIcon
                  sx={{
                    color: 'primary.main',

                    animation: 'pulse 1.5s infinite',

                    '@keyframes pulse': {
                      '0%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Toolbar>

          <Divider />

          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <GeofencesList onGeofenceSelected={setSelectedGeofenceId} />
          </Box>
        </Paper>

        <div className={classes.mapContainer}>
          <MapView>
            <MapGeofenceEdit selectedGeofenceId={selectedGeofenceId} />
          </MapView>
          <MapScale />
          <MapCurrentLocation />
          <MapGeocoder />
        </div>
      </div>
    </div>
  );
};

// 🔥 WRAPPER
const GeofencesPage = () => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = [
    {
      selector: ".maplibregl-ctrl-group button",
      content: "Bölge oluşturmak için Polygon(kare şeklindeki) Butona tıklayın.",
      position: isMobile ? "bottom" : "right",
    },
    {
      selector: ".maplibregl-canvas",
      content: "Oluşturacağınız bölge için haritada bir nokta seçin. Bu nokta bölgenin ilk köşesi olacak.",
      position: isMobile ? "bottom" : "right",
    },
    {
      selector: ".maplibregl-canvas",
      content: "Oluşturacağınız bölge için haritada 2. bir nokta seçin. ",
      position: isMobile ? "bottom" : "right",
    },
    {
      selector: ".maplibregl-canvas",
      content: "Oluşturacağınız bölgenin diğer köşesini seçmek için haritada bir noktaya tıklayın.",
      position: isMobile ? "bottom" : "right",
    },
    {
      selector: ".maplibregl-canvas",
      content: "Harita üzerinde istediğiniz kadar nokta seçerek bölgenizi oluşturabilirsiniz.",
      position: isMobile ? "bottom" : "right",
    },
    {
      selector: ".maplibregl-canvas",
      content: "Bölgeyi oluşturmaya devam edin; Bitirmek için başlangıç noktasına tıklayın veya boş bir alana çift tıklayın.",
      position: isMobile ? "bottom" : "top",
    },
  ];

  return (
    <TourProvider
      steps={steps}
      disableDotsNavigation
      disableKeyboardNavigation
      disableInteraction={false} // 🔥 EN KRİTİK
      scrollSmooth
      spotlightClicks

      onClickClose={() => {
        localStorage.setItem("geofence_tutorial_done", "true");
        window.dispatchEvent(new Event("tutorial_close"));
      }}

      onClickMask={() => {
        localStorage.setItem("geofence_tutorial_done", "true");
        window.dispatchEvent(new Event("tutorial_close"));
      }}
      styles={{
        popover: (base) => ({
          ...base,
          maxWidth: 260,
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: 12,

          // 🔥 SADECE DESKTOPTA SABİT
          ...(!isMobile && {
            position: 'fixed',
            top: 100,
            left: theme.dimensions.drawerWidthDesktop + 50,
            transform: 'none', // 🔥 ZIPLAMA FIX
          }),
        }),
        close: (base) => ({
          ...base,
          color: theme.palette.text.primary, // 🔥 FIX
        }),
      }}
    >
      <GeofencesPageInner />
    </TourProvider>
  );
};

export default GeofencesPage;