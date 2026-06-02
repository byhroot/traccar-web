import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container, Box, Typography, Stack, TextField, Grid, Card, CardContent,
  alpha, useTheme, IconButton, CircularProgress, Paper, Select, MenuItem,
  FormControl, InputLabel, Fab, Slide, Autocomplete, Chip,
  ToggleButton, ToggleButtonGroup, Button, Divider, Collapse,
  LinearProgress, Tooltip, Badge, Dialog, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Avatar, Tabs, Tab,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import PageLayout from '../../common/components/PageLayout';
import ReportsMenu from './ReportsMenu';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const calculateDateRange = (rangeType) => {
  const today = new Date();
  let start = new Date();
  let end = new Date();
  switch (rangeType) {
    case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
    case 'last7': start.setDate(today.getDate() - 7); break;
    case 'thisMonth': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
    default: break;
  }
  return {
    start: start.toISOString().split('T')[0] + 'T00:00:00Z',
    end: end.toISOString().split('T')[0] + 'T23:59:59Z',
  };
};

// YENİ:
const minimizeEventsForAI = (events = []) =>
  events.map(e => ({
    deviceId: e.deviceId,
    type: e.type,
    time: e.eventTime,
    attr: e.attributes?.alarm || e.attributes?.status || '',
    ...(e.type === 'deviceOverspeed' && e.attributes?.speed != null && {
      speed: Math.round(e.attributes.speed * 1.852),
      limit: Math.round(e.attributes.speedLimit * 1.852),
    }),
  })).slice(0, 50);

const minimizeSummaryForAI = (summaries = [], devices = []) =>
  summaries.map(s => {
    const dev = devices.find(d => String(d.id) === String(s.deviceId));
    return {
      deviceId: s.deviceId,
      category: dev?.category || 'unknown',
      dist_km: Math.round((s.distance || 0) / 1000),
      avg_kmh: Math.round((s.averageSpeed || 0) * 1.852),
      max_kmh: Math.round((s.maxSpeed || 0) * 1.852),
      startTime: s.startTime,
      endTime: s.endTime,
    };
  }).slice(0, 50);

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m}d`;
};

const formatDateTime = (isoStr) => {
  if (!isoStr) return '—';
  try {
    return new Date(new Date(isoStr).getTime())
      .toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return isoStr; }
};

const replaceIdsWithNames = (text, devices) => {
  if (!text || !devices?.length) return text;
  let result = text;
  devices.forEach(dev => {
    const patterns = [
      new RegExp(`Cihaz\\s+${dev.id}\\b`, 'gi'),
      new RegExp(`ID:\\s*${dev.id}\\b`, 'gi'),
      new RegExp(`\\b${dev.id}\\s+ID['']li`, 'gi'),
      new RegExp(`\\[\\[${dev.id}\\]\\]`, 'gi'),                    // [[170]]
      new RegExp(`\\[\\[deviceId:\\s*${dev.id}\\]\\]`, 'gi'),       // [[deviceId: 136]]
      new RegExp(`\\[\\[\\*\\*${dev.id}\\*\\*\\]\\]`, 'gi'), // [[**07YRP81**]]
    ];
    patterns.forEach(re => {
      result = result.replace(re, `**${dev.name}**`);
    });
    result = result.replace(new RegExp(`\\b${dev.id}\\b`, 'g'), `**${dev.name}**`);
  });
  return result;
};

const EVENT_LABELS = {
  deviceOverspeed: 'Hız Aşımı',
  deviceStopped: 'Durdu',
  deviceMoving: 'Hareket',
  ignitionOn: 'Kontak Açık',
  ignitionOff: 'Kontak Kapalı',
  deviceOnline: 'Çevrimiçi',
  deviceOffline: 'Çevrimdışı',
  geofenceEnter: 'Bölge Girişi',
  geofenceExit: 'Bölge Çıkışı',
};

const COLOR_MAP = {
  success: { bar: '#10b981', light: '#d1fae5', text: '#065f46' },
  warning: { bar: '#f59e0b', light: '#fef3c7', text: '#92400e' },
  error: { bar: '#ef4444', light: '#fee2e2', text: '#991b1b' },
};

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

// ─── KPI CARD ────────────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, color = '#6366f1', onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.18s',
      ...(onClick && {
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%': { boxShadow: `0 0 0 0 ${alpha(color, 0.4)}` },
          '70%': { boxShadow: `0 0 0 8px ${alpha(color, 0)}` },
          '100%': { boxShadow: `0 0 0 0 ${alpha(color, 0)}` },
        },
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px ${alpha(color, 0.18)}`,
          animation: 'none', // hover'da pulse durur
        },
      }),
    }}
  >
    <Box sx={{ bgcolor: alpha(color, 0.12), p: 1, borderRadius: 2, display: 'inline-flex', mb: 1.5 }}>
      <Icon sx={{ fontSize: 20, color }} />
    </Box>
    <Typography variant="h5" fontWeight={800} sx={{ mb: 0.25, letterSpacing: -0.5 }}>{value}</Typography>
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{label}</Typography>
      {onClick && (
        <OpenInFullIcon sx={{ fontSize: 11, color: 'text.disabled', ml: 0.5 }} />
      )}
    </Stack>
  </Paper>
);

const KpiSkeleton = () => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
    <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 32, width: 32, mb: 1.5 }} />
    <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 28, width: '40%', mb: 0.75 }} />
    <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 12, width: '65%' }} />
  </Paper>
);

