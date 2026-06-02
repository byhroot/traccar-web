import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Card, Box, Grid, Chip,
  Dialog, DialogTitle, IconButton, DialogContent, Badge,
  List, ListItem, ListItemText, CardActionArea, Divider,
  useTheme, useMediaQuery, Stack, Tooltip, alpha,
  Collapse, Menu, MenuItem, Switch, Select, FormControl,
  InputLabel, ToggleButton, ToggleButtonGroup, CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Announcement as AnnouncementIcon,
  Wifi as WifiIcon,
  Speed as SpeedIcon,
  WifiTetheringError as WifiTetheringErrorIcon,
  Map as MapIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  VerticalAlignBottom as VerticalAlignBottomIcon,
  RotateRight as RotateRightIcon,
  DragIndicator as DragIndicatorIcon,
  AccessTime as AccessTimeIcon,
  SignalWifiBad as SignalWifiBadIcon,
} from '@mui/icons-material';
import NearMeIcon from '@mui/icons-material/NearMe';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SosIcon from '@mui/icons-material/Sos';
import CarCrashIcon from '@mui/icons-material/CarCrash';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import WrongLocationIcon from '@mui/icons-material/WrongLocation';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from '../reports/components/ReportsMenu';
import EventListCard from './EventListCard';
import SpeedListCard from './SpeedListCard';
import GeofenceListCard from './GeofenceListCard';
import AlertListCard from './AlertListCard';
import DashboardChartsCard from './DashboardChartsCard';
import VehicleDetailCard from './VehicleDetailCard';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDispatch } from 'react-redux';
import { devicesActions } from '../store';
import {
  DEMO_DEVICES, DEMO_POSITIONS, DEMO_EVENTS,
  DemoModeBanner, DashboardEmptyState,
} from './DashboardDemoBanner';
// ─── SABITLER ─────────────────────────────────────────────────────────────────

// Sadece ID'ler burada — label'lar t() ile component içinde üretilir
const WIDGET_IDS = ['alerts', 'fleet_status', 'kpi_events', 'vehicle_status', 'charts', 'violations', 'event_list'];

const WIDGET_DEFS_FACTORY = (t) => [
  { id: 'alerts', label: `${t('reportCustom')} ${t('sharedNotifications')}` },
  { id: 'fleet_status', label: 'Filo ' + t('deviceStatus') },
  { id: 'kpi_events', label: t('eventAlarm') + ' - ' + "KPI Karts" },
  { id: 'vehicle_status', label: t('deviceTitle') + ' - ' + t('deviceStatus') },
  { id: 'charts', label: `${t('reportChart')} ${t('reportDaily')}` },
  { id: 'violations', label: t('eventDeviceOverspeed') + ' - ' + t('eventGeofenceExit') },
  { id: 'event_list', label: t('last10event') },
];

const TIME_OPTIONS_FACTORY = (t) => [
  { value: 6, label: `6 ${t('sharedHours')}` },
  { value: 12, label: `12 ${t('sharedHours')}` },
  { value: 24, label: `24 ${t('sharedHours')}` },
  { value: 48, label: `48 ${t('sharedHours')}` },
  { value: 72, label: `72 ${t('sharedHours')}` },
];

const PREFS_KEY = 'db_prefs_v4';
const ORDER_KEY = 'db_order_v4';
const EXP_PREFIX = 'db_exp_';
const TIME_KEY = 'db_time_v4';

const loadJSON = (key, fallback) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
};
const saveJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) { } };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const groupByDevice = (evList, devices, emoji = '🚗') =>
  Object.values(evList.reduce((acc, e) => {
    const dev = devices.find(d => d.id === e.deviceId);
    if (!acc[e.deviceId]) acc[e.deviceId] = {
      id: e.deviceId, name: dev?.name || `Cihaz ${e.deviceId}`,
      count: 0, emoji, device: dev, lastEventTime: e.eventTime,
    };
    acc[e.deviceId].count++;
    if (new Date(e.eventTime) > new Date(acc[e.deviceId].lastEventTime))
      acc[e.deviceId].lastEventTime = e.eventTime;
    return acc;
  }, {})).sort((a, b) => b.count - a.count);

