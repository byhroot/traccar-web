import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Typography, Card, CardContent, Box, Grid, Chip, Tooltip,
  Dialog, DialogTitle, IconButton,DialogContent, Badge, List, ListItem,ListItemText,Slide,CardActionArea
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from '../reports/components/ReportsMenu';
import EventListCard from './EventListCard';
import SpeedListCard from './SpeedListCard';
import GeofenceListCard from './GeofenceListCard';
import AlertListCard from './AlertListCard';
import PackageStatusCard from './PackageStatusCard';
import DashboardChartsCard from './DashboardChartsCard'

import { ShoppingCart as ShoppingCartIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBox as AccountBoxIcon,
  Announcement as AnnouncementIcon,
  Wifi as WifiIcon,
  Speed as SpeedIcon,
  WifiTetheringError as WifiTetheringErrorIcon,
  Map as MapIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { useTranslation } from '../common/components/LocalizationProvider';
import CloseIcon from '@mui/icons-material/Close';

const Dashboard = () => {
  const theme = useTheme();
  const isSM = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector((state) => state.session.user);
  const [attributes] = useState(user.attributes);
  const statuscarddisabled = attributes.statuscarddisabled;
  
  const t = useTranslation();
  const navigate = useNavigate();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [deviceDetails, setDeviceDetails] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsSpeed, setEventsSpeed] = useState([]);
  const [eventsGeofenceExit, setEventsGeofenceExit] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [motionCountTrue, setMotionCountTrue] = useState(0);
  const [motionCountFalse, setMotionCountFalse] = useState(0);
  const [expandedAlert, setExpandedAlert] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDevices, setDialogDevices] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);

  const COLORS = [theme.palette.primary.main, theme.palette.grey[300]];
// 1️⃣ Sadece cihaz listesini çeken fonksiyon (sayfa açılışında bir kez)
const fetchDevices = async () => {
  try {
    const res = await fetch('/api/devices');
    if(!res.ok) throw Error(await res.text());
    const data = await res.json();
    setDeviceDetails(data);
    setOnlineCount(data.filter(d=>d.status==='online').length);
    setOfflineCount(data.filter(d=>d.status!=='online').length);
    setMotionCountTrue(data.filter(d=>d.status==='online' && d.motionState===true).length);
    setMotionCountFalse(data.filter(d=>d.status!=='online' || d.motionState!==true).length);
    return data; // <-- burada data return et
  } catch(err){ console.error(err); return []; }
};


// 2️⃣ Sadece eventleri çeken fonksiyon (interval ile yenilenebilir)
const fetchEvents = async (devicesList = deviceDetails) => {
  if(!devicesList || devicesList.length === 0) return;
  try {
    const now = new Date();
    const from = new Date(now - 2*24*60*60*1000).toISOString();
    const to = now.toISOString();
    const params = new URLSearchParams({ from, to });
    devicesList.forEach(d=>params.append('deviceId', d.id));
    ['alarm', 'deviceInactive', 'deviceMoving', 'deviceStopped',
    'deviceOverspeed', 'deviceFuelDrop', 'geofenceEnter', 'geofenceExit',
    'ignitionOn', 'ignitionOff', 'maintenance', 'driverChanged'].forEach(type=>params.append('type',type));

    const eventsRes = await fetch(`/api/reports/events?${params.toString()}`);
    if(!eventsRes.ok) throw Error(await eventsRes.text());
    const merged = await eventsRes.json();
    merged.sort((a,b)=>new Date(b.eventTime)-new Date(a.eventTime));
    setEvents(merged.slice(0,50));
    setEventsSpeed(merged.filter(e=>e.type==='deviceOverspeed'));
    setEventsGeofenceExit(merged.filter(e=>e.type==='geofenceExit'));
  } catch(err){ console.error(err); }
};

