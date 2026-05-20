import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
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

/* severity: 'error' | 'warning' | 'success' | 'info' | 'default' */
const EVENT_CONFIG = {
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

const getConfig = (event) => {
  if (event.type === 'alarm' && event.attributes?.alarm) {
    const key = `alarm${event.attributes.alarm.charAt(0).toUpperCase()}${event.attributes.alarm.slice(1)}`;
    return EVENT_CONFIG[key] || EVENT_CONFIG.alarm;
  }
  return EVENT_CONFIG[event.type] || EVENT_CONFIG.alarm;
};

const formatTime = (str) => {
  const d = new Date(str);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}:${m < 10 ? '0' + m : m}`;
};

const EventListCard = ({ events, deviceDetails }) => {
  const [blinkingRows, setBlinkingRows] = useState(new Set());
  const t = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const sc = {
    error: { bg: theme.palette.error.main, color: theme.palette.error.main, light: theme.palette.error.light },
    warning: { bg: theme.palette.warning.main, color: theme.palette.warning.dark, light: theme.palette.warning.light },
    success: { bg: theme.palette.success.main, color: theme.palette.success.dark, light: theme.palette.success.light },
    info: { bg: theme.palette.info.main, color: theme.palette.info.dark, light: theme.palette.info.light },
    default: { bg: theme.palette.text.secondary, color: theme.palette.text.secondary, light: theme.palette.action.hover },
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
      setBlinkingRows((prev) => {
        const next = new Set(prev);
        const now = new Date();
        events
          .filter((e) => now - new Date(e.eventTime) <= 60000)
          .forEach((e) => { if (next.has(e.id)) next.delete(e.id); else next.add(e.id); });
        return next;
      });
    }, 1000);
    const stop = setTimeout(() => clearInterval(interval), 5000);
    return () => { clearInterval(interval); clearTimeout(stop); };
  }, [events]);

  return (
    <Box sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>

      {/* Başlık */}
      <Box sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="body2" fontWeight={500}>Son Olaylar</Typography>
        <Box sx={{ ml: 'auto', fontSize: '0.72rem', color: 'text.secondary', backgroundColor: theme.palette.action.hover, px: 1, py: 0.3, borderRadius: 10 }}>
          {events.length} olay
        </Box>
      </Box>

      {/* Satırlar */}
      {events.map((event) => {
        const { Icon, severity } = getConfig(event);
        const s = sc[severity];
        const isBlinking = blinkingRows.has(event.id);
        const deviceName = deviceDetails.find((d) => d.id === event.deviceId)?.name || event.deviceId;

        return (
          <Box
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              cursor: 'pointer',
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: isBlinking ? theme.palette.action.selected : 'transparent',
              transition: 'background 0.15s',
              '&:last-child': { borderBottom: 'none' },
              '&:hover': { backgroundColor: theme.palette.action.hover },
            }}
          >
            {/* İkon dairesi */}
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: s.bg + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon sx={{ fontSize: 16, color: s.bg }} />
            </Box>

            {/* Olay adı */}
            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.82rem', color: s.color, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getLabel(event)}
            </Typography>

            {/* Araç */}
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {deviceName}
            </Typography>

            {/* Saat */}
            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.disabled', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 32, textAlign: 'right' }}>
              {formatTime(event.eventTime)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default EventListCard;