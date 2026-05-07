import React, { useState } from 'react';
import { Switch, FormControlLabel, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useTranslation } from '../common/components/LocalizationProvider';

const NotificationsPageAddNotifiy = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const t = useTranslation();
  const handleToggle = async (event) => {
    const checked = event.target.checked;
    if (!checked) return;

    setLoading(true);
    try {
      const types = [
        'deviceOverspeed',
        'geofenceEnter',
        'geofenceExit',
        'ignitionOn',
        'ignitionOff',
        'maintenance',
        'driverChanged',
      ];
      const alarmAttributesList = [
        { alarms: 'vibration,tow' },
        { alarms: 'lowPower,powerCut,powerRestored,lowBattery,removing,gpsAntennaCut' },
        { alarms: 'idle,accident,hardAcceleration,hardBraking,hardCornering,fatigueDriving' },
      ];


      const notificators = 'web,firebase';

      const requests = [
        // alarm türü 3 ayrı attributes ile
        ...alarmAttributesList.map((attributes) =>
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'alarm',
              notificators,
              always: true,
              attributes,
            }),
          })
        ),

        // diğer tipler
        ...types.map((type) =>
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              notificators: type === 'maintenance' ? 'web,firebase,mail' : 'web,firebase',
              always: true,
            }),
          })
        ),
      ];

      const responses = await Promise.all(requests);

      const allSuccess = responses.every((res) => res.ok);
      if (allSuccess) {
        setSuccessOpen(true);
        onSuccess?.(); // Üst bileşeni tetikle
      } else {
        throw new Error('One or more requests failed');
      }
    } catch (error) {
      console.error('Notification creation failed:', error);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormControlLabel
        control={<Switch defaultChecked={false} onChange={handleToggle} disabled={loading} />}
        label={t("sharedNotifications") + ' ' + t("alarmPowerOff")}
      />
      {loading && <CircularProgress size={24} />}
      <Snackbar open={successOpen} autoHideDuration={4000} onClose={() => setSuccessOpen(false)}>
        <Alert onClose={() => setSuccessOpen(false)} severity="success">
          Bildirimler başarıyla eklendi.
        </Alert>
      </Snackbar>
      <Snackbar open={errorOpen} autoHideDuration={4000} onClose={() => setErrorOpen(false)}>
        <Alert onClose={() => setErrorOpen(false)} severity="error">
          Bildirim ekleme işlemi sırasında hata oluştu.
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationsPageAddNotifiy;