// ─── FLEET STATUS ─────────────────────────────────────────────────────────────

const FleetStatusCard = ({ devices, positions }) => {
  const theme = useTheme();
  const t = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(null);

  const stats = useMemo(() => {
    const posMap = Object.fromEntries((positions || []).map(p => [String(p.deviceId), p]));
    const online = devices.filter(d => d.status === 'online');
    const offline = devices.filter(d => d.status !== 'online');
    const moving = devices.filter(d => d.status === 'online' && d.motionState);
    const parked = devices.filter(d => !(d.status === 'online' && d.motionState));
    const idle = devices.filter(d => {
      const p = posMap[String(d.id)];
      return d.status === 'online' && !d.motionState && p && (p.speed || 0) < 1 && p.attributes?.ignition === true;
    });
    const ignOn = devices.filter(d => {
      const p = posMap[String(d.id)];
      return d.status === 'online' && p?.attributes?.ignition === true;
    });
    const ignOff = devices.filter(d => {
      const p = posMap[String(d.id)];
      return d.status === 'online' && p && p.attributes?.ignition === false;
    });
    const disconnected = devices.filter(d => {
      const p = posMap[String(d.id)];
      return d.status !== 'online' && p?.attributes?.ignition === true;
    });
    return { online, offline, moving, parked, idle, ignOn, ignOff, disconnected, total: devices.length };
  }, [devices, positions]);

  const rows = [
    { title: t('eventDeviceOnline'), value: stats.online.length, icon: WifiIcon, color: theme.palette.success.main, data: stats.online },
    { title: t('eventDeviceOffline'), value: stats.offline.length, icon: WifiTetheringErrorIcon, color: theme.palette.text.disabled, data: stats.offline },
    { title: t('eventDeviceMoving'), value: stats.moving.length, icon: SpeedIcon, color: theme.palette.info.main, data: stats.moving },
    { title: t('eventDeviceStopped'), value: stats.parked.length, icon: LocalParkingIcon, color: theme.palette.warning.main, data: stats.parked },
    { title: t('alarmIdle'), value: stats.idle.length, icon: HourglassEmptyIcon, color: theme.palette.secondary.main, data: stats.idle },
    { title: t('eventIgnitionOn'), value: stats.ignOn.length, icon: VpnKeyIcon, color: theme.palette.success.dark, data: stats.ignOn },
    { title: t('eventIgnitionOff'), value: stats.ignOff.length, icon: PowerOffIcon, color: theme.palette.text.secondary, data: stats.ignOff },
    { title: t('deviceStatusOffline'), value: stats.disconnected.length, icon: SignalWifiBadIcon, color: theme.palette.error.main, data: stats.disconnected },
  ];

  const ratio = stats.total > 0 ? Math.round((stats.online.length / stats.total) * 100) : 0;

  return (
    <>
      {/* ── Başlık + progress ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <DirectionsCarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10.5 }}>
            {stats.total} {t('sharedDevice')} - {t('live')} - {t('commandData')}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
            {ratio}% online
          </Typography>
          <Box sx={{ width: 56, height: 4, borderRadius: 99, bgcolor: alpha(theme.palette.divider, 1), overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', width: `${ratio}%`, bgcolor: theme.palette.success.main,
              borderRadius: 99, transition: 'width .8s cubic-bezier(.34,1.56,.64,1)',
            }} />
          </Box>
        </Stack>
      </Box>

      {/* ── KPI kartları ── */}
      <Grid container justifyContent="center" spacing={1}>
        {rows.map(row => (
          <Grid key={row.title} size={{ xs: 3, sm: 2, md: 1.5 }}>
            <Box
              onClick={() => row.data?.length && setDialog({ title: row.title, items: row.data })}
              sx={{
                borderRadius: 5,
                border: `1px solid ${alpha(theme.palette.divider, 1)}`,
                p: 1.5, textAlign: 'center',
                cursor: row.data?.length ? 'pointer' : 'default',
                transition: 'transform .18s, box-shadow .18s',
                '&:hover': row.data?.length ? {
                  transform: 'translateY(-3px)',
                  boxShadow: theme.shadows[4],
                } : {},
              }}
            >
              <row.icon sx={{ fontSize: 26, mb: 0.4, color: row.color }} />
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1, color: row.color }}>
                {row.value}
              </Typography>
              <Typography variant="caption" sx={{
                display: 'block', fontSize: '0.6rem', fontWeight: 600,
                color: 'text.secondary', textTransform: 'uppercase',
                lineHeight: 1.3, mt: 0.2,
              }}>
                {row.title}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ── Dialog ── */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span" fontWeight={800}>{dialog?.title}</Typography>
          <IconButton onClick={() => setDialog(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List disablePadding>
            {dialog?.items.map((d, i) => (
              <ListItem key={i} sx={{
                borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
                '&:last-child': { borderBottom: 'none' },
              }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    bgcolor: d.status === 'online' ? theme.palette.success.main : theme.palette.text.disabled,
                  }} />
                  <ListItemText
                    primary={<Typography fontWeight={700} sx={{ fontSize: 14 }}>{d.name}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {d.status === 'online' ? 'Online' : 'Offline'}{d.motionState ? ' · Hareket' : ''}
                      </Typography>
                    }
                  />
                  <Tooltip title="Detay">
                    <IconButton size="small"
                      onClick={() => { navigate(`/settings/device/${d.id}/details`); setDialog(null); }}
                      sx={{ width: 28, height: 28, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.divider, 1)}` }}>
                      <SettingsIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Haritada Göster">
                    <IconButton
                      size="small"
                      onClick={() => {
                        dispatch(devicesActions.selectId(d.id));
                        navigate('/');
                        setDialog(null);
                      }}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(theme.palette.divider, 1)}`,
                        position: 'relative',
                        overflow: 'visible',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: -3,
                          borderRadius: '6px',
                          border: `1.5px solid ${theme.palette.primary.main}`,
                          opacity: 0,
                          animation: 'liveRing 1.8s ease-in-out infinite',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          inset: -6,
                          borderRadius: '8px',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                          opacity: 0,
                          animation: 'liveRing 1.8s ease-in-out infinite 0.4s',
                        },
                        '@keyframes liveRing': {
                          '0%': { opacity: 0, transform: 'scale(0.85)' },
                          '30%': { opacity: 1 },
                          '100%': { opacity: 0, transform: 'scale(1.15)' },
                        },
                        '@keyframes livePulse': {
                          '0%, 100%': { opacity: 0.7 },
                          '50%': { opacity: 1 },
                        },
                        animation: 'livePulse 1.8s ease-in-out infinite',
                      }}
                    >
                      <NearMeIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── WIDGET WRAPPER (collapsible) ─────────────────────────────────────────────

const Widget = ({ id, label, children, dragHandle, defaultOpen = true }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(() => loadJSON(`${EXP_PREFIX}${id}`, defaultOpen));
  const toggle = () => { const n = !open; setOpen(n); saveJSON(`${EXP_PREFIX}${id}`, n); };
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}`, overflow: 'hidden' }}>
      <Box onClick={toggle} sx={{
        px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transition: 'background .15s', '&:hover': { bgcolor: 'action.hover' },
        bgcolor: open ? 'transparent' : alpha(theme.palette.action.hover, 0.1),
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {dragHandle}
          <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
        </Stack>
        {open ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} /> : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
      </Box>
      <Collapse in={open}>
        <Divider sx={{ opacity: .5 }} />
        <Box sx={{ p: { xs: 1, sm: 1.5 } }}>{children}</Box>
      </Collapse>
    </Card>
  );
};

// ─── KPI GRID ─────────────────────────────────────────────────────────────────

const KpiGrid = ({ stats, onKpiClick }) => {
  const theme = useTheme();
  const visible = stats.filter(s => s.value > 0);
  if (!visible.length) return null;
  return (
    <Grid container justifyContent="center" spacing={1}>
      {visible.map(kpi => (
        <Grid size={{ xs: 4, sm: 4, md: 2 }} key={kpi.title}>
          <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}`, transition: '.18s', '&:hover': { transform: 'translateY(-3px)', boxShadow: theme.shadows[4] } }}>
            <CardActionArea onClick={() => onKpiClick(kpi.title, kpi.data, kpi.rawEvents)} sx={{ p: 1.5, textAlign: 'center' }}>
              <kpi.icon sx={{ color: kpi.color, fontSize: 26, mb: 0.4 }} />
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>{kpi.value}</Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', lineHeight: 1.3, mt: 0.2 }}>
                {kpi.title}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// ─── VIOLATION CARDS ──────────────────────────────────────────────────────────

const ViolationCard = ({ icon: Icon, title, count, severity, children }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 1)}`, height: '100%' }}>
      <Box sx={{
        px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: alpha(theme.palette.primary.main, 0.06),
        borderBottom: count > 0 ? `1px solid ${alpha(theme.palette.divider, 1)}` : 'none',
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Icon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        </Stack>
        <Chip label={count} size="small" color={count > 0 ? severity : 'default'} sx={{ fontWeight: 700, height: 20, fontSize: 11 }} />
      </Box>
      {count > 0 && <Box sx={{ p: 1.5 }}>{children}</Box>}
    </Card>
  );
};


const ONBOARDING_KEY = 'db_onboarding_done';

const OnboardingTooltip = ({ anchorRef }) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(() => !localStorage.getItem(ONBOARDING_KEY));

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
  };

  if (!visible || !anchorRef?.current) return null;

  const rect = anchorRef.current.getBoundingClientRect();
  const tooltipWidth = 220;
  const margin = 8;

  // Tooltip'in sol pozisyonu: ortala ama ekran sınırını aşma
  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  if (left + tooltipWidth + margin > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - margin;
  }
  if (left < margin) left = margin;

  // Ok işaretinin tooltip içindeki yatay pozisyonu
  const arrowLeft = rect.left + rect.width / 2 - left;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: tooltipWidth,
        zIndex: 1400,
        bgcolor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.grey[900], 0.97)
          : alpha(theme.palette.grey[900], 0.92),
        color: '#fff',
        borderRadius: 2,
        px: 1.75, py: 1.25,
        boxShadow: theme.shadows[8],
      }}
    >
      {/* Ok işareti — dinamik pozisyon */}
      <Box sx={{
        position: 'absolute',
        top: -6,
        left: arrowLeft,
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderWidth: '0 6px 6px',
        borderStyle: 'solid',
        borderColor: `transparent transparent ${theme.palette.mode === 'dark'
          ? alpha(theme.palette.grey[900], 0.97)
          : alpha(theme.palette.grey[900], 0.92)
          } transparent`,
      }} />

      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5, color: '#fff' }}>
        Sayfayı özelleştirin
      </Typography>
      <Typography sx={{ fontSize: 11, color: alpha('#fff', 0.75), lineHeight: 1.5, mb: 1 }}>
        Bölümleri açıp kapatabilir, sürükle-bırak ile sıralayabilirsiniz.
      </Typography>
      <Box
        onClick={dismiss}
        sx={{
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          color: alpha('#fff', 0.6), textAlign: 'right',
          '&:hover': { color: '#fff' },
          transition: 'color .15s',
        }}
      >
        Bir daha gösterme ✕
      </Box>
    </Box>
  );
};

// ─── WIDGET MANAGER & DRAG ────────────────────────────────────────────────────

const WidgetManager = ({ prefs, order, widgetDefs, onChange, onReorder }) => {
  const theme = useTheme();
  const [anchor, setAnchor] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const btnRef = useRef(null); // ← ekle

  const handleDragStart = (id) => setDragging(id);
  const handleDragEnter = (id) => setDragOver(id);
  const handleDragEnd = () => {
    if (dragging && dragOver && dragging !== dragOver) {
      const next = [...order];
      const fi = next.indexOf(dragging);
      const ti = next.indexOf(dragOver);
      next.splice(fi, 1);
      next.splice(ti, 0, dragging);
      onReorder(next);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <>
      <OnboardingTooltip anchorRef={btnRef} /> {/* ← ekle */}

      <Tooltip title="Bölümleri Düzenle">
        <IconButton ref={btnRef} size="small" onClick={e => setAnchor(e.currentTarget)}
          sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }, borderRadius: 2, width: 32, height: 32 }}>
          <SettingsIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}`, minWidth: 260, boxShadow: theme.shadows[6] } }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}` }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: .8, fontSize: 10 }}>
            Bölümler
          </Typography>
        </Box>
        {order.map(id => {
          const def = widgetDefs.find(w => w.id === id);
          if (!def) return null;
          return (
            <Box
              key={id}
              draggable
              onDragStart={() => handleDragStart(id)}
              onDragEnter={() => handleDragEnter(id)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.75,
                cursor: 'grab', userSelect: 'none',
                bgcolor: dragOver === id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                borderLeft: dragOver === id ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                transition: 'background .12s, border .12s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
              <Switch size="small" checked={!!prefs[id]}
                onChange={e => { e.stopPropagation(); onChange(id, e.target.checked); }}
                onClick={e => e.stopPropagation()} />
              <Typography variant="body2" sx={{ fontSize: 13 }}>{def.label}</Typography>
            </Box>
          );
        })}
      </Menu>
    </>
  );
};

// ─── TIME FILTER BAR ──────────────────────────────────────────────────────────

const TimeFilter = ({ value, onChange, timeOptions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <Select value={value} onChange={e => onChange(e.target.value)}
          sx={{ borderRadius: 2, fontSize: 12, height: 32 }}>
          {timeOptions.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 12 }}>{o.label}</MenuItem>)}
        </Select>
      </FormControl>
    );
  }

  return (
    <ToggleButtonGroup size="small" value={value} exclusive onChange={(_, v) => v && onChange(v)}
      sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.4, fontSize: 11, fontWeight: 600, textTransform: 'none', borderRadius: '8px !important', border: `1px solid ${alpha(theme.palette.divider, 1)} !important`, mx: 0.25 } }}>
      {timeOptions.map(o => (
        <ToggleButton key={o.value} value={o.value}>{o.label}</ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const theme = useTheme();
  const t = useTranslation();
  const navigate = useNavigate();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // t hazır olduğunda türet
  const WIDGET_DEFS = useMemo(() => WIDGET_DEFS_FACTORY(t), [t]);
  const TIME_OPTIONS = useMemo(() => TIME_OPTIONS_FACTORY(t), [t]);

  const user = useSelector(s => s.session.user);
  const statuscarddisabled = user?.attributes?.statuscarddisabled;

  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [events, setEvents] = useState([]);
  const [maintenanceMap, setMaintMap] = useState({});
  const devRef = useRef([]);

  const [hours, setHours] = useState(() => loadJSON(TIME_KEY, 48));
  const [widgetPrefs, setWidgetPrefs] = useState(() =>
    loadJSON(PREFS_KEY, Object.fromEntries(WIDGET_IDS.map(id => [id, true])))
  );
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = loadJSON(ORDER_KEY, null);
    return (saved?.length === WIDGET_IDS.length) ? saved : [...WIDGET_IDS];
  });

  const [expandedAlert, setExpandedAlert] = useState(false);
  const [kpiDialog, setKpiDialog] = useState(null);
  const [expandedVehicle, setExpandedVehicle] = useState(null); // YENİ

  const handleWidgetChange = useCallback((id, val) => {
    setWidgetPrefs(prev => { const n = { ...prev, [id]: val }; saveJSON(PREFS_KEY, n); return n; });
  }, []);

  const handleReorder = useCallback((next) => {
    setWidgetOrder(next); saveJSON(ORDER_KEY, next);
  }, []);

  const handleHoursChange = useCallback((h) => {
    setHours(h); saveJSON(TIME_KEY, h);
  }, []);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchDevices = useCallback(async () => {
    try {
      const r = await fetch('/api/devices');
      if (r.ok) { const d = await r.json(); setDevices(d); devRef.current = d; return d; }
    } catch (e) { console.error(e); }
    return [];
  }, []);



  const fetchPositions = useCallback(async () => {
    try { const r = await fetch('/api/positions'); if (r.ok) setPositions(await r.json()); } catch (e) { console.error(e); }
  }, []);

  const fetchEvents = useCallback(async (devList, h) => {
    const list = devList || devRef.current;
    const hoursVal = h !== undefined ? h : hours;
    if (!list?.length) return;
    try {
      const now = new Date();
      const from = new Date(now - hoursVal * 3600 * 1000).toISOString();
      const params = new URLSearchParams({ from, to: now.toISOString() });
      list.forEach(d => params.append('deviceId', d.id));
      ['alarm', 'deviceMoving', 'deviceStopped', 'deviceOverspeed', 'deviceFuelDrop',
        'geofenceEnter', 'geofenceExit', 'ignitionOn', 'ignitionOff', 'maintenance',
        'driverChanged', 'idle', 'tow', 'hardAcceleration', 'hardBraking', 'hardCornering',
        'sos', 'accident', 'fatigueDriving',
      ].forEach(type => params.append('type', type));
      const r = await fetch(`/api/reports/events?${params.toString()}`);
      if (r.ok) setEvents((await r.json()).sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime)));
    } catch (e) { console.error(e); }
  }, [hours]);

  const fetchMaintenances = useCallback(async (devList) => {
    const list = devList || devRef.current;
    if (!list?.length || list.length > 10) return;
    try {
      const results = await Promise.allSettled(
        list.map(d => fetch(`/api/maintenance?deviceId=${d.id}`).then(r => r.ok ? r.json() : []))
      );
      const map = {};
      list.forEach((d, i) => { map[d.id] = results[i].status === 'fulfilled' ? results[i].value : []; });
      setMaintMap(map);
    } catch (e) { console.error(e); }
  }, []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDevices().then(d => {
      fetchPositions();
      if (d?.length) {
        fetchEvents(d, hours);
        fetchMaintenances(d);
        // fleet_status için localStorage'da daha önce kullanıcı tercihi kaydedilmemiş mi?
        const savedPrefs = localStorage.getItem(PREFS_KEY);
        if (!savedPrefs && d.length <= 3) {
          // İlk açılış + az araç → fleet_status'u kapalı başlat
          setWidgetPrefs(prev => {
            const next = { ...prev, fleet_status: false };
            saveJSON(PREFS_KEY, next);
            return next;
          });
        }
      }
      setIsLoading(false); // ← fetch bitti, artık boş durumu gösterebilir
    });
    const evInt = setInterval(() => fetchEvents(), 30000);
    const posInt = setInterval(() => fetchPositions(), 15000);
    return () => { clearInterval(evInt); clearInterval(posInt); };
  }, []); // eslint-disable-line

  useEffect(() => { fetchEvents(devRef.current, hours); }, [hours]); // eslint-disable-line
  // loadDemo / clearDemo
  const loadDemo = useCallback(() => {
    setDevices(DEMO_DEVICES);
    devRef.current = DEMO_DEVICES;
    setPositions(DEMO_POSITIONS);
    setEvents(DEMO_EVENTS);
    setIsDemoMode(true);
  }, []);

  const clearDemo = useCallback(() => {
    setIsDemoMode(false);
    setDevices([]); setPositions([]); setEvents([]);
    devRef.current = [];
    fetchDevices().then(d => { fetchEvents(d, hours); fetchPositions(); });
  }, [fetchDevices, fetchEvents, fetchPositions, hours]);

  // ── derived event slices ───────────────────────────────────────────────────

  const evSpeed = useMemo(() => events.filter(e => e.type === 'deviceOverspeed'), [events]);
  const evGeoExit = useMemo(() => events.filter(e => e.type === 'geofenceExit'), [events]);
  const alarm = useCallback(type => events.filter(e => e.type === 'alarm' && e.attributes?.alarm === type), [events]);

  const evIdle = useMemo(() => alarm('idle'), [events]);
  const evTow = useMemo(() => alarm('tow'), [events]);
  const evHardAcc = useMemo(() => alarm('hardAcceleration'), [events]);
  const evHardBrk = useMemo(() => alarm('hardBraking'), [events]);
  const evHardCor = useMemo(() => alarm('hardCornering'), [events]);
  const evSos = useMemo(() => alarm('sos'), [events]);
  const evVibration = useMemo(() => alarm('vibration'), [events]);
  const evAccident = useMemo(() => alarm('accident'), [events]);
  const kpiStats = useMemo(() => [
    { title: t('eventDeviceOverspeed'), value: evSpeed.length, icon: OfflineBoltIcon, color: theme.palette.error.main, data: groupByDevice(evSpeed, devices, '⚡'), rawEvents: evSpeed },
    { title: t('eventGeofenceExit'), value: evGeoExit.length, icon: WrongLocationIcon, color: theme.palette.secondary.main, data: groupByDevice(evGeoExit, devices, '📍'), rawEvents: evGeoExit },
    { title: t('alarmIdle') + " " + t('positionAlarm'), value: evIdle.length, icon: BedtimeIcon, color: theme.palette.info.main, data: groupByDevice(evIdle, devices, '🛌'), rawEvents: evIdle },
    { title: t('alarmTow'), value: evTow.length, icon: LocalShippingIcon, color: theme.palette.primary.main, data: groupByDevice(evTow, devices, '🚛'), rawEvents: evTow },
    { title: t('alarmHardAcceleration'), value: evHardAcc.length, icon: TrendingUpIcon, color: theme.palette.success.main, data: groupByDevice(evHardAcc, devices, '🚀'), rawEvents: evHardAcc },
    { title: t('alarmHardBraking'), value: evHardBrk.length, icon: VerticalAlignBottomIcon, color: theme.palette.warning.main, data: groupByDevice(evHardBrk, devices, '🛑'), rawEvents: evHardBrk },
    { title: t('alarmHardCornering'), value: evHardCor.length, icon: RotateRightIcon, color: theme.palette.error.main, data: groupByDevice(evHardCor, devices, '🌀'), rawEvents: evHardCor },
    { title: t('alarmSos'), value: evSos.length, icon: SosIcon, color: theme.palette.secondary.main, data: groupByDevice(evSos, devices, '🆘'), rawEvents: evSos },
    { title: t('alarmVibration'), value: evVibration.length, icon: CarCrashIcon, color: theme.palette.secondary.main, data: groupByDevice(evVibration, devices, '📍'), rawEvents: evVibration },
    { title: t('alarmAccident'), value: evAccident.length, icon: CarCrashIcon, color: theme.palette.error.main, data: groupByDevice(evAccident, devices, '💥'), rawEvents: evAccident },
  ], [devices, events, evSpeed, evGeoExit, evIdle, evTow, evHardAcc, evHardBrk, evHardCor, evSos, evVibration, evAccident, t, theme]);
  // ── widget renderer ────────────────────────────────────────────────────────

  const renderWidget = (id) => {
    if (!widgetPrefs[id]) return null;

    switch (id) {

      case 'fleet_status':
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <FleetStatusCard devices={devices} positions={positions} />
          </Box>
        );

      case 'alerts':
        if (statuscarddisabled) return null;
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}`, overflow: 'hidden' }}>
              <Box onClick={() => setExpandedAlert(v => !v)}
                sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, transition: 'background .15s' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Badge color="error" variant="dot" invisible={!events.length}>
                    <AnnouncementIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  </Badge>
                  <Typography variant="subtitle2" fontWeight={700}>{`${t('reportCustom')} ${t('sharedNotifications')}`}</Typography>
                </Stack>
                {expandedAlert ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Box>
              <Collapse in={expandedAlert}>
                <Divider sx={{ opacity: .5 }} />
                <Box sx={{ p: 1.5 }}><AlertListCard deviceDetails={devices} /></Box>
              </Collapse>
            </Card>
          </Box>
        );
      case 'vehicle_status':
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <Widget
              id="vehicle_status"
              label="Araç Detay"
              defaultOpen     // her zaman açık
            >
              <VehicleDetailCard
                devices={devices}
                positions={positions}
                maintenanceMap={maintenanceMap}
                events={events}
              />
            </Widget>
          </Box>
        );
      case 'kpi_events':
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10.5 }}>
              {t('reportEvents')} & {t('sharedAlarms')}
            </Typography>
            <KpiGrid stats={kpiStats} onKpiClick={(title, data, rawEvents) => { if (data?.length) setKpiDialog({ title, devices: data, rawEvents }); }} />
          </Box>
        );

      case 'charts':
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <Widget id="charts" label={`${t('reportChart')} ${t('reportDaily')}`}>
              <DashboardChartsCard devices={devices} />
            </Widget>
          </Box>
        );

      case 'violations':
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ViolationCard icon={WifiTetheringErrorIcon} title={t('eventDeviceOverspeed')} count={evSpeed.length} severity="error">
                  <SpeedListCard deviceDetails={devices} eventsSpeed={evSpeed} />
                </ViolationCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ViolationCard icon={MapIcon} title={t('eventGeofenceExit')} count={evGeoExit.length} severity="secondary">
                  <GeofenceListCard deviceDetails={devices} eventsGeofenceExit={evGeoExit} />
                </ViolationCard>
              </Grid>
            </Grid>
          </Box>
        );

      case 'event_list':
        return (
          <Box key={id} sx={{ mb: 2 }}>
            <Widget id="event_list" label={t('last10event')}>
              <EventListCard events={events.slice(0, 20)} deviceDetails={devices} />
            </Widget>
          </Box>
        );

      default: return null;
    }
  };

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'mainpageTitle']}>
      <Box sx={{ p: { xs: 0.5, sm: 1, md: 2 } }}>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DashboardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle1" fontWeight={700}>Dashboard</Typography>
            {devices.length > 0 && (
              <Chip
                label={`${devices.filter(d => d.status === 'online').length}/${devices.length} online`}
                size="small"
                sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}
              />
            )}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <AccessTimeIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <TimeFilter value={hours} onChange={handleHoursChange} timeOptions={TIME_OPTIONS} />
            </Stack>
            <WidgetManager
              prefs={widgetPrefs}
              order={widgetOrder}
              widgetDefs={WIDGET_DEFS}
              onChange={handleWidgetChange}
              onReorder={handleReorder}
            />
          </Stack>
        </Box>
        {isDemoMode && <DemoModeBanner onClear={clearDemo} />}

        {isLoading
          ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
              <CircularProgress size={32} sx={{ color: 'text.disabled' }} />
            </Box>
          )
          : devices.length === 0 && !isDemoMode
            ? <DashboardEmptyState onLoadDemo={loadDemo} />
            : widgetOrder.map(id => renderWidget(id))
        }

      </Box>

      <Dialog
        open={!!kpiDialog}
        onClose={() => { setKpiDialog(null); setExpandedVehicle(null); }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span" fontWeight={800}>
            {kpiDialog?.title}
          </Typography>
          <IconButton onClick={() => { setKpiDialog(null); setExpandedVehicle(null); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <List disablePadding>
            {kpiDialog?.devices.map((d) => {
              const isExpanded = expandedVehicle === d.id;

              // Bu araca ait olayları bul
              const vehicleEvents = (kpiDialog.rawEvents || [])
                .filter(e => e.deviceId === d.id)
                .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));

              return (
                <React.Fragment key={d.id}>
                  {/* Araç satırı */}
                  <ListItem
                    onClick={() => setExpandedVehicle(isExpanded ? null : d.id)}
                    sx={{
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      py: 1.25,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        bgcolor: d.device?.status === 'online'
                          ? theme.palette.success.main
                          : theme.palette.text.disabled,
                      }} />
                      <ListItemText
                        primary={
                          <Typography fontWeight={700} sx={{ fontSize: 14 }}>{d.name}</Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {d.count} ihlal
                          </Typography>
                        }
                      />
                      <Chip
                        label={d.count}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700, height: 20, fontSize: 11 }}
                      />
                      {isExpanded
                        ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      }
                    </Stack>
                  </ListItem>

                  {/* Olay listesi */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
                      {vehicleEvents.map((ev) => (
                        <Box
                          key={ev.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontSize: 12 }}>
                            {new Date(ev.eventTime).toLocaleString('tr-TR', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/event/${ev.id}`);
                              setKpiDialog(null);
                              setExpandedVehicle(null);
                            }}
                            sx={{
                              fontSize: 11,
                              borderRadius: 1.5,
                              px: 1,
                              py: 0.5,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              color: theme.palette.primary.main,
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                            }}
                          >
                            <SettingsIcon sx={{ fontSize: 13, mr: 0.5 }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{t("reportShow")}</Typography>
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </React.Fragment>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Dashboard;