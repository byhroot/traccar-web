import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Switch, Accordion, AccordionSummary, AccordionDetails, Typography, Container, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup, InputAdornment, IconButton, OutlinedInput, Autocomplete, TextField, createFilterOptions, Button,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { styled } from "@mui/material/styles";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CachedIcon from '@mui/icons-material/Cached';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
import { useAdministrator, useManager, useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
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
import DarkmodeSwicth from '../main/DarkmodeSwicth';
import LanguageSwitch from '../main/LanguageSwitch';

const ua = navigator.userAgent || "";
const uaData = navigator.userAgentData || {};
const platform = uaData.platform || navigator.platform || "";

// Apple cihazlarını algıla (iPhone, iPad, iPod veya dokunmatik Mac)
const isAppleDevice =
  /iPhone|iPad|iPod/i.test(ua) ||
  (/Mac/i.test(platform) && navigator.maxTouchPoints > 1);

// Android cihazlarını algıla (yeni userAgentData desteğiyle)
const isAndroidDevice =
  uaData.mobile && /Android/i.test(ua);

// Web masaüstü cihazlarını algıla (Windows, macOS, Linux)
const isWebDevice = !isAppleDevice && !isAndroidDevice;

const deviceFields = [
  { id: 'name', name: 'sharedName' },
  { id: 'uniqueId', name: 'deviceIdentifier' },
  { id: 'phone', name: 'sharedPhone' },
  { id: 'model', name: 'deviceModel' },
  { id: 'contact', name: 'deviceContact' },
];

//takipon
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


const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(2),
  },
  buttons: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-evenly',
    '& > *': {
      flexBasis: '33%',
    },
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
  tokenActions: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