// useEffect ile uygulama
useEffect(() => {
  fetchDevices().then(data => fetchEvents(data)); // devices yüklendikten sonra events
  const interval = setInterval(() => fetchEvents(deviceDetails), 10000);
  return () => clearInterval(interval);
}, []);

  const KPIData = [
    {title: "Online", value:onlineCount, icon:WifiIcon, color:"green", data:deviceDetails.filter(d=>d.status==='online')},
    {title: "Offline", value:offlineCount, icon:WifiTetheringErrorIcon, color:"gray", data:deviceDetails.filter(d=>d.status!=='online')},
    {title: t("positionMotion"), value:motionCountTrue, icon:SpeedIcon, color:"blue", data:deviceDetails.filter(d=>d.status==='online' && d.motionState===true)},
    {title: "Park", value:motionCountFalse, icon:SpeedIcon, color:"orange", data:deviceDetails.filter(d=>d.status!=='online' || d.motionState!==true)},
    {title: t("eventDeviceOverspeed"), value:eventsSpeed.length, icon:WifiTetheringErrorIcon, color:"red", data:eventsSpeed},
    {title: t("eventGeofenceExit"), value:eventsGeofenceExit.length, icon:MapIcon, color:"purple", data:eventsGeofenceExit},
  ];

  const handleKpiClick = (title, data) => {
    if (!data || data.length === 0) return;
    setDialogTitle(title);

    if (title === t("eventDeviceOverspeed") || title === t("eventGeofenceExit")) {
      const counts = {};
      data.forEach(e => { counts[e.deviceId] = (counts[e.deviceId] || 0) + 1; });
      const groupedData = Object.entries(counts).map(([deviceId, count]) => {
        const device = deviceDetails.find(d => d.id === parseInt(deviceId));
        return { id: deviceId, name: device?.name || `Cihaz ${deviceId}`, count };
      });
      setDialogDevices(groupedData);
    } else {
      setDialogDevices(data);
    }

    setDialogOpen(true);
  };

  const CardWrapper = ({children, onClick}) => (
    <Card sx={{
      p:2, borderRadius:3, boxShadow:'0 6px 18px rgba(0,0,0,0.12)',
      mb:2, cursor: onClick?'pointer':'default',
      transition:'all 0.3s ease-in-out',
      backgroundColor: theme.palette.background.paper,
      '&:hover': { transform: onClick?'translateY(-3px) scale(1.03)':'none', boxShadow:'0 10px 25px rgba(0,0,0,0.15)'}
    }} onClick={onClick}>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle','mainpageTitle']}>
      <Box position="relative" pt={1}>
        {/* Üst sağ simgeler */}
        <Box position="absolute" top={10} right={16} zIndex={10} display="flex" gap={1}>
        {!statuscarddisabled && 
        <Badge color="success" variant="dot">
          <AccountBoxIcon sx={{ fontSize: 40, color: theme.palette.primary.main, cursor: 'pointer' }}
            onClick={()=>setPackageDialogOpen(true)} />
        </Badge>
        }
        {!statuscarddisabled && 
          <ShoppingCartIcon sx={{ fontSize: 40, color: theme.palette.primary.main, cursor: 'pointer' }}
            onClick={()=>navigate('/settings/paymentpage')} />
          }
        </Box>
      <Grid item xs={12} container spacing={2} mt={3} mb={2} justifyContent="center">
          <Grid item xs={12}>
          {/* Alerts */}
          {!statuscarddisabled && 
              <CardContent sx={{
                borderRadius: 3,
                background: theme.palette.background.paper,
                boxShadow: 3,
              }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Badge onClick={()=>setExpandedAlert(!expandedAlert)} color="error" variant="dot" invisible={events.length===0}>
                  <AnnouncementIcon sx={{fontSize:32, color:theme.palette.primary.main}}/>
                </Badge>
                <Typography onClick={()=>setExpandedAlert(!expandedAlert)} variant="h6">
                  {`${t("reportCustom")} ${t("sharedNotifications")}`}
                </Typography>
                {expandedAlert ? <ExpandLessIcon onClick={()=>setExpandedAlert(!expandedAlert)}/> 
                              : <ExpandMoreIcon onClick={()=>setExpandedAlert(!expandedAlert)}/>}
              </Box>
              {expandedAlert && <AlertListCard deviceDetails={deviceDetails} />}
              </CardContent>

            }
            </Grid>
            { /* KPI Kartları - Modern Tema */}
          <Grid  mt={0} container spacing={1.5}>
            {KPIData.map((kpi, index) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} xl={2} key={kpi.title}>
                  <Card
                    onClick={() => handleKpiClick(kpi.title, kpi.data)}
                    sx={{
                      height: 140,
                      borderRadius: 4,
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      background: theme.palette.background.paper,
                      boxShadow: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
                    }}
                  >
                    <CardActionArea sx={{ height: '100%' }}>
                      <CardContent
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          gap: 1,
                        }}
                      >
                        {/* KPI Icon */}
                        <Grid
                          container
                          alignItems="center"
                          justifyContent="center"
                          spacing={1} // 🔹 ikon ve değer arasında boşluk
                        >
                          <Grid item>
                            <Tooltip title={kpi.title}>
                              <kpi.icon sx={{ fontSize: 35, color: kpi.color }} />
                            </Tooltip>
                          </Grid>

                          <Grid item>
                            <Typography variant="h5" fontWeight="bold">
                              {kpi.value || 0}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* KPI Title */}
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'bold',
                            color: '#fff',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            backgroundColor: kpi.color,
                          }}
                        >
                          {kpi.title}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
              </Grid>
            ))}
          </Grid>


          <Grid item xs={12} sm={12} md={12} lg={12}>
            <DashboardChartsCard devices={deviceDetails} />
          </Grid>

