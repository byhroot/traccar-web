import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Slider,
  Toolbar,
  Typography,
  useTheme,CircularProgress
} from '@mui/material';
import { useSelector } from 'react-redux';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  formatDistance,
  formatSpeed,
  formatVolume,
  formatTime,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import StatusCard from '../common/components/StatusCard';
import { Slide } from '@mui/material';
import fisinhFlag from '../../src/resources/images/finishflag.png?react'
import MapDefaultCamera from '../map/main/MapDefaultCamera';

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'reportStartOdometer'],
  ['startAddress', 'reportStartAddress'],
  ['endTime', 'reportEndTime'],
  ['endOdometer', 'reportEndOdometer'],
  ['endAddress', 'reportEndAddress'],
  ['distance', 'sharedDistance'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['duration', 'reportDuration'],
  ['spentFuel', 'reportSpentFuel'],
  ['driverName', 'sharedDriver'],
];
const columnsMap = new Map(columnsArray);

const TripReportPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');
  const theme = useTheme();

  const [columns, setColumns] = usePersistedState('tripColumns', [
    'startTime',
    'startAddress',
    'endTime',
    'endAddress',
    'distance',
    'averageSpeed',
    'duration',
    'maxSpeed',
    'driverName',
  ]);
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  const deviceCategory = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.category; // burası category
      }
    }
    return null;
  });

  const [replayLoading, setReplayLoading] = useState(false);


  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);

  // replay state
  const [replayMode, setReplayMode] = useState(false);
  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef();

  const createMarkers = () => [
    {
      latitude: selectedItem.startLat,
      longitude: selectedItem.startLon,
      image: 'default-neutral',
    },
    {
      latitude: selectedItem.endLat,
      longitude: selectedItem.endLon,
      image: 'default-success',
    },
  ];

  useEffectAsync(async () => {
    if (selectedItem && !replayMode) {
      const query = new URLSearchParams({
        deviceId: selectedItem.deviceId,
        from: selectedItem.startTime,
        to: selectedItem.endTime,
      });
      const response = await fetch(`/api/reports/route?${query.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.ok) {
        setRoute(await response.json());
      } else {
        throw Error(await response.text());
      }
    } else {
      setRoute(null);
    }
  }, [selectedItem, replayMode]);

  // fetch positions when entering replay mode
  const startReplay = async (trip) => {
    setReplayLoading(true); // yükleniyor spinner başlat
    try {
      const query = new URLSearchParams({
        deviceId: trip.deviceId,
        from: trip.startTime,
        to: trip.endTime,
      });
      const response = await fetch(`/api/positions?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
        setIndex(0);
        setReplayMode(true);
      }
    } finally {
      setReplayLoading(false); // işlem bitince spinner kapat
    }
  };
  

  // replay animation
  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => prev + 1);
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, positions]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    setSelectedDeviceId(deviceId);
    const query = new URLSearchParams({ deviceId, from, to });
    if (type === 'export') {
      window.location.assign(`/api/reports/trips/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(`/api/reports/trips/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(`/api/reports/trips?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          setItems(await response.json());
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'trips';
    const error = await scheduleReport(deviceIds, groupIds, report);
    if (error) {
      throw Error(error);
    }
  });
// start ve finish markerları her zaman render edilir, ama replay marker çok yakınsa gizlenir
const getMarkers = () => {
  if (!positions.length) return [];

  const replayPos = positions[index];
  const startPos = positions[0];
  const finishPos = positions[positions.length - 1];

  // replay marker ile start/finish marker arasındaki mesafe
  const isNear = (pos1, pos2, threshold = 0.0001) => {
    const latDiff = Math.abs(pos1.latitude - pos2.latitude);
    const lonDiff = Math.abs(pos1.longitude - pos2.longitude);
    return latDiff < threshold && lonDiff < threshold;
  };

  const markers = [];

  // Replay marker
  markers.push({
    latitude: replayPos.latitude,
    longitude: replayPos.longitude,
    image: `${deviceCategory}-neutral`,
    zIndex: 1000,
  });

  // Start marker
  if (!isNear(replayPos, startPos)) {
    markers.push({
      latitude: startPos.latitude,
      longitude: startPos.longitude,
      image: 'default-neutral',
      zIndex: 500,
    });
  }

  // Finish marker
  if (!isNear(replayPos, finishPos)) {
    markers.push({
      latitude: finishPos.latitude,
      longitude: finishPos.longitude,
      image: 'default-error',
      zIndex: 500,
    });
  }

  return markers;
};

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'duration':
        return formatNumericHours(value, t);
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      case 'startAddress':
        return (
          <AddressValue
            latitude={item.startLat}
            longitude={item.startLon}
            originalAddress={value}
          />
        );
      case 'endAddress':
        return (
          <AddressValue
            latitude={item.endLat}
            longitude={item.endLon}
            originalAddress={value}
          />
        );
      default:
        return value;
    }
  };

  // === UI ===
  if (replayMode) {
    return (
      <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportTrips']}>

        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
          <MapView>
            <MapGeofence />
            <MapRoutePath positions={positions} />

            <MapMarkers markers={getMarkers()} />

            <MapCamera latitude={positions[index].latitude} longitude={positions[index].longitude} />
          </MapView>
          <MapScale />

          {/* StatusCard */}
          {positions[index] && (
            <div style={{ position: 'absolute', top: 10, right: 10, width: 300 }}>
              <StatusCard
                deviceId={selectedItem.deviceId}
                position={positions[index]}
                onClose={() => {}}
                disableActions
              />
            </div>
          )}
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              right: 50,
              padding: 2,
              bgcolor: theme.palette.background.paper, // ✅ dark/light uyumlu
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              boxShadow: 3,
            }}
          >
            <Toolbar sx={{ padding: 0, gap: 1 }}>
              {/* ArrowBack animasyonlu */}
              <IconButton
                onClick={() => setReplayMode(false)}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  borderRadius: 2,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(25,118,210,0.7)' },
                    '50%': { transform: 'scale(1.1)', boxShadow: '0 0 20px 10px rgba(25,118,210,0.3)' },
                    '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(25,118,210,0)' },
                  },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 36, color: '#fff' }} />
              </IconButton>

              <Typography variant="subtitle1" sx={{ flexGrow: 1, textAlign: 'center' }}>
               {deviceName} {`${index + 1}/${positions.length}`}
              </Typography>

              {/* Replay kontrolleri */}
              <IconButton
                onClick={() => setIndex((i) => i - 1)}
                disabled={playing || index <= 0}
                sx={{ width: 40, height: 40 }}
              >
                <FastRewindIcon fontSize="medium" />
              </IconButton>

              <IconButton
                onClick={() => setPlaying(!playing)}
                disabled={index >= positions.length - 1}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'secondary.main',
                  '&:hover': { bgcolor: 'secondary.dark' },
                }}
              >
                {playing ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
              </IconButton>

              <IconButton
                onClick={() => setIndex((i) => i + 1)}
                disabled={playing || index >= positions.length - 1}
                sx={{ width: 40, height: 40 }}
              >
                <FastForwardIcon fontSize="medium" />
              </IconButton>
            </Toolbar>

            <Slider
              max={positions.length - 1}
              step={1}
              value={index}
              onChange={(_, val) => setIndex(val)}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': { width: 14, height: 14 },
                '& .MuiSlider-rail': { opacity: 0.3 },
              }}
            />
          </Paper>

        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportTrips']}>
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              {route && (
                <>
                  <MapRoutePath positions={route} />
                  <MapMarkers markers={createMarkers()} />
                  <MapCamera positions={route} />
                </>
              )}
            </MapView>
            <MapScale />

            {/* Play button sağ üstte */}

{/* Play button sağ üstte */}
<Slide in direction="left" timeout={800}>
  <div style={{ position: 'absolute', top: 70, right: 70, zIndex: 1000 }}>
  <IconButton
  color="primary"
  onClick={() => startReplay(selectedItem)}
  size="large"
  disabled={replayLoading} // yükleniyorsa disable
  sx={{
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: 4,
    '&:hover': { backgroundColor: '#f0f0f0', transform: 'scale(1.1)' },
    animation: 'pulse 1.5s infinite',
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.2)' },
      '100%': { transform: 'scale(1)' },
    },
  }}
>
  {replayLoading ? (
    <CircularProgress size={40} />
  ) : (
    <PlayArrowIcon sx={{ fontSize: 40 }} />
  )}
</IconButton>

  </div>
</Slide>
          </div>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              loading={loading}
            >
              <ColumnSelect
                columns={columns}
                setColumns={setColumns}
                columnsArray={columnsArray}
              />
            </ReportFilter>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.columnAction} />
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow
                    key={item.startPositionId}
                    hover
                    selected={selectedItem}
                    onClick={() => setSelectedItem(selectedItem ? null : item)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell className={classes.columnAction} padding="none">
                      {selectedItem === item ? (
                        <IconButton size="small" onClick={() => setSelectedItem(null)}>
                          <GpsFixedIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton size="small" onClick={() => setSelectedItem(item)}>
                          <LocationSearchingIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    {columns.map((key) => (
                      <TableCell key={key}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 1} startAction />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default TripReportPage;
