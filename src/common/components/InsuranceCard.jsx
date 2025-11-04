import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Button, MenuItem, InputAdornment,Snackbar } from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import deviceCategories from '../util/deviceCategories';
import StreetviewIcon from '@mui/icons-material/Streetview';
import { useNavigate } from 'react-router-dom';
import { useDeviceReadonly } from '../util/permissions';

const InsuranceCard = ({ deviceId, deviceData }) => {
  const t = useTranslation();
  const [speedLimit, setSpeedLimit] = useState('');
  const [insuranceExpiration, setInsuranceExpiration] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('default');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();
  const deviceReadonly = useDeviceReadonly();

  // ⚡ Props geldiğinde state'leri güncelle
  useEffect(() => {
    if (!deviceData) return;

    if (deviceData.attributes) {
      if (deviceData.attributes.speedLimit) {
        setSpeedLimit((deviceData.attributes.speedLimit * 1.852).toFixed(2));
      }
      if (deviceData.attributes.insuranceExpiration) {
        setInsuranceExpiration(deviceData.attributes.insuranceExpiration);
      }
    }
    setContact(deviceData.contact || '');
    setCategory(deviceData.category || 'default');
  }, [deviceData]);

  const handleSave = async () => {
    if (!deviceData) return;

    const speedLimitInNauticalMile = (parseFloat(speedLimit) / 1.852).toFixed(2);

    const updatedAttributes = {
      ...deviceData.attributes,
      speedLimit: parseFloat(speedLimitInNauticalMile),
      insuranceExpiration,
    };

    const updatedDevice = {
      ...deviceData,
      contact,
      category,
      attributes: updatedAttributes,
    };

    try {
      const updateResponse = await fetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDevice),
      });

      if (updateResponse.ok) {
        setSnackbarOpen(true);
      } else {
        console.error('Error saving data');
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3, p: 2 }}>
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
              PaperProps: { style: { maxHeight: 300 } },
            },
          }}
        >
          <MenuItem value="default" disabled>{t('selectCategory')}</MenuItem>
          {deviceCategories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {t(`category${cat.replace(/^\w/, (c) => c.toUpperCase())}`)}
            </MenuItem>
          ))}
        </TextField>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Typography>
            {t("eventCommandResult")}
          </Typography>
        </Snackbar>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
          sx={{ marginTop: '1rem' }}
          disabled={deviceReadonly}
        >
          {t('sharedSave')}
        </Button>
      </CardContent>
    </Card>
    
  );
};

export default InsuranceCard;
