import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, Grid, Snackbar, Alert, MenuItem , InputAdornment} from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import deviceCategories from '../util/deviceCategories';
import StreetviewIcon from '@mui/icons-material/Streetview';
import { useNavigate } from 'react-router-dom';

const InsuranceCard = ({ deviceId }) => {
  const t = useTranslation();
  const [speedLimit, setSpeedLimit] = useState('');
  const [insuranceExpiration, setInsuranceExpiration] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('default');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [device, setDevice] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeviceData = async () => {
      const response = await fetch(`/api/devices/${deviceId}`);
      if (response.ok) {
        const deviceData = await response.json();
        setDevice(deviceData);

        // Attributes
        if (deviceData.attributes) {
          if (deviceData.attributes.speedLimit) {
            const speedLimitInKm = deviceData.attributes.speedLimit * 1.852;
            setSpeedLimit(speedLimitInKm.toFixed(2));
          }
          if (deviceData.attributes.insuranceExpiration) {
            setInsuranceExpiration(deviceData.attributes.insuranceExpiration);
          }
        }

        // contact ve category
        setContact(deviceData.contact || '');
        setCategory(deviceData.category || 'default');
      } else {
        console.error('Failed to fetch device data');
      }
    };
    fetchDeviceData();
  }, [deviceId]);

  const handleSave = async () => {
    const speedLimitInNauticalMile = (parseFloat(speedLimit) / 1.852).toFixed(2);

    const updatedAttributes = {
      ...device.attributes,
      speedLimit: parseFloat(speedLimitInNauticalMile),
      insuranceExpiration,
    };

    const updatedDevice = {
      ...device,
      contact,
      category,
      attributes: updatedAttributes,
    };

    const updateResponse = await fetch(`/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice),
    });

    if (updateResponse.ok) {
      setSnackbarOpen(true);
      navigate(-1); // bir önceki sayfaya dön
    } else {
      console.error('Error saving data');
    }
  };

  return (
    <Grid >
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>{t('deviceInsuranceAndSpeed')}</Typography>

          <TextField
            label={t('attributeSpeedLimit')}
            variant="outlined"
            value={speedLimit}
            onChange={(e) => setSpeedLimit(e.target.value)}
            fullWidth
            sx={{ marginBottom: '1rem' }}
            InputProps={{ startAdornment: <SpeedIcon sx={{ marginRight: '8px' }} /> }}
            type="number"
          />

          <TextField
            label={t('sigortaTarih') + " " + t('userExpirationTime')}
            type="date"
            value={insuranceExpiration}
            onChange={(e) => setInsuranceExpiration(e.target.value)}
            fullWidth
            sx={{ marginBottom: '1rem' }}
            InputProps={{ startAdornment: <CalendarTodayIcon sx={{ marginRight: '8px' }} /> }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label={t('deviceContact')}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            fullWidth
            sx={{ marginBottom: '1rem' }}
            InputProps={{ startAdornment: <ContactPhoneIcon sx={{ marginRight: '8px' }} /> }}
          />
    <TextField
      select
      value={category || 'default'}
      label={t('deviceCategory')}
      onChange={(e) => setCategory(e.target.value)}
      fullWidth
      sx={{ marginBottom: '1rem' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <StreetviewIcon />
          </InputAdornment>
        ),
      }}
      SelectProps={{
        MenuProps: {
          PaperProps: {
            style: {
              maxHeight: 300, // burada 300px sınırı koyduk
            },
          },
        },
      }}
    >
      {/* Varsayılan boş değer */}
      <MenuItem value="default" disabled>
        {t('selectCategory')}
      </MenuItem>

      {/* Kategori listesini doldur */}
      {deviceCategories.map((cat) => (
        <MenuItem key={cat} value={cat}>
          {t(`category${cat.replace(/^\w/, (c) => c.toUpperCase())}`)}
        </MenuItem>
      ))}
    </TextField>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSave}
            sx={{ marginTop: '1rem' }}
          >
            {t('sharedSave')}
          </Button>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {t('sharedSaveSuccess')} Veriler Kaydedildi
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default InsuranceCard;
