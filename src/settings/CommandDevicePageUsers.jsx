import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  Typography,
  Slider,
  Box,Tooltip, IconButton, CircularProgress,Backdrop
} from '@mui/material';

import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import InsuranceCard from '../common/components/InsuranceCard';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';
import { useCatch } from '../reactHelper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import DeviceBakimNotlariCard from '../common/components/DeviceBakimNotlariCard';
import DeviceMaintenanceCard from '../common/components/DeviceMaintenanceCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DriverCard from '../common/components/DriverCard';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkField
 from '../common/components/LinkField';
const CommandDevicePageUsers = () => {
  const navigate = useNavigate();
  const classes = useSettingsStyles();
  const t = useTranslation();
  const { id } = useParams();
  const admin = useAdministrator();
  const limitCommands = useRestriction('limitCommands');
  const userReadonly = useRestriction('readonly');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [blockedDevice, setBlockedDevice] = useState(false);
  const [vibrationStatus, setVibrationStatus] = useState(false);
  const [sensorLevel, setSensorLevel] = useState('5');
  const [sensorLevelServer, setSensorLevelServer] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Komut başarılı ise cihaz attribute'larını güncelle
    const deviceResponse = await fetch(`/api/devices/${id}`);
    if (!deviceResponse.ok) {
      throw new Error(await deviceResponse.text());
    }
    const device = await deviceResponse.json();
    const updatedAttributes = { ...device.attributes };

    if (commandType === 'engineStop') {
      updatedAttributes.blockedDevice = true;
    }
    if (commandType === 'engineResume') {
      updatedAttributes.blockedDevice = false;
    }
    if (commandType === 'alarmVibrationon') {
      updatedAttributes.alarmVibration = true;
    }
    if (commandType === 'alarmVibrationoff') {
      updatedAttributes.alarmVibration = false;
    }
    if (commandType === 'alarmVibrationlevel') {
      updatedAttributes.alarmSensorlevel = sensorLevel;
    }

    device.attributes = updatedAttributes;

    const updateResponse = await fetch(`/api/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device),
    });

    if (!updateResponse.ok) {
      throw new Error(await updateResponse.text());
    }

    // Local state güncelle
    if (updatedAttributes.blockedDevice !== undefined) {
      setBlockedDevice(updatedAttributes.blockedDevice);
    }
    if (updatedAttributes.alarmVibration !== undefined) {
      setVibrationStatus(updatedAttributes.alarmVibration);
    }
    if (updatedAttributes.alarmSensorlevel !== undefined) {
      setSensorLevel(updatedAttributes.alarmSensorlevel.toString());
    }

    setSnackbarOpen(true);
    navigate('/');
  });

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (selectedCommand) {
      try {
        setLoading(true); // spinner başlat
        await handleSendCommand(selectedCommand);
      } finally {
        setLoading(false); // spinner bitir
      }
    }
  };
  
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);

  const device = useSelector((state) => state.devices.items[id]);

  const [deviceData, setDeviceData] = useState(null);

  const [position, setPositionData] = useState([]);


  const getDialogMessage = (command) => {
    switch (command) {
      case 'engineStop':
      case 'engineResume':
        return t('blokajUyari');
      case 'positionSingle':
        return t('tekKonumAcilama');
      case 'customCommand':
        return t('ozelKomutAciklama');
      // İstediğin kadar case ekleyebilirsin
      default:
        return t('genelUyari');
    }
  };
    
    // 🔹 Tooltip açıklamaları yerine Snackbar açıklaması
  const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '' });

  // Açıklama metinlerini yöneten fonksiyon
  const getSnackbarMessage = (id) => {
    switch (id) {
      case 'vibration':
        return 'Araç park halindeyken herhangi bir sarsıntı tespit edildiğinde bildirim alırsınız. Kontak Kapandıktan 2dk sonra devreye girer.';
      case 'engine':
        return 'Aracınızda Blokaj Kiti varsa, 20 km/h altında ve uydulara tam bağlandığında motoru durdurabilirsiniz.';
      case 'speed':
        return 'Hız limiti bildirimleriniz aktifse, hız ihlali durumunda anında bildirim alırsınız. Aracın hızını sınırlamaz.';
      case 'driver':
        return 'Bu bölümde araç sürücülerini yönetebilirsiniz. Sürücü bilgilerine aracın geçmiş konumlarında Kalıcı olarak saklanır. Veri bütünlüğü sebebiyle Sürücü Değişiklikleri geçmiş veri üzerinde yapılamaz.';
      case 'bakımHatirlatma':
        return 'Km, motor saati veya tarihe göre bakım hatırlatmaları ekleyebilir, ilgili periyotlarda bildirim alabilirsiniz.';
      case 'bakimNotları':
        return 'Geçmiş bakım notlarınızı görüntüleyebilir ve takip edebilirsiniz.';
      case 'geofences':
        return 'Araçla İlişkili Bölgeleri Seçebilirsiniz, Bölge Giriş veya Çıkış Bildirimleri almak için Bildirim Ayarlarınızı Kontrol Ediniz.';
      default:
        return '';
    }
  };

  // Snackbar açıklamasını aç/kapa fonksiyonu
  const handleSnackbarInfo = (id) => {
    const message = getSnackbarMessage(id);
    setSnackbarInfo({ open: true, message });
  };

  
  const fetchDeviceAttributes = async () => {
    setLoading(true);
    const response = await fetch(`/api/devices/${id}`);
    if (response.ok) {
      setLoading(false);
      const device = await response.json();
      setDeviceData(device); // tüm yanıtı tek state'e atıyoruz
      if (device.attributes) {
        if (device.attributes.blockedDevice !== undefined) {
          setBlockedDevice(device.attributes.blockedDevice);
        }
        if (device.attributes.alarmVibration !== undefined) {
          setVibrationStatus(device.attributes.alarmVibration);
        }
        if (device.attributes.alarmSensorlevel !== undefined) {
          setSensorLevel(device.attributes.alarmSensorlevel.toString());
          setSensorLevelServer(device.attributes.alarmSensorlevel.toString());

        }
          // blokajkiti kontrolü ekle
        if (device.attributes.blokajkiti === true) {
          setBlokajkitDurum(false); // Motor butonunu disable yap
        } else {
          setBlokajkitDurum(true); // Motor butonunu aktif yap
        }
      }
    } else {
      console.error('Failed to fetch device attributes');
    }
  };
  
  const fetchLastPosition = async () => {
    try {
      const response = await fetch(`/api/positions?id=${device?.positionId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPositionData(data[0]); // yalnızca ilk pozisyonu al
        } else {
          console.warn("Beklenen pozisyon verisi alınamadı veya boş.");
        }
      }
    } catch (err) {
      console.error("Son Position verileri alınamadı", err);
    }
  };

  useEffect(() => {
    if (device?.positionId) {
      fetchLastPosition();
    }
      fetchDeviceAttributes();
  }, [id]);


  const [blokajkitDurum, setBlokajkitDurum] = useState(true); // Motor butonu için state

  const [showVibrationSettings, setShowVibrationSettings] = useState(false);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedDevice']} > 

      { admin && 
      <Button   variant="outlined"   color="primary"   size="large"  fullWidth  onClick={() => navigate(`/settings/device/${id}/command`)}>{t('deviceCommand')}</Button>
      }
        <IconButton
        variant="contained"
        color="primary"
        onClick={() => navigate(-1)} // -1 = bir önceki sayfa
        sx={{ position: 'absolute', marginTop: '0.8rem', marginBottom: '2rem', left: 15 }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Container maxWidth="md" className={classes.container} sx={{ marginTop: '1rem' , marginBottom: '2rem'  } }>
      <Typography textAlign= 'center' variant="h6" gutterBottom> {t('reportDeviceName')} : {device?.name} </Typography>
        <Grid container spacing={0}>
          <Grid container spacing={1}>
            {/* Motor Durum Kartı */}
            <Grid item xs={6} sm={6} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 2,
                }}
              >
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 2, right: 2, color: 'text.secondary' }}
                  onClick={() => handleSnackbarInfo('engine')}
                >
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>

                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  {blockedDevice === false && (
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontSize: { xs: '0.8rem', sm: '1.2rem' } }}
                    >
                      {t('positionBlocked')}
                      <VerifiedUserIcon
                        sx={{
                          color: 'green',
                          fontSize: { xs: 16, sm: 20 },
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          ml: 1,
                        }}
                      />
                    </Typography>
                  )}
                  {blockedDevice === true && (
                    <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '1.2rem' } }}>
                      {t('positionBlocked')}
                    </Typography>
                  )}

                  {blokajkitDurum && (
                    <Typography gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }}>
                      {t('blokajaciklama')}
                    </Typography>
                  )}
                  {limitCommands && (
                    <Typography gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }}>
                      Yetkiniz Yok
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    color={blockedDevice ? 'success' : 'error'}
                    size="small"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' }, mt: 1 }}
                    onClick={() => {
                      setSelectedCommand(blockedDevice ? 'engineResume' : 'engineStop');
                      setConfirmOpen(true);
                    }}
                    disabled={blokajkitDurum || limitCommands}
                  >
                    {blockedDevice ? t('commandEngineResume') : t('commandEngineStop')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Titreşim Alarm Kartı */}
            <Grid item xs={6} sm={6} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  p: 2,
                }}
              >
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 2, right: 2, color: 'text.secondary' }}
                  onClick={() => handleSnackbarInfo('vibration')}
                >
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>

                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: { xs: '0.8rem', sm: '1.2rem' }, mt: 0 }}
                  >
                    {vibrationStatus ? t('commandAlarmVibrationon') : t('commandAlarmVibrationoff')}
                  </Typography>
                  {limitCommands && (
                    <Typography gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }}>
                      Yetkiniz Yok
                    </Typography>
                  )}
                  <Button
                    disabled={limitCommands}
                    variant="contained"
                    color={vibrationStatus ? 'error' : 'success'}
                    size="small"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' }, mt: 1 }}
                    onClick={() => {
                      setSelectedCommand(vibrationStatus ? 'alarmVibrationoff' : 'alarmVibrationon');
                      setConfirmOpen(true);
                    }}
                  >
                    {vibrationStatus ? t('commandAlarmDisarm') : t('commandAlarmArm')}
                  </Button>
                  <Button
                      size="small"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' }, mt: 1 }}
                      onClick={() => setShowVibrationSettings(!showVibrationSettings)}
                    >
                      {showVibrationSettings ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </Button>

                  {showVibrationSettings && (
                    <Box mt={2}>
                      <Slider
                        disabled={limitCommands}
                        value={parseInt(sensorLevel)}
                        min={2}
                        max={9}
                        step={1}
                        onChange={(e, newValue) => setSensorLevel(newValue.toString())}
                        valueLabelDisplay="on"
                        sx={{
                          '& .MuiSlider-valueLabel': {
                            fontSize: { xs: '0.6rem', sm: '0.8rem' }, // mobilde daha küçük
                          },
                        }}
                      />

                      <Box display="flex" justifyContent="space-between" px={0} mt={-1}>
                        <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.9rem' } }}  variant="body2" color="textSecondary">
                          Yüksek Hassasiyet
                        </Typography>
                        ⇔
                        <Typography sx={{ fontSize: { xs: '0.6rem', sm: '0.9rem' } }} variant="body2" color="textSecondary">
                          Düşük Hassasiyet
                        </Typography>
                      </Box>

                      <Button
                        disabled={limitCommands}
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ mt: 1, fontSize: { xs: '0.6rem', sm: '0.9rem' } }}
                        onClick={() => {
                          setSelectedCommand('alarmVibrationlevel');
                          setConfirmOpen(true);
                        }}
                      >
                        {t('commandSend')}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={1} sx={{ mt: 1 }}>

           <Grid item xs={12} md={6}>
              <InsuranceCard deviceId={id} deviceData={deviceData} />
            </Grid>
            <Grid spacing={3} item xs={12} md={6}>
              <DriverCard deviceId={id} deviceName={device?.name} position = {position} />
              {!userReadonly && 

              <Card
                sx={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  p: 2,
                  mt: 1,
                }}
              >
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 2, right: 2, color: 'text.secondary' }}
                  onClick={() => handleSnackbarInfo('geofences')}
                >
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>

              <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <LinkField
                endpointAll="/api/geofences"
                endpointLinked={`/api/geofences?deviceId=${id}`}
                baseId={id}
                keyBase="deviceId"
                keyLink="geofenceId"
                titleGetter={(it) => `${it.name} (${it.id})`}
                label={t('sharedGeofences')}
              />
           
              </CardContent>
            
              </Card>
              }
            </Grid>


          <Grid  container justifyContent="center" item xs={12}>
            <DeviceMaintenanceCard deviceId={id} deviceName={device?.name} devicePositionId={device?.positionId} position = {position} />
          </Grid>
                                    
          <Grid  container justifyContent="center" item xs={12}>
            <DeviceBakimNotlariCard deviceId={ id } deviceData={deviceData} />
          </Grid>

          </Grid>




        </Grid>

        {/* Onay Dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle   sx={{ fontSize: '14px' }} >{getDialogMessage(selectedCommand)}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t('sharedAreYouSure')}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} color="primary">
              {t('sharedNo')}
            </Button>
            <Button onClick={handleConfirm} color="primary" autoFocus>
              {t('sharedYes')}
            </Button>
          </DialogActions>
        </Dialog>


        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading} // loading true olduğunda göster
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            {t('sharedSave')}
          </Alert>
        </Snackbar>
      </Container>
      <Snackbar
  open={snackbarInfo.open}
  autoHideDuration={4000}
  onClose={() => setSnackbarInfo({ open: false, message: '' })}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert severity="info" sx={{ width: '100%' }}>
    {snackbarInfo.message}
  </Alert>
</Snackbar>
    </PageLayout>
  );
};

export default CommandDevicePageUsers;
