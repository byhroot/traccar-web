import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Button, Card, CardContent,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Slider,
  Box, Tooltip, IconButton, CircularProgress, Backdrop
} from '@mui/material';
import PageLayout from './PageLayout';
import useSettingsStyles from '../../settings/common/useSettingsStyles';
import { useCatch } from '../../reactHelper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAdministrator, useRestriction } from '../util/permissions';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from './LocalizationProvider';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

const BlockedCard = () => {
  const navigate = useNavigate();
  const classes = useSettingsStyles();
  const t = useTranslation();
  const id = useSelector((state) => state.devices.selectedId);
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
        return t('blokajUyari');
      case 'engineResume':
        return t('genelUyari');
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
      setLoading(false);
    } else {
      console.error('Failed to fetch device attributes');
    }
  };
  useEffect(() => {
    fetchDeviceAttributes();
  }, [id]);


  const [blokajkitDurum, setBlokajkitDurum] = useState(true); // Motor butonu için state

  const [showVibrationSettings, setShowVibrationSettings] = useState(false);

  return (
    <Grid>
      <IconButton
        size="small"
        sx={{
          position: 'absolute',
          top: '50%',                    // Dikey ortalama
          right: 20,                     // Sağdan 20px
          transform: 'translateY(-50%)', // Ortalamanın tam merkezde olması için
          color: 'text.secondary',
        }} onClick={() => handleSnackbarInfo('engine')}
      >
        <HelpOutlineIcon fontSize="large" />
      </IconButton>

      <CardContent
        sx={{
          textAlign: 'center',
          p: 1, // 0 yerine hafif bir padding dokunuş hissi verir
          minWidth: { xs: '240px' }, // Mobilde 140px, tablette 200px minimum genişlik
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >        {blokajkitDurum && (
        <Typography gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          {t('blokajaciklama')}
        </Typography>
      )}
        {limitCommands && (
          <Typography gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }}>
            Yetkiniz Yok
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>
          <IconButton
            color={blockedDevice ? 'success' : 'error'}
            onClick={() => {
              setSelectedCommand(blockedDevice ? 'engineResume' : 'engineStop');
              setConfirmOpen(true);
            }}
            disabled={blokajkitDurum || limitCommands}
            sx={{
              p: 3,
              border: `2px solid ${blockedDevice ? '#43a047' : '#e53935'}`,
              transition: '0.3s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          >
            <PowerSettingsNewIcon sx={{ fontSize: 40 }} />
          </IconButton>
          <Typography sx={{ mt: 1 }}>
            {blockedDevice ? t('commandEngineResume') : t('commandEngineStop')}
          </Typography>
        </Box>
      </CardContent>
      {/* Onay Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontSize: '14px' }} >{getDialogMessage(selectedCommand)}</DialogTitle>
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
          {t("eventCommandResult")}
        </Alert>
      </Snackbar>
      <Snackbar
        open={snackbarInfo.open}
        autoHideDuration={4000}
        onClose={() => setSnackbarInfo({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {snackbarInfo.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default BlockedCard;
