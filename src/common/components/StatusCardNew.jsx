import React, { useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Draggable from 'react-draggable';
import {
  Accordion, AccordionSummary, AccordionDetails, Card, Typography,
  IconButton, Table, TableBody, TableRow, TableCell, Menu, MenuItem,
  Dialog, Box, DialogContent, DialogTitle, Tooltip, Stack, Divider, useTheme, Button
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

// İkonlar
import CloseIcon from '@mui/icons-material/Close';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import EditIcon from '@mui/icons-material/Edit';
import PendingIcon from '@mui/icons-material/Pending';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Battery6BarIcon from '@mui/icons-material/Battery6Bar';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerIcon from '@mui/icons-material/Power';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import BlockIcon from '@mui/icons-material/Block';
import BoltIcon from '@mui/icons-material/Bolt';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RouteIcon from '@mui/icons-material/Route';
import NavigationIcon from '@mui/icons-material/Navigation';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// RSSI İkonları
import SignalCellular0BarIcon from '@mui/icons-material/SignalCellular0Bar';
import SignalCellular1BarIcon from '@mui/icons-material/SignalCellular1Bar';
import SignalCellular2BarIcon from '@mui/icons-material/SignalCellular2Bar';
import SignalCellular3BarIcon from '@mui/icons-material/SignalCellular3Bar';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';

// Utils & Components
import { formatIgnition } from '../util/formatter';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useAdministrator, useDeviceReadonly, useRestriction } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import EngineIcon from '../../resources/images/data/engine.svg?react';
import DeviceSettingsNew from '../../settings/DeviceSettingsNew';
import AreaChartIcon from '@mui/icons-material/AreaChart';

const iconMapping = {
  speed: <SpeedIcon color="primary" fontSize="small" />,
  address: <LocationOnIcon color="primary" fontSize="small" />,
  totalDistance: <RouteIcon color="primary" fontSize="small" />,
  course: <NavigationIcon color="primary" fontSize="small" />,
  ignition: <PowerIcon color="primary" fontSize="small" />,
  alarm: <NotificationsActiveIcon color="error" fontSize="small" />,
  blocked: <BlockIcon color="error" fontSize="small" />,
  power: <BoltIcon color="primary" fontSize="small" />,
  serverTime: <AccessTimeIcon color="primary" fontSize="small" />,
  fixTime: <AccessTimeIcon color="primary" fontSize="small" />,
  sat: <SatelliteAltIcon color="primary" fontSize="small" />,
  geofenceIds: <AreaChartIcon color="primary" fontSize="small" />,
  batteryLevel: <Battery6BarIcon color="primary" fontSize="small" />,
  rssi: <SignalCellularAltIcon color="primary" fontSize="small" />,
  driverUniqueId: <PersonPinIcon color="primary" fontSize="small" />,
};

const useStyles = makeStyles()((theme, { desktopPadding } = {}) => ({
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 1200,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding || 0}px / 3)`,
      bottom: theme.spacing(4),
    },
    [theme.breakpoints.down('md')]: {
      bottom: `calc(${theme.spacing(4)} + ${theme.dimensions.bottomBarHeight || 0}px)`,
    },
    transform: 'translateX(-50%)',
  },
  card: {
    pointerEvents: 'auto',
    width: 320,
    borderRadius: '16px',
    background: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(16px)',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      width: '80vw',
      maxWidth: '300px',
      maxHeight: 'none',
    },
  },
  dragHandle: {
    cursor: 'grab',
    padding: theme.spacing(0.5, 2, 0.2, 2),
    display: 'flex',
    justifyContent: 'center',
    '&:active': { cursor: 'grabbing' },
  },
  dragIndicator: { width: 35, height: 4, backgroundColor: theme.palette.divider, borderRadius: 2 },
  speedBadge: {
    background: 'linear-gradient(135deg, #00959E 0%, #00d2ff 100%)',
    color: '#fff',
    borderRadius: '12px',
    padding: '6px 12px',
    textAlign: 'center',
    minWidth: '70px',
    boxShadow: '0 4px 12px rgba(0,149,158,0.3)',
  },
  // ... (Eski stiller korunuyor, sadece şunları güncelle/ekle)
  actionIcon: {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    borderRadius: '10px',
    padding: '6px',
    transition: 'all 0.2s ease-in-out',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }
  },
  buttonStack: {
    display: 'flex',
    flexDirection: 'row',
    gap: '4px',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f1f5f9',
    padding: '4px',
    borderRadius: '12px',
    marginTop: '8px'
  },
  tableCell: { borderBottom: `1px solid ${theme.palette.divider}`, padding: '4px 0' },
  alarmBlink: {
    animation: 'blink 1s infinite alternate',
    color: theme.palette.error.main,
  },
  '@keyframes blink': {
    'from': { opacity: 1, transform: 'scale(1.15)' },
    'to': { opacity: 0.4, transform: 'scale(0.9)' }
  }
}));

// RSSI ve Satellite Yardımcıları
const getRssiIcon = (rssi) => {
  let IconComponent = SignalCellular0BarIcon;
  let color = '#8a3227';
  if (rssi > 15 && rssi <= 45) { IconComponent = SignalCellular1BarIcon; color = '#4DB6AC'; }
  else if (rssi > 45 && rssi <= 70) { IconComponent = SignalCellular2BarIcon; color = '#00959E'; }
  else if (rssi > 70 && rssi <= 90) { IconComponent = SignalCellular3BarIcon; color = '#00959E'; }
  else if (rssi > 90) { IconComponent = SignalCellular4BarIcon; color = '#00959E'; }
  return <IconComponent style={{ color, width: 20, height: 20 }} />;
};

const getSatelliteIcon = (sat, theme) => {
  let color = '#F44336';
  if (sat >= 1 && sat <= 5) color = '#90A4AE';
  else if (sat >= 6 && sat <= 8) color = '#78909C';
  else if (sat > 8) color = '#00959E';
  return <SatelliteAltIcon style={{ color, width: 20, height: 20 }} />;
};

const StatusRow = ({ name, content, icon }) => {
  const { classes } = useStyles();
  return (
    <TableRow>
      <TableCell className={classes.tableCell}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ opacity: 0.8, display: 'flex' }}>{icon}</Box>
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }} fontWeight="500">{name}</Typography>
        </Stack>
      </TableCell>
      <TableCell className={classes.tableCell} align="right">
        <Typography className="no-drag" variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }} fontWeight="700">{content}</Typography>
      </TableCell>
    </TableRow>
  );
};

const StatusCardNew = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const { classes } = useStyles({ desktopPadding });
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();
  const nodeRef = useRef(null);

  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElReplay, setAnchorElReplay] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const device = useSelector((state) => state.devices.items[deviceId]);
  const user = useSelector((state) => state.session.user);
  const admin = useAdministrator();
  const userReadonly = useRestriction('readonly');
  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const positionItems = useAttributePreference('positionItems', 'alarm,address,totalDistance,power,fixTime,driverUniqueId,geofenceIds');
  const positionAttributes = usePositionAttributes(t);

  const isSpecialPage = location.pathname.startsWith('/replay') || location.pathname.startsWith('/reports') || location.pathname.startsWith('/event');

  const statusDetails = useMemo(() => {
    if (!device || !position) return { label: '...', color: 'gray', time: '', emoji: '', isDelayed: false, timePrefix: '' };

    // Zamanları belirle
    const currentTime = isSpecialPage ? new Date(position.serverTime) : new Date();
    const fixTime = (isSpecialPage || device.status === "online") ? new Date(position.fixTime) : new Date(position.serverTime);

    const diffInMs = Math.max(0, currentTime - fixTime);
    const diffInMinutes = Math.floor(diffInMs / 60000);

    // Kritik Değerler
    const ignition = position?.attributes?.ignition === true; // Net boolean kontrolü
    const speed = (position.speed || 0) * 1.852;

    let label = t('eventDeviceStopped');
    let color = theme.palette.text.secondary;
    let emoji = "🅿️";
    let isDelayed = false;

    if (isSpecialPage) {
      // Replay sayfasındayken hız ve rölanti kontrolü
      if (speed > 1 && diffInMinutes <= 1) {
        label = t('eventDeviceMoving');
        color = "green"; emoji = "🚀";
      } else if (speed > 1 && diffInMinutes > 1) {
        label = `${t('deviceStatusOffline')} ${t('commandData')} ${t('sharedLoading')}`;
        color = theme.palette.warning.dark; emoji = "📡"; isDelayed = true;
      } else if (speed <= 1 && ignition) {
        label = t('alarmIdle');
        color = theme.palette.warning.main; emoji = "⏳";
      } else {
        label = t('eventDeviceStopped');
      }
    } else {
      // Canlı Takip Mantığı
      if (device.status !== "online") {
        if (ignition === false) {
          label = `${t("eventDeviceOffline")} | ${t("commandModeDeepSleep")}`;
          color = theme.palette.info.main; emoji = "💤";
        } else {
          label = t("eventDeviceOffline");
          color = theme.palette.error.main; emoji = "📶";
        }
      } else {
        if (diffInMinutes > 5 && speed > 1) {
          label = `${t('deviceStatusOffline')} ${t('commandData')} ${t('sharedLoading')}`;
          color = theme.palette.warning.dark; emoji = "📡"; isDelayed = true;
        } else if (speed > 1 && ignition) {
          label = t('eventDeviceMoving');
          color = "green"; emoji = "🚀";
        } else if (speed <= 1 && ignition) {
          label = t('alarmIdle');
          color = theme.palette.warning.main; emoji = "⏳";
        } else {
          label = t('eventDeviceStopped');
          color = theme.palette.text.secondary; emoji = "🅿️";
        }
      }
    }

    // Süre Etiketi Hesaplama
    let timeLabel = "";

    const isIdle = label === t('alarmIdle');

    // idle için ayrı hesaplama: idleStartTime → serverTime farkı
    if (isIdle) {
      const idleStartRaw = position?.attributes?.idleStartTime;
      if (idleStartRaw !== null) {
        const parsed = parseInt(String(idleStartRaw), 10);
        if (!isNaN(parsed)) {
          const idleStart = new Date(parsed);
          const serverTime = new Date(position?.serverTime);
          const idleDiff = Math.max(0, serverTime - idleStart);

          const hours = Math.floor(idleDiff / 3600000);
          const minutes = Math.floor((idleDiff % 3600000) / 60000);

          if (hours >= 24) {
            timeLabel = '';
          } else if (hours > 0) {
            timeLabel = `${hours} ${t('sharedHours')} ${minutes} ${t('sharedMinutes')}`;
          } else if (minutes >= 1) {
            timeLabel = `${minutes} ${t('sharedMinutes')}`;
          }
        }
      }
    } else {
      const hideTimeInReplay = isSpecialPage && (label === t('alarmIdle') || label === t('eventDeviceMoving'));
      if (diffInMs > 1000 && !hideTimeInReplay) {
        const days = Math.floor(diffInMs / 86400000);
        const hours = Math.floor((diffInMs % 86400000) / 3600000);
        const minutes = Math.floor((diffInMs % 3600000) / 60000);

        if (days > 0) timeLabel = `${days} ${t('sharedDays')} ${hours} ${t('sharedHours')}`;
        else if (hours > 0) timeLabel = `${hours} ${t('sharedHours')} ${minutes} ${t('sharedMinutes')}`;
        else if (minutes >= 1) timeLabel = `${minutes} ${t('sharedMinutes')}`;
      }
    }

    const timePrefix = isSpecialPage && (label === t('eventDeviceStopped') || label === t('eventDeviceMoving'))
      ? `${t('statePaused') || 'Bekleme'}: `
      : "⏱️ ";

    return { label, color, time: timeLabel, emoji, isDelayed, timePrefix };

    // BAĞIMLILIK LİSTESİ GÜNCELLENDİ
  }, [device?.status, position, isSpecialPage, t]);

  const handleGeofence = useCatchCallback(async () => {
    const newItem = { name: t('sharedGeofence'), area: `CIRCLE (${position.latitude} ${position.longitude}, 50)` };
    const res = await fetch('/api/geofences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if (res.ok) {
      const item = await res.json();
      await fetch('/api/permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId, geofenceId: item.id }) });
      navigate(`/settings/geofence/${item.id}`);
    }
  }, [navigate, position, deviceId]);

  if (!device || !position) return null;
  const getTodayRangeUTC = () => {
    const now = new Date();

    // bugün 00:00:00 (local)
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // bugün 23:59:59.999 (local)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return {
      from: start.toISOString(),
      to: end.toISOString()
    };
  };
  return (
    <>
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        // maxWidth={false} diyerek MUI'nin md, lg gibi sınırlarını devre dışı bırakıyoruz
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            width: '90vw', // Ekran genişliğinin %90'ı
            maxWidth: '1400px', // Çok büyük ekranlarda (4K gibi) aşırı yayılmaması için opsiyonel sınır
            m: 'auto'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate(`/settings/device/${device?.id}/details`)}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}
          >
            <Typography variant="h6" sx={{ fontSize: "0.8rem" }} fontWeight="800">{device?.name} ✨</Typography>
          </Button>
          <IconButton onClick={() => setSettingsOpen(false)} size="medium"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 0, // Tüm kenar boşluklarını sıfırladık, içerik tam yayılacak
            mt: 0,
            mb: 0,
            '&:last-child': {
              pb: 0,
            },
            // İçerideki DeviceSettingsNew'in Dialog yüksekliğine uyum sağlaması için:
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ width: '100%', height: '100%' }}>
            <DeviceSettingsNew deviceId={deviceId} />
          </Box>
        </DialogContent>
      </Dialog>

      <Box className={classes.root}>
        <Draggable nodeRef={nodeRef} handle=".draggable-handle" cancel=".no-drag">
          <div ref={nodeRef} style={{ pointerEvents: 'auto' }}>
            <Card className={`${classes.card} draggable-handle`} elevation={0}>
              <div className={`${classes.dragHandle} draggable-handle`}>
                <div className={classes.dragIndicator} />
              </div>
              {/* Paket Süresi Uyarısı */}
              <Box sx={{ px: 1, pb: 0 }}>
                {/* ÜST SATIR: İsim ve Kapat Butonu */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ ml: 0.5, mb: 0, pb: 0, mt: 0 }}>
                  <Typography variant="body1" fontWeight="900" sx={{ fontSize: '0.85rem', flex: 1, noWrap: true }}>
                    {device.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" >
                    {position?.attributes?.alarm && (
                      <Tooltip title={`${t('eventAlarm')}: ${t('alarm' + position?.attributes?.alarm.charAt(0).toUpperCase() + position?.attributes?.alarm.slice(1))}`}>
                        <NotificationsActiveIcon className={classes.alarmBlink} sx={{ fontSize: 18 }} />
                      </Tooltip>
                    )}
                    <Tooltip title={formatIgnition(position?.attributes?.ignition, t)}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EngineIcon style={{
                          width: 24, height: 24,
                          color: (position?.attributes?.ignition && (isSpecialPage || device?.status === 'online'))
                            ? theme.palette.success.main
                            : '#94a3b8',
                        }} />
                      </Box>
                    </Tooltip>

                    {/* Uydu İkonu ve Hesaplaması */}
                    <Tooltip title={`Uydu: ${position?.attributes?.sat || 0}`}>
                      {getSatelliteIcon(position?.attributes?.sat || 0, theme)}
                    </Tooltip>

                    <Tooltip title={t('positionCharge')}>
                      {position?.attributes?.charge ? <BatteryChargingFullIcon sx={{ fontSize: 16, color: device?.status === 'online' || isSpecialPage ? '#00959E' : '#6d6d6d' }} /> : <Battery6BarIcon sx={{ fontSize: 16, color: '#ee0e0e' }} />}
                    </Tooltip>

                    {/* RSSI İkonu ve Hesaplaması */}
                    {position?.attributes?.hasOwnProperty('rssi') && (
                      <Tooltip title={`Sinyal: ${position?.attributes?.rssi}`}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {device?.status === 'online' || isSpecialPage ?
                            getRssiIcon(position?.attributes?.rssi)
                            :
                            <SignalCellular1BarIcon sx={{ fontSize: 16, color: '#616161' }} />
                          }
                        </Box>
                      </Tooltip>
                    )}
                  </Stack>
                  <IconButton size="small" onClick={onClose} className="no-drag" sx={{ p: 0.5 }}>
                    <CloseIcon fontSize="medium" />
                  </IconButton>
                </Stack>


                {/* ORTA ALAN: Hız ve Bilgi Paneli */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {/* Hız Göstergesi */}
                  <Box className={classes.speedBadge} sx={{ height: '55px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h5" fontWeight="900" sx={{ lineHeight: 1 }}>{Math.round(position.speed * 1.852)}</Typography>
                    <Typography variant="caption" fontWeight="700" sx={{ opacity: 0.8, fontSize: '0.55rem' }}>KM/H</Typography>
                  </Box>

                  {/* Durum Metinleri */}
                  <Box sx={{ flex: 1 }}>

                    <Box>
                      <Typography variant="subtitle" fontWeight="800" sx={{ color: statusDetails.color, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: statusDetails.isDelayed ? '0.5rem' : '0.7rem' }}>
                        <span style={{ fontSize: '1rem' }}>{statusDetails.emoji}</span> {statusDetails.label.toUpperCase()}
                      </Typography>

                      {statusDetails.time && (
                        <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ display: 'block', mt: -0.3 }}>
                          {statusDetails.time}
                        </Typography>
                      )}


                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.2 }}>
                      {position?.attributes?.power ? (
                        <Typography variant="caption" fontWeight="800" color="primary" sx={{ fontSize: '0.65rem' }}>
                          ⚡ {parseFloat(position?.attributes?.power).toFixed(1)}V
                        </Typography>
                      ) : <Typography variant="caption" fontWeight="800" color="primary" sx={{ fontSize: '0.65rem' }}>
                        ⚡ 0 V
                      </Typography>
                      }
                      <Typography variant="caption" fontWeight="900" sx={{ fontSize: '0.65rem', color: position?.attributes?.ignition ? 'success.main' : 'text.disabled' }}>
                        • {position?.attributes?.ignition ? t('eventIgnitionOn') : t('eventIgnitionOff')}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* SAĞ TARAF: Küçük Sensör İkonları (Dikey Stack) */}
                  <Stack spacing={0.5} alignItems="center">



                  </Stack>
                </Stack>

                {/* ALT SATIR: Aksiyon Butonları (Yanyana Dizilim) */}
                <Box className={`${classes.buttonStack} no-drag`}>
                  <Tooltip title={t('reportReplay')}>
                    <IconButton disabled={isSpecialPage || userReadonly} size="small" className={classes.actionIcon} sx={{ flex: 1 }} onClick={(e) => setAnchorElReplay(e.currentTarget)}>
                      <HistoryIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('sharedPreferences')}>
                    <IconButton disabled={isSpecialPage || userReadonly} size="small" className={classes.actionIcon} sx={{ flex: 1 }} onClick={() => setSettingsOpen(true)}>
                      <SettingsIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('sharedShowDetails')}>
                    <IconButton
                      size="small"
                      className={classes.actionIcon}
                      sx={{ flex: 1, color: expanded ? theme.palette.primary.main : 'inherit' }}
                      onClick={() => setExpanded(!expanded)}
                    >
                      <ExpandMoreIcon sx={{ fontSize: 20, transition: '0.3s', transform: expanded ? 'rotate(180deg)' : 'none' }} />
                    </IconButton>
                  </Tooltip>

                  {admin && (
                    <Tooltip title={t('sharedEdit')}>
                      <IconButton size="small" className={classes.actionIcon} sx={{ flex: 1 }} onClick={() => navigate(`/settings/device/${deviceId}`)}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Tooltip title={t('sharedMore')}>
                    <IconButton size="small" className={classes.actionIcon} sx={{ flex: 1 }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                      <PendingIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                {/* Paket Süresi Uyarısı (Tıklanabilir & Linkli) */}
                {device.expirationTime && (new Date(device.expirationTime) - new Date()) < (30 * 24 * 60 * 60 * 1000) && (
                  <Typography
                    onClick={() => navigate(`/settings/paymentpage`)} // Buradaki yolu kendi ödeme sayfanıza göre güncelleyin
                    className="no-drag" // Sürüklemeyi engellemek için önemli
                    sx={{
                      fontSize: '11px',
                      mt: 1,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      cursor: 'pointer', // El simgesi çıksın
                      textDecoration: 'underline', // Link olduğu anlaşılsın
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 0.8,
                        color: 'warning.dark'
                      }
                    }}
                    color="warning.main"
                  >
                    ⚠️ {t("paketAlert")}
                  </Typography>
                )}
                {/* Paket Süresi Uyarısı */}
                {device.expirationTime && new Date(device.expirationTime) < new Date() && (
                  <Typography sx={{ fontSize: '11px', mt: 1, textAlign: 'center', fontWeight: 'bold' }} color="error">
                    ⚠️ {t("paketAlertgecmis")}
                  </Typography>
                )}

                {position?.attributes?.alarm && (
                  <Box sx={{ bgcolor: 'error.main', color: 'white', py: 0.2, px: 1, borderRadius: 1, mt: 1 }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.6rem', textAlign: 'center', display: 'block' }}>
                      ⚠️ {t('alarm' + position?.attributes?.alarm.charAt(0).toUpperCase() + position?.attributes?.alarm.slice(1)).toUpperCase()} ALARMI!
                    </Typography>
                  </Box>
                )}
                {/* Alarm ve Paket Uyarısı (Aynı kalabilir) */}
              </Box>

              {/* Alt kısımdaki Accordion yapısı artık böyle */}
              {/* Alt kısımdaki Accordion */}
              <Accordion
                expanded={expanded}
                sx={{
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  margin: '0 !important',
                  minHeight: 0, // Önemli: Yükseklik kalıntısını önler
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': { margin: '0 !important' } // MUI'nin default marginini sıfırla
                }}
              >
                {/* Summary kısmını boş bir fragment veya null döndürerek tamamen gizliyoruz */}
                <AccordionSummary sx={{ display: 'none' }} />

                <AccordionDetails sx={{ p: 0, borderTop: expanded ? `1px solid ${theme.palette.divider}` : 'none' }}>
                  <Box
                    sx={{
                      maxHeight: 180,
                      overflowY: 'auto',
                      px: 2,
                      py: 1,
                      // Scrollbar'ı gizleyerek temiz görünüm sağlıyoruz
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none',
                      '&::-webkit-scrollbar': { display: 'none' }
                    }}
                  >
                    <Table size="small">
                      <TableBody>
                        {positionItems.split(',').filter(k => position.hasOwnProperty(k) || position?.attributes?.hasOwnProperty(k)).map(key => (
                          <StatusRow
                            key={key}
                            name={positionAttributes[key]?.name || key}
                            icon={iconMapping[key] || <InfoOutlinedIcon fontSize="small" />}
                            content={<PositionValue position={position} property={position.hasOwnProperty(key) ? key : null} attribute={position.hasOwnProperty(key) ? null : key} />}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </AccordionDetails>
              </Accordion>
              <Box sx={{ p: 0.5, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography sx={{ fontSize: '9px', fontWeight: '900', color: 'text.disabled' }}>
                  {t('positionServerTime')}: {new Date(position.serverTime).toLocaleString()}
                </Typography>
              </Box>
            </Card>
          </div>
        </Draggable>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { borderRadius: '15px', mt: 1 } }}>
        <MenuItem onClick={() => { setAnchorEl(null); handleGeofence(); }} sx={{ fontSize: '0.85rem' }}>{t('sharedCreateGeofence')}</MenuItem>
        <Divider />
        {admin && (
          <MenuItem onClick={() => navigate(`/position/${position.id}`)} sx={{ fontSize: '0.85rem' }}>{t('sharedShowDetails')}</MenuItem>
        )}
        <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${position.latitude},${position.longitude}`} sx={{ fontSize: '0.85rem' }}>{t('linkGoogleMaps')}</MenuItem>
        <MenuItem component="a" target="_blank" href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`} sx={{ fontSize: '0.85rem' }}>{t('linkAppleMaps')}</MenuItem>
        {!shareDisabled && !user.temporary && <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)} sx={{ fontSize: '0.85rem' }} color="primary">{t('deviceShare')}</MenuItem>}
      </Menu>

      <Menu anchorEl={anchorElReplay} open={Boolean(anchorElReplay)} onClose={() => setAnchorElReplay(null)} PaperProps={{ sx: { borderRadius: '15px', mt: 1 } }}>
        <MenuItem
          onClick={() => {
            const { from, to } = getTodayRangeUTC();

            navigate(`/reports/trips?deviceId=${deviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          }}
          sx={{ fontSize: '0.85rem' }}
        >
          {t('reportTrips')}
        </MenuItem>        <Divider />
        <MenuItem onClick={() => navigate(`/replay?deviceId=${deviceId}`)} sx={{ fontSize: '0.85rem' }}>{t('reportReplay')}</MenuItem>
      </Menu>

      <RemoveDialog open={false} endpoint="devices" itemId={deviceId} onResult={() => { }} />
    </>
  );
};

export default StatusCardNew;