/**
 * CombinedReportPage v5
 */

import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip, IconButton, Chip, Box, Typography,
  Collapse, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  FullscreenRounded, FullscreenExitRounded,
  ExpandMoreRounded, ExpandLessRounded,
  RouteRounded, ThermostatRounded, TimelineRounded,
  PlaceRounded, SpeedRounded, EventRounded,
  LayersRounded, DirectionsCarRounded,
  WarningAmberRounded, BoltRounded, FlagRounded,
  MyLocationRounded, ClearRounded, PlayArrowRounded,
} from '@mui/icons-material';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import useReportStyles from './common/useReportStyles';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapRouteCoordinatesCombined from '../map/MapRouteCoordinatesCombined';
import MapRouteEvents from '../map/MapRouteEvents';
import { formatTime } from '../common/util/formatter';
import fetchOrThrow from '../common/util/fetchOrThrow';
import ReportPageAnime from './components/ReportPageAnime';

const DEVICE_COLORS = [
  '#4F8EF7', '#F7774F', '#4FC78E', '#C74FD4', '#D4A74F',
  '#4FC7C7', '#F74F8E', '#8EF74F', '#7B4FF7', '#F7C94F',
];

const FILTER_GROUPS = [
  { key: 'ignition', label: 'Kontak', icon: <BoltRounded sx={{ fontSize: 13 }} />, color: '#4caf50' },
  { key: 'movement', label: 'Hareket', icon: <DirectionsCarRounded sx={{ fontSize: 13 }} />, color: '#2196f3' },
  { key: 'speed', label: 'Hız', icon: <SpeedRounded sx={{ fontSize: 13 }} />, color: '#fc9d45' },
  { key: 'alarm', label: 'Alarm', icon: <WarningAmberRounded sx={{ fontSize: 13 }} />, color: '#f44336' },
  { key: 'geofence', label: 'Bölge', icon: <FlagRounded sx={{ fontSize: 13 }} />, color: '#9c27b0' },
  { key: 'other', label: 'Diğer', icon: <MyLocationRounded sx={{ fontSize: 13 }} />, color: '#607d8b' },
];

const EVENT_COLOR = {
  alarm: '#f44336', ignitionOn: '#4caf50', ignitionOff: '#757575',
  deviceMoving: '#2196f3', deviceStopped: '#ff9800', deviceOverspeed: '#fc9d45',
  geofenceEnter: '#9c27b0', geofenceExit: '#9c27b0',
};
const evColor = (type) => EVENT_COLOR[type] || '#607d8b';

/* ── Yardımcılar ── */
function haversineKm(lon1, lat1, lon2, lat2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildSummary(item) {
  const { route = [], events = [], positions = [] } = item;
  let distanceKm = 0;
  for (let i = 1; i < route.length; i++)
    distanceKm += haversineKm(route[i - 1][0], route[i - 1][1], route[i][0], route[i][1]);
  const speeds = positions.map((p) => p.speed || 0).filter(Boolean);
  const maxSpeed = speeds.length ? Math.max(...speeds) : 0;
  const times = events.map((e) => new Date(e.eventTime).getTime()).filter(Boolean);
  const startTime = times.length ? new Date(Math.min(...times)).toISOString() : null;
  const endTime = times.length ? new Date(Math.max(...times)).toISOString() : null;
  const byGroup = { ignition: 0, movement: 0, speed: 0, alarm: 0, geofence: 0, other: 0 };
  events.forEach((e) => {
    if (e.type === 'ignitionOn' || e.type === 'ignitionOff') byGroup.ignition++;
    else if (e.type === 'deviceMoving' || e.type === 'deviceStopped') byGroup.movement++;
    else if (e.type === 'deviceOverspeed') byGroup.speed++;
    else if (e.type === 'alarm') byGroup.alarm++;
    else if (e.type === 'geofenceEnter' || e.type === 'geofenceExit') byGroup.geofence++;
    else byGroup.other++;
  });
  return { distanceKm, maxSpeed, startTime, endTime, byGroup, totalEvents: events.length };
}

/* ── Event ısı grafiği ── */
function EventHeatBar({ events, color, height: h = 32, bins: BINS = 30 }) {
  if (!events.length) return null;
  const times = events.map((e) => new Date(e.eventTime).getTime());
  const min = Math.min(...times), max = Math.max(...times);
  const range = max - min || 1;
  const bins = Array(BINS).fill(0);
  times.forEach((t) => { bins[Math.min(BINS - 1, Math.floor(((t - min) / range) * BINS))]++; });
  const peak = Math.max(...bins, 1);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: h }}>
      {bins.map((count, i) => (
        <Box key={i} sx={{
          flex: 1, height: `${Math.max(6, (count / peak) * 100)}%`,
          bgcolor: count ? color : 'action.hover',
          opacity: count ? 0.3 + (count / peak) * 0.7 : 0.1,
          borderRadius: '2px 2px 0 0', transition: 'height 0.2s ease',
        }} />
      ))}
    </Box>
  );
}