// ─── FLEET DISTANCE DIALOG ────────────────────────────────────────────────────

const FleetDistDialog = ({ open, onClose, rawSummary, devices, insights, rawEvents }) => {
  const [insightDialog, setInsightDialog] = useState(null);

  // Per-device km totals
  const deviceStats = useMemo(() => {
    const map = {};
    rawSummary.forEach(t => {
      const id = String(t.deviceId);
      if (!map[id]) map[id] = { totalDist: 0, totalTrips: 0, totalTime: 0, maxSpeed: 0 };
      map[id].totalDist += t.distance || 0;
      map[id].totalTrips += 1;
      map[id].totalTime += t.duration || 0;
      const spd = Math.round((t.maxSpeed || 0) * 1.852);
      if (spd > map[id].maxSpeed) map[id].maxSpeed = spd;
    });
    return Object.entries(map)
      .map(([id, stats]) => {
        const device = devices.find(d => String(d.id) === id);
        const deviceInsights = insights.filter(i => String(i.deviceId) === id);
        const hasError = deviceInsights.some(i => i.color === 'error');
        const hasWarning = deviceInsights.some(i => i.color === 'warning');
        return {
          deviceId: id,
          name: device?.name || `Cihaz ${id}`,
          km: Math.round(stats.totalDist / 1000),
          trips: stats.totalTrips,
          time: formatDuration(stats.totalTime / 1000),
          maxSpeed: stats.maxSpeed,
          severity: hasError ? 'error' : hasWarning ? 'warning' : 'success',
        };
      })
      .sort((a, b) => b.km - a.km);
  }, [rawSummary, devices, insights]);

  const maxKm = deviceStats[0]?.km || 1;

  const handleVehicleCardClick = (stat) => {
    // Build a synthetic insight item so InsightDialog can render properly
    const deviceInsight = insights.find(i => String(i.deviceId) === stat.deviceId);
    const syntheticItem = deviceInsight || {
      deviceId: stat.deviceId,
      title: `${stat.name}: Araç Detayı`,
      value: `${stat.km} km`,
      desc: `${stat.trips} Günlük Özet`,
      color: stat.severity,
    };
    setInsightDialog(syntheticItem);
  };

  const severityColors = {
    error: { bar: '#ef4444', light: '#fee2e2', badge: '#fca5a5', badgeText: '#7f1d1d' },
    warning: { bar: '#f59e0b', light: '#fef9ee', badge: '#fde68a', badgeText: '#78350f' },
    success: { bar: '#10b981', light: '#f0fdf8', badge: '#a7f3d0', badgeText: '#064e3b' },
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#6366f1', 0.04) }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: alpha('#6366f1', 0.12), p: 1, borderRadius: 2, display: 'inline-flex' }}>
                <RouteIcon sx={{ fontSize: 20, color: '#6366f1' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Araç Bazlı Mesafe</Typography>
                <Typography variant="caption" color="text.secondary">
                  {deviceStats.length} araç · Tıklayarak detay görüntüleyin
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} size="small"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          {deviceStats.length === 0 ? (
            <Box textAlign="center" py={8} sx={{ opacity: 0.3 }}>
              <RouteIcon sx={{ fontSize: 48, mb: 1.5, display: 'block', mx: 'auto' }} />
              <Typography variant="body2">Bu dönemde mesafe verisi bulunamadı.</Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {deviceStats.map((stat) => {
                const sc = severityColors[stat.severity];
                const barPct = Math.max(8, Math.round((stat.km / maxKm) * 100));
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={stat.deviceId}>
                    <Card
                      elevation={0}
                      onClick={() => handleVehicleCardClick(stat)}
                      sx={{
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.18s',
                        '&:hover': {
                          borderColor: sc.bar,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${alpha(sc.bar, 0.15)}`,
                          '& .vehicle-open-icon': { opacity: 1 },
                        },
                      }}
                    >
                      {/* Colored top accent */}
                      <Box sx={{ height: 3, bgcolor: sc.bar }} />
                      <CardContent sx={{ pt: 1.5, pb: '10px !important', px: 2 }}>
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: sc.light }}>
                              <DirectionsCarIcon sx={{ fontSize: 15, color: sc.bar }} />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13, lineHeight: 1.2 }}>
                                {stat.name}
                              </Typography>
                              <Stack direction="row" spacing={0.75} alignItems="center" mt={0.25}>
                                {stat.severity === 'error' && (
                                  <Chip label="Kritik" size="small" sx={{ height: 16, fontSize: 10, bgcolor: sc.badge, color: sc.badgeText, fontWeight: 700 }} />
                                )}
                                {stat.severity === 'warning' && (
                                  <Chip label="Uyarı" size="small" sx={{ height: 16, fontSize: 10, bgcolor: sc.badge, color: sc.badgeText, fontWeight: 700 }} />
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                          <Stack alignItems="flex-end" spacing={0}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: sc.bar, lineHeight: 1, fontSize: '1.3rem' }}>
                              {stat.km} km
                            </Typography>
                            <OpenInFullIcon className="vehicle-open-icon" sx={{ fontSize: 11, color: 'text.disabled', opacity: 0, transition: 'opacity 0.18s', mt: 0.25 }} />
                          </Stack>
                        </Stack>

                        {/* km progress bar */}
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{
                            height: 5, borderRadius: 99,
                            bgcolor: alpha(sc.bar, 0.12),
                            overflow: 'hidden',
                          }}>
                            <Box sx={{
                              height: '100%',
                              width: `${barPct}%`,
                              bgcolor: sc.bar,
                              borderRadius: 99,
                              transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                            }} />
                          </Box>
                        </Box>

                        {/* Meta row */}
                        <Stack direction="row" spacing={2}>
                          {[
                            { icon: RouteIcon, val: `${stat.trips} günlük özet` },
                            { icon: AccessTimeIcon, val: stat.time },
                            { icon: SpeedIcon, val: `${stat.maxSpeed} km/h` },
                          ].map(({ icon: Ic, val }) => (
                            <Stack key={val} direction="row" alignItems="center" spacing={0.4}>
                              <Ic sx={{ fontSize: 11, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{val}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled" sx={{ flex: 1 }}>
            {deviceStats.reduce((s, d) => s + d.km, 0).toLocaleString('tr-TR')} km toplam · {deviceStats.reduce((s, d) => s + d.trips, 0)} Özet
          </Typography>
          <Button onClick={onClose} size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Nested InsightDialog — opens when a vehicle card is clicked */}
      <InsightDialog
        open={Boolean(insightDialog)}
        onClose={() => setInsightDialog(null)}
        item={insightDialog}
        devices={devices}
        rawSummary={rawSummary}
        rawEvents={rawEvents}
      />
    </>
  );
};

// ─── INSIGHT CARD ────────────────────────────────────────────────────────────

const InsightCard = ({ item, onOpen }) => {
  const theme = useTheme();
  const c = COLOR_MAP[item.color] || COLOR_MAP.success;
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }} >
      <Card elevation={0} onClick={() => onOpen(item)} sx={{
        borderRadius: 3, border: '1px solid', borderColor: 'divider',
        height: '100%', cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: c.bar,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(c.bar, 0.15)}`,
          '& .open-icon': { opacity: 1 },
        },
      }}>
        <Box sx={{ height: 4, bgcolor: c.bar }} />
        <CardContent sx={{ pt: 1.5, pb: '12px !important' }}>
          <Box className="open-icon" sx={{ position: 'absolute', top: 12, right: 10, opacity: 0, transition: 'opacity 0.2s' }}>
            <OpenInFullIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          </Box>
          <Typography variant="caption" fontWeight={600} color="text.secondary"
            sx={{ display: 'block', mb: 0.5, fontSize: 11, letterSpacing: 0.3, pr: 2 }}>
            {item.title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ my: 0.5, color: c.bar, lineHeight: 1.1, fontSize: '1.6rem' }}>
            {item.value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.5 }}>
            {item.desc}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};

// ─── SKELETON CARD ───────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <LinearProgress sx={{ height: 4 }} />
      <CardContent>
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 12, width: '60%', mb: 1 }} />
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 32, width: '40%', mb: 1 }} />
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 12, width: '90%' }} />
      </CardContent>
    </Card>
  </Grid>
);

