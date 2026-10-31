import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Grid, Button, Snackbar, Alert, Dialog, DialogActions,
  DialogContent, DialogTitle, Box, IconButton, CircularProgress, Backdrop,
  Stack, Typography, Paper, Avatar, ButtonBase, Slider, TextField, MenuItem,
  DialogContentText, Divider, Chip,
  useTheme
} from '@mui/material';

// --- İKONLAR ---
// Kategori
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PetsIcon from '@mui/icons-material/Pets';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import FlightIcon from '@mui/icons-material/Flight';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PersonIcon from '@mui/icons-material/Person';
import SailingIcon from '@mui/icons-material/Sailing';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import RvHookupIcon from '@mui/icons-material/RvHookup';
import TrainIcon from '@mui/icons-material/Train';
import TramIcon from '@mui/icons-material/Tram';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MopedIcon from '@mui/icons-material/Moped';

// Genel & Veri İkonları
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import MapIcon from '@mui/icons-material/Map';
import BuildIcon from '@mui/icons-material/Build';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import EditIcon from '@mui/icons-material/Edit';
import SpeedIcon from '@mui/icons-material/Speed';
import KeyIcon from '@mui/icons-material/Key';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExploreIcon from '@mui/icons-material/Explore';
import HeightIcon from '@mui/icons-material/Height';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import TimelineIcon from '@mui/icons-material/Timeline';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
// Utils & Components
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import DeviceBakimNotlariCard from '../common/components/DeviceBakimNotlariCard';
import DeviceMaintenanceCard from '../common/components/DeviceMaintenanceCard';
import DriverCard from '../common/components/DriverCard';
import LinkField from '../common/components/LinkField';
import InsuranceCard from '../common/components/InsuranceCard';
import deviceCategories from '../common/util/deviceCategories';
import DeviceGeofenceCard from '../common/components/DeviceGeofenceCard';


const getCategoryIcon = (category) => {
  const iconMap = {
    animal: <PetsIcon />, bicycle: <DirectionsBikeIcon />, boat: <DirectionsBoatIcon />,
    bus: <DirectionsBusIcon />, car: <DirectionsCarIcon />, camper: <AirportShuttleIcon />,
    crane: <PrecisionManufacturingIcon />, helicopter: <FlightIcon />, motorcycle: <TwoWheelerIcon />,
    person: <PersonIcon />, plane: <FlightIcon />, ship: <SailingIcon />, tractor: <AgricultureIcon />,
    trailer: <RvHookupIcon />, train: <TrainIcon />, tram: <TramIcon />, truck: <LocalShippingIcon />,
    van: <AirportShuttleIcon />, scooter: <MopedIcon />, default: <DirectionsCarIcon />
  };
  return iconMap[category] || iconMap.default;
};

