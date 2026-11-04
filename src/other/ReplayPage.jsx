import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Paper, Slider, Toolbar, Typography, Tooltip, Link as MuiLink, } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRouteEvents from '../map/MapRouteEvents';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import { formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';
import MapOverlay from '../map/overlay/MapOverlay';
import StatusCardNew from '../common/components/StatusCardNew';
import { useAttributePreference } from '../common/util/preferences';
import { Menu, MenuItem, ListItemIcon, ListItemText, Checkbox } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Switch, FormControlLabel } from '@mui/material';
import ReportPageAnime from '../reports/components/ReportPageAnime';
import MapSnapRoute from '../map/MapSnapRoute';
import { useAdministrator, useRestriction } from '../common/util/permissions';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
    padding: '10px 0', // Slider'ın kendi iç padding'ini azalttık (tıklama alanını öldürmeden)
    marginTop: theme.spacing(-1), // Üstteki yazıya yaklaşması için
    marginBottom: theme.spacing(-1), // Alttaki butonlara yaklaşması için
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formControlLabel: {
    height: '100%',
    width: '100%',
    paddingRight: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(1, 2), // Üst-alt 1 birim (8px), sağ-sol 2 birim (16px) yaptık
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(1),
      padding: theme.spacing(1), // Mobilde daha da daraltabiliriz
    },
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1),
    },
  },
}));

