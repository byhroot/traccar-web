import { useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Autocomplete,
  TextField,
  createFilterOptions,
  Button,
  Switch,
  Box,
  Paper,
  Stack,
  Divider,
  useTheme, alpha  // <--- Buraya ekle
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CachedIcon from '@mui/icons-material/Cached';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import MapIcon from '@mui/icons-material/Map';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import InfoIcon from '@mui/icons-material/Info';

import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import useMapStyles from '../map/core/useMapStyles';
import useMapOverlays from '../map/overlay/useMapOverlays';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

import alert from '../../src/resources/alert.mp3';
import alert2 from '../../src/resources/alert2.mp3';
import alert3 from '../../src/resources/alert3.mp3';
import alert4 from '../../src/resources/alert4.mp3';
import alert5 from '../../src/resources/alert5.mp3';
import alert6 from '../../src/resources/alert6.mp3';
import sound from '../../src/resources/sound.mp3';
import sound2 from '../../src/resources/sound2.mp3';
import sound3 from '../../src/resources/sound3.mp3';
import sound4 from '../../src/resources/sound4.mp3';
import sound5 from '../../src/resources/sound5.mp3';
import sound6 from '../../src/resources/sound6.mp3';
import LanguageSwitch from '../main/LanguageSwitch';

const deviceFields = [
  { id: 'name', name: 'sharedName' },
  { id: 'uniqueId', name: 'deviceIdentifier' },
  { id: 'phone', name: 'sharedPhone' },
  { id: 'model', name: 'deviceModel' },
  { id: 'contact', name: 'deviceContact' },
  { id: 'geofenceIds', name: 'sharedGeofence' },
  { id: 'driverUniqueId', name: 'sharedDriver' },
  { id: 'motion', name: 'positionMotion' },
];

const soundFiles = [
  { id: 'sound', name: 'Sound', file: sound },
  { id: 'sound2', name: 'Sound 2', file: sound2 },
  { id: 'sound3', name: 'Sound 3', file: sound3 },
  { id: 'sound4', name: 'Sound 4', file: sound4 },
  { id: 'sound5', name: 'Sound 5', file: sound5 },
  { id: 'sound6', name: 'Sound 6', file: sound6 },
  { id: 'alert', name: 'Alert', file: alert },
  { id: 'alert2', name: 'Alert 2', file: alert2 },
  { id: 'alert3', name: 'Alert 3', file: alert3 },
  { id: 'alert4', name: 'Alert 4', file: alert4 },
  { id: 'alert5', name: 'Alert 5', file: alert5 },
  { id: 'alert6', name: 'Alert 6', file: alert6 },
];

const playSound = (file) => {
  const audio = new Audio(file);
  audio.play();
};

const PreferencesPage = () => {
  const { classes } = useSettingsStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const user = useSelector((state) => state.session.user);
  const [attributes, setAttributes] = useState(user.attributes);
  const selectedSoundFile = soundFiles.find(sound => sound.id === attributes.notificationSound);

  const versionApp = import.meta.env.VITE_APP_VERSION;
  const versionServer = useSelector((state) => state.session.server.version);
  const socket = useSelector((state) => state.session.socket);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(
    dayjs().add(1, 'week').locale('en').format('YYYY-MM-DD'),
  );

  const mapStyles = useMapStyles();
  const mapOverlays = useMapOverlays();

  const positionAttributes = usePositionAttributes(t);
  const filter = createFilterOptions();

  const generateToken = useCatch(async () => {
    const expiration = dayjs(tokenExpiration, 'YYYY-MM-DD').toISOString();
    const response = await fetchOrThrow('/api/session/token', {
      method: 'POST',
      body: new URLSearchParams(`expiration=${expiration}`),
    });
    setToken(await response.text());
  });

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const handleSave = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
    navigate(-1);
  });

  const handleReboot = useCatch(async () => {
    const response = await fetch('/api/server/reboot', { method: 'POST' });
    throw Error(response.statusText);
  });

  // Ortak Accordion Stili (Yüzen Kart Görünümü)
  const accordionStyle = {
    mb: 2,
    borderRadius: '16px !important',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    '&:before': { display: 'none' }, // MUI'nin varsayılan üst çizgisini kaldırır
    overflow: 'hidden'
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedPreferences']}>
      {/* Container boyutunu "sm" yaparak elementlerin daha ferah durmasını sağladık */}
      <Container maxWidth="sm" sx={{ py: 3 }}>

        {/* ☁️ Bulut Senkronizasyon Kartı */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            flex: 1,
            borderRadius: 4,
            position: 'relative', // Sağ üstteki dil seçiciyi konumlandırmak için şart
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 149, 158, 0.15)' : '#e0f7fa',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 149, 158, 0.3)' : '#b2ebf2'}`,
            display: 'flex',
            alignItems: 'center', // İkon ve metni dikeyde ortalar
            gap: 2,
            // Mobilde dil seçicinin metne çok yaklaşmaması için üstten biraz daha fazla boşluk
            pt: { xs: 2.5, sm: 2.5 }
          }}
        >
          {/* 🌍 Dil Seçici (Sağ Üst Köşe) */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2
            }}
          >
            <LanguageSwitch />
          </Box>

          {/* ☁️ Bulut İkonu */}
          {/* ☁️ Animasyonlu Veri Senkronizasyonu İkonu */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              bgcolor: 'primary.main',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              // Arka plandaki dairesel genişleme (Pulse)
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `2px solid ${theme.palette.primary.main}`,
                animation: 'ripple 2s infinite ease-out',
              },
              '@keyframes ripple': {
                '0%': { transform: 'scale(1)', opacity: 1 },
                '100%': { transform: 'scale(1.6)', opacity: 0 },
              }
            }}
          >
            {/* Ana Bulut Simgesi */}
            <CloudDoneIcon sx={{ fontSize: 30, position: 'absolute', opacity: 1.8 }} />

            {/* Dönen Senkronizasyon Simgesi */}
            <CachedIcon
              sx={{
                fontSize: 25,
                animation: 'spin 2s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          </Box>

          {/* 📝 Metin Alanı */}
          <Box sx={{ pr: { xs: 0, sm: 4 } }}> {/* Sağ taraftan dil seçici için boşluk bırakır */}
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main" sx={{ lineHeight: 1.2, mb: 0.5 }}>
              {t("settingsTitle")} & {t("loginLanguage")} ✨
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '95%' }}>
              Ayarlarınız <b>oturum açtığınız tüm telefonlarda otomatik olarak senkronize</b> edilir.
            </Typography>
          </Box>
        </Paper>

        {!readonly && (
          <>
            {/* 🗺️ HARİTA AYARLARI */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <MapIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="600">{t('mapTitle')}</Typography>
                </Box>
              </AccordionSummary>
              <Divider />
              <AccordionDetails sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('mapActive')}</InputLabel>
                    <Select
                      label={t('mapActive')}
                      value={attributes.activeMapStyles?.split(',') || ['custom', 'locationIqDark', 'openFreeMap']}
                      onChange={(e, child) => {
                        const clicked = mapStyles.find((s) => s.id === child.props.value);
                        if (clicked.available) {
                          setAttributes({ ...attributes, activeMapStyles: e.target.value.join(',') });
                        } else if (clicked.id !== 'custom') {
                          const query = new URLSearchParams({ attribute: clicked.attribute });
                          navigate(`/settings/user/${user.id}?${query.toString()}`);
                        }
                      }}
                      multiple
                    >
                      {mapStyles.map((style) => (
                        <MenuItem key={style.id} value={style.id}>
                          <Typography component="span" color={style.available ? 'textPrimary' : 'error'}>
                            {style.title}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {admin && (
                    <FormControl fullWidth>
                      <InputLabel>{t('mapOverlay')}</InputLabel>
                      <Select
                        label={t('mapOverlay')}
                        value={attributes.selectedMapOverlay || ''}
                        onChange={(e) => {
                          const clicked = mapOverlays.find((o) => o.id === e.target.value);
                          if (!clicked || clicked.available) {
                            setAttributes({ ...attributes, selectedMapOverlay: e.target.value });
                          } else if (clicked.id !== 'custom') {
                            const query = new URLSearchParams({ attribute: clicked.attribute });
                            navigate(`/settings/user/${user.id}?${query.toString()}`);
                          }
                        }}
                      >
                        <MenuItem value="">{'\u00a0'}</MenuItem>
                        {mapOverlays.map((overlay) => (
                          <MenuItem key={overlay.id} value={overlay.id}>
                            <Typography component="span" color={overlay.available ? 'textPrimary' : 'error'}>
                              {overlay.title}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {admin && (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={Object.keys(positionAttributes)}
                      getOptionLabel={(option) => {
                        if (typeof option === 'object' && option.inputValue) return option.inputValue;
                        return positionAttributes[option]?.name || option;
                      }}
                      value={attributes.positionItems?.split(',') || ['fixTime', 'address', 'speed', 'totalDistance']}
                      onChange={(_, newValue) => {
                        setAttributes({
                          ...attributes,
                          positionItems: newValue.map((x) => (typeof x === 'string' ? x : x.inputValue)).join(','),
                        });
                      }}
                      filterOptions={(options, params) => {
                        const filtered = filter(options, params);
                        if (params.inputValue && !options.includes(params.inputValue)) {
                          filtered.push({
                            inputValue: params.inputValue,
                            name: `${t('sharedAdd')} "${params.inputValue}"`,
                          });
                        }
                        return filtered;
                      }}
                      renderOption={(props, option) => (
                        <li {...props}>
                          {option.name ? option.name : positionAttributes[option]?.name || option}
                        </li>
                      )}
                      renderInput={(params) => <TextField {...params} label={t('attributePopupInfo')} />}
                    />
                  )}

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>{t('mapLiveRoutes')}</InputLabel>
                      <Select
                        label={t('mapLiveRoutes')}
                        value={attributes.mapLiveRoutes || 'none'}
                        onChange={(e) => setAttributes({ ...attributes, mapLiveRoutes: e.target.value })}
                      >
                        <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                        <MenuItem value="selected">{t('deviceSelected')}</MenuItem>
                        <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>{t('mapDirection')}</InputLabel>
                      <Select
                        label={t('mapDirection')}
                        value={attributes.mapDirection || 'selected'}
                        onChange={(e) => setAttributes({ ...attributes, mapDirection: e.target.value })}
                      >
                        <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                        <MenuItem value="selected">{t('deviceSelected')}</MenuItem>
                        <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>

                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
                    <FormGroup>
                      <FormControlLabel
                        control={<Switch color="primary" checked={attributes.hasOwnProperty('oldStatusCard') ? attributes.oldStatusCard : false} onChange={(e) => setAttributes({ ...attributes, oldStatusCard: e.target.checked })} />}
                        label="Eski Araç Kartı Tasarımı (Tıklanınca açılan bilgi)"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={attributes.hasOwnProperty('mapGeofences') ? attributes.mapGeofences : true} onChange={(e) => setAttributes({ ...attributes, mapGeofences: e.target.checked })} />}
                        label={t('attributeShowGeofences')}
                      />
                      <FormControlLabel
                        control={<Checkbox checked={attributes.hasOwnProperty('mapFollow') ? attributes.mapFollow : false} onChange={(e) => setAttributes({ ...attributes, mapFollow: e.target.checked })} />}
                        label={t('deviceFollow')}
                      />
                      <FormControlLabel
                        control={<Checkbox checked={attributes.hasOwnProperty('mapCluster') ? attributes.mapCluster : true} onChange={(e) => setAttributes({ ...attributes, mapCluster: e.target.checked })} />}
                        label={t('mapClustering')}
                      />
                      <FormControlLabel
                        control={<Checkbox checked={attributes.hasOwnProperty('mapOnSelect') ? attributes.mapOnSelect : true} onChange={(e) => setAttributes({ ...attributes, mapOnSelect: e.target.checked })} />}
                        label={t('mapOnSelect')}
                      />
                    </FormGroup>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* 📱 CİHAZ AYARLARI */}
            {admin && (
              <Accordion sx={accordionStyle}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <SmartphoneIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="600">{t('deviceTitle')}</Typography>
                  </Box>
                </AccordionSummary>
                <Divider />
                <AccordionDetails sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <SelectField
                      value={attributes.devicePrimary || 'name'}
                      onChange={(e) => setAttributes({ ...attributes, devicePrimary: e.target.value })}
                      data={deviceFields}
                      titleGetter={(it) => t(it.name)}
                      label={t('devicePrimaryInfo')}
                    />
                    <SelectField
                      value={attributes.deviceSecondary}
                      onChange={(e) => setAttributes({ ...attributes, deviceSecondary: e.target.value })}
                      data={deviceFields}
                      titleGetter={(it) => t(it.name)}
                      label={t('deviceSecondaryInfo')}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* 🔔 BİLDİRİM SESLERİ */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <NotificationsActiveIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="600">{t('notificationSound')}</Typography>
                </Box>
              </AccordionSummary>
              <Divider />
              <AccordionDetails sx={{ p: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('notificationSound')}</InputLabel>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Select
                      value={attributes.notificationSound || 'default'}
                      onChange={(e) => setAttributes({ ...attributes, notificationSound: e.target.value })}
                      sx={{ flex: 1 }}
                      label={t('notificationSound')}
                    >
                      {soundFiles.map((sound) => (
                        <MenuItem key={sound.id} value={sound.id}>
                          {sound.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton
                      color="primary"
                      sx={{ bgcolor: 'action.hover', width: 48, height: 48 }}
                      onClick={() => selectedSoundFile && playSound(selectedSoundFile.file)}
                      disabled={!selectedSoundFile}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Box>
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* 🎵 DİĞER SES OLAYLARI */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <VolumeUpIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="600">{t('sharedSound')}</Typography>
                </Box>
              </AccordionSummary>
              <Divider />
              <AccordionDetails sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <SelectField
                    multiple
                    value={attributes.soundEvents?.split(',') || []}
                    onChange={(e) => setAttributes({ ...attributes, soundEvents: e.target.value.join(',') })}
                    endpoint="/api/notifications/types"
                    keyGetter={(it) => it.type}
                    titleGetter={(it) => t(prefixString('event', it.type))}
                    label={t('eventsSoundEvents')}
                  />
                  <SelectField
                    multiple
                    value={attributes.soundAlarms?.split(',') || ['sos']}
                    onChange={(e) => setAttributes({ ...attributes, soundAlarms: e.target.value.join(',') })}
                    data={alarms}
                    keyGetter={(it) => it.key}
                    label={t('eventsSoundAlarms')}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {/* 🔑 API TOKEN */}
        <Accordion sx={accordionStyle}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <VpnKeyIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="600">{t('userToken')}</Typography>
            </Box>
          </AccordionSummary>
          <Divider />
          <AccordionDetails sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField
                label={t('userExpirationTime')}
                type="date"
                fullWidth
                value={tokenExpiration}
                onChange={(e) => {
                  setTokenExpiration(e.target.value);
                  setToken(null);
                }}
              />
              <FormControl fullWidth>
                <OutlinedInput
                  multiline
                  rows={4}
                  readOnly
                  type="text"
                  value={token || ''}
                  placeholder="Token oluşturmak için butona tıklayın"
                  endAdornment={
                    <InputAdornment position="end">
                      <Stack spacing={1}>
                        <IconButton size="small" color="primary" onClick={generateToken} disabled={!!token}>
                          <CachedIcon />
                        </IconButton>
                        <IconButton size="small" color="secondary" onClick={() => navigator.clipboard.writeText(token)} disabled={!token}>
                          <ContentCopyIcon />
                        </IconButton>
                      </Stack>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {!readonly && (
          <>
            {/* ℹ️ SİSTEM BİLGİSİ */}
            <Accordion sx={accordionStyle}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <InfoIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="600">{t('sharedInfoTitle')}</Typography>
                </Box>
              </AccordionSummary>
              <Divider />
              <AccordionDetails sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <TextField value={versionApp} label={t('settingsAppVersion')} disabled fullWidth />
                  <TextField value={versionServer || '-'} label={t('settingsServerVersion')} disabled fullWidth />
                  <TextField
                    value={socket ? t('deviceStatusOnline') : t('deviceStatusOffline')}
                    label={t('settingsConnection')}
                    disabled
                    fullWidth
                  />
                  {admin && (
                    <Stack direction="row" spacing={2} mt={2}>
                      <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/emulator')}>
                        {t('sharedEmulator')}
                      </Button>
                      <Button variant="outlined" color="error" fullWidth onClick={handleReboot}>
                        {t('serverReboot')}
                      </Button>
                    </Stack>
                  )}
                </Stack>
                {/* 🧹 LOCAL STORAGE TEMİZLEME */}
                {/* 🧹 LOCAL STORAGE TEMİZLEME */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mt: 3,
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                  }}
                >
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <InfoIcon color="warning" />
                      <Typography variant="subtitle1" fontWeight="600">
                        Yerel Verileri Temizle
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Uygulamada cihazda saklanan tüm geçici veriler temizlenir.
                      Sonrasında uygulamayı yeniden başlatmanız gerekebilir.
                    </Typography>

                    {!showClearConfirm ? (
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => setShowClearConfirm(true)}
                        sx={{
                          borderRadius: 3,
                          py: 1.2,
                          fontWeight: 'bold',
                        }}
                      >
                        Tüm Verileri Temizle
                      </Button>
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(244,67,54,0.08)'
                              : 'rgba(244,67,54,0.04)',
                        }}
                      >
                        <Stack spacing={2}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Bu işlem geri alınamaz. Tüm localStorage ve
                            sessionStorage verileri silinecek.
                          </Typography>

                          <Stack direction="row" spacing={1}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => setShowClearConfirm(false)}
                              sx={{ borderRadius: 3 }}
                            >
                              Vazgeç
                            </Button>

                            <Button
                              fullWidth
                              variant="contained"
                              color="error"
                              onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                              }}
                              sx={{
                                borderRadius: 3,
                                fontWeight: 'bold',
                              }}
                            >
                              Evet, Temizle
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              </AccordionDetails>
            </Accordion>

            {/* 💾 KAYDET / İPTAL BUTONLARI */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4, mb: 2 }}>
              <Button
                type="button"
                color="inherit"
                variant="text"
                onClick={() => navigate(-1)}
                sx={{ flex: 1, borderRadius: 8, py: 1.5, fontWeight: 'bold' }}
              >
                {t('sharedCancel')}
              </Button>
              <Button
                type="button"
                color="primary"
                variant="contained"
                onClick={handleSave}
                sx={{ flex: 2, borderRadius: 8, py: 1.5, fontWeight: 'bold', boxShadow: 4 }}
              >
                {t('sharedSave')}
              </Button>
            </Box>
          </>
        )}
      </Container>
    </PageLayout>
  );
};

export default PreferencesPage;