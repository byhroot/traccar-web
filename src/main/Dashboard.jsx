import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import {
  Typography, Card, Box, Grid, Chip,
  Dialog, DialogTitle, IconButton, DialogContent, Badge, List, ListItem, ListItemText, CardActionArea, Divider, useTheme, useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Announcement as AnnouncementIcon,
  Wifi as WifiIcon,
  Speed as SpeedIcon,
  WifiTetheringError as WifiTetheringErrorIcon,
  Map as MapIcon,
  NotificationsActive as NotificationsActiveIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import PageLayout from '../common/components/PageLayout';
import ReportsMenu from '../reports/components/ReportsMenu';
import EventListCard from './EventListCard';
import SpeedListCard from './SpeedListCard';
import GeofenceListCard from './GeofenceListCard';
import AlertListCard from './AlertListCard';
import DashboardChartsCard from './DashboardChartsCard';
import { useTranslation } from '../common/components/LocalizationProvider';

const Dashboard = () => {
  const theme = useTheme();
  const t = useTranslation();
  const navigate = useNavigate();

  const user = useSelector((state) => state.session.user);
  const { statuscarddisabled } = user.attributes || {};

  const [deviceDetails, setDeviceDetails] = useState([]);
  const deviceDetailsRef = useRef([]); // Interval içinde stale closure önlemek için

  const [events, setEvents] = useState([]);
  const [expandedAlert, setExpandedAlert] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState({ title: '', devices: [] });

  // 1️⃣ Cihazları Getir
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices');
      if (res.ok) {
        const data = await res.json();
        setDeviceDetails(data);
        deviceDetailsRef.current = data;
        return data;
      }
    } catch (err) { console.error("Device fetch error:", err); }
    return [];
  }, []);

  // 2️⃣ Eventleri Getir (Cihaz listesini parametre olarak alır veya Ref'ten okur)
  const fetchEvents = useCallback(async (currentDevices) => {
    const list = currentDevices || deviceDetailsRef.current;
    if (!list || list.length === 0) return;

    try {
      const now = new Date();
      const from = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();
      const params = new URLSearchParams({ from, to });

      list.forEach(d => params.append('deviceId', d.id));
      ['alarm', 'deviceInactive', 'deviceMoving', 'deviceStopped',
        'deviceOverspeed', 'deviceFuelDrop', 'geofenceEnter', 'geofenceExit',
        'ignitionOn', 'ignitionOff', 'maintenance', 'driverChanged'].forEach(type => params.append('type', type));

      const res = await fetch(`/api/reports/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime)));
      }
    } catch (err) { console.error("Event fetch error:", err); }
  }, []);

  useEffect(() => {
    fetchDevices().then(data => fetchEvents(data));
    const interval = setInterval(() => fetchEvents(), 10000); // 10 saniyede bir güncel cihaz listesiyle çek
    return () => clearInterval(interval);
  }, [fetchDevices, fetchEvents]);

  // 3️⃣ Verileri Parçala (Memoize ederek gereksiz filtreleme işlemlerini engelliyoruz)
  const eventsSpeed = useMemo(() => events.filter(e => e.type === 'deviceOverspeed'), [events]);
  const eventsGeofenceExit = useMemo(() => events.filter(e => e.type === 'geofenceExit'), [events]);

  const kpiStats = useMemo(() => [
    { title: "Online", value: deviceDetails.filter(d => d.status === 'online').length, icon: WifiIcon, color: theme.palette.success.main, data: deviceDetails.filter(d => d.status === 'online') },
    { title: "Offline", value: deviceDetails.filter(d => d.status !== 'online').length, icon: WifiTetheringErrorIcon, color: theme.palette.grey[500], data: deviceDetails.filter(d => d.status !== 'online') },
    { title: t("positionMotion"), value: deviceDetails.filter(d => d.status === 'online' && d.motionState).length, icon: SpeedIcon, color: theme.palette.info.main, data: deviceDetails.filter(d => d.status === 'online' && d.motionState) },
    { title: "Park", value: deviceDetails.filter(d => d.status !== 'online' || !d.motionState).length, icon: SpeedIcon, color: theme.palette.warning.main, data: deviceDetails.filter(d => d.status !== 'online' || !d.motionState) },
    { title: t("eventDeviceOverspeed"), value: eventsSpeed.length, icon: WifiTetheringErrorIcon, color: theme.palette.error.main, data: eventsSpeed },
    { title: t("eventGeofenceExit"), value: eventsGeofenceExit.length, icon: MapIcon, color: theme.palette.secondary.main, data: eventsGeofenceExit },
  ], [deviceDetails, eventsSpeed, eventsGeofenceExit, t, theme]);

  const handleKpiClick = (title, data) => {
    if (!data?.length) return;
    let finalData = data;
    if (title === t("eventDeviceOverspeed") || title === t("eventGeofenceExit")) {
      const counts = {};
      data.forEach(e => { counts[e.deviceId] = (counts[e.deviceId] || 0) + 1; });
      finalData = Object.entries(counts).map(([id, count]) => ({
        id, name: deviceDetails.find(d => d.id === parseInt(id))?.name || `Cihaz ${id}`, count
      }));
    }
    setDialogData({ title, devices: finalData });
    setDialogOpen(true);
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'mainpageTitle']}>
      <Box sx={{ p: { xs: 0.5, md: 2 } }}>

        {/* 🔔 Uyarılar (Daha ince tasarım) */}
        {!statuscarddisabled && (
          <Card sx={{ mb: 2, borderRadius: 3, p: 1, '&:last-child': { pb: 1 } }} elevation={2}>
            <Box
              display="flex" alignItems="center" justifyContent="space-between"
              onClick={() => setExpandedAlert(!expandedAlert)} sx={{ cursor: 'pointer', px: 1 }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Badge color="error" variant="dot" invisible={events.length === 0}>
                  <AnnouncementIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                </Badge>
                <Typography variant="subtitle2" fontWeight={700}>
                  {`${t("reportCustom")} ${t("sharedNotifications")}`}
                </Typography>
              </Box>
              {expandedAlert ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
            {expandedAlert && (
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ mb: 1, opacity: 0.5 }} />
                <AlertListCard deviceDetails={deviceDetails} />
              </Box>
            )}
          </Card>
        )}

        {/* 📊 KPI Kartları */}
        <Grid container justifyContent="center" spacing={1} mb={2}>
          {kpiStats.filter(kpi => kpi.value > 0).map((kpi) => (
            <Grid item xs={4} sm={4} md={2} key={kpi.title}>
              <Card sx={{ minWidth: "80px", borderRadius: 3, boxShadow: 1, transition: '0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
                <CardActionArea onClick={() => handleKpiClick(kpi.title, kpi.data)} sx={{ p: 1.5, textAlign: 'center' }}>
                  <kpi.icon sx={{ color: kpi.color, fontSize: 30, mb: 0.5 }} />
                  <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1 }}>{kpi.value}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                    {kpi.title}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 📈 Grafik Kartı */}
        <Box sx={{ mb: 2 }}>
          <DashboardChartsCard devices={deviceDetails} />
        </Box>

        {/* ⚠️ Detaylı İhlal Listeleri */}
        <Grid container spacing={2} mt={2} justifyContent="center">
          {/* Overspeed Kartı */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <Card sx={{ mb: 2, borderRadius: 3, p: 1, '&:last-child': { pb: 1 } }} elevation={2}>
              {/* Kart Header - Her zaman görünür */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: theme.palette.primary.dark,
                  color: '#fff',
                  borderRadius: eventsSpeed.length > 0 ? 'inherit' : 2, // Veri yoksa köşeleri yumuşat
                }}
              >
                <WifiTetheringErrorIcon sx={{ fontSize: 30 }} />
                <Typography variant="h7" sx={{ fontWeight: 600, textAlign: 'center', flex: 1, ml: 0 }}>
                  {t("eventDeviceOverspeed")}
                </Typography>
                <Chip
                  label={eventsSpeed.length}
                  color="secondary"
                  sx={{ fontWeight: 'bold', ml: 1 }}
                />
              </Box>

              {/* Kart İçerik - Sadece veri varsa görünür */}
              {eventsSpeed.length > 0 && (
                <Box sx={{ p: 2, minHeight: 100, backgroundColor: theme.palette.main }}>
                  <SpeedListCard deviceDetails={deviceDetails} eventsSpeed={eventsSpeed} />
                </Box>
              )}
            </Card>
          </Grid>

          {/* Geofence Exit Kartı */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <Card sx={{ mb: 2, borderRadius: 3, p: 1, '&:last-child': { pb: 1 } }} elevation={2}>
              {/* Kart Header - Her zaman görünür */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: theme.palette.primary.dark,
                  color: '#fff',
                  borderRadius: eventsGeofenceExit.length > 0 ? 'inherit' : 2,
                }}
              >
                <MapIcon sx={{ fontSize: 30 }} />
                <Typography variant="h7" sx={{ fontWeight: 600, textAlign: 'center', flex: 1, ml: 0 }}>
                  {t("eventGeofenceExit")}
                </Typography>
                <Chip
                  label={eventsGeofenceExit.length}
                  color="secondary"
                  sx={{ fontWeight: 'bold', ml: 1 }}
                />
              </Box>

              {/* Kart İçerik - Sadece veri varsa görünür */}
              {eventsGeofenceExit.length > 0 && (
                <Box sx={{ p: 2, minHeight: 100, backgroundColor: theme.palette.main }}>
                  <GeofenceListCard deviceDetails={deviceDetails} eventsGeofenceExit={eventsGeofenceExit} />
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* 🕒 Son 10 Aktivite */}
        <Card sx={{ borderRadius: 3 }} elevation={2}>
          <CardActionArea onClick={() => setExpandedEvents(!expandedEvents)} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1.5}>
                <NotificationsActiveIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>{t("last10event")}</Typography>
              </Box>
              {expandedEvents ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardActionArea>
          {expandedEvents && (
            <Box sx={{ p: 2, pt: 0 }}>
              <EventListCard events={events.slice(0, 20)} deviceDetails={deviceDetails} />
            </Box>
          )}
        </Card>
      </Box>

      {/* 📱 Detay Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={800}>{dialogData.title}</Typography>
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List disablePadding>
            {dialogData.devices.map((device, idx) => (
              <ListItem key={idx} sx={{ borderBottom: '1px solid #eee' }}>
                <ListItemText
                  primary={<Typography fontWeight={700}>{device.name}</Typography>}
                  secondary={device.count ? `İhlal Sayısı: ${device.count}` : `Durum: ${device.status || "-"}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Dashboard;