// Tarih Formatlayıcı
const formatTime = (timeString) => {
  if (!timeString) return '--';
  const d = new Date(timeString);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const CommandDevicePageUsers = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { id } = useParams();
  const admin = useAdministrator();
  const limitCommands = useRestriction('limitCommands');
  const theme = useTheme();
  const colors = {
    primary: '#00adb5',
    secondary: '#777777',
    gradient: 'linear-gradient(135deg, #00adb5 0%, #222831 100%)',
    cardBg: 'rgba(255,255,255,0.1)'
  };
  const user = useSelector((state) => state.session.user);

  const Servis = user?.attributes?.servis === true;

  const [deviceData, setDeviceData] = useState(null);
  const [position, setPosition] = useState(null);
  const [groupName, setGroupName] = useState('--');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Blokaj Sistemi State'leri
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState('');

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [geofenceOpen, setGeofenceOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [vibrationOpen, setVibrationOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);

  const [editForm, setEditForm] = useState({ speedLimit: '', contact: '', category: 'default' });
  const [sensorLevel, setSensorLevel] = useState('5');

  const fetchAddress = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { 'Accept-Language': 'tr' } });
      const data = await res.json();
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const devRes = await fetch(`/api/devices/${id}`);
      const dev = await devRes.json();
      setDeviceData(dev);
      setEditForm({
        speedLimit: dev.attributes?.speedLimit ? (dev.attributes.speedLimit * 1.852).toFixed(0) : '',
        contact: dev.contact || '',
        category: dev.category || 'default'
      });
      if (dev.attributes?.alarmSensorlevel) setSensorLevel(dev.attributes.alarmSensorlevel.toString());

      // Grup Bilgisini Çek
      if (dev.groupId) {
        const grpRes = await fetch(`/api/groups`);
        const groups = await grpRes.json();
        const found = groups.find(g => g.id === dev.groupId);
        if (found) setGroupName(found.name);
      }

      if (dev.positionId) {
        const posRes = await fetch(`/api/positions?id=${dev.positionId}`);
        const posData = await posRes.json();
        if (posData.length > 0) {
          setPosition(posData[0]);
          fetchAddress(posData[0].latitude, posData[0].longitude);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const getDialogMessage = (command) => {
    switch (command) {
      case 'engineStop':
        return t('blokajUyari') || 'Motor blokajı uygulamak üzeresiniz. Lütfen aracın güvenli bir hızda veya park halinde olduğundan emin olun.';
      case 'engineResume':
        return t('genelUyari') || 'Motor blokajını kaldırmak üzeresiniz. Onaylıyor musunuz?';
      case 'positionSingle':
        return t('tekKonumAcilama') || 'Tek konum isteği gönderilecek.';
      case 'customCommand':
        return t('ozelKomutAciklama') || 'Özel komut gönderilecek.';
      default:
        return t('genelUyari') || 'Bu işlemi onaylıyor musunuz?';
    }
  };

  const handleSendCommand = useCatch(async (commandType) => {
    const command = {
      deviceId: parseInt(id, 10),
      type: commandType,
      attributes: {},
      textChannel: false,
    };

    if (commandType === 'alarmVibrationlevel') {
      command.attributes.alarmSensorlevel = sensorLevel;
    }

    const response = await fetch('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const updatedAttributes = { ...deviceData.attributes };

    if (commandType === 'engineStop') {
      updatedAttributes.blockedDevice = true;
    }
    if (commandType === 'engineResume') {
      updatedAttributes.blockedDevice = false;
    }
    if (commandType === 'alarmArm') {
      updatedAttributes.alarmVibration = true;
    }
    if (commandType === 'alarmDisarm') {
      updatedAttributes.alarmVibration = false;
    }
    if (commandType === 'alarmVibrationlevel') {
      updatedAttributes.alarmSensorlevel = sensorLevel;
    }

    const updatedDevice = { ...deviceData, attributes: updatedAttributes };

    const updateResponse = await fetch(`/api/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice),
    });

    if (!updateResponse.ok) {
      throw new Error(await updateResponse.text());
    }

    // Ekranı güncelle
    setDeviceData(updatedDevice);
    setSnackbarOpen(true);
  });

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (selectedCommand) {
      try {
        setLoading(true);
        await handleSendCommand(selectedCommand);
        if (selectedCommand === 'engineStop') {
          setTimeout(() => navigate('/'), 1500);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const BlokajKitDurumu = deviceData?.attributes?.blokajkiti

  const handleUpdateDevice = useCatch(async () => {
    const updated = {
      ...deviceData, contact: editForm.contact, category: editForm.category,
      attributes: { ...deviceData.attributes, speedLimit: editForm.speedLimit ? parseFloat((parseFloat(editForm.speedLimit) / 1.852).toFixed(2)) : null }
    };
    const res = await fetch(`/api/devices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    if (res.ok) { setSnackbarOpen(true); setEditOpen(false); fetchData(); }
  });

  // Dinamik Buton Listesi (KARTLAR DAHA GENİŞ YAPILDI xs={6} sm={6})
  const actionButtons = [
    {
      label: t("positionBlocked"),
      icon: <PowerSettingsNewIcon sx={{ fontSize: 32 }} />,
      color: deviceData?.attributes?.blockedDevice ? '#e53935' : colors.primary,
      desc: !deviceData?.attributes?.blokajkiti ? t("blokajaciklama") : deviceData?.attributes?.blockedDevice ? t("alarmPowerOn") : t("alarmPowerOff"),
      disabled: !deviceData?.attributes?.blokajkiti || limitCommands,
      action: () => {
        setSelectedCommand(deviceData?.attributes?.blockedDevice ? 'engineResume' : 'engineStop');
        setConfirmOpen(true);
      }
    },
    { label: t("sharedNotifications"), disabled: Servis, icon: <NotificationsActiveIcon sx={{ fontSize: 32 }} />, color: colors.primary, desc: t("reportCustom") + " " + t("sharedNotifications"), action: () => navigate(`/settings/device/notify/${id}`) },

    {
      label: t("commandAlarmVibration"),
      icon: <SecurityIcon sx={{ fontSize: 32 }} />,
      color: deviceData?.attributes?.alarmVibration ? colors.primary : '#9e9e9e',
      desc: deviceData?.attributes?.alarmVibration ? t("alarmPowerOn") : t("alarmPowerOff"),
      disabled: limitCommands,
      action: () => setVibrationOpen(true)
    },
    { label: t("sharedDriver"), disabled: Servis, icon: <PersonIcon sx={{ fontSize: 32 }} />, desc: t("eventDriverChanged"), color: colors.primary, action: () => setDriverOpen(true) },
    { label: t("reportConfigure"), disabled: Servis, icon: <SettingsApplicationsIcon sx={{ fontSize: 32 }} />, color: colors.primary, desc: t("attributeSpeedLimit") + ", " + t("deviceContact") + ",.. ", action: () => setInsuranceOpen(true) },
    { label: t("sharedGeofences"), disabled: Servis, icon: <MapIcon sx={{ fontSize: 32 }} />, color: colors.primary, desc: t("sharedGeofences"), action: () => setGeofenceOpen(true) },
    { label: t("sharedMaintenance"), disabled: Servis, icon: <BuildIcon sx={{ fontSize: 32 }} />, color: colors.primary, desc: t("sharedNotification"), action: () => setMaintenanceOpen(true) },
    { label: t("eventMaintenance"), disabled: Servis, icon: <NoteAltIcon sx={{ fontSize: 32 }} />, color: colors.primary, desc: t("notes"), action: () => setNotesOpen(true) },
    { label: 'KOMUTLAR', icon: <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />, color: '#e65100', desc: 'Gelişmiş', hidden: !admin, action: () => navigate(`/settings/device/${id}/command`) },
  ].filter(btn => !btn.hidden);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceSecondaryInfo']}>
      <Container maxWidth="sm" sx={{ py: 2, textAlign: 'center' }}>

        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', boxShadow: 1, position: 'absolute', left: 16 }}>
            <ArrowBackIcon sx={{ color: colors.primary }} />
          </IconButton>
          <Typography variant="h6" fontWeight="900" color={colors.secondary}>
            {t("deviceSecondaryInfo")}
          </Typography>
        </Stack>

        {/* --- ULTRA DATA KARTI --- */}
        <Paper elevation={6} sx={{ p: 2, mb: 3, borderRadius: 5, background: colors.gradient, color: 'white', position: 'relative', overflow: 'hidden' }}>

          <Box sx={{ position: 'absolute', right: -30, top: -20, opacity: 0.05, transform: 'rotate(15deg)' }}>
            {React.cloneElement(getCategoryIcon(deviceData?.category), { sx: { fontSize: 250 } })}
          </Box>

          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            {/* Header: Avatar, Name, ID */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 70, height: 70, bgcolor: 'rgba(255,255,255,0.15)', border: '2px solid white' }}>
                {React.cloneElement(getCategoryIcon(deviceData?.category), { sx: { fontSize: 35 } })}
              </Avatar>
              <Box textAlign="left" flex={1}>
                <Typography variant="h5" fontWeight="900" noWrap>{deviceData?.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.9 }}>
                  <FingerprintIcon fontSize="small" />
                  <Typography variant="caption" fontWeight="bold">ID: {id}</Typography>
                  <Typography variant="caption">|</Typography>
                  <Chip
                    icon={<GpsFixedIcon sx={{ color: 'white !important', fontSize: '14px' }} />}
                    label={position?.valid ? t("deviceStatus") + ": " + t("alarmPowerOn") : t("deviceStatus") + ": " + t("alarmPowerOff")}
                    size="small"
                    sx={{ bgcolor: position?.valid ? '#4caf50' : '#f44336', color: 'white', fontWeight: 'bold' }}
                  />
                </Stack>
              </Box>
            </Stack>

            {/* Metrikler 1. Satır: Hız, Kontak, Batarya */}
            <Grid container spacing={1} sx={{ bgcolor: colors.cardBg, p: 1.5, borderRadius: 3 }}>
              <Grid item xs={4}>
                <Stack spacing={0.5}>
                  <SpeedIcon sx={{ mx: 'auto', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>{t("positionSpeed")}</Typography>
                  <Typography variant="body2" fontWeight="800">{(position?.speed * 1.852 || 0).toFixed(0)} km/h</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack spacing={0.5}>
                  <KeyIcon sx={{ mx: 'auto', fontSize: 18, color: position?.attributes?.ignition ? "#00ffcc" : "#ff4d4d" }} />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>{t("positionIgnition")}</Typography>
                  <Typography variant="body2" fontWeight="800">{position?.attributes?.ignition ? t("eventIgnitionOn") : t("eventIgnitionOff")}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack spacing={0.5}>
                  <SettingsRemoteIcon sx={{ mx: 'auto', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>{t("positionBattery")}</Typography>
                  <Typography variant="body2" fontWeight="800">%{position?.attributes?.batteryLevel || '--'}</Typography>
                </Stack>
              </Grid>
            </Grid>

            {/* Metrikler 2. Satır: Yükseklik, Yön, Mesafe */}
            <Grid container spacing={1} sx={{ bgcolor: colors.cardBg, p: 1.5, borderRadius: 3 }}>
              <Grid item xs={4}>
                <Stack spacing={0.5} direction="row" alignItems="center" justifyContent="center">
                  <HeightIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                  <Typography variant="caption" fontWeight="bold">{position?.altitude ? `${position.altitude.toFixed(0)}m` : '--'}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack spacing={0.5} direction="row" alignItems="center" justifyContent="center">
                  <ExploreIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                  <Typography variant="caption" fontWeight="bold">{position?.course ? `${position.course.toFixed(0)}°` : '--'}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack spacing={0.5} direction="row" alignItems="center" justifyContent="center">
                  <TimelineIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                  <Typography variant="caption" fontWeight="bold">{(position?.attributes?.totalDistance / 1000 || 0).toFixed(1)} km</Typography>
                </Stack>
              </Grid>
            </Grid>

            {/* Grup ve Yetkili Bilgisi */}
            <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ px: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <GroupWorkIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                <Typography variant="caption" fontWeight="600">{groupName}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <ContactPhoneIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                <Typography variant="caption" fontWeight="600">{deviceData?.contact || t("noData")}</Typography>
              </Stack>
            </Stack>

            {/* Zaman Damgaları */}
            <Stack spacing={0.5} sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 1.5, borderRadius: 3, textAlign: 'left' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 14, color: '#00ffcc' }} />
                <Typography variant="caption" sx={{ flex: 1, opacity: 0.8 }}>{t("positionFixTime")}</Typography>
                <Typography variant="caption" fontWeight="bold">{formatTime(position?.fixTime)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                <Typography variant="caption" sx={{ flex: 1, opacity: 0.8 }}>{t("positionServerTime")}</Typography>
                <Typography variant="caption" fontWeight="bold">{formatTime(deviceData?.lastUpdate)}</Typography>
              </Stack>
            </Stack>

            {/* Adres / Koordinat */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
              <LocationOnIcon sx={{ fontSize: 18, color: '#00ffcc' }} />
              <Typography variant="caption" sx={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>
                {address || `${position?.latitude?.toFixed(5) || '--'}, ${position?.longitude?.toFixed(5) || '--'}`}
              </Typography>
            </Stack>

          </Stack>
        </Paper>

        {/* --- UNIFORM BUTON GRID --- */}
        {/* xs={6} ve sm={6} yaparak kartların hem mobilde hem tablette daha geniş ve 2'li düzen olmasını sağladık */}
        {/* justifyContent="center" eklenerek alt satırda kalan kartların da ortada durması sağlandı */}
        <Grid container spacing={2} justifyContent="center">
          {actionButtons.map((btn, i) => (
            <Grid item xs={6} sm={6} md={4} key={i}>
              <ButtonBase
                disabled={btn.disabled}
                onClick={btn.action}
                sx={{
                  width: '100%',
                  minWidth: 130,
                  height: '110px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 5,
                  bgcolor: theme.palette.background.paper,
                  border: `2px solid ${btn.color === colors.primary || btn.color === '#e53935' ? btn.color : '#eee'}`,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                  opacity: btn.disabled ? 0.5 : 1
                }}
              >
                {/* minWidth: 80 kaldırıldı. Sadece margin-bottom (mb) bırakıldı. */}
                <Box sx={{ color: btn.color, mb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {btn.icon}
                </Box>
                <Typography variant="caption" fontWeight="900" sx={{ letterSpacing: 0.5 }}>
                  {btn.label}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.5 }}>
                  {btn.desc}
                </Typography>
              </ButtonBase>
            </Grid>
          ))}
        </Grid>

        {/* --- DİYALOGLAR --- */}

        {/* Yeni Blokaj Onay Dialogu */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 5 } }}>
          <DialogTitle fontWeight="900" sx={{ color: selectedCommand === 'engineStop' ? '#e53935' : colors.primary }}>
            {selectedCommand === 'engineStop' ? t("commandEngineStop") : t("commandEngineStart")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontWeight: 500 }}>
              {getDialogMessage(selectedCommand)}
            </DialogContentText>

            {/* Cihazın mevcut blokaj durumunu gösteren bilgi kutusu */}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold">
                {t("deviceStatus")}: <span style={{ color: deviceData?.attributes?.blockedDevice ? '#e53935' : '#4caf50' }}>
                  {deviceData?.attributes?.blockedDevice ? t("reportDevice") + " " + t("positionBlocked") : t("reportDevice") + " " + t("alarmPowerOn")}
                </span>
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setConfirmOpen(false)} sx={{ fontWeight: 'bold' }}>İptal</Button>
            <Button onClick={() => handleConfirm()} variant="contained" sx={{ bgcolor: selectedCommand === 'engineStop' ? '#e53935' : colors.primary, borderRadius: 3, fontWeight: 'bold' }}>
              {t("sharedAccept")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sarsıntı ve Hassasiyet Kombine Dialog */}
        <Dialog open={vibrationOpen} onClose={() => setVibrationOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 6 } }}>
          <DialogTitle sx={{ fontWeight: '900' }}>Sarsıntı Ayarları</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box textAlign="center">
                <Typography variant="body2" gutterBottom color="text.secondary">Mevcut Durum: <b>{deviceData?.attributes?.alarmVibration ? t("alarmPowerOn") : t("alarmPowerOff")}</b></Typography>
                <Button variant="contained" fullWidth color={deviceData?.attributes?.alarmVibration ? "error" : "primary"} onClick={() => handleSendCommand(deviceData?.attributes?.alarmVibration ? 'alarmDisarm' : 'alarmArm')} sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}>
                  {deviceData?.attributes?.alarmVibration ? t("commandAlarmDisarm") : t("commandAlarmArm")}
                </Button>
              </Box>
              <Divider>{t("commandAlarmVibrationlevel")}</Divider>
              <Box sx={{ px: 2, pt: 2 }}>
                <Slider value={parseInt(sensorLevel)} min={2} max={9} step={1} onChange={(e, v) => setSensorLevel(v.toString())} valueLabelDisplay="on" sx={{ color: colors.primary }} />
                <Typography variant="caption" display="block" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>{t("commandAlarmSensorlevel")}</Typography>
                <Button variant="outlined" fullWidth onClick={() => handleSendCommand('alarmVibrationlevel')} sx={{ mt: 2, borderRadius: 3, color: colors.primary, borderColor: colors.primary }}>SEVİYEYİ GÜNCELLE</Button>
              </Box>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Diğer Dialoglar */}
        <Dialog open={driverOpen} onClose={() => setDriverOpen(false)} fullWidth maxWidth="xs"><DialogTitle sx={{ fontWeight: 'bold' }}> </DialogTitle><DialogContent><DriverCard deviceId={id} deviceName={deviceData?.name} position={position} /></DialogContent><DialogActions><Button onClick={() => setDriverOpen(false)}>{t("sharedCancel")}</Button></DialogActions></Dialog>
        <Dialog open={insuranceOpen} onClose={() => setInsuranceOpen(false)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontWeight: 'bold' }}> </DialogTitle><DialogContent><InsuranceCard deviceId={id} deviceData={deviceData} /></DialogContent><DialogActions><Button onClick={() => setInsuranceOpen(false)}>{t("sharedCancel")}</Button></DialogActions></Dialog>
        <Dialog open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} fullWidth maxWidth="sm"><DialogContent sx={{ p: 0 }}><DeviceMaintenanceCard deviceId={id} deviceName={deviceData?.name} position={position} /></DialogContent></Dialog>
        <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} fullWidth maxWidth="sm"><DialogContent sx={{ p: 0 }}><DeviceBakimNotlariCard deviceId={id} deviceData={deviceData} /></DialogContent></Dialog>

        <Dialog open={geofenceOpen} onClose={() => setGeofenceOpen(false)} fullWidth maxWidth="sm"><DialogContent sx={{ p: 2 }}><DeviceGeofenceCard deviceId={id} /></DialogContent></Dialog>




        <Backdrop open={loading} sx={{ zIndex: 9999, color: '#fff' }}><CircularProgress color="inherit" /></Backdrop>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
          <Alert severity="success" variant="filled" sx={{ borderRadius: 4 }}>İşlem Başarılı</Alert>
        </Snackbar>

      </Container>
    </PageLayout>
  );
};

export default CommandDevicePageUsers;