<Grid container spacing={1} mt={5} justifyContent="center">
  <Grid item xs={6} sm={6} md={5} lg={4}>
    <CardWrapper onClick={() => handleKpiClick(t("eventDeviceOverspeed"), eventsSpeed)}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <WifiTetheringErrorIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }, // 👈 mobilde küçük, desktopta normal
            fontWeight: 600,
          }}
        >
          {t("eventDeviceOverspeed")}
        </Typography>
      </Box>
      <SpeedListCard deviceDetails={deviceDetails} eventsSpeed={eventsSpeed} />
    </CardWrapper>
  </Grid>

  <Grid item xs={6} sm={6} md={5} lg={4}>
    <CardWrapper onClick={() => handleKpiClick(t("eventGeofenceExit"), eventsGeofenceExit)}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <MapIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
            fontWeight: 600,
          }}
        >
          {t("eventGeofenceExit")}
        </Typography>
      </Box>
      <GeofenceListCard deviceDetails={deviceDetails} eventsGeofenceExit={eventsGeofenceExit} />
    </CardWrapper>
  </Grid>
</Grid>




          {/* Son 10 Event */}
          <Grid item xs={12} sm={12} md={8} lg={6}>
            <CardWrapper onClick={()=>setExpandedEvents(!expandedEvents)}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <NotificationsActiveIcon sx={{fontSize:32, color:theme.palette.primary.main}}/>
                <Typography variant="h6">{t("last10event")}</Typography>
                {expandedEvents ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
              </Box>
              {expandedEvents && <EventListCard events={events} deviceDetails={deviceDetails}/>}
            </CardWrapper>
          </Grid>

        </Grid>

        {/* Dialoglar */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
  <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
    {dialogTitle}
    <IconButton
      aria-label="close"
      onClick={() => setDialogOpen(false)}
      sx={{ color: theme.palette.grey[500] }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
          <DialogContent>
            {dialogDevices.length > 0 ? (
              <List>
                {dialogDevices.map(device => (
                  <ListItem key={device.id}>
                    <ListItemText
                      primary={device.name}
                      secondary={
                        device.count 
                          ? `İhlal Sayısı: ${device.count}` 
                          : `Durum: ${device.status || "-"}`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography align="center">Cihaz bulunamadı</Typography>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={packageDialogOpen} onClose={()=>setPackageDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>{t("settingsUser")} {t("positionStatus")}</DialogTitle>
          <DialogContent>
            <PackageStatusCard />
          </DialogContent>
        </Dialog>

      </Box>
    </PageLayout>
  );
};

export default Dashboard;
