// NotificationsList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Popover,
  Checkbox,
  Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment } from '@mui/material';
import { Collapse } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import SpeedIcon from '@mui/icons-material/Speed';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import BuildIcon from '@mui/icons-material/Build';
import BadgeIcon from '@mui/icons-material/Badge';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import HelpIcon from '@mui/icons-material/Help';
import PageLayout from './PageLayout';
import { useTranslation } from './LocalizationProvider';
import { useParams } from 'react-router-dom';
import ParkIcon from '@mui/icons-material/LocalParking'; // DeviceStopped
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// --- Sabitler ---

const NOTIFICATION_TYPES = [
  'ignitionOn', 'ignitionOff', 'deviceOverspeed', 'geofenceEnter', 'geofenceExit',
  'deviceMoving', 'deviceStopped', 'maintenance', 'driverChanged',
  'deviceOnline', 'deviceUnknown', 'deviceOffline',
];

const ALARM_GROUPS = [
  { key: 'vibration', label: 'alarmVibration', alarms: ['vibration'] },
  { key: 'power', label: 'alarmPowerCut', alarms: ['powerCut', 'removing'] },
  { key: 'device', label: 'sharedPowerAlarms', alarms: ['lowPower', 'lowBattery', 'gpsAntennaCut'] },
  { key: 'safety', label: 'sharedDriveBehaivor', alarms: ['idle', 'tow', 'hardAcceleration', 'hardBraking', 'hardCornering', 'sos', 'accident', 'fatigueDriving'] },
];


const NOTIFICATOR_ICONS = {
  firebase: '📱',
  mail: '✉️',
  sms: '💬',
  pushover: '📞',
};

// UI’da göstermeyeceğiz ama backend’e her zaman gidecek zorunlular
const BACKEND_MANDATORY = ['firebase', 'web'];

// UI’da göstereceğimiz seçenekler (web gizli)
const NOTIFICATOR_UI = ['firebase', 'mail', 'sms', 'pushover'];
// Pushover hangi bildirim tiplerinde gösterilsin?
// 💡 Hangi tiplerde Pushover gösterilecek?
const shouldShowPushover = (type, alarmGroupKey) => {
  if (!type) return false;
  if (type === 'alarm') {
    return ['vibration', 'power'].includes(alarmGroupKey);
  }
  return ['geofenceEnter', 'geofenceExit', 'deviceMoving'].includes(type);
};

// 💡 Hangi tiplerde Mail gösterilecek?
const shouldShowMail = (type, alarmGroupKey) => {
  if (!type) return false;

  // Eğer alarm tipindeyse sadece "power" grubunda göster
  if (type === 'alarm') {
    return ['vibration', 'power'].includes(alarmGroupKey);
  }

  // Diğer event tipleri için mevcut liste geçerli
  const allowed = [
    'maintenance',
    'deviceOverspeed',
    'deviceMoving',
    'driverChanged',
    'deviceUnknown',
    'deviceOffline',
    'geofenceEnter',
    'geofenceExit',
  ];

  return allowed.includes(type);
};




// Event/Alarm tip iconları
const getTypeIcon = (type) => {
  switch (type) {
    case 'deviceMoving': return <DirectionsCarIcon color="primary" />;
    case 'deviceStopped': return <ParkIcon color="action" />;
    case 'deviceOverspeed': return <SpeedIcon color="warning" />;
    case 'geofenceEnter': return <LoginIcon color="success" />;
    case 'geofenceExit': return <LogoutIcon color="error" />;
    case 'ignitionOn': return <PowerSettingsNewIcon color="success" />;
    case 'ignitionOff': return <PowerSettingsNewIcon color="disabled" />;
    case 'maintenance': return <BuildIcon color="warning" />;
    case 'driverChanged': return <BadgeIcon color="info" />;
    case 'deviceOnline': return <WifiIcon color="primary" />;
    case 'deviceUnknown': return <HelpOutlineIcon color="disabled" />;
    case 'deviceOffline': return <WifiOffIcon color="error" />;
    default: return <NotificationsActiveIcon color="error" fontSize="small" />;
  }
};


// Haftalık kısaltmalar UI yazımı
const WEEKDAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

// --- Yardımcılar ---

