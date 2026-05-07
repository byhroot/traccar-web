import React, { useState, useEffect, useRef } from 'react'; // useRef eklendi
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Draggable from 'react-draggable';
import { GaugeContainer, GaugeValueArc, GaugeReferenceArc } from '@mui/x-charts/Gauge';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  CardMedia,
  Dialog,
  Box,
  DialogContent,
  DialogTitle,
  Tooltip,
} from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui'; // tss-react'a geçildi
import CloseIcon from '@mui/icons-material/Close';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import EditIcon from '@mui/icons-material/Edit';
import PendingIcon from '@mui/icons-material/Pending';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Battery6BarIcon from '@mui/icons-material/Battery6Bar';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerIcon from '@mui/icons-material/Power';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import BlockIcon from '@mui/icons-material/Block';
import BoltIcon from '@mui/icons-material/Bolt';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RouteIcon from '@mui/icons-material/Route';
import NavigationIcon from '@mui/icons-material/Navigation';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SignalCellular0BarIcon from '@mui/icons-material/SignalCellular0Bar';
import SignalCellular1BarIcon from '@mui/icons-material/SignalCellular1Bar';
import SignalCellular2BarIcon from '@mui/icons-material/SignalCellular2Bar';
import SignalCellular3BarIcon from '@mui/icons-material/SignalCellular3Bar';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import FenceIcon from '@mui/icons-material/Fence';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery4BarIcon from '@mui/icons-material/Battery4Bar';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

import {
  formatBoolean, formatIgnition, formatPercentage,
} from '../../common/util/formatter';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useAdministrator, useManager, useDeviceReadonly, useRestriction } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import EngineIcon from '../../resources/images/data/engine.svg?react';
import DeviceSettingsNew from '../../settings/DeviceSettingsNew';

const iconMapping = {
  speed: <SpeedIcon color="primary" />,
  address: <LocationOnIcon color="primary" />,
  totalDistance: <RouteIcon color="primary" />,
  course: <NavigationIcon color="primary" />,
  ignition: <PowerIcon color="primary" />,
  alarm: <NotificationsActiveIcon color="error" />,
  blocked: <BlockIcon color="error" />,
  power: <BoltIcon color="primary" />,
  serverTime: <AccessTimeIcon color="primary" />,
  deviceTime: <AccessTimeIcon color="primary" />,
  fixTime: <AccessTimeIcon color="primary" />,
  network: <NetworkCheckIcon color="primary" />,
  geofenceIds: <FenceIcon color="primary" />,
  sat: <SatelliteAltIcon color="primary" />,
  distance: <RouteIcon color="primary" />,
  motion: <TrendingUpIcon color="primary" />,
  charge: <BatteryChargingFullIcon color="primary" />,
  batteryLevel: <Battery4BarIcon color="primary" />,
  rssi: <SignalCellularAltIcon color="primary" />,
  result: <ThumbUpIcon color="primary" />,
  driverUniqueId: <PersonPinIcon color="primary" />,
};

// tss-react yapısına uygun hale getirildi
const useStyles = makeStyles()((theme, { desktopPadding } = {}) => ({
  iconContainer: { display: 'flex', alignItems: 'center' },
  card: { pointerEvents: 'auto', width: theme.dimensions.popupMaxWidth },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.primary.contrastText,
    mixBlendMode: 'difference',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 0, 2),
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  icon: { width: '25px', height: '25px', marginRight: theme.spacing(1) },
  table: { '& .MuiTableCell-sizeSmall': { paddingLeft: 0, paddingRight: 0 } },
  cell: { borderBottom: 'none' },
  actions: { justifyContent: 'space-between' },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding || 0}px / 3)`,
      bottom: theme.spacing(8),
      transform: 'translateX(-50%)',

    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(4)} + ${theme.dimensions.bottomBarHeight}px)`,

    },
    transform: 'translateX(-50%)',
  },
  success: { color: theme.palette.success.main },
  neutral: { color: theme.palette.neutral?.main || 'gray' },
  error: { color: theme.palette.error.main },
}));

