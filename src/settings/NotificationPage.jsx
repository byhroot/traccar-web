import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Button,
  TextField,
  Box,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TuneIcon from '@mui/icons-material/Tune';
import SendIcon from '@mui/icons-material/Send';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import EditItemView from './components/EditItemView';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import useFeatures from '../common/util/useFeatures';
import { useAdministrator } from '../common/util/permissions';

const NotificationPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const admin = useAdministrator();

  const [item, setItem] = useState();
  const [testDisabled, setTestDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const [notificationTypes, setNotificationTypes] = useState([]);
  const allowedTypes = ['alarm', 'geofenceEnter', 'geofenceExit', 'ignitionOn', 'ignitionOff', 'deviceOnline', 'driverChanged', 'deviceOffline', 'deviceUnknown', 'deviceMoving', 'deviceStopped', 'deviceOverspeed', 'maintenance'];

  useEffect(() => {
    const fetchNotificationTypes = async () => {
      const response = await fetch('/api/notifications/types');
      const types = await response.json();
      const filteredTypes = admin ? types : types.filter(type => allowedTypes.includes(type.type));
      setNotificationTypes(filteredTypes);
    };
    fetchNotificationTypes();
  }, [admin]);

  // Test Butonu Sayaç Yönetimi
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setTestDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const testNotificators = useCatch(async () => {
    setTestDisabled(true);
    setCountdown(10); // 10 saniye kilit
    await Promise.all(
      item.notificators.split(/[, ]+/).map(async (notificator) => {
        await fetchOrThrow(`/api/notifications/test/${notificator}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }),
    );
  });

  const user = useSelector((state) => state.session.user);
  const [attributes] = useState(user.attributes);
  const smsLimit = attributes.smsLimit;

  const validate = () =>
    item &&
    item.type &&
    item.notificators &&
    (!item.notificators?.includes('command') || item.commandId);

  return (
    <EditItemView
      endpoint="notifications"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedNotification']}
    >
      {item && (
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Accordion
            defaultExpanded
            sx={{ borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <NotificationsActiveIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="700">{t('sharedNotification')}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails className={classes.details} sx={{ pt: 0 }}>
              <SelectField
                value={item.type}
                onChange={(e) => setItem({ ...item, type: e.target.value })}
                data={notificationTypes}
                keyGetter={(it) => it.type}
                titleGetter={(it) => t(prefixString('event', it.type))}
                label={t('sharedType')}
              />

              {item.type === 'alarm' && (
                <SelectField
                  multiple
                  value={item.attributes?.alarms ? item.attributes.alarms.split(/[, ]+/) : []}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, alarms: e.target.value.join() } })}
                  data={alarms}
                  keyGetter={(it) => it.key}
                  label={t('sharedAlarms')}
                />
              )}

              <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

              <SelectField
                multiple
                value={item.notificators ? (smsLimit > 0 ? item.notificators.split(/[, ]+/) : item.notificators.split(/[, ]+/).filter(v => v !== 'sms' && v !== 'pushover')) : []}
                onChange={(e) => setItem({
                  ...item,
                  notificators: smsLimit > 0 ? e.target.value.join() : e.target.value.filter(v => v !== 'sms' && v !== 'pushover').join()
                })}
                endpoint="/api/notifications/notificators"
                keyGetter={(it) => it.type}
                titleGetter={(it) => t(prefixString('notificator', it.type))}
                label={t('notificationNotificators')}
              />

              {item.notificators?.includes('command') && (
                <SelectField
                  value={item.commandId}
                  onChange={(e) => setItem({ ...item, commandId: Number(e.target.value) })}
                  endpoint="/api/commands"
                  titleGetter={(it) => it.description}
                  label={t('sharedSavedCommand')}
                />
              )}
              {item.notificators?.includes('pushover') && (
                <Alert severity="info" sx={{ borderRadius: '10px' }}>
                  {t('notificatorPhoneInfo')}
                </Alert>
              )}

              {/* Bilgi Kutuları */}
              <Box sx={{ my: 2 }}>
                {(smsLimit == null || smsLimit <= 0) ? (
                  <Alert severity="warning" icon={<ErrorOutlineIcon />} sx={{ borderRadius: '10px' }}>
                    SMS/Telefon Çağrı paketiniz Aktif değil.
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: '10px' }}>
                    {t('notificatorSms')} {t('userUserLimit')} : <strong>{smsLimit}</strong>
                  </Alert>
                )}
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<SendIcon />}
                onClick={testNotificators}
                disabled={!item.notificators || testDisabled}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  boxShadow: 'none',
                  '&:disabled': { bgcolor: 'action.disabledBackground' }
                }}
              >
                {testDisabled ? `${t('sharedTestNotificators')} (${countdown}s)` : t('sharedTestNotificators')}
              </Button>

              <FormGroup sx={{ mt: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={item.always} onChange={(e) => setItem({ ...item, always: e.target.checked })} />}
                  label={<Typography variant="body2" fontWeight="500">{t('notificationAlways')}</Typography>}
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TuneIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="700">{t('sharedExtra')}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails className={classes.details} sx={{ pt: 0 }}>
              {admin &&
                <TextField
                  fullWidth
                  variant="filled"
                  value={item.description || ''}
                  onChange={(e) => setItem({ ...item, description: e.target.value })}
                  label={t('sharedDescription')}
                  sx={{ mb: 2 }}
                />
              }
              <SelectField
                value={item.calendarId}
                onChange={(e) => setItem({ ...item, calendarId: Number(e.target.value) })}
                endpoint="/api/calendars"
                label={t('sharedCalendar')}
              />

              {['geofenceEnter', 'geofenceExit'].includes(item.type) && (
                <SelectField
                  multiple
                  value={item.attributes?.geofenceIds ? item.attributes.geofenceIds.split(',') : []}
                  onChange={(e) => {
                    const geofenceIds = e.target.value.join();
                    const attributes = { ...item.attributes };
                    geofenceIds ? attributes.geofenceIds = geofenceIds : delete attributes.geofenceIds;
                    setItem({ ...item, attributes });
                  }}
                  endpoint="/api/geofences"
                  keyGetter={(it) => String(it.id)}
                  label={t('sharedGeofences')}
                />
              )}

              {admin && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: '8px' }}>
                  <FormControlLabel
                    control={<Checkbox checked={item.attributes?.priority} onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, priority: e.target.checked } })} />}
                    label={<Typography variant="body2" fontWeight="600" color="primary">{t('sharedPriority')}</Typography>}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}
    </EditItemView>
  );
};

export default NotificationPage;