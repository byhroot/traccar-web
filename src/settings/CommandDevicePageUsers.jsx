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
} from '@mui/material';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import InsuranceCard from '../common/components/InsuranceCard';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';
import { useCatch } from '../reactHelper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAdministrator, useRestriction } from '../common/util/permissions';

const CommandDevicePageUsers = () => {
  const navigate = useNavigate();
  const classes = useSettingsStyles();
  const t = useTranslation();
  const { id } = useParams();
  const admin = useAdministrator();
  const limitCommands = useRestriction('limitCommands');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [blockedDevice, setBlockedDevice] = useState(false);
  const [vibrationStatus, setVibrationStatus] = useState(false);
  const [sensorLevel, setSensorLevel] = useState('5');
  const [sensorLevelServer, setSensorLevelServer] = useState('');

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

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (selectedCommand) {
      handleSendCommand(selectedCommand);
    }
  };
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);

  const device = useSelector((state) => state.devices.items[id]);


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
  

  useEffect(() => {
    const fetchDeviceAttributes = async () => {
      const response = await fetch(`/api/devices/${id}`);
      if (response.ok) {
        const device = await response.json();
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
    fetchDeviceAttributes();
  }, [id]);

  const [blokajkitDurum, setBlokajkitDurum] = useState(true); // Motor butonu için state


  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedDevice']} > 
      { admin && 
      <Button   variant="outlined"   color="primary"   size="large"  fullWidth  onClick={() => navigate(`/settings/device/${id}/command`)}>{t('deviceCommand')}</Button>
      }
      <Container maxWidth="md" className={classes.container} sx={{ marginTop: '2rem' }}>
      <Typography textAlign= 'center' variant="h6" gutterBottom> {t('reportDeviceName')} : {device.name}</Typography>

        <Grid container spacing={2}>
          {/* Motor Durum Kartı */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ position: 'relative' }}>
              {blockedDevice === false && (
                <CheckCircleIcon
                  sx={{
                    position: 'absolute',
                    top: 15,
                    left: 30,
                    color: 'green',
                    fontSize: 40,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              )}
              <CardContent  sx={{ textAlign: 'center' }}>
                {blockedDevice === false && 
                <Typography variant="h6" gutterBottom>{t('positionBlocked')} </Typography>
                }
                {blockedDevice === true && 
                <Typography variant="h6" gutterBottom>{t('positionBlocked')} </Typography>
                }
                {blokajkitDurum &&  <Typography gutterBottom> {t('blokajaciklama')}</Typography>}
                {limitCommands &&  <Typography gutterBottom> Yetkiniz Yok </Typography>}
                <Button
                  variant="contained"
                  color={blockedDevice ? 'success' : 'error'}
                  size="large"
                  onClick={() => {
                    setSelectedCommand(blockedDevice ? 'engineResume' : 'engineStop');
                    setConfirmOpen(true);
                  }}
                  disabled={blokajkitDurum || limitCommands} // Burada butonun disabled durumunu kontrol ediyoruz
                >
                  {blockedDevice ? t('commandEngineResume') : t('commandEngineStop')}
                </Button>
              </CardContent>
            </Card>
          </Grid>


          {/* Titreşim Alarm Kartı */}
          <Grid item xs={12} sm={6}>
            <Card  sx={{ position: 'relative' }}>
              {vibrationStatus === true && (
                <CheckCircleIcon
                  sx={{
                    position: 'absolute',
                    top: 15,
                    left: 30,
                    color: 'green',
                    fontSize: 40,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              )}
              <CardContent  sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom> {t('alarmVibration')}</Typography>
                {limitCommands &&  <Typography gutterBottom> Yetkiniz Yok </Typography>}

                <Button
                 disabled={limitCommands}
                  variant="contained"
                  color={vibrationStatus ? 'error' : 'success'}
                  size="large"
                  onClick={() => {
                    setSelectedCommand(vibrationStatus ? 'alarmVibrationoff' : 'alarmVibrationon');
                    setConfirmOpen(true);
                  }}
                >
                  {vibrationStatus ? t('commandAlarmVibrationoff') : t('commandAlarmVibrationon')}
                </Button>
              </CardContent>
            </Card>
          </Grid>


          {/* Titreşim Hassasiyet Seviyesi Kartı */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>{t('commandAlarmVibrationlevel')} : {sensorLevelServer} </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('commandAlarmSensorlevel')}
                </Alert>

                <Slider
                  disabled={limitCommands}
                  value={parseInt(sensorLevel)}
                  min={2}
                  max={9}
                  step={1}
                  onChange={(e, newValue) => setSensorLevel(newValue.toString())}
                  valueLabelDisplay="on"
                />
                 {limitCommands &&  <Typography gutterBottom> Yetkiniz Yok </Typography>}

                <Button
                  disabled={limitCommands}
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ marginTop: '1rem' }}
                  onClick={() => {
                    setSelectedCommand('alarmVibrationlevel');
                    setConfirmOpen(true);
                  }}
                >
                  {t('sharedSave')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
             {/* Insurance and Speed Limit Card */}
             
            <Grid  container justifyContent="center" item xs={12}>
              <InsuranceCard deviceId={ id } />
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

    </PageLayout>
  );
};

export default CommandDevicePageUsers;