const StatusRow = ({ name, content, icon }) => {
  const { classes } = useStyles();
  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <div className={classes.iconContainer}>
          <div className={classes.icon}>{icon}</div>
          <Typography variant="body2">{name}</Typography>
        </div>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
      </TableCell>
    </TableRow>
  );
};

// Diğer yardımcı fonksiyonlar (getSatelliteIcon, getRssiIcon) aynı kalabilir...
const getRssiIcon = (rssi) => {
  let IconComponent = SignalCellular0BarIcon;
  let color = '#8a3227';
  if (rssi > 15 && rssi <= 45) { IconComponent = SignalCellular1BarIcon; color = '#4DB6AC'; }
  else if (rssi > 45 && rssi <= 70) { IconComponent = SignalCellular2BarIcon; color = '#00959E'; }
  else if (rssi > 70 && rssi <= 90) { IconComponent = SignalCellular3BarIcon; color = '#00959E'; }
  else if (rssi > 90) { IconComponent = SignalCellular4BarIcon; color = '#00959E'; }
  return <IconComponent style={{ color, width: 20, height: 20 }} />;
};

function getSatelliteIcon(sat) {
  let color = '#F44336';
  if (sat >= 1 && sat <= 5) color = '#90A4AE';
  else if (sat >= 6 && sat <= 10) color = '#78909C';
  else if (sat > 10) color = '#00959E';
  return <SatelliteAltIcon style={{ color, width: 20, height: 20 }} />;
}

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const { classes } = useStyles({ desktopPadding });
  const nodeRef = useRef(null); // React 18 / findDOMNode hatası için
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [expanded, setExpanded] = useState(desktop); // Başlangıçta çözünürlüğe göre açılma
  // Kullanıcının accordion'a tıklaması ile durumu değiştirecek bir işlev
  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  useEffect(() => {
    setExpanded(desktop); // Ekran çözünürlüğü değiştiğinde güncellenir
  }, [desktop]);


  const location = useLocation();

  const deviceReadonly = useDeviceReadonly();
  const admin = useAdministrator();
  const manager = useManager();
  const limitCommands = useRestriction('limitCommands');
  const userReadonly = useRestriction('readonly');
  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;
  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference('positionItems', 'alarm,address,totalDistance,power,fixTime,driverUniqueId');
  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenSettings = () => setSettingsOpen(true);
  const handleCloseSettings = () => setSettingsOpen(false);

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetch('/api/devices');
      if (response.ok) dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = { name: t('sharedGeofence'), area: `CIRCLE (${position.latitude} ${position.longitude}, 50)` };
    const response = await fetch('/api/geofences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if (response.ok) {
      const item = await response.json();
      await fetch('/api/permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }) });
      navigate(`/settings/geofence/${item.id}`);
    }
  }, [navigate, position]);

  return (
    <>
      {/* Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={handleCloseSettings}
        maxWidth="md"
        fullWidth
      >
        {/* Başlık ve çarpı butonu */}
        <DialogTitle sx={{ m: 0, pt: 0, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body4" align="center" gutterBottom>
            {device?.name || '...'}
          </Typography>
          <IconButton onClick={handleCloseSettings} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {/* Dialog içeriği */}
        <DialogContent sx={{ p: 0, pb: 1 }} dividers>
          <DeviceSettingsNew deviceId={deviceId} />
        </DialogContent>
      </Dialog>

      <div className={classes.root} style={{ pointerEvents: 'auto' }}>        {device && (
        <Draggable
          nodeRef={nodeRef} // Hata düzeltmesi
          handle={`.draggable-handle`} // Seçiciyi güncelledik
          cancel=".close-button"

        >
          <div ref={nodeRef} style={{ pointerEvents: 'auto' }}> {/* Ref sarmalayıcı */}
            <Card sx={{ borderRadius: 5 }} elevation={3} className={classes.card}>
              <div className="draggable-handle"> {/* Sürüklenebilir alan */}
                {deviceImage ? (
                  <CardMedia className={classes.media} image={`/api/media/${device.uniqueId}/${deviceImage}`}>
                    <IconButton onClick={onClose}><CloseIcon fontSize="small" className={classes.mediaButton} /></IconButton>
                  </CardMedia>
                ) : (
                  <div className={classes.header}>
                    {position?.attributes?.hasOwnProperty('ignition') && (
                      <Tooltip title={formatIgnition(position.attributes.ignition, t)}>
                        <IconButton size="small">
                          <EngineIcon className={position.attributes.ignition ? classes.success : classes.neutral} style={{ width: 25, height: 25 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {position && position.attributes && position.attributes.hasOwnProperty('sat') && (
                      <Tooltip title={`${t('positionSat')}: ${parseInt(position.attributes.sat, t)}`}>
                        <IconButton size="small">
                          {getSatelliteIcon(parseInt(position.attributes.sat))}
                        </IconButton>
                      </Tooltip>
                    )}
                    {position && position.attributes && position.attributes.hasOwnProperty('rssi') && (
                      <Tooltip title={`${t('positionRssi')}: ${formatPercentage(position.attributes.rssi, t)}`}>
                        <IconButton size="small">
                          {getRssiIcon(parseInt(position.attributes.rssi))}
                        </IconButton>
                      </Tooltip>
                    )}
                    {position && position.attributes && position.attributes.hasOwnProperty('charge') && (
                      <Tooltip title={`${t('positionCharge')}: ${formatBoolean(position.attributes.charge, t)}`}>
                        <IconButton size="small">
                          {position.attributes.charge ? (
                            <BatteryChargingFullIcon style={{ color: "#00959E", width: 25, height: 25 }} />
                          )
                            : position.attributes.hasOwnProperty('batteryLevel') < 100 ?
                              (< Battery6BarIcon className={classes.error} style={{ width: 25, height: 25 }} />)
                              :
                              (<BatteryAlertIcon className={classes.error} style={{ width: 25, height: 25 }} />)
                          }
                        </IconButton>
                      </Tooltip>
                    )}
                    {position && position.attributes && position.attributes.hasOwnProperty('result') && (
                      <Tooltip title={t('commandSent')}>
                        <IconButton size="small">
                          <ThumbUpIcon className={classes.success} style={{ width: 20, height: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" onClick={onClose} className="close-button"
                    ><CloseIcon fontSize="small" /></IconButton>
                  </div>
                )}
              </div>

              <Accordion expanded={expanded} onChange={(e, isExpanded) => setExpanded(isExpanded)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="speed-panel-content"
                  id="speed-panel-header"
                  style={{
                    minHeight: '40px',
                    padding: '0 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'center', // Tüm öğeleri ortalamak için
                  }}
                >
                  {/* Gauge ve Hız Bölümü */}
                  {position && position.hasOwnProperty('speed') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ position: 'relative', display: 'inline-block', width: '125px', height: '40px' }}>
                        <GaugeContainer
                          width={125}
                          height={100}
                          startAngle={-90}
                          endAngle={90}
                          value={(position.speed) / 100 * 100}
                          style={{
                            position: 'absolute',
                            top: '-30px', // Üstteki boşluğu azaltmak için
                            left: 0,
                          }}
                        >
                          <GaugeReferenceArc />
                          <GaugeValueArc />
                        </GaugeContainer>
                        <Typography
                          fontSize="13px"
                          style={{
                            position: 'absolute',
                            top: '35px', // Yazıyı biraz yukarı al
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontWeight: 'bold',
                            margin: 0,
                          }}
                        >
                          {Math.round(position.speed * 1.852)} km/s
                        </Typography>
                      </div>
                    </div>
                  )}
                  {/* Sağ Sütun: Park Durumu ve Süre */}
                  {position && position.fixTime && (
                    <div style={{ textAlign: 'center' }}>
                      {device.expirationTime && new Date(device.expirationTime) < new Date() && (
                        <Typography sx={{ fontSize: '12px' }} variant="body2" color="error" >
                          {t("paketAlertgecmis")}
                        </Typography>
                      )}
                      {(() => {
                        const currentTime = (location.pathname === '/replay' || location.pathname.startsWith('/reports') || location.pathname.startsWith('/event')) ? new Date(position.serverTime) : device.status === "online" ? new Date() : new Date(); // Mevcut zaman
                        const fixTime = (location.pathname === '/replay' || location.pathname.startsWith('/reports') || location.pathname.startsWith('/event')) ? new Date(position.fixTime) : device.status === "online" ? new Date(position.fixTime) : new Date(position.serverTime); // FixTime zamanı
                        const diffInMs = currentTime - fixTime;
                        const diffInMinutes = Math.floor(diffInMs / 60000);

                        if (location.pathname === '/replay' || location.pathname.startsWith('/reports') || location.pathname.startsWith('/event')) {
                          if (position && position.speed <= 5 && diffInMinutes > 3) {
                            return <Typography style={{ color: 'grey' }}> {t('eventDeviceStopped')} </Typography>;
                          } else if (position.speed < 4 && diffInMinutes > 1) {
                            return <Typography style={{ color: 'grey' }}>{t('eventDeviceStopped')}</Typography>;
                          } else if (position.speed > 3 && diffInMinutes <= 1) {
                            return <Typography style={{ color: 'green' }}>{t('eventDeviceMoving')}</Typography>;
                          } else if (position.speed > 1 && diffInMinutes > 1) {
                            return <Typography style={{ color: 'grey' }}> {t('deviceStatusOffline')} {t('commandData')}  {t('sharedLoading')} </Typography>;
                          }
                          // Cihaz çevrimdışı ve protokol long ise
                        } else if ((device.status !== "online") && position && position.protocol && position.protocol === "takiponalong") {
                          return <Typography sx={{ fontSize: '12px' }} color="info">{t("eventDeviceOffline")} | {t("commandModeDeepSleep")}</Typography>;
                        } else if (device.status !== "online") {
                          // Cihaz çevrimdışıysa
                          return <Typography sx={{ fontSize: '12px' }} color="info">{t("eventDeviceOffline")} </Typography>;
                        } else {
                          // Cihaz çevrimiçiyse
                          if (diffInMinutes > 1) {
                            if (position && position.speed > 5) {
                              return <Typography style={{ color: 'grey' }}> {t('deviceStatusOffline')} {t('commandData')}  {t('sharedLoading')} </Typography>;
                            } else if (position && position.speed <= 5) {
                              return <Typography style={{ color: 'grey' }}> {t('eventDeviceStopped')} </Typography>;
                            }

                          } else if (position && position.attributes && !position.attributes.ignition && position.speed < 5 || diffInMinutes >= 1) {
                            return <Typography style={{ color: 'grey' }}>{t('eventDeviceStopped')}</Typography>;
                          } else if (diffInMinutes < 1) {
                            return <Typography style={{ color: 'green' }}>{t('eventDeviceMoving')}</Typography>;
                          }
                        }
                      })()}

                      <Typography sx={{ fontSize: '12px' }} variant="body2" style={{ color: 'gray' }}>
                        {(() => {
                          const currentTime = (location.pathname === '/replay' || location.pathname.startsWith('/reports')) ? new Date(position.serverTime) : device.status === "online" ? new Date() : new Date(); // Mevcut zaman
                          const fixTime = (location.pathname === '/replay' || location.pathname.startsWith('/reports')) ? new Date(position.fixTime) : device.status === "online" ? new Date(position.fixTime) : device.status !== "online" && position && position.protocol === "takiponalong" ? new Date(position.fixTime) : new Date(position.serverTime); // FixTime zamanı
                          const diffInMs = currentTime - fixTime;

                          const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

                          if (days > 0) {
                            return `${days} ${t('sharedDays')} ${hours} ${t('sharedHours')}`;
                          } else if (hours > 0) {
                            return `${hours} ${t('sharedHours')} ${minutes} ${t('sharedMinutes')}`;
                          } else if (minutes > 5) {
                            return `${minutes} ${t('sharedMinutes')}`;
                          }
                        })()}
                      </Typography>
                    </div>
                  )}
                </AccordionSummary>
                <AccordionDetails style={{ padding: '0px' }}>
                  {position && (
                    <CardContent className={classes.content} style={{ paddingTop: 0 }}>
                      <Table size="small" classes={{ root: classes.table }}>
                        <TableBody>
                          {positionItems
                            .split(',')
                            .filter((key) => position.hasOwnProperty(key) || position.attributes.hasOwnProperty(key))
                            .map((key) => {
                              let icon = null;
                              // İlgili özelliklere göre uygun ikonları belirle
                              switch (key) {
                                case 'speed':
                                case 'address':
                                case 'totalDistance':
                                case 'course':
                                case 'ignition':
                                case 'alarm':
                                case 'blocked':
                                case 'power':
                                case 'serverTime':
                                case 'deviceTime':
                                case 'fixTime':
                                case 'network':
                                case 'geofenceIds':
                                case 'sat':
                                case 'distance':
                                case 'motion':
                                case 'charge':
                                case 'batteryLevel':
                                case 'rssi':
                                case 'result':
                                case 'driverUniqueId':
                                  icon = iconMapping[key];
                                  break;
                                default:
                                  break;
                              }
                              return (
                                <StatusRow
                                  key={key}
                                  name={
                                    positionAttributes.hasOwnProperty(key)
                                      ? positionAttributes[key].name
                                      : key
                                  }
                                  content={
                                    <PositionValue
                                      position={position}
                                      property={position.hasOwnProperty(key) ? key : null}
                                      attribute={position.hasOwnProperty(key) ? null : key}
                                    />
                                  }
                                  icon={icon}
                                />
                              );
                            })}
                        </TableBody>
                      </Table>

                    </CardContent>
                  )}
                  <CardActions classes={{ root: classes.actions }} disableSpacing>
                    <IconButton
                      color="secondary"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      disabled={!position || userReadonly}
                    >
                      <PendingIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => navigate(`/replay?deviceId=${deviceId}`)}
                      disabled={disableActions || !position || userReadonly}
                    >
                      <HistoryIcon />
                    </IconButton>

                    <IconButton
                      onClick={handleOpenSettings}
                      disabled={disableActions || userReadonly}
                    >
                      <SettingsIcon />
                    </IconButton>

                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}/connections`)}
                      disabled={disableActions || deviceReadonly}
                    >
                      <InsertLinkIcon />
                    </IconButton>
                    {admin &&
                      <IconButton
                        onClick={() => navigate(`/settings/device/${deviceId}`)}
                        disabled={disableActions || deviceReadonly}
                      >
                        <EditIcon />
                      </IconButton>
                    }
                  </CardActions>
                </AccordionDetails>
              </Accordion>
            </Card>
          </div>
        </Draggable>
      )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          {manager && (

            <MenuItem onClick={() => navigate(`/position/${position.id}`)}><Typography color="secondary">{t('sharedShowDetails')}</Typography></MenuItem>
          )}
          <MenuItem disabled={disableActions || deviceReadonly} onClick={handleGeofence}><Typography color="secondary">{t('sharedCreateGeofence')}</Typography></MenuItem>
          <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}>{t('linkGoogleMaps')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}>{t('linkAppleMaps')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}>{t('linkStreetView')}</MenuItem>
          {navigationAppTitle && <MenuItem component="a" target="_blank" href={navigationAppLink.replace('{latitude}', position.latitude).replace('{longitude}', position.longitude)}>{navigationAppTitle}</MenuItem>}
          {!shareDisabled && !user.temporary && <MenuItem disabled={disableActions || deviceReadonly} onClick={() => navigate(`/settings/device/${deviceId}/share`)}><Typography color="primary">{t('deviceShare')}</Typography></MenuItem>}
        </Menu>
      )}

      <RemoveDialog open={removing} endpoint="devices" itemId={deviceId} onResult={handleRemove} />
    </>
  );
};

export default StatusCard;