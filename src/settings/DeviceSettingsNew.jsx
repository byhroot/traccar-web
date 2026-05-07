import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  Backdrop,
  CircularProgress,
  Box,
  Tooltip,
  Button
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';

import VibrationIcon from '@mui/icons-material/Vibration';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EngineeringIcon from '@mui/icons-material/Engineering';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import PolicyIcon from '@mui/icons-material/Policy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import InsuranceCard from '../common/components/InsuranceCard';
import DeviceBakimNotlariCard from '../common/components/DeviceBakimNotlariCard';
import DeviceMaintenanceCard from '../common/components/DeviceMaintenanceCard';
import VibrationCard from '../common/components/VibrationCard';
import NotificationCard from '../common/components/NotificationCard';
import DriverCard from '../common/components/DriverCard';
import BlockedCard from '../common/components/BlockedCard';
import useSettingsStyles from './common/useSettingsStyles';
import { useTranslation } from '../common/components/LocalizationProvider';
import AreaChartIcon from '@mui/icons-material/AreaChart';
import DeviceGeofenceCard from '../common/components/DeviceGeofenceCard';
import { useAdministrator } from '../common/util/permissions';

const DeviceSettingsNew = ({ deviceId }) => {
  const navigate = useNavigate();
  //  const { id } = useParams();
  const id = useSelector((state) => state.devices.selectedId) || deviceId; // Öncelikle Redux'tan al, yoksa prop olarak gelen ID'yi kullan
  const user = useSelector((state) => state.session.user);
  const Servis = user?.attributes?.servis === true;

  const t = useTranslation();

  const classes = useSettingsStyles();
  const admin = useAdministrator();
  const [openDialog, setOpenDialog] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [position, setPosition] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blockedDevice, setBlockedDevice] = useState(false);
  const [vibrationActive, setVibrationActive] = useState(false);

  // 🔹 Cihaz ve pozisyon bilgileri
  const fetchDeviceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/devices/${id}`);
      if (response.ok) {
        const device = await response.json();
        setDeviceData(device);
        if (device.attributes.blockedDevice !== undefined) {
          setBlockedDevice(device.attributes.blockedDevice);
        }
        if (device.attributes.alarmVibration !== undefined) {
          setVibrationActive(device.attributes.alarmVibration);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLastPosition = async () => {
    try {
      const response = await fetch(`/api/positions?id=${deviceData?.positionId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPosition(data[0]);
        }
      }
    } catch (err) {
      console.error('Pozisyon alınamadı', err);
    }
  };

  useEffect(() => {
    fetchDeviceData();
  }, [id]);

  useEffect(() => {
    if (deviceData?.positionId) {
      fetchLastPosition();
    }
  }, [deviceData]);

  const handleDialogClose = async () => {
    setOpenDialog(null);
    await fetchDeviceData();
  };

  useEffect(() => {
    if (openDialog === 'notifications' && id) {
      navigate(`settings/device/notify/${id}`);
      setOpenDialog(null); // Dialog’u kapalı tut
    }
  }, [openDialog, id, navigate]);


  // 🔹 Dialog içeriği
  const renderDialogContent = () => {
    switch (openDialog) {
      case 'insurance':
        return (
          <Card sx={{ p: 3, textAlign: 'center' }}>

            <InsuranceCard deviceId={id} deviceData={deviceData} />
          </Card>

        );
      case 'maintenance':
        return (
          <DeviceMaintenanceCard
            deviceId={id}
            deviceName={deviceData?.name}
            devicePositionId={deviceData?.positionId}
            position={position}
          />
        );
      case 'driver':
        return (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <DriverCard
              deviceId={id}
              deviceName={deviceData?.name}
              position={position}
            />
          </Card>

        );
      case 'notes':
        return <DeviceBakimNotlariCard deviceId={id} deviceData={deviceData} />;
      case 'vibration':
        return (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <VibrationCard />
          </Card>
        );
      case 'notifications':
        return null;
      case 'block':
        return (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <BlockedCard deviceId={id} />
          </Card>
        );
      case 'geofences':
        return (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <DeviceGeofenceCard deviceId={id} />
          </Card>
        );
      default:
        return null;
    }
  };

  // 🔹 Modern Dashboard Simgeleri
  const iconCards = [
    {
      id: 'block',
      icon: (
        <PowerSettingsNewIcon
          sx={{
            fontSize: 40,
            color: blockedDevice ? '#e53935' : '#43a047',
            transition: '0.3s',
          }}
        />
      ),
      label: t('positionBlocked'),
      desc: blockedDevice ? t("reportDevice") + " " + t("alarmPowerOff") : t("reportDevice") + " " + t("alarmPowerOn"),
    },
    {
      id: 'notifications',
      icon: <NotificationsActiveIcon sx={{ fontSize: 40, color: '#0288d1' }} />,
      label: t('sharedNotifications'),
      desc: t("settingsTitle"),
      disabled: Servis, // Servis kullanıcısı bildirim ayarlarını değiştiremesin
    },
    {
      id: 'vibration',
      icon: (
        <VibrationIcon
          sx={{
            fontSize: 40,
            color: vibrationActive ? '#43a047' : '#f57c00',
          }}
        />
      ),
      label: t('commandAlarmVibration'),
      desc: vibrationActive ? t("alarmPowerOn") : t("alarmPowerOff")
    },
    {
      id: 'driver',
      disabled: Servis, // Servis kullanıcısı bildirim ayarlarını değiştiremesin

      icon: (
        <GroupAddIcon
          sx={{
            fontSize: 40,
            color: position?.attributes?.driverUniqueId ? '#4caf50' : '#9e9e9e',
            transition: 'color 0.3s ease',
          }}
        />
      ),
      label: t('sharedDriver'),
      desc: position?.attributes?.driverUniqueId
        ? t('sharedSaved')
        : ""
    },

    {
      id: 'maintenance',
      icon: <EngineeringIcon sx={{ fontSize: 40, color: '#6a1b9a' }} />,
      label: "⏰ " + t('sharedMaintenance'),
      desc: t("sharedNotification"),
      disabled: Servis, // Servis kullanıcısı bildirim ayarlarını değiştiremesin

    },
    {
      id: 'notes',
      icon: <NoteAltIcon sx={{ fontSize: 40, color: '#455a64' }} />,
      label: "📝 " + t('notes'),
      desc: t('eventMaintenance') + " " + t('notes'),
      disabled: Servis, // Servis kullanıcısı bildirim ayarlarını değiştiremesin

    },
    {
      id: 'insurance',
      icon: <PolicyIcon sx={{ fontSize: 40, color: '#1565c0' }} />,
      label: t('settingsTitle'),
      desc: t('sigortaTarih') + ", " + t('attributeSpeedLimit') + ", " + t('deviceCategory'),
    },
    {
      id: 'geofences',
      icon: <AreaChartIcon sx={{ fontSize: 40, color: 'green' }} />,
      label: t('sharedGeofences'),
      desc: t('devicesAndState'),
      disabled: Servis, // Servis kullanıcısı bildirim ayarlarını değiştiremesin

    },
  ];

  return (
    <Container maxWidth="md">
      <Grid
        container
        spacing={1}
        justifyContent="center"
        sx={{ display: 'flex', flexWrap: 'wrap', mt: 2 }}
      >
        {admin &&
          <Button sx={{ px: 0.8, py: 0.3, minHeight: 26 }}
            variant="outlined" color="primary" size="small" fullWidth onClick={() => navigate(`/settings/device/${id}/command`)}>{t('deviceCommand')}</Button>
        }
        {iconCards.map((item) => (
          <Grid key={item.id} size={{ xs: 6, sm: 4, md: 2 }}>
            <Tooltip title={item.disabled ? "Servis yetkisiyle bu ayara erişilemez" : ""}>
              <Card
                // Eğer disabled ise setOpenDialog çalışmaz
                onClick={() => !item.disabled && setOpenDialog(item.id)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: { xs: 120, lg: 130 },
                  borderRadius: 3,
                  boxShadow: item.disabled ? 0 : 3, // Devre dışıyken gölgeyi kaldırabilirsin
                  transition: '0.3s',
                  p: 0,

                  // --- Disabled Stilleri ---
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.4 : 1, // Sönük görünüm
                  filter: item.disabled ? 'grayscale(0.8)' : 'none', // Renkleri grileştirir
                  backgroundColor: item.disabled ? 'action.hover' : 'background.paper',
                  border: item.disabled ? '1px solid' : 'none',
                  borderColor: 'divider',
                  pointerEvents: item.disabled ? 'none' : 'auto', // Tıklamayı tamamen bloklar (Tooltip için 'auto' kalabilir)
                }}
              >
                {item.icon}
                <Typography
                  variant="subtitle2"
                  sx={{ mt: 0, fontWeight: 500, textAlign: 'center', color: item.disabled ? 'text.disabled' : 'text.primary' }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', lineHeight: 1.2, px: 1 }}
                >
                  {item.disabled ? "Yetkiniz Yok" : item.desc}
                </Typography>
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={!!openDialog}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            p: 0,
            position: 'relative',
            backgroundColor: 'transparent', // 🔹 Arka plan tamamen şeffaf
            boxShadow: 'none',              // 🔹 Kenar gölgesi yok
          },
        }}
      >
        {/* X Butonu */}
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            zIndex: 10,
          }}
        >
          <IconButton onClick={handleDialogClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Kartı biraz altta başlatıyoruz */}
        <Box sx={{ mt: '10px', position: 'relative', zIndex: 1 }}>
          {renderDialogContent()}
        </Box>
      </Dialog>



      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default DeviceSettingsNew;