/* ── Stat kartı ── */
function StatCard({ icon, label, value, color = 'text.primary' }) {
  return (
    <Box sx={{
      flex: 1, minWidth: { xs: 60, sm: 72 },
      p: { xs: '7px 9px', md: '9px 11px' },
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2,
      display: 'flex', flexDirection: 'column', gap: 0.2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.disabled' }}>
        <Box sx={{ fontSize: 12, display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontSize: { xs: 9, md: 10 }, color: 'text.secondary', fontWeight: 500, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
      <Typography fontWeight={700} color={color} sx={{ fontSize: { xs: 12, md: 14 }, lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

/* ── Event grup pill ── */
function EventGroupPill({ count, total, color, icon, label }) {
  if (!count) return null;
  const pct = Math.round((count / total) * 100);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, flex: 1, minWidth: 64 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color }}>
          {icon}
          <Typography sx={{ fontSize: 10, fontWeight: 600, color }}>{label}</Typography>
        </Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color }}>{count}</Typography>
      </Box>
      <Box sx={{ height: 3, borderRadius: 2, bgcolor: `${color}20`, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 2 }} />
      </Box>
    </Box>
  );
}

/* ── Olay listesi ── */
function EventList({ events, t, onReplay }) {
  const [limit, setLimit] = useState(30);
  if (!events.length) return null;

  const sorted = [...events].sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
  const visible = sorted.slice(0, limit);

  const getLabel = (ev) => {
    if (ev.type === 'alarm' && ev.attributes?.alarm) {
      const k = `alarm${ev.attributes.alarm[0].toUpperCase()}${ev.attributes.alarm.slice(1)}`;
      return t(k);
    }
    return t(`event${ev.type[0].toUpperCase()}${ev.type.slice(1)}`);
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <EventRounded sx={{ fontSize: 12 }} /> Olay listesi
      </Typography>
      <Box sx={{
        maxHeight: 280, overflowY: 'auto',
        border: '1px solid', borderColor: 'divider', borderRadius: 1.5,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
      }}>
        {visible.map((ev, i) => {
          const color = evColor(ev.type);
          const label = getLabel(ev);
          const time = ev.eventTime
            ? new Date(ev.eventTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' })
            : '—';
          return (
            <Box
              key={ev.id ?? i}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1.25, py: 0.7,
                borderBottom: i < visible.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background 0.1s',
              }}
            >
              {/* Renk nokta */}
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />

              {/* Olay adı + zaman */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.3 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'text.disabled', lineHeight: 1.2 }}>
                  {time}
                </Typography>
              </Box>

              {/* Replay butonu */}
              {onReplay && ev.eventTime && (
                <Box
                  component="button"
                  onClick={() => {
                    const evMs = new Date(ev.eventTime).getTime();
                    const margin = 15 * 60000;
                    onReplay(
                      new Date(evMs - margin).toISOString(),
                      new Date(evMs + margin).toISOString(),
                      String(ev.deviceId),
                    );
                  }}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.3,
                    px: 0.75, py: 0.3, borderRadius: 1,
                    border: `1px solid ${color}50`, bgcolor: `${color}10`, color,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    '&:hover': { bgcolor: `${color}20` },
                  }}
                >
                  <PlayArrowRounded sx={{ fontSize: 12 }} /> Replay
                </Box>
              )}
            </Box>
          );
        })}

        {/* Daha fazla */}
        {sorted.length > limit && (
          <Box
            onClick={() => setLimit((l) => l + 30)}
            sx={{
              py: 0.8, textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: 'primary.main', cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            + {sorted.length - limit} olay daha göster
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ── Per-device card ── */
function DeviceCard({ item, deviceName, color, index, t, onReplay }) {
  const [open, setOpen] = useState(index === 0);
  const summary = useMemo(() => buildSummary(item), [item]);

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>

      {/* Başlık */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: { xs: 1.5, md: 2 }, py: { xs: 1.1, md: 1.4 },
          borderLeft: `4px solid ${color}`,
          bgcolor: open ? `${color}08` : 'transparent',
          cursor: 'pointer', '&:hover': { bgcolor: `${color}10` },
          transition: 'background 0.12s',
        }}
      >
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color, flexShrink: 0, boxShadow: `0 0 0 3px ${color}25` }} />
        <Typography fontWeight={700} sx={{ flex: 1, fontSize: { xs: 13, md: 14 } }}>{deviceName}</Typography>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{summary.distanceKm.toFixed(1)} km</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>·</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{summary.totalEvents} olay</Typography>
        </Box>
        <Chip
          label={summary.totalEvents} size="small"
          sx={{ fontSize: 10, height: 18, minWidth: 28, bgcolor: `${color}14`, color, border: `1px solid ${color}30`, fontWeight: 700 }}
        />
        {open
          ? <ExpandLessRounded fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
          : <ExpandMoreRounded fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />}
      </Box>

      {/* Detay */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ px: { xs: 1.5, md: 2 }, pb: 2, pt: 1.25, borderLeft: `4px solid ${color}` }}>

          {/* Stat kartları */}
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.75, flexWrap: 'wrap' }}>
            <StatCard icon={<RouteRounded sx={{ fontSize: 12 }} />} label="Mesafe" value={`${summary.distanceKm.toFixed(1)} km`} color={color} />
            <StatCard icon={<PlaceRounded sx={{ fontSize: 12 }} />} label="Konum" value={item.positions.length} color={color} />
            <StatCard icon={<EventRounded sx={{ fontSize: 12 }} />} label="Olay" value={summary.totalEvents} color={color} />
          </Box>

          {/* Isı grafiği */}
          <Box sx={{ mb: 1.75 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <TimelineRounded sx={{ fontSize: 12 }} /> Olay yoğunluğu (zaman)
            </Typography>
            <EventHeatBar events={item.events} color={color} height={36} bins={30} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
              <Typography sx={{ fontSize: 9, color: 'text.disabled' }}>
                {summary.startTime ? formatTime(summary.startTime, 'minutes') : '—'}
              </Typography>
              <Typography sx={{ fontSize: 9, color: 'text.disabled' }}>
                {summary.endTime ? formatTime(summary.endTime, 'minutes') : '—'}
              </Typography>
            </Box>
          </Box>

          {/* Dağılım pill'ları */}
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <ThermostatRounded sx={{ fontSize: 12 }} /> Olay dağılımı
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
              {FILTER_GROUPS.map(({ key, label, icon, color: c }) => (
                <EventGroupPill key={key} count={summary.byGroup[key]} total={summary.totalEvents} color={c} icon={icon} label={label} />
              ))}
            </Box>
          </Box>

          {/* Olay listesi */}
          <EventList events={item.events} t={t} onReplay={onReplay} />

        </Box>
      </Collapse>
    </Box>
  );
}