const ReplayPage = () => {
  const t = useTranslation();
  const { classes } = useStyles();
  const navigate = useNavigate();
  const timerRef = useRef();
  const [tooltipOpen, setTooltipOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [playSpeed, setPlaySpeed] = useState(2);
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);
  const oldMenu = useAttributePreference('oldStatusCard', false);
  const [confirmDialog, setConfirmDialog] = useState(null); // null | 'warn' | 'block'
  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventFilters, setEventFilters] = useState({
    alarm: true,
    ignition: true,
    movement: false,
    geofence: false,
    speed: false,
    other: false,
  });
  const [filterAnchor, setFilterAnchor] = useState(null);
  const admin = useAdministrator();

  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapQuery, setSnapQuery] = useState(null);
  const [snapPositions, setSnapPositions] = useState([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapError, setSnapError] = useState(null);
  const loaded = Boolean(from && to && !loading && positions.length);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!playing || positions.length === 0) {
      clearInterval(timerRef.current);
      return;
    }

    // Önce eskiyi temizle
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        if (prev >= positions.length - 1) {
          clearInterval(timerRef.current);
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / playSpeed);

    return () => clearInterval(timerRef.current);
  }, [playing, playSpeed]); // positions KALDIRILDI

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timerRef.current);
        setPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  useEffect(() => {
    if (tooltipOpen) {
      const timer = setTimeout(() => setTooltipOpen(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [tooltipOpen]);

  const onPointClick = useCallback(
    (_, index) => {
      setIndex(index);
    },
    [setIndex],
  );

  const onMarkerClick = useCallback(
    (positionId) => {
      setShowCard(!!positionId);
    },
    [setShowCard],
  );

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const deviceId = deviceIds.find(() => true);
    setLoading(true);
    setSelectedDeviceId(deviceId);
    setSnapQuery({ deviceId, from, to });
    setSnapPositions([]);
    setSnapError(null);
    const query = new URLSearchParams({ deviceId, from, to });
    try {
      const response = await fetchOrThrow(`/api/positions?${query.toString()}`);
      setIndex(0);
      const raw = await response.json();

      if (!raw.length) throw Error(t('sharedNoData'));

      // Events'i önceden çek ki dialog açılmadan önce elimizde olsun
      const eventsQuery = new URLSearchParams({ deviceId, from, to, type: 'allEvents' });
      let fetchedEvents = [];
      try {
        const eventsRes = await fetchOrThrow(`/api/reports/events?${eventsQuery.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        fetchedEvents = await eventsRes.json();
        setEvents(fetchedEvents);
      } catch {
        // events gelmese de devam
      }

      if (raw.length > 6000) {
        setConfirmDialog('block');
        return;
      }

      if (raw.length > 2000) {
        setConfirmDialog({ type: 'warn', positions: raw, events: fetchedEvents }); // ← events'i dialog'a taşı
        return;
      }

      setPositions(raw);
    } finally {
      setLoading(false);
    }

  });


  // useEffect ile from/to sıfırlanınca events'i de temizle
  useEffect(() => {
    if (!from && !to) {
      setPositions([]);
      setEvents([]);   // ← eklendi
      setSnapPositions([]);
      setSnapQuery(null);
      setSnapEnabled(false);
    }
  }, [from, to]);
  useEffect(() => {
    if (!admin || !snapEnabled || !snapQuery) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setSnapLoading(true);
      setSnapError(null);
      try {
        const query = new URLSearchParams(snapQuery);
        const response = await fetchOrThrow(`/api/reports/route-snap?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (!cancelled) {
          setSnapPositions(data);
        }
      } catch (e) {
        if (!cancelled) {
          setSnapPositions([]);
          setSnapError(e.message);
        }
      } finally {
        if (!cancelled) {
          setSnapLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [admin, snapEnabled, snapQuery]);

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  return (
    <div className={classes.root}>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapRoutePath positions={positions} />
        {admin && snapEnabled && <MapSnapRoute positions={snapPositions} />}
        <MapRouteEvents positions={positions} events={events} filters={eventFilters} />

        <MapRoutePoints positions={positions} onClick={onPointClick} showSpeedControl />
        {index < positions.length && (
          <MapPositions
            positions={[positions[index]]}
            onMarkerClick={onMarkerClick}
            titleField="serverTime"
          />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />
      <div className={classes.sidebar}>
        <Paper elevation={3} square>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <Typography sx={{ fontSize: 14 }}
              className={classes.title}>
              {t('reportReplay')}
            </Typography>
            {loaded && (
              <>
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
                <Tooltip title="Olayları filtreleyebilirsiniz" arrow open={!filterAnchor && tooltipOpen} onClose={() => setTooltipOpen(false)}>
                  <IconButton onClick={(e) => { setFilterAnchor(e.currentTarget); setTooltipOpen(false); }}>
                    <FilterListIcon sx={{ color: 'primary.main' }} />
                  </IconButton>
                </Tooltip>
                <IconButton
                  edge="end"
                  onClick={() => updateReportParams(searchParams, setSearchParams, 'ignore', [])}
                >
                  <TuneIcon />
                </IconButton>
              </>
            )}
          </Toolbar>
          {/* Menü — Toolbar dışına, ama aynı return içine */}
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            {[
              { key: 'alarm', label: 'Alarmlar', color: '#f44336' },
              { key: 'ignition', label: 'Kontak', color: '#4caf50' },
              { key: 'movement', label: 'Hareket', color: '#2196f3' },
              { key: 'speed', label: 'Speed Limit', color: '#9c27b0' },
              { key: 'geofence', label: 'Geofence', color: '#9c27b0' },
              { key: 'other', label: 'Tümü', color: '#9c27b0' },

            ].map(({ key, label, color }) => (
              <MenuItem
                key={key}
                onClick={() => setEventFilters((f) => ({ ...f, [key]: !f[key] }))}
                dense
              >
                <ListItemIcon>
                  <Checkbox
                    checked={eventFilters[key]}
                    size="small"
                    sx={{ color, '&.Mui-checked': { color } }}
                  />
                </ListItemIcon>
                <ListItemText primary={label} />
              </MenuItem>
            ))}
          </Menu>
        </Paper>
        <Paper className={classes.content} square>
          {loaded && (
            <>

              <Slider
                className={classes.slider}
                max={positions.length - 1}
                step={null}
                marks={positions.map((_, index) => ({ value: index }))}
                value={index}
                onChange={(_, index) => setIndex(index)}
              />
              <div className={classes.controls}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', minWidth: 52 }}>
                  {`${index + 1}/${positions.length}`}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    onClick={() => setIndex((i) => i - 1)}
                    disabled={playing || index <= 0}
                    size="small"
                  >
                    <FastRewindIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => setPlaying(!playing)}
                    disabled={index >= positions.length - 1}
                    size="small"
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' },
                      '&.Mui-disabled': { backgroundColor: 'action.disabledBackground' },
                      width: 36,
                      height: 36,
                    }}
                  >
                    {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                  </IconButton>
                  <IconButton
                    onClick={() => setIndex((i) => i + 1)}
                    disabled={playing || index >= positions.length - 1}
                    size="small"
                  >
                    <FastForwardIcon fontSize="small" />
                  </IconButton>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  {[2, 4, 8, 16].map((speed) => ( //8x ve 16x hız seçenekleri eklendi
                    <button
                      key={speed}
                      onClick={() => setPlaySpeed(speed)}
                      style={{
                        fontSize: 11,
                        fontWeight: playSpeed === speed ? 700 : 400,
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: playSpeed === speed ? 'transparent' : '#ccc',
                        backgroundColor: playSpeed === speed ? '#1976d2' : 'transparent',
                        color: playSpeed === speed ? '#fff' : 'inherit',
                        cursor: 'pointer',
                        lineHeight: 1.6,
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 12, textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {deviceName} - {positions && positions[index]
                  ? formatTime(positions[index]?.fixTime, 'seconds')
                  : '--:--'}
                {admin && (
                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} />}
                      label={<span style={{ fontSize: 12 }}>OSRM snap karşılaştır</span>}
                    />
                    {snapEnabled && (
                      <div style={{ fontSize: 11, color: snapError ? '#d32f2f' : 'var(--color-text-secondary)' }}>
                        {snapLoading ? 'Yükleniyor...' : snapError || `ham: ${positions.length} · snap: ${snapPositions.length} (pembe)`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          <div style={{ display: loaded ? 'none' : 'block' }}>
            <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
          </div>
          {!loading && !loaded && <ReportPageAnime />}

        </Paper>
      </div>
      {showCard && index < positions.length && (

        oldMenu ? (
          <StatusCard
            deviceId={selectedDeviceId}
            position={positions[index]}
            onClose={() => setShowCard(false)}
            disableActions
          />
        ) : (
          <StatusCardNew
            deviceId={selectedDeviceId}
            position={positions[index]}
            onClose={() => setShowCard(false)}
            disableActions
          />
        )


      )}



      <Dialog open={!!confirmDialog}>

        <DialogTitle>⚠️ Çok Fazla Veri</DialogTitle>

        <DialogContent>
          <DialogContentText>

            {confirmDialog === 'block' ? (
              <>
                6000&apos;den fazla konum verisi mevcut. Lütfen sorgu aralığını daraltınız.
                <br /><br />
                Detaylı Rota geçmişi için;
                <MuiLink
                  component="button"
                  underline="hover"
                  onClick={() => {
                    navigate(`/reports/trips?deviceId=${selectedDeviceId}`);
                    setConfirmDialog(null);
                  }}
                >
                  Raporlar &gt; Yolculuklar
                </MuiLink>{' '}
                bölümünü kullanmanız daha sağlıklı olacaktır.

                Uzun aralıklı olay haritası görünümü için{' '}
                <MuiLink
                  component="button"
                  underline="hover"
                  onClick={() => {
                    navigate(`/reports/combined?deviceId=${selectedDeviceId}`);
                    setConfirmDialog(null);
                  }}
                >
                  Raporlar &gt; Kombine
                </MuiLink>{' '}
                sayfasını ziyaret edebilirsiniz.
              </>
            ) : (
              <>
                {confirmDialog?.positions?.length} konum verisi mevcut.
                Performans için bazı konumlar sadeleştirilecek,
                rota atlamalı görüntülenebilir.
                <br /><br />

                Daha sağlıklı görüntüleme için{' '}
                <MuiLink
                  component="button"
                  underline="hover"
                  onClick={() => {
                    navigate(`/reports/trips?deviceId=${selectedDeviceId}`);
                    setConfirmDialog(null);
                  }}
                >
                  Raporlar &gt; Yolculuklar
                </MuiLink>{' '}
                bölümünü kullanabilirsiniz.
                <br /><br />

                Yine de görüntülemek istiyor musunuz?
              </>
            )}

          </DialogContentText>
        </DialogContent>

        <DialogActions>

          {confirmDialog !== 'block' && (
            <Button
              onClick={() => {
                const raw = confirmDialog.positions;

                const eventPositionIds = new Set(
                  confirmDialog.events
                    .map((e) => e.positionId)
                    .filter(Boolean)
                );

                const step = Math.ceil(raw.length / 1500);

                setPositions(
                  raw.filter((_, i) =>
                    i % step === 0 ||
                    i === raw.length - 1 ||
                    eventPositionIds.has(raw[i].id)
                  )
                );

                setConfirmDialog(null);
              }}
            >
              Yine de Görüntüle
            </Button>
          )}

          <Button
            onClick={() => setConfirmDialog(null)}
            color={confirmDialog === 'block' ? 'primary' : 'error'}
          >
            {confirmDialog === 'block' ? 'Tamam' : 'İptal'}
          </Button>

        </DialogActions>

      </Dialog>
    </div>
  );
};

export default ReplayPage;
