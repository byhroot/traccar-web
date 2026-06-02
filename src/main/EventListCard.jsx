import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from '../common/components/LocalizationProvider';

import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import StopIcon from '@mui/icons-material/Stop';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import PowerIcon from '@mui/icons-material/Power';
import GpsOffIcon from '@mui/icons-material/GpsOff';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import LockIcon from '@mui/icons-material/Lock';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TireRepairIcon from '@mui/icons-material/TireRepair';
import HotelIcon from '@mui/icons-material/Hotel';
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocalParkingIcon from '@mui/icons-material/LocalParking';

const EVENT_CFG = {
  deviceMoving: { Icon: SpeedIcon, severity: 'success' },
  deviceStopped: { Icon: StopIcon, severity: 'default' },
  deviceOverspeed: { Icon: SpeedIcon, severity: 'warning' },
  deviceFuelDrop: { Icon: LocalGasStationIcon, severity: 'warning' },
  ignitionOn: { Icon: VpnKeyIcon, severity: 'success' },
  ignitionOff: { Icon: PowerOffIcon, severity: 'default' },
  geofenceEnter: { Icon: AddLocationIcon, severity: 'info' },
  geofenceExit: { Icon: LocationOffIcon, severity: 'info' },
  maintenance: { Icon: BuildIcon, severity: 'warning' },
  driverChanged: { Icon: PersonIcon, severity: 'info' },
  alarmVibration: { Icon: WarningAmberIcon, severity: 'warning' },
  alarmTow: { Icon: WarningAmberIcon, severity: 'error' },
  alarmIdle: { Icon: HotelIcon, severity: 'default' },
  alarmLowPower: { Icon: BatteryAlertIcon, severity: 'warning' },
  alarmPowerCut: { Icon: PowerOffIcon, severity: 'error' },
  alarmPowerRestored: { Icon: PowerIcon, severity: 'success' },
  alarmLowBattery: { Icon: BatteryAlertIcon, severity: 'warning' },
  alarmRemoving: { Icon: PhoneAndroidIcon, severity: 'error' },
  alarmGpsAntennaCut: { Icon: GpsOffIcon, severity: 'error' },
  alarmAccident: { Icon: LocalPoliceIcon, severity: 'error' },
  alarmHardAcceleration: { Icon: ElectricBoltIcon, severity: 'warning' },
  alarmHardBraking: { Icon: ElectricBoltIcon, severity: 'warning' },
  alarmHardCornering: { Icon: TireRepairIcon, severity: 'warning' },
  alarmParking: { Icon: LocalParkingIcon, severity: 'info' },
  alarmFatigueDriving: { Icon: HotelIcon, severity: 'error' },
  alarmSos: { Icon: LocalPoliceIcon, severity: 'error' },
  alarmFallDown: { Icon: WarningAmberIcon, severity: 'warning' },
  alarmFault: { Icon: BuildIcon, severity: 'error' },
  alarmLock: { Icon: LockIcon, severity: 'info' },
  alarmPowerOff: { Icon: PowerOffIcon, severity: 'error' },
  alarmPowerOn: { Icon: PowerIcon, severity: 'success' },
  alarmMovement: { Icon: SpeedIcon, severity: 'warning' },
  alarmLaneChange: { Icon: AirlineStopsIcon, severity: 'warning' },
  alarm: { Icon: NotificationsActiveIcon, severity: 'error' },
};

const getCfg = (event) => {
  if (event.type === 'alarm' && event.attributes?.alarm) {
    const key = `alarm${event.attributes.alarm.charAt(0).toUpperCase()}${event.attributes.alarm.slice(1)}`;
    return EVENT_CFG[key] || EVENT_CFG.alarm;
  }
  return EVENT_CFG[event.type] || EVENT_CFG.alarm;
};

const fmtTime = (str) => {
  const d = new Date(str);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}:${m < 10 ? '0' + m : m}`;
};

const fmtDate = (str) => {
  const d = new Date(str);
  const date = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  const h = d.getHours();
  const m = d.getMinutes();
  return `${date} ${h}:${m < 10 ? '0' + m : m}`;
};

const EventListCard = ({ events, deviceDetails }) => {
  const [blinking, setBlinking] = useState(new Set());
  const t = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const sc = {
    error: { bg: theme.palette.error.main, light: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main },
    warning: { bg: theme.palette.warning.main, light: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.dark },
    success: { bg: theme.palette.success.main, light: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark },
    info: { bg: theme.palette.info.main, light: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.dark },
    default: { bg: theme.palette.text.secondary, light: theme.palette.action.hover, color: theme.palette.text.secondary },
  };

  const getLabel = (event) => {
    if (event.type === 'alarm' && event.attributes?.alarm) {
      const key = `alarm${event.attributes.alarm.charAt(0).toUpperCase()}${event.attributes.alarm.slice(1)}`;
      return t(key);
    }
    return t(`event${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(prev => {
        const next = new Set(prev);
        const now = new Date();
        events.filter(e => now - new Date(e.eventTime) <= 60000)
          .forEach(e => { if (next.has(e.id)) next.delete(e.id); else next.add(e.id); });
        return next;
      });
    }, 1000);
    const stop = setTimeout(() => clearInterval(interval), 10000);
    return () => { clearInterval(interval); clearTimeout(stop); };
  }, [events]);

  if (!events.length) return (
    <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
      <Typography variant="body2">Bu dönemde olay kaydı bulunamadı.</Typography>
    </Box>
  );

  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 1)}`, bgcolor: 'background.paper' }}>
      {/* header */}
      <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}` }}>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12 }}>Son Olaylar</Typography>
        <Box sx={{ ml: 'auto', fontSize: 11, color: 'text.secondary', bgcolor: 'action.hover', px: 1, py: 0.3, borderRadius: 10 }}>
          {events.length} olay
        </Box>
      </Box>

      {events.map((event) => {
        const { Icon, severity } = getCfg(event);
        const s = sc[severity];
        const isNew = blinking.has(event.id);
        const deviceName = deviceDetails.find(d => d.id === event.deviceId)?.name || `#${event.deviceId}`;
        const isToday = new Date(event.eventTime).toDateString() === new Date().toDateString();

        return (
          <Box
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 0.9,
              cursor: 'pointer',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
              bgcolor: isNew ? alpha(s.bg, 0.08) : 'transparent',
              transition: 'background .15s',
              '&:last-child': { borderBottom: 'none' },
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {/* icon dot */}
            <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: s.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon sx={{ fontSize: 15, color: s.bg }} />
            </Box>

            {/* label */}
            <Typography variant="body2" sx={{ flex: 1, fontSize: 12.5, color: s.color, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getLabel(event)}
            </Typography>

            {/* device */}
            <Typography variant="caption" sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {deviceName}
            </Typography>

            {/* time */}
            <Typography variant="caption" sx={{ fontSize: 11, color: 'text.disabled', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 36, textAlign: 'right' }}>
              {isToday ? fmtTime(event.eventTime) : fmtDate(event.eventTime)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default EventListCard;