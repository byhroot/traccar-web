import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Collapse, Link, Typography, Divider, Box, IconButton, Dialog, DialogActions, DialogContent, DialogTitle,Table,TableHead,TableRow,TableCell,TableBody,Snackbar, Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useEffectAsync } from '../reactHelper';
import { prefixString } from '../common/util/stringUtils';
import { formatBoolean } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import { useAdministrator } from '../common/util/permissions';
import WifiIcon from '@mui/icons-material/Wifi'; // DeviceOnline
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // DeviceUnknown
import WifiOffIcon from '@mui/icons-material/WifiOff'; // DeviceOffline
import BlockIcon from '@mui/icons-material/Block'; // DeviceInactive
import SendIcon from '@mui/icons-material/Send'; // QueuedCommandSent
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'; // DeviceMoving
import ParkIcon from '@mui/icons-material/LocalParking'; // DeviceStopped
import SpeedIcon from '@mui/icons-material/Speed'; // DeviceOverspeed
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'; // Fuel
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // CommandResult
import LoginIcon from '@mui/icons-material/Login'; // GeofenceEnter
import LogoutIcon from '@mui/icons-material/Logout'; // GeofenceExit
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'; // Alarm
import FlashOnIcon from '@mui/icons-material/FlashOn'; // IgnitionOn
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'; // IgnitionOff
import BuildIcon from '@mui/icons-material/Build'; // Maintenance
import SmsIcon from '@mui/icons-material/Sms'; // TextMessage
import BadgeIcon from '@mui/icons-material/Badge'; // DriverChanged
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'; // Media
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsPageAddNotifiy from './NotificationsPageAddNotifiy'
import { Switch, FormControlLabel } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AdUnitsIcon from '@mui/icons-material/AdUnits';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import NearbyErrorIcon from '@mui/icons-material/NearbyError';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const NotificationsPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();
  const admin = useAdministrator();

  const user = useSelector((state) => state.session.user);
  const [attributes] = useState(user.attributes);
  const smsLimit = attributes.smsLimit;

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const getTypeIcon = (type) => {
    switch (type) {
      case 'deviceOnline': return <WifiIcon color="primary" />;
      case 'deviceUnknown': return <HelpOutlineIcon color="disabled" />;
      case 'deviceOffline': return <WifiOffIcon color="error" />;
      case 'deviceInactive': return <BlockIcon color="disabled" />;
      case 'queuedCommandSent': return <SendIcon color="primary" />;
      case 'deviceMoving': return <DirectionsCarIcon color="primary" />;
      case 'deviceStopped': return <ParkIcon color="action" />;
      case 'deviceOverspeed': return <SpeedIcon color="warning" />;
      case 'deviceFuelDrop': return <LocalGasStationIcon color="error" />;
      case 'deviceFuelIncrease': return <LocalGasStationIcon color="success" />;
      case 'commandResult': return <CheckCircleOutlineIcon color="info" />;
      case 'geofenceEnter': return <LoginIcon color="success" />;
      case 'geofenceExit': return <LogoutIcon color="error" />;
      case 'alarm': return <NotificationsActiveIcon color="error" />;
      case 'ignitionOn': return <PowerSettingsNewIcon color="success" />;
      case 'ignitionOff': return <PowerSettingsNewIcon color="disabled" />;
      case 'maintenance': return <BuildIcon color="warning" />;
      case 'textMessage': return <SmsIcon color="primary" />;
      case 'driverChanged': return <BadgeIcon color="info" />;
      case 'media': return <PhotoCameraIcon color="secondary" />;
      default: return <NotificationsActiveIcon color="disabled" />;
    }
  };

  const getNotifyIcon = (type) => {
    switch (type) {
      case 'firebase': return <AdUnitsIcon color="success" />;
      case 'mail': return <EmailIcon color="action" />;
      case 'sms': return <SmsIcon color="info" />;
      case 'pushover': return <CallIcon color="warning" />;
      case 'web': return;
      default: return ;
    }
  };


  const notificatorTypes = [
    'firebase',
    'mail',
    'sms',
    'pushover',

    // sesli çağrı gibi özel olanlar varsa ekleyebilirsin
  ];
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDialog = () => {
    setOpenDialog(false);
    // Burada ek işlemler yapılabilir, örneğin değişiklik kaydetme
  };

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const handleNotificationsAdded = () => {
    setTimestamp(Date.now()); // useEffect tetiklenir
  };
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const formatList = (prefix, value) => {
    if (value) {
      return value
        .split(/[, ]+/)
        .filter(Boolean)
        .map((it) => t(prefixString(prefix, it)))
        .join(', ');
    }
    return '';
  };

  const handleToggleExpand = (itemId) => {
    setExpandedItemId((prevId) => (prevId === itemId ? null : itemId));
  };


  const filterByKeywordTranslated = (keyword, t) => (item) => {
    const lowerKeyword = keyword.toLowerCase();
  
    const translatedType = t(prefixString('event', item.type)).toLowerCase();
    const translatedDescription = item.description?.toLowerCase() || '';
  
    return (
      translatedType.includes(lowerKeyword) ||
      translatedDescription.includes(lowerKeyword)
    );
  };
  const filteredItems = items.filter(filterByKeywordTranslated(searchKeyword, t));

  const [pendingChanges, setPendingChanges] = useState([]);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const handleSwitchChange = (item, type, enabled) => {
    setPendingChanges(prev => {
      const existing = prev.find(change => change.item.id === item.id);
      if (existing) {
        return prev.map(change =>
          change.item.id === item.id
            ? {
                ...change,
                changes: { ...change.changes, [type]: enabled },
              }
            : change
        );
      } else {
        return [...prev, { item, changes: { [type]: enabled } }];
      }
    });
    setSnackbarOpen(true);
  };
  

  const applyPendingChanges = async () => {
    for (const { item, changes } of pendingChanges) {
      const currentNotificators = item.notificators?.split(',') || [];
      let updatedSet = new Set(currentNotificators);
  
      for (const [type, enabled] of Object.entries(changes)) {
        if (enabled) {
          updatedSet.add(type);
        } else {
          updatedSet.delete(type);
        }
      }
  
      const newNotificators = Array.from(updatedSet).join(',');
  
      // Notificators güncelle
      await fetch(`/api/notifications/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, notificators: newNotificators }),
      });
    }
  
    setPendingChanges([]);
    setSnackbarOpen(false);
    setTimestamp(Date.now());
  };
  
  
  
  const discardPendingChanges = () => {
    setPendingChanges([]);
    setSnackbarOpen(false);
  };
  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingChanges.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // bazı tarayıcılar için gerekli
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingChanges]);

  
  return (
    <PageLayout   mb={5} menu={<SettingsMenu />} breadcrumbs={['alarmGeneral', 'sharedNotifications']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Box
          display="flex"
          justifyContent="center"
          alignItems="center"

        >
      
      {(smsLimit == null || smsLimit <= 0) && (
        <Typography variant="body2" color="secondary">
          {t("notificatorSms") +" / " + t("notificatorPushover") + " " + t("userUserLimit")} : 0
        </Typography>
      )}
      {smsLimit >= 0 && (
        <Typography className={classes.smsLimit} variant="body2"  color="primary" style={{ fontStyle: 'italic' }}>
          {t('notificatorSms')} & {t('notificatorPushover')}  {t('userUserLimit')} :{smsLimit ? smsLimit : 0 }
        </Typography>
      )}
        </Box>

      {items.length === 0 && !loading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100px" // veya "50vh", "100%" gibi ihtiyaca göre
          width="100%"
        >
          <NotificationsPageAddNotifiy onSuccess={handleNotificationsAdded} />
        </Box>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('notificationType')}</TableCell>
            <TableCell>{t('notificationNotificators')}</TableCell>
            {desktop && <TableCell>{t('Notificators')}</TableCell>}
            <TableCell>{t('edit')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && filteredItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body1" color="textSecondary">
                  {t('sharedNotifications')}
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {!loading && filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isAlarmType = item.type === 'alarm';
            const showAlarms = isAlarmType && item.attributes?.alarms;

            return (
              <React.Fragment key={item.id}>
                <TableRow hover>
                  <TableCell
                    onClick={() => handleToggleExpand(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTypeIcon(item.type)}
                      {item.calendarId && <AccessTimeIcon fontSize="small" color="action" /> || null}
                      {t(prefixString('event', item.type))}
                      <Typography variant="subtitle2">{item.description}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {t('notificationAlways')}: {formatBoolean(item.always, t)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                    </Typography>
                  </TableCell>
                  <TableCell
                    onClick={() => handleToggleExpand(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {item.notificators?.split(',').filter(n => n).map((type) => (
                        <Box display="flex" alignItems="center" gap={1}>
                        <span> {getNotifyIcon(type)}</span>
                      </Box>
                      ))}
                    </Box>
                  </TableCell>

                  {desktop && (
                    <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={2}>
                            {notificatorTypes.map((type) => (
                              
                              <FormControlLabel
                                control={
                                  <Switch
                                  
                                    checked={
                                      (() => {
                                        const change = pendingChanges.find(c => c.item.id === item.id);
                                        if (change && change.changes.hasOwnProperty(type)) {
                                          return change.changes[type];
                                        }
                                        return item.notificators?.split(',').includes(type) || false;
                                      })()
                                    }
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;

                                      // Orijinal notificators listesi
                                      const originalNotificators = item.notificators?.split(',').filter(n => n) || [];

                                      // Geçici değişiklikleri uygula
                                      const change = pendingChanges.find(c => c.item.id === item.id);
                                      let simulatedNotificators = [...originalNotificators];

                                      if (change) {
                                        for (const [key, val] of Object.entries(change.changes)) {
                                          if (val && !simulatedNotificators.includes(key)) {
                                            simulatedNotificators.push(key);
                                          } else if (!val && simulatedNotificators.includes(key)) {
                                            simulatedNotificators = simulatedNotificators.filter(n => n !== key);
                                          }
                                        }
                                      }

                                      // Eğer SMS veya Pushover değişikliği yapılıyorsa, smsLimit'i kontrol et
                                      if ((type === "sms" || type === "pushover") && (
                                        !smsLimit || smsLimit <= 0)) {
                                        setDialogMessage(t("notificatorSms") +" / " + t("notificatorPushover") + ":" + t("sharedDisabled") + " | " + t("userUserLimit") + ": 0");
                                        setOpenDialog(true);
                                        return; // SMS veya Pushover değişikliğine izin verme
                                      }

                                      // Eğer geriye hiçbir notificator kalmayacaksa engelle
                                      if (!isChecked && simulatedNotificators.length === 1 && simulatedNotificators.includes(type)) {
                                        setDialogMessage(t("sharedRequired") + " : " + t("notificationType"));
                                        setOpenDialog(true);
                                        return; // Değişikliğe izin verme
                                      }

                                      // Şimdi değişikliği uygula
                                      if (!isChecked) {
                                        simulatedNotificators = simulatedNotificators.filter(n => n !== type);
                                      } else if (!simulatedNotificators.includes(type)) {
                                        simulatedNotificators.push(type);
                                      }

                                      handleSwitchChange(item, type, isChecked);
                                    }}
                                  />
                                }
                                label={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <span> {getNotifyIcon(type)} {t(`notificator${type.charAt(0).toUpperCase() + type.slice(1)}`)}</span>
                                  </Box>
                                }
                              />
                            ))}

                          </Box>
                    </TableCell>
                  )}
                  <TableCell className={classes.columnAction} padding="none">

                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/notification"
                      endpoint="notifications"
                      setTimestamp={setTimestamp}
                    />
                    <IconButton onClick={() => handleToggleExpand(item.id)} size="small">
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={desktop ? 3 : 2} style={{ paddingBottom: 0, paddingTop: 0 }}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box margin={2}>
                        {showAlarms && (
                          <>
                            <Typography variant="subtitle2" color="textSecondary">
                              {formatList('alarm', item.attributes.alarms)}
                            </Typography>
                            <Box my={1} />
                          </>
                        )}
                        
                        {!desktop && (
                          <Box display="flex" flexWrap="wrap" gap={2}>
                            {notificatorTypes.map((type) => (
                             <FormControlLabel
                              control={
                                <Switch
                                  checked={
                                    (() => {
                                      const change = pendingChanges.find(c => c.item.id === item.id);
                                      if (change && change.changes.hasOwnProperty(type)) {
                                        return change.changes[type];
                                      }
                                      return item.notificators?.split(',').includes(type) || false;
                                    })()
                                  }
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                            
                                    // Orijinal notificators listesi
                                    const originalNotificators = item.notificators?.split(',').filter(n => n) || [];
                            
                                    // Geçici değişiklikleri uygula
                                    const change = pendingChanges.find(c => c.item.id === item.id);
                                    let simulatedNotificators = [...originalNotificators];
                            
                                    if (change) {
                                      for (const [key, val] of Object.entries(change.changes)) {
                                        if (val && !simulatedNotificators.includes(key)) {
                                          simulatedNotificators.push(key);
                                        } else if (!val && simulatedNotificators.includes(key)) {
                                          simulatedNotificators = simulatedNotificators.filter(n => n !== key);
                                        }
                                      }
                                    }
                            
                                    // Eğer SMS veya Pushover değişikliği yapılıyorsa, smsLimit'i kontrol et
                                    if ((type === "sms" || type === "pushover") && (
                                      !smsLimit || smsLimit <= 0)) {
                                      setDialogMessage(t("notificatorSms") +" / " + t("notificatorPushover") + ":" + t("sharedDisabled") + " | " + t("userUserLimit") + ": 0");
                                      setOpenDialog(true);
                                      return; // SMS veya Pushover değişikliğine izin verme
                                    }
                            
                                    // Eğer geriye hiçbir notificator kalmayacaksa engelle
                                    if (!isChecked && simulatedNotificators.length === 1 && simulatedNotificators.includes(type)) {
                                      setDialogMessage(t("sharedRequired") + " : " + t("notificationType"));
                                      setOpenDialog(true);
                                      return; // Değişikliğe izin verme
                                    }
                            
                                    // Şimdi değişikliği uygula
                                    if (!isChecked) {
                                      simulatedNotificators = simulatedNotificators.filter(n => n !== type);
                                    } else if (!simulatedNotificators.includes(type)) {
                                      simulatedNotificators.push(type);
                                    }
                            
                                    handleSwitchChange(item, type, isChecked);
                                  }}
                                />
                              }
                              label={t(`notificator${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                            />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>

                <Divider component="tr" />
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      <CollectionFab editPath="/settings/notification" />
      <Snackbar
        open={snackbarOpen}
        message={`${pendingChanges.length} ${t("sharedNotification")} | ${t("changeDetected")}`}
        action={
          <>
            <Button color="warning" size="small" onClick={discardPendingChanges}>
            {t("sharedCancel")}
            </Button>
            <Button color="info" size="small" onClick={applyPendingChanges}>
              {t("sharedSave")}
            </Button>
          </>
        }
      />

        <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogContent>
        <Typography variant="body3" style={{ fontSize: '12px', fontWeight: '500' }}>
            {dialogMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialog} color="primary">
            {t("sharedCancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default NotificationsPage;