/* ── Segment overlay ── */
function SegmentOverlay({ selectedSegment, deviceName, color, onReplay, onClear }) {
  if (!selectedSegment) return null;
  return (
    <Box sx={{
      position: 'absolute', bottom: { xs: 52, md: 40 }, left: '50%',
      transform: 'translateX(-50%)', zIndex: 20,
      display: 'flex', alignItems: 'center', gap: 0.75,
      bgcolor: 'background.paper', border: `2px solid ${color}`, borderRadius: 3,
      px: { xs: 1.25, md: 2 }, py: { xs: 0.6, md: 0.9 },
      boxShadow: `0 4px 16px ${color}30`,
      maxWidth: { xs: 'calc(100vw - 20px)', md: 400 },
      flexWrap: 'wrap', justifyContent: 'center',
    }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography fontWeight={700} noWrap sx={{ maxWidth: { xs: 80, md: 130 }, fontSize: { xs: 11, md: 12 } }}>
        {deviceName}
      </Typography>
      {selectedSegment.fromTime && (
        <Typography color="text.secondary" noWrap sx={{ fontSize: { xs: 10, md: 11 } }}>
          {formatTime(selectedSegment.fromTime, 'minutes')}
          {selectedSegment.toTime && <> → {formatTime(selectedSegment.toTime, 'minutes')}</>}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 0.4, alignItems: 'center' }}>
        <Box component="button" onClick={onReplay} sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.4,
          px: { xs: 0.9, md: 1.25 }, py: 0.4, borderRadius: 1.5,
          border: `1.5px solid ${color}`, bgcolor: color, color: '#fff',
          fontWeight: 700, fontSize: 11, cursor: 'pointer', '&:hover': { opacity: 0.85 },
        }}>
          <PlayArrowRounded sx={{ fontSize: 14 }} /> Replay
        </Box>
        <Tooltip title="Kapat">
          <IconButton size="small" onClick={onClear} sx={{ width: 26, height: 26 }}>
            <ClearRounded sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

/* ── Filter bar ── */
function FilterBar({ filters, onChange }) {
  return (
    <Box sx={{
      display: 'flex', gap: 0.75, flexWrap: 'wrap',
      px: { xs: 1, md: 1.5 }, py: 0.75,
      borderBottom: '1px solid', borderColor: 'divider',
      bgcolor: 'background.default',
    }}>
      <Typography sx={{ fontSize: 10, color: 'text.disabled', alignSelf: 'center', mr: 0.5 }}>
        Olaylar:
      </Typography>
      {FILTER_GROUPS.map(({ key, label, icon, color }) => {
        const active = filters[key];
        return (
          <Box key={key} component="button"
            onClick={() => onChange({ ...filters, [key]: !active })}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.4,
              px: 0.9, py: 0.35, borderRadius: '20px', fontSize: 10, fontWeight: 600,
              border: '1px solid', borderColor: active ? color : 'divider',
              bgcolor: active ? `${color}15` : 'transparent',
              color: active ? color : 'text.disabled',
              cursor: 'pointer', transition: 'all 0.12s',
              '&:hover': { borderColor: color, color, bgcolor: `${color}10` },
            }}
          >
            {icon} {label}
          </Box>
        );
      })}
    </Box>
  );
}