// base64 VCALENDAR (simple) üretimi
const buildICalBase64 = ({ startHHmm = '08:00', endHHmm = '20:00', freq = 'DAILY', byDays = [] }) => {
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';

  const today = dayjs();
  const [sh, sm] = startHHmm.split(':').map(Number);
  const [eh, em] = endHHmm.split(':').map(Number);

  let dtStart = today.hour(sh).minute(sm).second(0);
  let dtEnd = today.hour(eh).minute(em).second(0);

  // 🕐 Eğer bitiş saati başlangıçtan önceyse → ertesi gün olmalı
  if (dtEnd.isBefore(dtStart)) {
    dtEnd = dtEnd.add(1, 'day');
  }

  const DTSTART = `DTSTART;TZID=${tzid}:${dtStart.locale('en').format('YYYYMMDDTHHmmss')}`;
  const DTEND = `DTEND;TZID=${tzid}:${dtEnd.locale('en').format('YYYYMMDDTHHmmss')}`;

  let RRULE = 'RRULE:FREQ=DAILY';
  if (freq === 'WEEKLY') {
    const icalDays = byDays.length ? byDays.join(',') : 'MO,WE,FR';
    RRULE = `RRULE:FREQ=WEEKLY;BYDAY=${icalDays}`;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Traccar//NONSGML Traccar//EN',
    'BEGIN:VEVENT',
    'UID:00000000-0000-0000-0000-000000000000',
    DTSTART,
    DTEND,
    RRULE,
    'SUMMARY:Event',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return window.btoa(lines.join('\n'));
};


// VCALENDAR (simple) -> okunur özet
const describeICal = (b64, t) => {
  try {
    const txt = window.atob(b64);
    const lines = txt.split('\n').map(l => l.trim());
    const dtstartLine = lines.find(l => l.startsWith('DTSTART'));
    const dtendLine = lines.find(l => l.startsWith('DTEND'));
    const rruleLine = lines.find(l => l.startsWith('RRULE'));

    const timeFrom = dtstartLine?.split(':')?.[1]?.slice(9, 13); // HHmmss → alttaki formatla alacağız
    const timeTo = dtendLine?.split(':')?.[1]?.slice(9, 13);

    // Daha sağlam saat çekimi:
    const startRaw = dtstartLine?.split(':')?.[1] || '';
    const endRaw = dtendLine?.split(':')?.[1] || '';
    const startHH = startRaw.substring(9, 11);
    const startMM = startRaw.substring(11, 13);
    const endHH = endRaw.substring(9, 11);
    const endMM = endRaw.substring(11, 13);

    const hhmmFrom = `${startHH || '08'}:${startMM || '00'}`;
    const hhmmTo = `${endHH || '20'}:${endMM || '00'}`;

    let freq = 'DAILY';
    let byday = [];
    if (rruleLine) {
      const parts = rruleLine.split(';').map(x => x.trim());
      const f = parts.find(p => p.startsWith('RRULE:FREQ=')) || parts[0];
      freq = f.replace('RRULE:FREQ=', '') || 'DAILY';
      const by = parts.find(p => p.startsWith('BYDAY='));
      if (by) byday = by.replace('BYDAY=', '').split(',');
    }

    if (freq === 'DAILY') {
      return `🗓️ ${t('calendarDaily') || 'Hergün'} ${hhmmFrom}–${hhmmTo}`;
    }
    if (freq === 'WEEKLY') {
      // BYDAY dizisini TR kısaltmalara çevir
      const mapDay = (d) => {
        switch (d) {
          case 'MO': return 'Pzt';
          case 'TU': return 'Sal';
          case 'WE': return 'Çar';
          case 'TH': return 'Per';
          case 'FR': return 'Cum';
          case 'SA': return 'Cmt';
          case 'SU': return 'Paz';
          default: return d;
        }
      };
      const days = byday.map(mapDay).join(', ');
      return `🗓️ ${days} ${hhmmFrom}–${hhmmTo}`;
    }
    return `🗓️ ${hhmmFrom}–${hhmmTo}`;
  } catch {
    return '🗓️ Takvim';
  }
};// Etiket → gösterim (eventXxx çevirisi)
function eventLabel(type, t) {
  return t?.(`event${type.charAt(0).toUpperCase()}${type?.slice(1)}`) || type;
}

// Alarm attribute çeviri listesi
const translateAlarmKey = (alarmKey, t) =>
  t?.(`alarm${alarmKey.charAt(0).toUpperCase()}${alarmKey?.slice(1)}`) || alarmKey;

// --- Ana Sayfa ---

const NotificationCard = () => {
  const t = useTranslation();
  const user = useSelector((s) => s.session.user);
  const { id } = useParams();
  const deviceId = useSelector((state) => state.devices.selectedId) || id;

  console.log("test", deviceId);

  const deviceName = useSelector((state) => {
    if (deviceId) {
      const device = state.devices.items[deviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  const smsLimit = user?.attributes?.smsLimit;

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [calendars, setCalendars] = useState([]);

  const [deleteConfirm, setDeleteConfirm] = useState(null); // {id, isGlobal}
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null); // notification objesi ya da null
  const [createOpen, setCreateOpen] = useState(false);

  const onlyUINotificators = (csv) => (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter((x) => x && x !== 'web'); // firebase dahil, web hariç
  // Metni aksan/işaretlerden arındırıp küçült
  const normalize = (s) =>
    (s || '')
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  // Bir bildirimi arama için tek metne dönüştür (çeviriyle)
  const buildSearchableText = (n, t, calendars) => {
    const parts = [];

    // Başlık (eventLabel veya Alarm)
    const title = n.type === 'alarm' ? (t('sharedAlarms') || 'Alarm') : eventLabel(n.type, t);
    parts.push(title);

    // Alarm anahtarları (çeviri)
    if (n.type === 'alarm') {
      const keys = (n.attributes?.alarms || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      keys.forEach((k) => parts.push(translateAlarmKey(k, t)));
    }

    // Kanallar (UI’da görünenler)
    const uiNotifs = onlyUINotificators(n.notificators);
    uiNotifs.forEach((x) => {
      const label = t(`notificator${x.charAt(0).toUpperCase()}${x.slice(1)}`);
      parts.push(label);
    });

    // Takvim özeti
    if (n.calendarId) {
      const c = calendars.find((x) => x.id === n.calendarId);
      if (c) parts.push(describeICal(c.data, t));
    }

    // (Opsiyonel) description
    if (n.description) parts.push(n.description);

    return normalize(parts.join(' '));
  };
  // FETCHERS
  const fetchCalendars = async () => {
    const res = await fetch('/api/calendars');
    if (res.ok) {
      const arr = await res.json();
      setCalendars(arr || []);
    }
  };

  const fetchNotifications = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      // global + device
      const [globalRes, deviceRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch(`/api/notifications?deviceId=${deviceId}`),
      ]);
      const globalData = (await globalRes.json()) || [];
      const deviceData = (await deviceRes.json()) || [];

      // sadece always=true olan global’ler ve cihazdaki bildirimler
      const filtered = [
        ...globalData?.filter((n) => n.always),
        ...deviceData,
      ];

      setNotifications(filtered.sort((a, b) => b.id - a.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
    fetchNotifications();
  }, []);

  // --- Kart Listeleme ---

  const [search, setSearch] = useState('');

  const filteredCards = useMemo(() => {
    if (!search.trim()) return notifications;
    const q = normalize(search);
    return notifications.filter((n) => {
      const txt = buildSearchableText(n, t, calendars);
      return txt.includes(q);
    });
  }, [search, notifications, calendars, t]);

  // --- Silme ---

  const deleteNotification = async (id) => {
    const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      console.error(await res.text());
    }
  };

  const handleDelete = (n) => {
    setDeleteConfirm({ id: n.id, isGlobal: !!n.always });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?.id) return;
    await deleteNotification(deleteConfirm.id);
    setDeleteConfirm(null);
    await fetchNotifications();
  };

  // --- Ekle ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const createDefaultNotificationBody = (type, group) => {
    if (type === 'alarm' && group) {
      return {
        type: 'alarm',
        description: group.key, // eşlemede kullanacağız
        attributes: { alarms: group.alarms.join(',') },
        notificators: BACKEND_MANDATORY.join(','), // "firebase,web"
      };
    }
    return {
      type,
      notificators: BACKEND_MANDATORY.join(','),
      attributes: {},
    };
  };

  const handleCreate = () => {
    setCreateOpen(true);
  };

  // --- Edit ---

  const handleEdit = async (notification) => {
    setEditData(notification);
    setEditOpen(true);
  };

  // PUT / Save
  const saveNotification = async (data) => {
    // UI’da gösterilen notificator’ların + zorunluların birleşimi
    const uiSelected = NOTIFICATOR_UI?.filter((k) => data._uiNotificators?.[k]);
    const finalNotificators = Array.from(
      new Set([...uiSelected, ...BACKEND_MANDATORY])
    );

    // Gereksiz alanları çıkar (_uiNotificators, firebase, mail, sms, pushover)
    const { _uiNotificators, firebase, mail, sms, pushover, ...cleanData } = data;

    const body = {
      ...cleanData,
      notificators: finalNotificators.join(','),
    };

    const res = await fetch(`/api/notifications/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(await res.text());
    }
    await fetchNotifications();
  };


  // POST / create + permission
  const createNotification = async (draft) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      console.error(await res.text());
      return null;
    }
    const created = await res.json();

    // Cihaza bağla
    await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, notificationId: created.id }),
    });

    return created;
  };

  // --- Dialog Bileşenleri ---

  const CalendarCreateDialog = ({ open, onClose, onCreated }) => {
    const [freq, setFreq] = useState('DAILY'); // DAILY | WEEKLY
    const [start, setStart] = useState('08:00');
    const [end, setEnd] = useState('20:00');
    const [days, setDays] = useState(['MO', 'WE']); // Weekly varsayılan

    const toggleDay = (code) => {
      setDays((prev) =>
        prev.includes(code) ? prev?.filter((d) => d !== code) : [...prev, code]
      );
    };

    const weekdayCodes = [
      { code: 'MO', label: 'Pzt' },
      { code: 'TU', label: 'Sal' },
      { code: 'WE', label: 'Çar' },
      { code: 'TH', label: 'Per' },
      { code: 'FR', label: 'Cum' },
      { code: 'SA', label: 'Cmt' },
      { code: 'SU', label: 'Paz' },
    ];

    const handleCreate = async () => {
      const data = buildICalBase64({
        startHHmm: start,
        endHHmm: end,
        freq,
        byDays: days,
      });

      // İsim üret (kullanıcıya göstermeyeceğiz ama kayıt için gerekli)
      const name =
        freq === 'DAILY'
          ? `${t('calendarDaily') || 'Hergün'} ${start}–${end}`
          : `${days.map((d) => d).join(',')} ${start}–${end}`;

      const body = { name, data, attributes: {} };
      const res = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchCalendars(); // güncel listeyi çek
        const created = await res.json();
        onCreated?.(created); // ana dialoğa geri bildir
        onClose();
      } else {
        console.error(await res.text());
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>🆕 {t('reportStartTime') || 'Yeni Zaman Aralığı'}</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>⏱️ {t('commandTimezone')}</InputLabel>
            <Select
              label={t('commandTimezone')}
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              size="small"
            >
              <MenuItem value="DAILY">{t('calendarDaily') || 'Hergün'}</MenuItem>
              <MenuItem value="WEEKLY">{t('calendarWeekly') || 'Haftalık'}</MenuItem>
            </Select>
          </FormControl>

          {freq === 'WEEKLY' && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {weekdayCodes.map((d) => {
                const selected = days.includes(d.code);
                return (
                  <Chip
                    key={d.code}
                    size="small"
                    label={d.label}
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => toggleDay(d.code)}
                    sx={{
                      color: selected ? 'white' : 'text.primary',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: selected ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  />
                );
              })}
            </Stack>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={t("reportFrom")}
              type="time"
              size="small"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              fullWidth
              inputProps={{ step: 300 }}
            />
            <TextField
              label={t("reportTo")}
              type="time"
              size="small"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              fullWidth
              inputProps={{ step: 300 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('sharedCancel') || 'Vazgeç'}</Button>
          <Button onClick={handleCreate} variant="contained">
            {t('sharedCreate') || 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const EditDialog = ({ open, onClose, initial }) => {
    const [data, setData] = useState(null);
    const [uiNotificators, setUiNotificators] = useState({});
    const [useCalendar, setUseCalendar] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState(null);
    const [createCalOpen, setCreateCalOpen] = useState(false);

    const smsDisabled = !smsLimit || Number(smsLimit) <= 1;
    const pushoverDisabled = !smsLimit || Number(smsLimit) <= 1;

    useEffect(() => {
      if (!initial) return;
      setData(initial);
      const ui = {};
      onlyUINotificators(initial.notificators).forEach((n) => (ui[n] = true));
      setUiNotificators(ui);
      setUseCalendar(!!initial.calendarId);
      setSelectedCalendarId(initial.calendarId || null);
    }, [initial]);

    const calendarDesc = useMemo(() => {
      if (!selectedCalendarId) return '';
      const c = calendars.find((c) => c.id === selectedCalendarId);
      return c ? describeICal(c.data, t) : '';
    }, [selectedCalendarId, calendars]);

    const alarmBadges = useMemo(() => {
      if (!data || data.type !== 'alarm') return null;
      const keys = (data.attributes?.alarms || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!keys.length) return null;
      return (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
          {keys.map((k) => (
            <Chip
              key={k}
              size="small"
              label={`• ${translateAlarmKey(k, t)}`}
              variant="outlined"
            />
          ))}
        </Stack>
      );
    }, [data]);

    const handleSave = async () => {
      if (!data) return;
      const payload = { ...data, _uiNotificators: uiNotificators };
      payload.calendarId = useCalendar && selectedCalendarId ? selectedCalendarId : 0;
      await saveNotification(payload);
      onClose(true);
    };

    if (!data) return null; // Hook sırası korunmalı

    return (
      <>
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
          <DialogTitle>🛠️ {t('sharedEdit') || 'Bildirimi Düzenle'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                🔧 {data.type === 'alarm'
                  ? t('alarmGeneral') || 'Alarm'
                  : eventLabel(data.type, t)}
              </Typography>

              {alarmBadges}

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                  🔔 {t('sharedChannels') || 'Bildirim Kanalları'}
                </Typography>
                <FormGroup>
                  {NOTIFICATOR_UI.map((key) => {
                    // --- Görünürlük kontrolü
                    if (key === 'pushover') {
                      let show = false;

                      if (data.type === 'alarm') {
                        if (data.always) {
                          // 🌍 Global alarm — attributes üzerinden kontrol
                          const alarms = (data.attributes?.alarms || '')
                            .split(',')
                            .map(s => s.trim().toLowerCase());

                          show = alarms.includes('vibration') || alarms.includes('powercut');
                        } else {
                          // 🚗 Cihaza özel alarm — description üzerinden kontrol
                          const [alarmType] = (data.description || '')
                            .split(',')
                            .map(s => s.trim().toLowerCase());
                          show = shouldShowPushover(data.type, alarmType);
                        }
                      } else {
                        // 🧭 Diğer event tipleri
                        show = shouldShowPushover(data.type, null);
                      }

                      if (!show) return null;
                    }

                    if (key === 'mail') {
                      const [alarmType] = (data.description || '')
                        .split(',')
                        .map(s => s.trim().toLowerCase());

                      const show = shouldShowMail(
                        data.type,
                        data.type === 'alarm' ? alarmType : null
                      );

                      if (!show) return null;
                    }

                    const disabled =
                      (key === 'sms' && smsDisabled) ||
                      (key === 'pushover' && pushoverDisabled);
                    return (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            size="small"
                            checked={uiNotificators[key] || false}
                            onChange={(e) =>
                              setUiNotificators((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            disabled={disabled}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              color: disabled ? 'text.disabled' : 'text.primary',
                            }}
                          >
                            {NOTIFICATOR_ICONS[key]}{' '}
                            {t(`notificator${key.charAt(0).toUpperCase()}${key?.slice(1)}`)}
                          </Typography>
                        }
                      />
                    );
                  })}
                </FormGroup>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                  ⏰ {t('positionValid')} {t('commandTimezone')}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={useCalendar}
                      onChange={(e) => setUseCalendar(e.target.checked)}
                    />
                  }
                  label={t('positionValid') + " " + t('commandSetTimezone') + "?" || 'Belirli saatlerde geçerli olsun mu?'}
                />

                {useCalendar && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('records') || 'Kayıtlı Zamanlar'}</InputLabel>
                      <Select
                        label={t('records') || 'Önceki ayarlarınız'}
                        value={selectedCalendarId || ''}
                        onChange={(e) => setSelectedCalendarId(e.target.value)}
                        renderValue={(val) => {
                          if (!val) return <em>{t('calendarSelect') || 'Seçiniz'}</em>;
                          const c = calendars.find((m) => m.id === val);
                          return c ? describeICal(c.data, t) : val;
                        }}
                      >
                        {calendars.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {describeICal(c.data, t)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="outlined"
                      onClick={() => setCreateCalOpen(true)}
                      startIcon={<AddIcon />}
                    >
                      {t('sharedAdd') || 'Yeni ekle'}
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => onClose(false)}>{t('sharedCancel') || 'Vazgeç'}</Button>
            <Button onClick={handleSave} variant="contained">
              {t('sharedSave') || 'Kaydet'}
            </Button>
          </DialogActions>
        </Dialog>

        <CalendarCreateDialog
          open={createCalOpen}
          onClose={() => setCreateCalOpen(false)}
          onCreated={(created) => setSelectedCalendarId(created.id)}
        />
      </>
    );
  };



  const CreateDialog = ({ open, onClose }) => {
    const [mode, setMode] = useState('event'); // 'event' | 'alarm'
    const [eventType, setEventType] = useState(NOTIFICATION_TYPES[0]);
    const [alarmGroup, setAlarmGroup] = useState(ALARM_GROUPS[0].key);

    const [uiNotificators, setUiNotificators] = useState({
      firebase: true, // default açık
      mail: false,
      sms: false,
      pushover: false,
    });

    const [useCalendar, setUseCalendar] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState('');
    const [createCalOpen, setCreateCalOpen] = useState(false);

    const smsDisabled = !smsLimit || Number(smsLimit) <= 1;
    const pushoverDisabled = !smsLimit || Number(smsLimit) <= 1;
    const alarmBadges = useMemo(() => {
      if (mode !== 'alarm') return null;

      const group = ALARM_GROUPS.find((g) => g.key === alarmGroup);
      if (!group || !group.alarms?.length) return null;

      return (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            flexWrap: 'wrap',
            mt: 1,
          }}
        >
          {group.alarms.map((a) => (
            <Chip
              key={a}
              size="small"
              label={translateAlarmKey(a, t)}
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          ))}
        </Stack>
      );
    }, [mode, alarmGroup, t]);

    const handleCreateSave = async () => {
      let draft;
      if (mode === 'event') {
        draft = createDefaultNotificationBody(eventType);
      } else {
        const group = ALARM_GROUPS.find((g) => g.key === alarmGroup);
        draft = createDefaultNotificationBody('alarm', group);
      }
      // 📌 description alanına cihaz adını ekleyelim
      if (deviceName) {
        // Eğer description varsa sonuna ekle
        draft.description = draft.description
          ? `${draft.description},${deviceName}`
          : deviceName;
      }
      // notificators
      const selectedUi = NOTIFICATOR_UI?.filter((k) => uiNotificators[k]);
      draft.notificators = Array.from(new Set([...selectedUi, ...BACKEND_MANDATORY])).join(',');

      // calendar
      if (useCalendar && selectedCalendarId) {
        draft.calendarId = selectedCalendarId;
      }

      const created = await createNotification(draft);
      if (created) {
        onClose(true);
      } else {
        onClose(false);
      }
    };

    return (
      <>
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
          <DialogTitle>➕ {t('sharedAdd') || 'Yeni Bildirim Ekle'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>🎯 {t('sharedType') || 'Tür'}</InputLabel>
                <Select
                  label={t('sharedType') || 'Tür'}
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <MenuItem value="event">{t('reportEvents') || 'Olay'}</MenuItem>
                  <MenuItem value="alarm">{t('eventAlarm') || 'Alarm'}</MenuItem>
                </Select>
              </FormControl>

              {mode === 'event' ? (
                <FormControl size="small" fullWidth>
                  <InputLabel>📋 {t('sharedEventType') || 'Olay Tipi'}</InputLabel>
                  <Select
                    label={t('sharedEventType') || 'Olay Tipi'}
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    {NOTIFICATION_TYPES.map((tp) => (
                      <MenuItem key={tp} value={tp}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getTypeIcon(tp)}
                          <span>{eventLabel(tp, t)}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl size="small" fullWidth>
                  <InputLabel>🚨 {t('alarmGeneral') || 'Alarm Grubu'}</InputLabel>
                  <Select
                    label={t('alarmGeneral') || 'Alarm Grubu'}
                    value={alarmGroup}
                    onChange={(e) => setAlarmGroup(e.target.value)}
                  >
                    {ALARM_GROUPS.map((g) => (
                      <MenuItem key={g.key} value={g.key}>
                        {t(g.label)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {mode === 'alarm' && alarmBadges}
              <Divider />

              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                  🔔 {t('notificationNotificators')}
                </Typography>
                <FormGroup>
                  {NOTIFICATOR_UI.map((key) => {
                    // --- Görünürlük kontrolü
                    if (key === 'pushover') {
                      const show = shouldShowPushover(
                        mode === 'alarm' ? 'alarm' : eventType,
                        mode === 'alarm' ? alarmGroup : null
                      );
                      if (!show) return null;
                    }

                    if (key === 'mail') {
                      const show = shouldShowMail(mode === 'alarm' ? 'alarm' : eventType,
                        mode === 'alarm' ? alarmGroup : null);
                      if (!show) return null;
                    }
                    const disabled =
                      (key === 'sms' && smsDisabled) ||
                      (key === 'pushover' && pushoverDisabled);
                    return (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            size="small"
                            checked={uiNotificators[key]}
                            onChange={(e) =>
                              setUiNotificators((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            disabled={disabled}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              color: disabled ? 'text.disabled' : 'text.primary',
                            }}
                          >
                            {NOTIFICATOR_ICONS[key]}{' '}
                            {t(`notificator${key.charAt(0).toUpperCase()}${key?.slice(1)}`)}
                          </Typography>
                        }
                      />
                    );
                  })}
                </FormGroup>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                  ⏰ {t('reportTimeType') || 'Zaman'}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={useCalendar}
                      onChange={(e) => setUseCalendar(e.target.checked)}
                    />
                  }
                  label={t('positionValid') + " " + t('commandSetTimezone') + "?" || 'Belirli saatlerde geçerli olsun mu?'}
                />
                {useCalendar && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('records') || 'Önceki ayarlarınız'}</InputLabel>
                      <Select
                        label={t('calendarChoose') || 'Önceki ayarlarınız'}
                        value={selectedCalendarId}
                        onChange={(e) => setSelectedCalendarId(e.target.value)}
                        displayEmpty
                        renderValue={(val) => {
                          if (!val) return <em>{t('calendarSelect') || ''}</em>;
                          const c = calendars.find((m) => m.id === val);
                          return c ? describeICal(c.data, t) : val;
                        }}
                      >
                        {calendars.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {describeICal(c.data, t)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={() => setCreateCalOpen(true)}
                      startIcon={<AddIcon />}
                    >
                      {t('sharedAdd') || 'Yeni ekle'}
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => onClose(false)}>{t('sharedCancel') || 'Vazgeç'}</Button>
            <Button onClick={handleCreateSave} variant="contained">
              {t('sharedCreate') || 'Oluştur'}
            </Button>
          </DialogActions>
        </Dialog>

        <CalendarCreateDialog
          open={createCalOpen}
          onClose={() => setCreateCalOpen(false)}
          onCreated={(created) => setSelectedCalendarId(created.id)}
        />
      </>
    );
  };

  // --- Kart UI ---
  const NotificationCards = ({ n }) => {
    const [expanded, setExpanded] = useState(false);
    const uiNotifs = onlyUINotificators(n.notificators);
    const hasCalendar = !!n.calendarId;

    const isAlarm = n.type === 'alarm';
    const alarmKeys = isAlarm
      ? (n.attributes?.alarms || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      : [];

    // 🔠 Başlık metni oluştur
    let title = '';
    let icon = getTypeIcon(n.type);

    if (isAlarm) {
      // Description içindeki alarm grup key'ini al
      const descKey = (n.description || '').split(',')[0].trim().toLowerCase();

      // Eğer ALARM_GROUPS'ta bu key varsa çevirisini bul
      const matchedGroup = ALARM_GROUPS.find((g) => g.key === descKey);
      if (matchedGroup) {
        title = t(matchedGroup.label) || matchedGroup.label;
      } else {
        title = t('sharedAlarms') || 'Alarm';
      }
    } else {
      title = eventLabel(n.type, t);
    }

    // Eğer takvim varsa, özet oluştur
    let calendarSummary = '';
    if (hasCalendar) {
      const c = calendars.find((x) => x.id === n.calendarId);
      if (c) {
        calendarSummary = describeICal(c.data, t).replace(/^🗓️\s*/, '');
      }
    }

    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          px: 1.5,
          py: 1,
          cursor: 'pointer',
          transition: '0.25s',
          '&:hover': { boxShadow: 3, borderColor: 'primary.light' },
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* --- ÜST BAŞLIK (KAPALI HAL) --- */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {/* Sol taraf */}
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Üst satır: ikon + başlık + tüm araçlar etiketi */}
            <Box display="flex" alignItems="center" gap={1}>
              {icon}
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ flexShrink: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {title}
              </Typography>

              {n.always && (
                <Chip
                  size="small"
                  label={"🚗 " + t("notificationAlways")}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                  }}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Alt satır: calendar özeti */}
            {calendarSummary && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  ml: 4.5, // ikon hizasına boşluk
                  mt: 0.2,
                  display: 'block',
                }}
              >
                ⌛ {calendarSummary}
              </Typography>
            )}
          </Box>

          {/* Sağ taraf: notificator simgeleri + expand oku */}
          <Stack direction="row" spacing={0.6} alignItems="center">
            {uiNotifs.map((x) => (
              <Typography key={x} sx={{ fontSize: '1.2rem' }}>
                {NOTIFICATOR_ICONS[x]}
              </Typography>
            ))}
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.2s',
                opacity: 0.7,
              }}
            />
          </Stack>
        </Box>

        {/* --- DETAY (AÇILDIĞINDA) --- */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />

          {/* Alarm etiketleri */}
          {!!alarmKeys.length && (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                flexWrap: 'wrap',
                overflow: 'hidden',
                mb: 1,
              }}
            >
              {alarmKeys.map((k) => (
                <Chip
                  key={k}
                  size="small"
                  label={translateAlarmKey(k, t)}
                  variant="outlined"
                  sx={{ fontSize: '0.8rem', height: 26 }}
                />
              ))}
            </Stack>
          )}

          {/* Düzenle / Sil butonları */}
          <Stack direction="row" spacing={1}>
            <Tooltip title={t('sharedEdit')}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(n); }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('sharedDelete')}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(n); }}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Collapse>
      </Card>
    );
  };



  return (
    <PageLayout menu={""} breadcrumbs={['sharedDevice', 'sharedNotifications']}>
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 2.5, md: 3 }, // 👈 Kenarlardan boşluk
            py: 1,
            mb: 1,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`, // alt çizgi (isteğe bağlı)
          }}
        >
          {/* Sol taraf: Başlık + Araç adı */}
          <Box
            sx={{
              flexWrap: 'row',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Typography
              variant="h7"
              fontWeight={800}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {t('sharedNotifications') || 'Bildirimler'} {deviceName}
            </Typography>

            <TextField
              size="small"
              placeholder={t('sharedSearch') || 'Ara…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 110, maxWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box
            sx={{
              ml: 'auto',                 // varsa soldaki başlıktan kendini sağa iter
              display: 'flex',
              justifyContent: 'flex-end', // içerikleri sağa hizala
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',           // daralınca alt satıra geçsin
              width: '100%',              // satırın tamamını kullan (wrap daha iyi çalışır)
            }}
          >
            <IconButton color="success" size="medium" onClick={() => setSnackbarOpen(true)}>
              <HelpOutlineIcon fontSize="medium" />
            </IconButton>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              disabled={!deviceId}
            >
              {t('sharedAdd') || 'Yeni Bildirim'}
            </Button>
          </Box>
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={20000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            {'Bildirimler modüler bir yapıya sahiptir. Her araç için farklı bildirimler tanımlayabilir, aynı bildirim tipini birden fazla kez ekleyerek günün farklı saatlerine özel kurallar oluşturabilirsiniz. Örneğin: gece alarm durumlarında “telefonla arama”, gündüz ise yalnızca “uygulama bildirimi” alacak şekilde yapılandırabilirsiniz.'}
          </Alert>
        </Snackbar>

        {loading ? (
          <Typography variant="body2">{t('sharedLoading') || 'Yükleniyor...'}</Typography>
        ) : (
          <Grid container spacing={1}>
            {filteredCards.map((n) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={n.id}>
                <NotificationCards n={n} />
              </Grid>
            ))}

            {filteredCards.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  {t('sharedNoResults') || 'Aramanızla eşleşen bildirim bulunamadı.'}
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* Silme Onayı */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle>{t('sharedDelete') || 'Sil'}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {deleteConfirm?.isGlobal
                ? (t('warnDeleteGlobal') ||
                  'Bu bildirim tüm araçlar için aktif. Diğer araçlarınız için de tek tek bildirim eklemeniz gerekir.')
                : (t('warnDeleteDevice') || 'Bu bildirim sadece bu araç için geçerlidir.')}
            </Typography>
            <Alert severity="error">
              {t('confirmAreYouSure') || 'Bu işlemi onaylıyor musunuz?'}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>{t('sharedCancel') || 'Vazgeç'}</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              {t('sharedYes') || 'Evet'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Düzenleme */}
        <EditDialog
          open={editOpen}
          onClose={(refresh) => {
            setEditOpen(false);
            setEditData(null);
            if (refresh) fetchNotifications();
          }}
          initial={editData}
        />

        {/* Ekle */}
        <CreateDialog
          open={createOpen}
          onClose={(refresh) => {
            setCreateOpen(false);
            if (refresh) fetchNotifications();
          }}
        />
      </Box>
    </PageLayout>
  );
};

export default NotificationCard;
