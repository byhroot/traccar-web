import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  Tooltip,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import LockIcon from '@mui/icons-material/Lock';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatBoolean,
  formatPercentage,
  formatStatus,
  getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: '24px',
    height: '24px',
    filter: 'brightness(0) invert(1)',
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.text.secondary, // Neutral için text secondary daha yumuşak durur
  },
  selected: {
    backgroundColor: `${theme.palette.primary.main}15 !important`, // Seçili satırda şeffaf ve modern bir renk
    borderLeft: `4px solid ${theme.palette.primary.main}`, // Seçili satırı vurgulayan ince sol çizgi
  },
  statusIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  }
}));

const DeviceRow = ({ devices, index, style }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const resolveFieldValue = (field) => {
    if (field === 'geofenceIds') {
      const geofenceIds = position?.geofenceIds;
      return geofenceIds?.length ? <GeofencesValue geofenceIds={geofenceIds} /> : null;
    }
    if (field === 'driverUniqueId') {
      const driverUniqueId = position?.attributes?.driverUniqueId;
      return driverUniqueId ? <DriverValue driverUniqueId={driverUniqueId} /> : null;
    }
    if (field === 'motion') {
      return <MotionBar deviceId={item.id} />;
    }
    return item[field];
  };

  const getStatusColorList = () => {
    const isOnline = item.status === 'online';
    const speed = position && position.speed != null ? position.speed : 0;
    const ignition = position && position.attributes ? position.attributes.ignition : null;
    const motion = item.motionState === true;

    if (!isOnline) {
      return '#bdbdbd'; // offline (daha modern bir gri)
    }

    if (position && position.attributes && motion && ignition && speed > 1) {
      return '#4caf50'; // aktif hareket (MUI success green)
    }

    if (position && position.attributes && ignition && (speed === 0)) {
      return '#81c784'; // açık yeşil - kontak açık ama hareketsiz
    }

    return '#9e9e9e'; // online ama kontak kapalı veya bilinmeyen durum
  };

  const primaryValue = resolveFieldValue(devicePrimary);
  const secondaryValue = resolveFieldValue(deviceSecondary);

  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {secondaryValue && (
          <>
            <Typography variant="caption" color="textSecondary" noWrap>
              {secondaryValue}
            </Typography>
            <Typography variant="caption" color="textSecondary">•</Typography>
          </>
        )}
        <Typography variant="caption" className={classes[getStatusColor(item.status)]} fontWeight="medium">
          {status}
        </Typography>
      </Box>
    );
  };

  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={selectedDeviceId === item.id ? classes.selected : null}
        sx={{
          mx: 1, // Sağdan soldan biraz boşluk
          my: 0.5,
          borderRadius: '12px', // Modern yuvarlak hatlar
          height: 'calc(100% - 8px)', // Marginleri telafi edip sanal listeyi bozmamak için
          boxSizing: 'border-box',
        }}
      >
        <ListItemAvatar>
          {position && position.attributes && position.attributes.hasOwnProperty('blocked') && position.attributes.blocked ? (
            <Avatar sx={{ bgcolor: '#ffebee', boxShadow: 1 }}>
              <LockIcon color="error" fontSize="small" />
            </Avatar>
          ) : (
            <Avatar
              sx={{
                bgcolor: getStatusColorList(item),
                boxShadow: 2, // Avatara hafif derinlik
                width: 40,
                height: 40,
              }}
            >
              <img className={classes.icon} src={mapIcons[mapIconKey(item.category)]} alt="" />
            </Avatar>
          )}
        </ListItemAvatar>

        <ListItemText
          primary={primaryValue}
          secondary={secondaryText()}
          slotProps={{
            primary: { noWrap: true, fontWeight: 600, fontSize: '0.90rem', color: 'text.primary' }, // İsimler daha tok duracak
            secondary: { component: 'div' } // Span içine Typography koyduğumuz için uyarıyı engeller
          }}
          sx={{ pr: 1 }}
        />

        {position && (
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* HIZ GÖSTERGESİ (Chip ile daha modern) */}
            {position.speed != null && (
              <Chip
                size="small"
                label={`${Math.round(position.speed * 1.852)} km/h`}
                color={position.speed > 0 ? "success" : "default"}
                variant={position.speed > 0 ? "filled" : "outlined"}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.60rem',
                  height: '24px',
                  display: { xs: 'flex', sm: 'flex' } // Mobilde çok sıkışırsa gizleyebilir veya bırakabilirsin (şuan sm ve üstü gösterilir)
                }}
              />
            )}

            {/* DURUM İKONLARI (Stack içinde daha düzenli) */}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {position.attributes.hasOwnProperty('alarm') && (
                <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
                  <Box className={classes.statusIcon}>
                    <ErrorIcon fontSize="small" className={classes.error} />
                  </Box>
                </Tooltip>
              )}

              {position.attributes.hasOwnProperty('ignition') && (
                <Tooltip title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}>
                  <Box className={classes.statusIcon}>
                    <EngineIcon
                      width={18}
                      height={18}
                      className={position.attributes.ignition ? classes.success : classes.neutral}
                    />
                  </Box>
                </Tooltip>
              )}

              {position.attributes.hasOwnProperty('batteryLevel') && (
                <Tooltip title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}>
                  <Box className={classes.statusIcon}>
                    {(position.attributes.batteryLevel > 70 &&
                      (position.attributes.charge ? (
                        <BatteryChargingFullIcon fontSize="small" className={classes.success} />
                      ) : (
                        <BatteryFullIcon fontSize="small" className={classes.success} />
                      ))) ||
                      (position.attributes.batteryLevel > 30 &&
                        (position.attributes.charge ? (
                          <BatteryCharging60Icon fontSize="small" className={classes.warning} />
                        ) : (
                          <Battery60Icon fontSize="small" className={classes.warning} />
                        ))) ||
                      (position.attributes.charge ? (
                        <BatteryCharging20Icon fontSize="small" className={classes.error} />
                      ) : (
                        <Battery20Icon fontSize="small" className={classes.error} />
                      ))}
                  </Box>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        )}
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;