// ─── INSIGHT DETAIL DIALOG ────────────────────────────────────────────────────

const InsightDialog = ({ open, onClose, item, devices, rawSummary, rawEvents }) => {
  const [tab, setTab] = useState(0);

  const idFromAI = item?.deviceId || item?.deviceIds || null;
  const device = useMemo(() => devices.find(d => String(d.id) === String(idFromAI)), [devices, idFromAI]);
  const devTrips = useMemo(() => rawSummary.filter(t => String(t.deviceId) === String(idFromAI)), [rawSummary, idFromAI]);
  const devEvents = useMemo(() => rawEvents.filter(e => String(e.deviceId) === String(idFromAI)), [rawEvents, idFromAI]);

  const speedData = useMemo(() =>
    devTrips.map((t, i) => ({
      name: `#${i + 1}`,
      avg: Math.round((t.averageSpeed || 0) * 1.852),
      max: Math.round((t.maxSpeed || 0) * 1.852),
    })), [devTrips]);

  const eventBreakdown = useMemo(() => {
    const map = {};
    devEvents.forEach(e => {
      const label = EVENT_LABELS[e.type] || e.type;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [devEvents]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }));
    devEvents.forEach(e => {
      try {
        const h = new Date(new Date(e.eventTime).getTime()).getHours();
        hours[h].count++;
      } catch { /* skip */ }
    });
    return hours.filter(h => h.count > 0);
  }, [devEvents]);

  useEffect(() => { if (open) setTab(0); }, [open]);

  if (!item) return null;

  const c = COLOR_MAP[item.color] || COLOR_MAP.success;
  const totalDist = devTrips.reduce((s, t) => s + (t.distance || 0), 0);
  const totalTime = devTrips.reduce((s, t) => s + (t.duration || 0), 0);
  const overspeeds = devEvents.filter(e => e.type === 'deviceOverspeed').length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(c.bar, 0.04) }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: c.light, width: 38, height: 38 }}>
              <DirectionsCarIcon sx={{ fontSize: 18, color: c.bar }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {device?.name || `Cihaz ${idFromAI}`}
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c.bar }} />
                <Typography variant="caption" sx={{ color: c.bar, fontWeight: 600 }}>
                  {item.value} · {item.title.split(':').pop()?.trim()}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </Stack>

        <Grid container spacing={1.5}>
          {[
            { icon: RouteIcon, label: 'Toplam Mesafe', value: `${Math.round(totalDist / 1000)} km` },
            { icon: AccessTimeIcon, label: 'Sürüş Süresi', value: formatDuration(totalTime / 1000) },
            { icon: SpeedIcon, label: 'Hız Aşımı', value: `${overspeeds} kez` },
            { icon: RouteIcon, label: 'Günlük Özet', value: `${devTrips.length} adet` },
          ].map(({ icon: Ic, label, value }) => (
            <Grid size={{ xs: 6, sm: 3, md: 2 }} key={label}>
              <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{label}</Typography>
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>{value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        TabIndicatorProps={{ style: { backgroundColor: c.bar } }}>
        <Tab label="Grafikler" sx={{ textTransform: 'none', fontSize: 13 }} />
        <Tab label={`Günlük Özet (${devTrips.length})`} sx={{ textTransform: 'none', fontSize: 13 }} />
        <Tab label={`Olaylar (${devEvents.length})`} sx={{ textTransform: 'none', fontSize: 13 }} />
      </Tabs>

      <DialogContent sx={{ p: 0 }}>

        {/* TAB 0 — Charts */}
        {tab === 0 && (
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              {speedData.length > 0 && (
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ fontSize: 13 }}>
                      Hız Profili (Seyahat Bazlı)
                    </Typography>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={speedData} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit=" km/h" />
                        <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }}
                          formatter={(v, n) => [`${v} km/h`, n === 'avg' ? 'Ort. Hız' : 'Maks. Hız']} />
                        <Bar dataKey="avg" fill="#6366f1" radius={[3, 3, 0, 0]} name="avg" />
                        <Bar dataKey="max" fill={alpha('#ef4444', 0.7)} radius={[3, 3, 0, 0]} name="max" />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}

              {eventBreakdown.length > 0 && (
                <Grid size={{ xs: 12, md: speedData.length > 0 ? 5 : 12 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ fontSize: 13 }}>
                      Olay Dağılımı
                    </Typography>
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={eventBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                          paddingAngle={3} dataKey="value">
                          {eventBreakdown.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}

              {hourlyData.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ fontSize: 13 }}>
                      Saatlik Olay Dağılımı
                    </Typography>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => [v, 'Olay']} />
                        <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}

              {speedData.length === 0 && eventBreakdown.length === 0 && (
                <Grid size={{ xs: 12 }}>
                  <Box textAlign="center" py={6} sx={{ opacity: 0.4 }}>
                    <Typography variant="body2">Bu dönem için grafik verisi bulunamadı.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* TAB 1 — Trips */}
        {/* TAB 1 — Daily Summary */}
        {tab === 1 && (
          <TableContainer sx={{ maxHeight: 380 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Tarih', 'Mesafe', 'Ort. Hız', 'Maks. Hız', 'Motor Saati'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, bgcolor: 'background.paper' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {devTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.disabled', fontSize: 13 }}>
                      Bu dönemde özet verisi bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : [...devTrips]
                  .filter(t => t.distance > 0)
                  .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                  .map((t, i) => {
                    const maxKmh = Math.round((t.maxSpeed || 0) * 1.852);
                    const avgKmh = Math.round((t.averageSpeed || 0) * 1.852);
                    const distKm = Math.round((t.distance || 0) / 1000);
                    const engineH = t.engineHours ? formatDuration(t.engineHours / 1000) : '—';
                    const dateLabel = new Date(t.startTime).toLocaleDateString('tr-TR', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    });
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{dateLabel}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>
                          <Chip label={`${distKm} km`} size="small"
                            sx={{ height: 20, fontSize: 11, bgcolor: '#ede9fe', color: '#4c1d95' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{avgKmh} km/h</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>
                          <Typography component="span" sx={{
                            fontSize: 12,
                            color: maxKmh > 120 ? 'error.main' : 'text.primary',
                            fontWeight: maxKmh > 120 ? 700 : 400,
                          }}>
                            {maxKmh} km/h
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{engineH}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* TAB 2 — Events */}
        {tab === 2 && (
          <TableContainer sx={{ maxHeight: 380 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Zaman', 'Olay Tipi', 'Detay'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, bgcolor: 'background.paper' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {devEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.disabled', fontSize: 13 }}>
                      Bu dönemde olay kaydı bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...devEvents]
                    .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))
                    .map((e, i) => {
                      const isAlert = e.type === 'deviceOverspeed';
                      return (
                        <TableRow key={i} hover sx={isAlert ? { bgcolor: alpha('#ef4444', 0.04) } : {}}>
                          <TableCell sx={{ fontSize: 12 }}>{formatDateTime(e.eventTime)}</TableCell>
                          <TableCell>
                            <Chip label={EVENT_LABELS[e.type] || e.type} size="small" sx={{
                              height: 20, fontSize: 11,
                              bgcolor: isAlert ? '#fee2e2' : '#f3f4f6',
                              color: isAlert ? '#991b1b' : '#374151',
                              fontWeight: isAlert ? 700 : 400,
                            }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {e.type === 'deviceOverspeed' && e.attributes?.speed && e.attributes?.speedLimit
                              ? `${Math.round(e.attributes.speed * 1.852)} km/h / limit: ${Math.round(e.attributes.speedLimit * 1.852)} km/h`
                              : e.attributes?.alarm || e.attributes?.status || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.disabled" sx={{ flex: 1 }}>
          {devTrips.length} Günlük Özet · {devEvents.length} olay
        </Typography>
        <Button onClick={onClose} size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── OVERVIEW CHARTS ─────────────────────────────────────────────────────────

const OverviewCharts = ({ insights, rawSummary, rawEvents, devices }) => {
  const distByDevice = useMemo(() => {
    const map = {};
    rawSummary.forEach(t => {
      const dev = devices.find(d => String(d.id) === String(t.deviceId));
      const name = dev?.name || `#${t.deviceId}`;
      map[name] = (map[name] || 0) + Math.round((t.distance || 0) / 1000);
    });
    return Object.entries(map)
      .map(([name, dist]) => ({ name, dist }))
      .sort((a, b) => b.dist - a.dist)
      .slice(0, 8);
  }, [rawSummary, devices]);

  const eventTypes = useMemo(() => {
    const map = {};
    rawEvents.forEach(e => {
      const label = EVENT_LABELS[e.type] || e.type;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rawEvents]);

  const severityData = useMemo(() => [
    { name: 'Normal', value: insights.filter(i => i.color === 'success').length, fill: '#10b981' },
    { name: 'Uyarı', value: insights.filter(i => i.color === 'warning').length, fill: '#f59e0b' },
    { name: 'Kritik', value: insights.filter(i => i.color === 'error').length, fill: '#ef4444' },
  ].filter(d => d.value > 0), [insights]);

  if (rawSummary.length === 0 && rawEvents.length === 0) return null;

  return (
    <Box mb={3}>
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
        sx={{ mb: 2, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        Filo Genel Görünümü
      </Typography>
      <Grid container spacing={2}>

        {distByDevice.length > 0 && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: 250 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{ fontSize: 13 }}>
                Araç Bazlı Mesafe (km)
              </Typography>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={distByDevice} layout="vertical" barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} unit=" km" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
                  <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => [`${v} km`]} />
                  <Bar dataKey="dist" radius={[0, 4, 4, 0]}>
                    {distByDevice.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {eventTypes.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: 250 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ fontSize: 13 }}>Olay Türleri</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={eventTypes} cx="50%" cy="48%" outerRadius={72} paddingAngle={2} dataKey="value"
                    label={({ percent }) => percent > 0.08 ? `${Math.round(percent * 100)}%` : ''}
                    labelLine={false} fontSize={10}>
                    {eventTypes.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {severityData.length > 0 && (
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: 250 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={0.5} sx={{ fontSize: 13 }}>Durum Dağılımı</Typography>
              <ResponsiveContainer width="100%" height={160}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%"
                  data={severityData} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} dataKey="value" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <ReTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Stack direction="row" justifyContent="center" spacing={2} mt={0.5}>
                {severityData.map(d => (
                  <Box key={d.name} textAlign="center">
                    <Typography variant="h6" fontWeight={800} sx={{ color: d.fill, lineHeight: 1 }}>{d.value}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{d.name}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const ReportsMenuNewAIDetails = () => {
  const theme = useTheme();
  const chatEndRef = useRef(null);

  const [selectionType, setSelectionType] = useState('device');
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rangeType, setRangeType] = useState('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [insights, setInsights] = useState([]);
  const [isLoadingUI, setIsLoadingUI] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState(null);

  // Fleet distance dialog state
  const [fleetDistOpen, setFleetDistOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Sistem analize hazır. Araç veya grup seçerek analizi başlatabilirsiniz.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [rawSummaryState, setRawSummaryState] = useState([]);
  const [rawEventsState, setRawEventsState] = useState([]);

  const AI_API_URL = 'https://giris.takipon.com/api/ai';

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatOpen]);

  useEffect(() => {
    const init = async () => {
      try {
        const [devRes, grpRes] = await Promise.all([fetch('/api/devices'), fetch('/api/groups')]);
        const devData = await devRes.json();
        const grpData = await grpRes.json();
        setDevices(devData);
        setGroups(grpData);
        if (devData.length > 0 && devData.length < 10) setSelectedItems(devData);
      } catch (e) { console.error('Veri yükleme hatası:', e); }
      finally { setIsLoadingUI(false); }
    };
    init();
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('aiAnalysisCache');
    const cacheTime = localStorage.getItem('aiAnalysisCacheTime');
    const HOUR = 1000 * 60 * 60 * 72;
    if (cached && cacheTime && Date.now() - Number(cacheTime) < HOUR) {
      setInsights(JSON.parse(cached));
      const summary = localStorage.getItem('aiAnalysisSummary');
      if (summary) setChatHistory([{ role: 'ai', text: summary }]);
      const cachedSummary = localStorage.getItem('rawSummaryCache');
      const cachedEvents = localStorage.getItem('rawEventsCache');
      if (cachedSummary) setRawSummaryState(JSON.parse(cachedSummary));
      if (cachedEvents) setRawEventsState(JSON.parse(cachedEvents));
      setFilterOpen(false);
    } else {
      setFilterOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isLoadingUI || devices.length === 0 || insights.length > 0) return;
    if (localStorage.getItem('aiAnalysisCache')) return;
    const AUTO_HOUR = 1000 * 60 * 60;
    const lastRun = localStorage.getItem('autoAnalysisTimestamp');
    if ((!lastRun || Date.now() - Number(lastRun) > AUTO_HOUR) && selectedItems.length > 0) {
      localStorage.setItem('autoAnalysisTimestamp', String(Date.now()));
      handleStartAnalysis();
    }
  }, [isLoadingUI, devices, selectedItems]); // eslint-disable-line

  const handleStartAnalysis = async () => {
    if (selectedItems.length === 0) return;
    setIsAnalyzing(true);
    setInsights([]);
    try {
      const dates = rangeType === 'custom'
        ? { start: startDate + 'T00:00:00Z', end: endDate + 'T23:59:59Z' }
        : calculateDateRange(rangeType);

      const deviceIdsList = selectionType === 'device'
        ? selectedItems.map(i => i.id)
        : devices.filter(d => selectedItems.map(g => g.id).includes(d.groupId)).map(d => d.id);

      const eventQuery = deviceIdsList.map(id => `deviceId=${id}`).join('&');
      const tripQuery = selectionType === 'device'
        ? deviceIdsList.map(id => `deviceId=${id}`).join('&')
        : selectedItems.map(g => `groupId=${g.id}`).join('&');

      const [eventRes, tripRes] = await Promise.allSettled([
        fetch(`/api/reports/events?from=${dates.start}&to=${dates.end}&${eventQuery}`),
        fetch(`/api/reports/summary?from=${dates.start}&to=${dates.end}&${tripQuery}&daily=true`, { headers: { Accept: 'application/json' } }),
      ]);

      const rawEvents = eventRes.status === 'fulfilled' ? await eventRes.value.json() : [];
      const rawSummary = tripRes.status === 'fulfilled' ? await tripRes.value.json() : [];

      setRawEventsState(rawEvents);
      setRawSummaryState(rawSummary);
      localStorage.setItem('rawSummaryCache', JSON.stringify(rawSummary));
      localStorage.setItem('rawEventsCache', JSON.stringify(rawEvents));

      const payload = {
        model: 'gpt-4.1-mini',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Sen bir araç ve motosiklet filo takip uzmanısın. Türkçe yanıt ver. Ham veriler GMT+0 'a göredir. Sen yanıt üretirken türkiye zaman dilimine (GMT+3) göre yanıt ver.
trips içindeki her kayıtta category alanı vardır, bu araç tipini gösterir (örneğin "car" veya "motorcycle")
Events listesinde eğer Alarm varsa attribute alarnlarındaki;
-'powerCut' olan olay varsa Cihaz Akü Bağlantısı Sökülmüştür, Olası müdahale veya yetkisiz kullanım olabilir(Kritik).
-'lowPower' olayları aracın Akü sağlığı ile ilgili olabilir(uyarı).
-'vibration' olayları motosiklet gibi araçlarda gündüz saatlerinde  olağan karşılanabilir.
Titreşim alarmları genellikle aracın park halindeyken sarsıntı tespit ettiği durumları gösterir. Bu durum sabit bir nesneye çarpma, rüzgar etkisi veya başka bir dış faktörden kaynaklanıyor olabilir.
Birden fazla araç varsa, mümkünse her araç için en az 1 insight üret.
Summary Türkçe ve kısa olsun. olumlama yap genel olarak
Veriler:
Trips: dist(km), avg(km/h), max(km/h bu hız limiti değil), tripTime(DAKİKA), startTime, endTime
Events: type, time, attr (alarm veya status bilgisi), overspeed ise speed ve limit bilgisi
Mesafe, Avg, yolculukta ulaşılan max hız, yolculuk süresi ve araç tipine göre anlaşılır verimlilik yorumları yapabilirsin.
Her insight'a 'deviceId' ekle.
SADECE JSON: {"insights":[{"deviceId":"89","title":"BAŞLIK","value":"DEĞER","desc":"AÇIKLAMA","color":"success|warning|error"}],"summary":"Genel özet"}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              events: minimizeEventsForAI(rawEvents),
              trips: minimizeSummaryForAI(rawSummary, devices),
            }),
          },
        ],
        response_format: { type: 'json_object' },
      };

      const aiRes = await fetch(AI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const aiData = await aiRes.json();
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON parse error');
      const result = JSON.parse(jsonMatch[0]);

      const mappedInsights = result.insights.map(insight => {
        const idFromAI = insight.deviceId || insight.deviceIds;
        const device = devices.find(d => String(d.id) === String(idFromAI));
        return {
          ...insight,
          title: device ? `${device.name}: ${insight.title}` : `Cihaz ${idFromAI}: ${insight.title}`,
        };
      });

      setInsights(mappedInsights);
      localStorage.setItem('aiAnalysisCache', JSON.stringify(mappedInsights));
      localStorage.setItem('aiAnalysisCacheTime', String(Date.now()));
      localStorage.setItem('aiAnalysisSummary', result.summary || '');

      const humanSummary = replaceIdsWithNames(result.summary || 'Analiz tamamlandı.', devices);
      setChatHistory([{ role: 'ai', text: humanSummary }]);
      setFilterOpen(false);
    } catch (e) {
      console.error('Analiz hatası:', e);
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Analiz sırasında bir hata oluştu.' }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', text: msg }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const systemMsg = {
        role: 'system',
        content: `TakipOn asistanısın. SADECE şu verilere dayan:
insights: ${JSON.stringify(insights.map(i => ({ deviceId: i.deviceId, value: i.value, desc: i.desc })))}
events: ${JSON.stringify(minimizeEventsForAI(rawEventsState))}
trips: ${JSON.stringify(minimizeSummaryForAI(rawSummaryState, devices))}
Yanıtlarında belirli bir araçtan bahsetmen gerekirse cümle içinde [[deviceId]] veya [[170]] formatını kullan.
`,
      };
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1000,
          messages: [systemMsg, ...newHistory.map(h => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.text }))],
        }),
      });
      const data = await response.json();
      const raw = data.choices[0].message.content;
      const cleaned = replaceIdsWithNames(raw, devices);
      setChatHistory(prev => [...prev, { role: 'ai', text: cleaned }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Bir hata oluştu.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Fleet KPIs
  const totalDist = useMemo(() => rawSummaryState.reduce((s, t) => s + (t.distance || 0), 0), [rawSummaryState]);
  const totalTrips = rawSummaryState.length;
  const totalEvents = rawEventsState.length;
  const totalOverspd = rawEventsState.filter(e => e.type === 'deviceOverspeed').length;
  const hasCritical = insights.filter(i => i.color === 'error').length;

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'AI Analiz']}>
      <Container maxWidth="lg" sx={{ py: 3 }}>

        {/* ─── FILTER PANEL ─── */}
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box onClick={() => setFilterOpen(v => !v)} sx={{
            px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', bgcolor: filterOpen ? 'action.hover' : 'transparent',
            transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' },
          }}>

            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <TuneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={600}>Analiz Filtresi</Typography>
              {!filterOpen && selectedItems.slice(0, 3).map(item => (
                <Chip key={item.id} label={item.name} size="small" sx={{ height: 20, fontSize: 11 }} />
              ))}
              {!filterOpen && selectedItems.length > 3 && (
                <Chip label={`+${selectedItems.length - 3}`} size="small" sx={{ height: 20, fontSize: 11 }} />
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              {!filterOpen && insights.length > 0 && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" fontWeight={600}>Analiz hazır</Typography>
                </Stack>
              )}
              {filterOpen ? <ExpandLessIcon sx={{ color: 'text.secondary' }} /> : <ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
            </Stack>
          </Box>

          <Collapse in={filterOpen}>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 12, md: 5 }}>
                  <ToggleButtonGroup size="small" value={selectionType} exclusive color="primary" sx={{ mb: 1 }}
                    onChange={(_, val) => { if (val) { setSelectionType(val); setSelectedItems([]); } }}>
                    <ToggleButton value="device" sx={{ textTransform: 'none', fontSize: 12 }}>
                      <DirectionsCarIcon sx={{ mr: 0.75, fontSize: 15 }} />Araç
                    </ToggleButton>
                    <ToggleButton value="group" sx={{ textTransform: 'none', fontSize: 12 }}>
                      <GroupWorkIcon sx={{ mr: 0.75, fontSize: 15 }} />Grup
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Autocomplete multiple size="small"
                    options={selectionType === 'device' ? devices : groups}
                    getOptionLabel={o => o.name || ''} value={selectedItems}
                    onChange={(_, val) => setSelectedItems(val)} loading={isLoadingUI}
                    renderInput={params => (
                      <TextField {...params} placeholder={selectionType === 'device' ? 'Araç seçin...' : 'Grup seçin...'} />
                    )}
                    renderTags={(value, getTagProps) => value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip key={key} label={option.name} size="small" {...tagProps} sx={{ height: 22, fontSize: 11 }} />
                      );
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} >
                  <FormControl fullWidth size="small">
                    <InputLabel>Zaman Aralığı</InputLabel>
                    <Select value={rangeType} label="Zaman Aralığı" onChange={e => setRangeType(e.target.value)}>
                      <MenuItem value="today">Bugün</MenuItem>
                      <MenuItem value="yesterday">Dün</MenuItem>
                      <MenuItem value="last7">Son 7 Gün</MenuItem>
                      <MenuItem value="thisMonth">Bu Ay</MenuItem>
                      <MenuItem value="custom">Özel Tarih</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {rangeType === 'custom' && (
                  <>
                    <Grid size={{ xs: 6, sm: 3, md: 2 }} >
                      <TextField type="date" size="small" fullWidth label="Başlangıç"
                        InputLabelProps={{ shrink: true }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                      <TextField type="date" size="small" fullWidth label="Bitiş"
                        InputLabelProps={{ shrink: true }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </Grid>
                  </>
                )}
                <Grid size={{ xs: 12, md: rangeType === 'custom' ? 12 : 2 }}
                  sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
                  <Button variant="contained" onClick={handleStartAnalysis}
                    disabled={isAnalyzing || selectedItems.length === 0}
                    startIcon={isAnalyzing ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 15 }} />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40, px: 3 }}>
                    {isAnalyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
          {isAnalyzing && <LinearProgress sx={{ height: 2 }} />}
        </Paper>

        {/* ─── KPI CARDS ─── */}
        {(insights.length > 0 || isAnalyzing) && (
          <Grid container spacing={2} mb={3}>
            {isAnalyzing ? (
              [1, 2, 3, 4].map(i => (
                <Grid size={{ xs: 6, sm: 3 }} key={i}>
                  <KpiSkeleton />
                </Grid>
              ))
            ) : [
              {
                icon: RouteIcon,
                label: 'Toplam Mesafe / Detaylar için tıkla!',
                value: `${Math.round(totalDist / 1000)} km`,
                color: '#6366f1',
                // ↓ Toplam Mesafe kartına tıklanınca fleet dialog açılır
                onClick: rawSummaryState.length > 0 ? () => setFleetDistOpen(true) : undefined,
              },
              { icon: DirectionsCarIcon, label: 'Toplam Günlük Özet', value: `${totalTrips}`, color: '#10b981' },
              { icon: NotificationsActiveIcon, label: 'Toplam Olay', value: `${totalEvents}`, color: '#f59e0b' },
              { icon: SpeedIcon, label: 'Hız Aşımı', value: `${totalOverspd}`, color: '#ef4444' },
            ].map(({ icon, label, value, color, onClick }) => (
              <Grid size={{ xs: 6, sm: 3 }} key={label}>
                <KpiCard icon={icon} label={label} value={value} color={color} onClick={onClick} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* ─── OVERVIEW CHARTS ─── */}
        {!isAnalyzing && rawSummaryState.length > 0 && (
          <OverviewCharts insights={insights} rawSummary={rawSummaryState} rawEvents={rawEventsState} devices={devices} />
        )}
        <Typography variant="subtitle2" sx={{ fontSize: "9px" }} fontWeight={300}>Aşağıdaki yorumlar AI Asistanı tarafından oluşturulmaktadır. Yapay zeka yorumlarda hata yapabilir. Bu nedenle aşağıdaki yorumlara ilişkin sorumluluk firmamıza ait değildir. Yapay zekaya Araç plakası veya sürücü adı gibi bilgiler gönderilmez, veriler Anonim olarak işlenmektedir.</Typography>

        {/* ─── INSIGHT CARDS ─── */}
        {insights.length > 0 && !isAnalyzing && (
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Typography variant="subtitle2" color="text.secondary"
              sx={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
              AI İçgörüler
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="caption" color="text.secondary">{insights.length} sonuç</Typography>
            {hasCritical > 0 && (
              <Chip label={`${hasCritical} kritik`} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
            )}
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11, ml: 'auto !important' }}>
              Detay için karta tıklayın
            </Typography>
          </Stack>
        )}

        <Grid container spacing={2}>
          {isAnalyzing
            ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
            : insights.map((item, index) => <InsightCard key={index} item={item} onOpen={setDialogItem} />)
          }
        </Grid>

        {insights.length === 0 && !isAnalyzing && (
          <Box textAlign="center" py={12} sx={{ opacity: 0.25, userSelect: 'none' }}>
            <AutoAwesomeIcon sx={{ fontSize: 64, mb: 2, display: 'block', mx: 'auto' }} />
            <Typography variant="h6" fontWeight={600}>Analiz başlatmak için araç seçin</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Filtreden araç veya grup seçerek AI analizini başlatabilirsiniz.
            </Typography>
          </Box>
        )}
      </Container>

      {/* ─── FLEET DISTANCE DIALOG ─── */}
      <FleetDistDialog
        open={fleetDistOpen}
        onClose={() => setFleetDistOpen(false)}
        rawSummary={rawSummaryState}
        rawEvents={rawEventsState}
        devices={devices}
        insights={insights}
      />

      {/* ─── INSIGHT DETAIL DIALOG ─── */}
      <InsightDialog
        open={Boolean(dialogItem)}
        onClose={() => setDialogItem(null)}
        item={dialogItem}
        devices={devices}
        rawSummary={rawSummaryState}
        rawEvents={rawEventsState}
      />

      {/* ─── CHAT FAB ─── */}
      <Box sx={{ position: 'fixed', bottom: 64, right: 28, zIndex: 1300 }}>
        <Slide direction="up" in={isChatOpen} mountOnEnter unmountOnExit>
          <Paper elevation={8} sx={{
            width: { xs: '88vw', sm: 360 }, height: 460,
            display: 'flex', flexDirection: 'column',
            borderRadius: 3, overflow: 'hidden', mb: 2,
            border: '1px solid', borderColor: 'divider',
          }}>
            <Box sx={{
              px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                <Typography variant="subtitle2" fontWeight={700}> TakipOn Rapor Asistan</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setIsChatOpen(false)} sx={{ color: 'white', p: 0.5 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Box sx={{
              flex: 1, overflowY: 'auto', p: 1.5,
              display: 'flex', flexDirection: 'column', gap: 0.75, bgcolor: 'background.default'
            }}>
              {chatHistory.map((msg, i) => (
                <Box key={i} sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <Paper elevation={0} sx={{
                    p: '8px 12px', borderRadius: 2.5,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    border: '1px solid',
                    borderColor: msg.role === 'user' ? 'primary.main' : 'divider',
                  }}>
                    <Typography variant="body2" sx={{ fontSize: 13, lineHeight: 1.5 }}>{msg.text}</Typography>
                  </Paper>
                </Box>
              ))}
              {isChatLoading && (
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Paper elevation={0} sx={{ p: '8px 12px', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {[0, 1, 2].map(i => (
                        <Box key={i} sx={{
                          width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled',
                          animation: 'typing 1.4s infinite', animationDelay: `${i * 0.2}s`,
                          '@keyframes typing': { '0%,80%,100%': { opacity: 0.3 }, '40%': { opacity: 1 } },
                        }} />
                      ))}
                    </Stack>
                  </Paper>
                </Box>
              )}
              <div ref={chatEndRef} />
            </Box>

            <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <TextField fullWidth size="small" value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleAskAI()}
                placeholder="Soru sorun..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                InputProps={{
                  endAdornment: (
                    <IconButton size="small" onClick={handleAskAI}
                      disabled={!chatInput.trim() || isAnalyzing} sx={{ color: 'primary.main' }}>
                      <SendIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </Paper>
        </Slide>

        <Tooltip title="AI Asistan" placement="left">
          <Badge badgeContent={hasCritical || 0} color="error" max={9}>
            <Fab color="primary" size="medium" onClick={() => setIsChatOpen(v => !v)}
              sx={{ boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}` }}>
              <AutoAwesomeIcon />
            </Fab>
          </Badge>
        </Tooltip>
      </Box>
    </PageLayout>
  );
};

export default ReportsMenuNewAIDetails;