/* ═══════════════════════════════════
   Ana sayfa
═══════════════════════════════════ */
const CombinedReportPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const devices = useSelector((state) => state.devices.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [eventFilters, setEventFilters] = useState(
    { alarm: true, ignition: true, movement: true, speed: true, geofence: true, other: true },
  );
  const [hiddenDevices, setHiddenDevices] = useState(new Set());

  const toggleDevice = useCallback((deviceId) => {
    setHiddenDevices((prev) => {
      const next = new Set(prev);
      next.has(deviceId) ? next.delete(deviceId) : next.add(deviceId);
      return next;
    });
    setSelectedSegment((prev) => prev?.deviceId === deviceId ? null : prev);
  }, []);

  const itemsCoordinates = useMemo(
    () => items.filter((item) => !hiddenDevices.has(item.deviceId)).flatMap((item) => item.route),
    [items, hiddenDevices],
  );

  const globalStats = useMemo(() => {
    const summaries = items.map(buildSummary);
    return {
      deviceCount: items.length,
      totalDistance: summaries.reduce((a, s) => a + s.distanceKm, 0),
      totalEvents: items.reduce((a, i) => a + i.events.length, 0),
      maxSpeed: Math.max(0, ...summaries.map((s) => s.maxSpeed)),
    };
  }, [items]);

  const handleSegmentClick = useCallback(({ deviceId, deviceIdx, segmentIndex, fromTime, toTime }) => {
    setSelectedSegment((prev) =>
      prev?.deviceId === deviceId && prev?.segmentIndex === segmentIndex ? null
        : { deviceId, deviceIdx, segmentIndex, fromTime, toTime },
    );
  }, []);

  const handleReplaySegment = useCallback(() => {
    if (!selectedSegment) return;
    const item = items.find((it) => it.deviceId === selectedSegment.deviceId);
    const summary = item ? buildSummary(item) : {};
    navigate({
      pathname: '/replay', search: new URLSearchParams({
        from: selectedSegment.fromTime,
        to: selectedSegment.toTime || summary.endTime || '',
        deviceId: selectedSegment.deviceId,
      }).toString()
    });
  }, [selectedSegment, items, navigate]);

  const handleEventReplay = useCallback((from, to, deviceId) => {
    navigate({ pathname: '/replay', search: new URLSearchParams({ from, to, deviceId }).toString() });
  }, [navigate]);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((id) => query.append('deviceId', id));
    groupIds.forEach((id) => query.append('groupId', id));
    setLoading(true);
    setSelectedSegment(null);
    setHiddenDevices(new Set());
    try {
      const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  const hasItems = Boolean(items.length);
  const selectedColor = selectedSegment ? DEVICE_COLORS[(selectedSegment.deviceIdx ?? 0) % DEVICE_COLORS.length] : '#4F8EF7';
  const selectedDeviceName = selectedSegment ? devices[selectedSegment.deviceId]?.name || `#${selectedSegment.deviceId}` : '';

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <div className={classes.container}>

        {/* ════ HARİTA ════ */}
        {hasItems && (
          <div
            className={classes.containerMap}
            style={mapFullscreen ? { position: 'fixed', inset: 0, zIndex: 1300, width: '100vw', height: '100vh' } : undefined}
          >
            <MapView>
              <MapGeofence />
              {items.filter((item) => !hiddenDevices.has(item.deviceId)).map((item, idx) => (
                <MapRouteCoordinatesCombined
                  key={item.deviceId}
                  item={item}
                  name={devices[item.deviceId]?.name}
                  color={DEVICE_COLORS[idx % DEVICE_COLORS.length]}
                  selectedSegment={selectedSegment?.deviceId === item.deviceId ? selectedSegment.segmentIndex : undefined}
                  hasAnySelection={Boolean(selectedSegment)}
                  onSegmentClick={({ segmentIndex, fromTime, toTime }) =>
                    handleSegmentClick({ deviceId: item.deviceId, deviceIdx: idx, segmentIndex, fromTime, toTime })
                  }
                />
              ))}
              {items.filter((item) => !hiddenDevices.has(item.deviceId)).map((item) => (
                <MapRouteEvents
                  key={`ev-${item.deviceId}`}
                  positions={item.positions}
                  events={item.events}
                  filters={eventFilters}
                  replayMarginMin={15}
                  onReplayRequest={handleEventReplay}
                  deviceName={devices[item.deviceId]?.name || `#${item.deviceId}`}
                  showDeviceName={items.length > 1}
                  deviceColor={DEVICE_COLORS[items.findIndex((it) => it.deviceId === item.deviceId) % DEVICE_COLORS.length]}
                />
              ))}
            </MapView>
            <MapScale />
            <MapCamera coordinates={itemsCoordinates} />

            <SegmentOverlay
              selectedSegment={selectedSegment}
              deviceName={selectedDeviceName}
              color={selectedColor}
              onReplay={handleReplaySegment}
              onClear={() => setSelectedSegment(null)}
            />

            {/* Fullscreen */}
            <Tooltip title={mapFullscreen ? 'Küçült' : 'Tam ekran'}>
              <IconButton
                onClick={() => setMapFullscreen((v) => !v)}
                sx={{
                  position: 'absolute', top: { xs: 210, md: 200 }, right: 10, zIndex: 20,
                  width: 40, height: 40, bgcolor: 'background.paper',
                  boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}40, 0 2px 8px rgba(0,0,0,0.15)`,
                  animation: 'pulseRing 2s ease-in-out infinite',
                  '@keyframes pulseRing': {
                    '0%,100%': { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}40, 0 2px 8px rgba(0,0,0,0.15)` },
                    '50%': { boxShadow: (theme) => `0 0 0 5px ${theme.palette.primary.main}25, 0 2px 12px rgba(0,0,0,0.18)` },
                  },
                  transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  '&:hover': { bgcolor: 'background.paper', transform: 'scale(1.12)' },
                  '&:active': { transform: 'scale(0.92)' },
                }}
              >
                <Box sx={{ display: 'flex', transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)', transform: mapFullscreen ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1)' }}>
                  {mapFullscreen ? <FullscreenExitRounded sx={{ fontSize: 18 }} /> : <FullscreenRounded sx={{ fontSize: 18 }} />}
                </Box>
              </IconButton>
            </Tooltip>

            {/* Araç legend */}
            <Box sx={{
              position: 'absolute', top: { xs: 56, md: 60 }, left: 10, zIndex: 10,
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              borderRadius: 2, px: { xs: 1, md: 1.25 }, py: { xs: 0.6, md: 0.85 },
              display: 'flex', flexDirection: { xs: 'row', md: 'column' }, flexWrap: 'wrap',
              gap: { xs: 0.75, md: 0.4 }, maxWidth: { xs: 'calc(100% - 58px)', md: 200 },
              boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            }}>
              {!isMobile && (
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.secondary', mb: 0.3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Araçlar
                </Typography>
              )}
              {items
                .map((item, idx) => ({ item, idx, eventCount: item.events.length }))
                .filter(({ eventCount }) => eventCount > 0)
                .map(({ item, idx, eventCount }) => {
                  const color = DEVICE_COLORS[idx % DEVICE_COLORS.length];
                  const hidden = hiddenDevices.has(item.deviceId);
                  const name = devices[item.deviceId]?.name || `#${item.deviceId}`;
                  return (
                    <Tooltip key={item.deviceId} title={hidden ? 'Göster' : 'Gizle'} placement="right">
                      <Box onClick={() => toggleDevice(item.deviceId)} sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75,
                        cursor: 'pointer', borderRadius: 1, px: 0.5, py: 0.25,
                        opacity: hidden ? 0.35 : 1,
                        transition: 'opacity 0.15s, background 0.12s',
                        '&:hover': { bgcolor: `${color}14` },
                      }}>
                        <Box sx={{ width: 12, height: 3, borderRadius: 1, bgcolor: color, flexShrink: 0, boxShadow: hidden ? 'none' : `0 0 0 1px ${color}40` }} />
                        <Typography noWrap sx={{ fontSize: { xs: 10, md: 10 }, flex: 1, minWidth: 0 }}>{name}</Typography>
                        <Box sx={{ fontSize: 9, fontWeight: 700, lineHeight: 1, px: 0.6, py: 0.2, borderRadius: '10px', bgcolor: `${color}20`, color, border: `1px solid ${color}40`, flexShrink: 0 }}>
                          {eventCount}
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })}
              {items.length > 1 && hiddenDevices.size > 0 && (
                <Box onClick={() => setHiddenDevices(new Set())} sx={{
                  mt: 0.25, pt: 0.5, borderTop: '1px solid', borderColor: 'divider',
                  fontSize: 9, color: 'primary.main', fontWeight: 600,
                  cursor: 'pointer', textAlign: 'center', '&:hover': { opacity: 0.7 },
                }}>
                  Tümünü göster
                </Box>
              )}
            </Box>
          </div>
        )}

        {/* ════ ANA İÇERİK ════ */}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />
          </div>
          {items.length === 0 && !loading && <ReportPageAnime />}

          {hasItems && <FilterBar filters={eventFilters} onChange={setEventFilters} />}

          {hasItems && (
            <Box sx={{
              display: 'flex', gap: 0.75, flexWrap: 'wrap',
              px: { xs: 1, md: 1.5 }, py: { xs: 0.9, md: 1.1 },
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: 'background.default',
            }}>
              <StatCard icon={<LayersRounded sx={{ fontSize: 12 }} />} label="Araç" value={globalStats.deviceCount} />
              <StatCard icon={<RouteRounded sx={{ fontSize: 12 }} />} label="Toplam km" value={`${globalStats.totalDistance.toFixed(1)}`} color="info.main" />
              <StatCard icon={<EventRounded sx={{ fontSize: 12 }} />} label="Toplam olay" value={globalStats.totalEvents} color="warning.main" />
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, p: { xs: 0.75, md: 1.25 } }}>
            {loading ? (
              [1, 2, 3].map((i) => (
                <Box key={i} sx={{
                  height: 52, borderRadius: 2, bgcolor: 'action.hover',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                  '@keyframes pulse': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 0.9 } },
                }} />
              ))
            ) : (
              items.map((item, idx) => (
                <DeviceCard
                  key={item.deviceId}
                  item={item}
                  deviceName={devices[item.deviceId]?.name || `#${item.deviceId}`}
                  color={DEVICE_COLORS[idx % DEVICE_COLORS.length]}
                  index={idx}
                  t={t}
                  onReplay={handleEventReplay}
                />
              ))
            )}
          </Box>
        </div>
      </div>
    </PageLayout>
  );
};

export default CombinedReportPage;