const PreferencesPage = () => {
  const classes = useSettingsStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const admin = useAdministrator();
  const manager = useManager();
  const readonly = useRestriction('readonly');

  const user = useSelector((state) => state.session.user);
  const [attributes, setAttributes] = useState(user.attributes);
  const selectedSoundFile = soundFiles.find(sound => sound.id === attributes.notificationSound);

  const versionApp = import.meta.env.VITE_APP_VERSION.slice(0, -2);
  const versionServer = useSelector((state) => state.session.server.version);
  const socket = useSelector((state) => state.session.socket);

  const [token, setToken] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(dayjs().add(1, 'week').locale('en').format('YYYY-MM-DD'));

  const mapStyles = useMapStyles();
  const mapOverlays = useMapOverlays();

  const positionAttributes = usePositionAttributes(t);

  const filter = createFilterOptions();

  const generateToken = useCatch(async () => {
    const expiration = dayjs(tokenExpiration, 'YYYY-MM-DD').toISOString();
    const response = await fetch('/api/session/token', {
      method: 'POST',
      body: new URLSearchParams(`expiration=${expiration}`),
    });
    if (response.ok) {
      setToken(await response.text());
    } else {
      throw Error(await response.text());
    }
  });

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const handleSave = useCatch(async () => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes }),
    });
    if (response.ok) {
      dispatch(sessionActions.updateUser(await response.json()));
      navigate(-1);
    } else {
      throw Error(await response.text());
    }
  });

  const handleReboot = useCatch(async () => {
    const response = await fetch('/api/server/reboot', { method: 'POST' });
    throw Error(response.statusText);
  });


  const [darkMode, setDarkMode] = useState(Boolean(user?.attributes?.darkModeuser));
  
  const handleSaveDarkMode = async (newDarkMode) => {
    try {
      const updatedAttributes = {
        ...user.attributes,
        darkModeuser: newDarkMode,
        activeMapStyles: newDarkMode ? "googleHybrid" : "custom,googleRoad,googleHybrid",
      };
  
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, attributes: updatedAttributes }),
      });
  
      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(sessionActions.updateUser(updatedUser));
        setDarkMode(newDarkMode);
        window.location.reload(); // Sayfayı yenile
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error("Tema güncellenirken hata oluştu:", error);
    }
  };
  

  
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#aab4be",
        ...theme.applyStyles?.("dark", { backgroundColor: "#8796A5" }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#001e3c',
    width: 32,
    height: 32,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
    ...theme.applyStyles('dark', {
      backgroundColor: '#003892',
    }),
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: '#aab4be',
    borderRadius: 20 / 2,
    ...theme.applyStyles('dark', {
      backgroundColor: '#8796A5',
    }),
  },
}));


  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedPreferences']}>
      <Container maxWidth="xs" className={classes.container}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "2hv" }}>
        <FormControlLabel
          control={
            <MaterialUISwitch
              sx={{ m: 1 }}
              checked={darkMode}
              onChange={(e) => handleSaveDarkMode(e.target.checked)}
            />
          }
        />
        <LanguageSwitch />

      </div>



        {!readonly && (
          <>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {t('mapTitle')}
                </Typography>
              </AccordionSummary>
            
              <AccordionDetails className={classes.details}>
               {admin && 
                <FormControl>
                  <InputLabel>{t('mapActive')}</InputLabel>
                  <Select
                    label={t('mapActive')}
                    value={attributes.activeMapStyles?.split(',') || ['locationIqStreets', 'osm', 'carto']}
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
                        <Typography component="span" color={style.available ? 'textPrimary' : 'error'}>{style.title}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                }
                {admin && 

                <FormControl>
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
                        <Typography component="span" color={overlay.available ? 'textPrimary' : 'error'}>{overlay.title}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                }
                {admin && 

                <Autocomplete
                  multiple
                  freeSolo
                  options={Object.keys(positionAttributes)}
                  getOptionLabel={(option) => (positionAttributes[option]?.name || option)}
                  value={attributes.positionItems?.split(',') || ['speed', 'address', 'totalDistance', 'course']}
                  onChange={(_, option) => {
                    setAttributes({ ...attributes, positionItems: option.join(',') });
                  }}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    if (params.inputValue && !filtered.includes(params.inputValue)) {
                      filtered.push(params.inputValue);
                    }
                    return filtered;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('attributePopupInfo')}
                    />
                  )}
                />
                  }
                <FormControl>
                  <InputLabel>{t('mapLiveRoutes')}</InputLabel>
                  <Select
                    label={t('mapLiveRoutes')}
                    value={attributes.mapLiveRoutes || 'all'}
                    onChange={(e) => setAttributes({ ...attributes, mapLiveRoutes: e.target.value })}
                  >
                    <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                    <MenuItem value="selected">{t('deviceSelected')}  </MenuItem>
                    <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>{t('mapDirection')} </InputLabel>
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
                <FormGroup>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={attributes.hasOwnProperty('mapGeofences') ? attributes.mapGeofences : true}
                        onChange={(e) => setAttributes({ ...attributes, mapGeofences: e.target.checked })}
                      />
                    )}
                    label={t('attributeShowGeofences')}
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={attributes.hasOwnProperty('mapFollow') ? attributes.mapFollow : true}
                        onChange={(e) => setAttributes({ ...attributes, mapFollow: e.target.checked })}
                      />
                    )}
                    label={t('deviceFollow')}
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={attributes.hasOwnProperty('mapCluster') ? attributes.mapCluster : false}
                        onChange={(e) => setAttributes({ ...attributes, mapCluster: e.target.checked })}
                      />
                    )}
                    label={t('mapClustering')}
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={attributes.hasOwnProperty('mapOnSelect') ? attributes.mapOnSelect : true}
                        onChange={(e) => setAttributes({ ...attributes, mapOnSelect: e.target.checked })}
                      />
                    )}
                    label={t('mapOnSelect')}
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>
            {admin && 
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {t('deviceTitle')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
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
              </AccordionDetails>
            </Accordion>
            }
            </>
          )}
            {isAppleDevice &&
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {t('notificationSound')} 
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControl fullWidth>
                    <InputLabel>{t('notificationSound')}</InputLabel>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Select
                        value={attributes.notificationSound || 'default'}
                        onChange={(e) => setAttributes({ ...attributes, notificationSound: e.target.value })}
                        style={{ flex: 1 }}
                        label={t('notificationSound')}  
                      >
                        {soundFiles.map((sound) => (
                          <MenuItem key={sound.id} value={sound.id}>
                            {sound.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <IconButton
                        size="small"
                        onClick={() => selectedSoundFile && playSound(selectedSoundFile.file)}
                        style={{ marginLeft: '8px' }}
                        disabled={!selectedSoundFile}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </div>
                  </FormControl>
                </AccordionDetails>
              </Accordion>
            }
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {t('sharedSound')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
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
              </AccordionDetails>
            </Accordion>

  
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('userToken')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <TextField
              label={t('userExpirationTime')}
              type="date"
              value={tokenExpiration}
              onChange={(e) => {
                setTokenExpiration(e.target.value);
                setToken(null);
              }}
            />
            <FormControl>
              <OutlinedInput
                multiline
                rows={6}
                readOnly
                type="text"
                value={token || ''}
                endAdornment={(
                  <InputAdornment position="end">
                    <div className={classes.verticalActions}>
                      <IconButton size="small" edge="end" onClick={generateToken} disabled={!!token}>
                        <CachedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" edge="end" onClick={() => navigator.clipboard.writeText(token)} disabled={!token}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </InputAdornment>
                )}
              />
            </FormControl>
          </AccordionDetails>
        </Accordion>
        {!readonly && (
          <>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {t('sharedInfoTitle')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <TextField
                  value={versionApp}
                  label={t('settingsAppVersion')}
                  disabled
                />
                <TextField
                  value={versionServer || '-'}
                  label={t('settingsServerVersion')}
                  disabled
                />
                <TextField
                  value={socket ? t('deviceStatusOnline') : t('deviceStatusOffline')}
                  label={t('settingsConnection')}
                  disabled
                />
                {admin && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/emulator')}
                  >
                    {t('sharedEmulator')}
                  </Button>
                )}
                {admin && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleReboot}
                  >
                    {t('serverReboot')}
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>
            <div className={classes.buttons}>
              <Button
                type="button"
                color="primary"
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                {t('sharedCancel')}
              </Button>
              <Button
                type="button"
                color="primary"
                variant="contained"
                onClick={handleSave}
              >
                {t('sharedSave')}
              </Button>
            </div>
          </>
        )}
      </Container>
    </PageLayout>
  );
};

export default PreferencesPage;
