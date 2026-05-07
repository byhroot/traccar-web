import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, TextField, Button,
  MenuItem, InputAdornment, Snackbar, Box, Alert
} from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import StreetviewIcon from '@mui/icons-material/Streetview';
import TimerIcon from '@mui/icons-material/Timer';
import deviceCategories from '../util/deviceCategories';
import { useDeviceReadonly } from '../util/permissions';

const InsuranceCard = ({ deviceId, deviceData }) => {
  const t = useTranslation();
  const deviceReadonly = useDeviceReadonly();

  const [formData, setFormData] = useState({
    speedLimit: '',
    insuranceExpiration: '',
    contact: '',
    category: 'default',
    idleMinDuration: 20, // Varsayılan 20 dk
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (deviceData) {
      setFormData({
        speedLimit: deviceData.attributes?.speedLimit ? (deviceData.attributes.speedLimit * 1.852).toFixed(2) : '',
        insuranceExpiration: deviceData.attributes?.insuranceExpiration || '',
        contact: deviceData.contact || '',
        category: deviceData.category || 'default',
        // Kayıt yoksa 20 (Varsayılan) kabul et
        idleMinDuration: deviceData.attributes?.idleMinDuration ?? 20,
      });
    }
  }, [deviceData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!deviceData || deviceReadonly) return;

    const speedLimitInKnots = formData.speedLimit ? (parseFloat(formData.speedLimit) / 1.852).toFixed(2) : 0;

    const updatedDevice = {
      ...deviceData,
      contact: formData.contact,
      category: formData.category,
      attributes: {
        ...deviceData.attributes,
        speedLimit: parseFloat(speedLimitInKnots),
        insuranceExpiration: formData.insuranceExpiration,
        // 0 gelirse 0 olarak, sayı gelirse sayı olarak kaydet
        idleMinDuration: parseInt(formData.idleMinDuration, 10),
      },
    };

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDevice),
      });

      if (response.ok) setSnackbarOpen(true);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  return (
    <Card sx={{ maxWidth: 450, mx: 'auto', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
        <Typography variant="h6" textAlign="center" fontWeight="600" color="primary.main">
          {t('deviceInsuranceAndSpeed')}
        </Typography>

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label={t('attributeSpeedLimit')}
            name="speedLimit"
            type="number"
            value={formData.speedLimit}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SpeedIcon /></InputAdornment>,
              endAdornment: <InputAdornment position="end">km/h</InputAdornment>
            }}
          />

          <TextField
            fullWidth
            select
            label={t('alarmIdle')}
            name="idleMinDuration"
            /* Mantık burada başlıyor */
            value={
              formData.idleMinDuration === undefined || formData.idleMinDuration === null
                ? 20 // Eğer veri hiç yoksa (tanımsızsa) varsayılan 20
                : (formData.idleMinDuration === 0 || formData.idleMinDuration === ""
                  ? 0 // Eğer var ama 0 veya boş string ise "Kapat" (0)
                  : formData.idleMinDuration) // Diğer durumlarda kendi değeri
            }
            onChange={handleChange}
            helperText="Rolanti belirlediğiniz süreden fazla olursa alarm tetiklenir..."
            InputProps={{
              startAdornment: <InputAdornment position="start"><TimerIcon /></InputAdornment>
            }}
          >
            {/* Değeri 0 olan MenuItem "Kapat" anlamına gelir */}
            <MenuItem value={0}>{t('alarmPowerOff')}</MenuItem>

            {[10, 15, 20, 30, 45, 60].map((min) => (
              <MenuItem key={min} value={min}>
                {min} {t('sharedMinutes')}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label={`${t('sigortaTarih')} ${t('userExpirationTime')}`}
            name="insuranceExpiration"
            type="date"
            value={formData.insuranceExpiration}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><CalendarTodayIcon /></InputAdornment>
            }}
          />

          <TextField
            fullWidth
            label={t('deviceContact')}
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><ContactPhoneIcon /></InputAdornment>
            }}
          />

          <TextField
            fullWidth
            select
            label={t('deviceCategory')}
            name="category"
            value={formData.category}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><StreetviewIcon /></InputAdornment>
            }}
          >
            <MenuItem value="default" disabled>{t('selectCategory')}</MenuItem>
            {deviceCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>{t(`category${cat.replace(/^\w/, (c) => c.toUpperCase())}`)}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={deviceReadonly}
          sx={{ mt: 1, py: 1.5, borderRadius: 2 }}
        >
          {t('sharedSave')}
        </Button>
      </CardContent>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" variant="filled">{t('eventCommandResult')}</Alert>
      </Snackbar>
    </Card>
  );
};

export default InsuranceCard;