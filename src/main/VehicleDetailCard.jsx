import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Stack, Chip, Grid,
  Avatar, IconButton, LinearProgress, Tooltip, alpha,
  useTheme, Badge, Tab, Tabs,
} from '@mui/material';
import NearMeIcon from '@mui/icons-material/NearMe';
import SettingsIcon from '@mui/icons-material/Settings';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import PaymentIcon from '@mui/icons-material/Payment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import { useDispatch } from 'react-redux';
import { devicesActions } from '../store';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  const p = new Date(d);
  return isNaN(p) ? '—' : p.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysLeft = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : Math.ceil((d - Date.now()) / 86400000);
};

const expiryStatus = (s) => {
  const d = daysLeft(s);
  if (d === null) return 'unknown';
  if (d < 0) return 'expired';
  if (d <= 45) return 'warning';
  return 'ok';
};

const fmtLastUpdate = (s) => {
  if (!s) return '—';
  const p = new Date(s);
  if (isNaN(p)) return '—';
  const diff = Math.floor((Date.now() - p) / 60000);
  if (diff < 1) return 'Az önce';
  if (diff < 60) return `${diff} dk önce`;
  if (diff < 1440) return `${Math.floor(diff / 60)} sa önce`;
  return fmtDate(s);
};

const fmtSpeed = (knots) =>
  knots != null && knots > 0 ? `${Math.round(knots * 1.852)} km/h` : '0 km/h';

const vehicleIcon = (category) => {
  if (!category) return DirectionsCarIcon;
  const c = category.toLowerCase();
  if (c.includes('motor') || c.includes('moto') || c === 'motorcycle') return TwoWheelerIcon;
  if (c.includes('truck') || c.includes('kamyon')) return LocalShippingIcon;
  return DirectionsCarIcon;
};

// ─── EXPIRY BAR ───────────────────────────────────────────────────────────────

const ExpiryBar = ({ label, dateStr, icon: Icon }) => {
  const theme = useTheme();
  const days = daysLeft(dateStr);
  const status = expiryStatus(dateStr);
  const color =
    status === 'expired' ? theme.palette.error.main
      : status === 'warning' ? theme.palette.warning.main
        : theme.palette.success.main;
  const pct = days === null ? 0 : Math.max(0, Math.min(100, (days / 365) * 100));

  return (
    <Box sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${alpha(color, 0.2)}`, bgcolor: alpha(color, 0.04) }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {Icon && <Icon sx={{ fontSize: 13, color: 'text.secondary' }} />}
          <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {days !== null && days <= 45 && (
            <Chip label={days < 0 ? 'Doldu' : `${days}g`} size="small"
              color={days < 0 ? 'error' : 'warning'} sx={{ height: 16, fontSize: 10, fontWeight: 700 }} />
          )}
          <Typography sx={{ fontSize: 11, color, fontWeight: 600 }}>{fmtDate(dateStr)}</Typography>
        </Stack>
      </Stack>
      <LinearProgress variant="determinate" value={pct} sx={{
        height: 4, borderRadius: 99,
        bgcolor: alpha(color, 0.12),
        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 99 },
      }} />
    </Box>
  );
};

// ─── STAT ROW ─────────────────────────────────────────────────────────────────

const StatRow = ({ icon: Icon, label, value, color }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box sx={{
        width: 26, height: 26, borderRadius: 1.5, flexShrink: 0,
        bgcolor: alpha(color || theme.palette.primary.main, 0.1),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon sx={{ fontSize: 14, color: color || theme.palette.primary.main }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 10.5, color: 'text.secondary', lineHeight: 1 }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }} noWrap>{value}</Typography>
      </Box>
    </Stack>
  );
};

// ─── VEHICLE PANEL ────────────────────────────────────────────────────────────

const VehiclePanel = ({ device, position, maintenances, events }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const isOnline = device.status === 'online';
  const isMoving = isOnline && device.motionState;
  const speed = position?.speed || 0;
  const ignition = position?.attributes?.ignition;
  const isIdle = isOnline && !isMoving && speed < 1 && ignition === true;
  const voltage = position?.attributes?.power || position?.attributes?.battery;
  const gpsValid = position?.valid !== false;
  const VIcon = vehicleIcon(device.category);

  const statusColor = isMoving ? theme.palette.info.main
    : isIdle ? theme.palette.secondary.main
      : isOnline ? theme.palette.success.main
        : theme.palette.text.disabled;

  const statusLabel = isMoving
    ? `${t('eventDeviceMoving')} · ${fmtSpeed(speed)}`
    : isIdle ? t('commandIdlingAlarm')
      : isOnline
        ? ignition === true ? `${t('eventIgnitionOn')} · ${t('eventDeviceStopped')}` : t('eventDeviceStopped')
        : t('deviceStatusOffline');

  const devEvents = (events || []).filter(e => e.deviceId === device.id);
  const overspeedCount = devEvents.filter(e => e.type === 'deviceOverspeed').length;
  const alarmCount = devEvents.filter(e => e.type === 'alarm').length;

  const allMaintenances = [
    ...(maintenances || []),
    ...Object.values(device.attributes?.bakimlar || {}),
  ];
  const urgentMaint = allMaintenances.filter(m => {
    const d = daysLeft(m.date || m.tarih);
    return d !== null && d <= 30;
  });

  // ── Paket süresi uyarısı (30 gün eşiği) ──
  const pkgDays = daysLeft(device.expirationTime);
  const pkgWarn = pkgDays !== null && pkgDays <= 30;
  const pkgExpired = pkgDays !== null && pkgDays < 0;

  const insStatus = expiryStatus(device.attributes?.insuranceExpiration);
  const hasAlert = pkgWarn || insStatus !== 'ok' || urgentMaint.length > 0;

  return (
    <Box>
      {/* ── Başlık ── */}
      <Box sx={{
        p: 1.5, bgcolor: alpha(statusColor, 0.06),
        borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: statusColor, border: `2px solid ${theme.palette.background.paper}` }} />
          }>
          <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(statusColor, 0.15), border: `1.5px solid ${alpha(statusColor, 0.4)}` }}>
            <VIcon sx={{ fontSize: 22, color: statusColor }} />
          </Avatar>
        </Badge>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography fontWeight={700} sx={{ fontSize: 15 }} noWrap>{device.name}</Typography>
            {hasAlert && <WarningAmberIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.2 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{statusLabel}</Typography>
          </Stack>
          <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: 0.15 }}>
            {t('deviceLastUpdate')}: {fmtLastUpdate(device.lastUpdate)}
            {device.contact ? ` · ${device.contact}` : ''}
          </Typography>
        </Box>

        {/* ── Aksiyon butonları (küçük, sade) ── */}
        <Stack direction="row" spacing={0.5}>
          {pkgWarn && (
            <Tooltip title={pkgExpired ? 'Paket süresi doldu — Ödeme Yap' : `${pkgDays} gün kaldı — Ödeme Yap`}>
              <IconButton
                size="small"
                onClick={() => navigate('/settings/paymentpage')}
                sx={{
                  width: 28, height: 28, borderRadius: 1.5,
                  bgcolor: alpha(pkgExpired ? theme.palette.error.main : theme.palette.warning.main, 0.1),
                  border: `1px solid ${alpha(pkgExpired ? theme.palette.error.main : theme.palette.warning.main, 0.3)}`,
                  color: pkgExpired ? theme.palette.error.main : theme.palette.warning.main,
                  '&:hover': { bgcolor: alpha(pkgExpired ? theme.palette.error.main : theme.palette.warning.main, 0.18) },
                }}
              >
                <PaymentIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('sharedShowDetails')}>
            <IconButton size="small"
              onClick={() => navigate(`/settings/device/${device.id}/details`)}
              sx={{ width: 28, height: 28, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.divider, 1)}` }}>
              <SettingsIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Haritada Göster">
            <IconButton
              size="small"
              onClick={() => {
                dispatch(devicesActions.selectId(device.id));
                navigate('/');
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                border: `1px solid ${alpha(theme.palette.divider, 1)}`,
                position: 'relative',
                overflow: 'visible',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -3,
                  borderRadius: '6px',
                  border: `1.5px solid ${theme.palette.primary.main}`,
                  opacity: 0,
                  animation: 'liveRing 1.8s ease-in-out infinite',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '8px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                  opacity: 0,
                  animation: 'liveRing 1.8s ease-in-out infinite 0.4s',
                },
                '@keyframes liveRing': {
                  '0%': { opacity: 0, transform: 'scale(0.85)' },
                  '30%': { opacity: 1 },
                  '100%': { opacity: 0, transform: 'scale(1.15)' },
                },
                '@keyframes livePulse': {
                  '0%, 100%': { opacity: 0.7 },
                  '50%': { opacity: 1 },
                },
                animation: 'livePulse 1.8s ease-in-out infinite',
              }}
            >
              <NearMeIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

        </Stack>
      </Box>

      {/* ── Paket uyarı satırı (başlık altında, ince) ── */}
      {pkgWarn && (
        <Box sx={{
          px: 2, py: 0.75,
          bgcolor: alpha(pkgExpired ? theme.palette.error.main : theme.palette.warning.main, 0.05),
          borderBottom: `1px solid ${alpha(pkgExpired ? theme.palette.error.main : theme.palette.warning.main, 0.15)}`,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <WarningAmberIcon sx={{ fontSize: 13, color: pkgExpired ? theme.palette.error.main : theme.palette.warning.main, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 11.5, flex: 1, color: pkgExpired ? theme.palette.error.main : theme.palette.warning.main, fontWeight: 500 }}>
            {pkgExpired
              ? `Paket süresi ${Math.abs(pkgDays)} gün önce doldu`
              : `Paket süresi ${pkgDays} gün içinde doluyor`}
          </Typography>
          <Typography
            onClick={() => navigate('/settings/paymentpage')}
            sx={{
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              color: pkgExpired ? theme.palette.error.main : theme.palette.warning.main,
              textDecoration: 'underline', textUnderlineOffset: 2,
              '&:hover': { opacity: 0.75 },
            }}
          >
            Ödeme Yap →
          </Typography>
        </Box>
      )}

      {/* ── İçerik ── */}
      <Box sx={{ p: 1.5 }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              {t('commandGetDeviceStatus')}
            </Typography>
            <Stack spacing={1}>
              <StatRow
                icon={isMoving ? SpeedIcon : LocalParkingIcon}
                label={t('deviceStatus')}
                value={isMoving ? `${fmtSpeed(speed)}` : isIdle ? t('commandIdlingAlarm') : t('eventDeviceStopped')}
                color={isMoving ? theme.palette.info.main : theme.palette.text.secondary}
              />
              <StatRow
                icon={ignition === true ? VpnKeyIcon : PowerOffIcon}
                label={t('positionIgnition')}
                value={ignition === true ? t('eventIgnitionOn') : ignition === false ? t('eventIgnitionOff') : t('deviceStatusUnknown')}
                color={ignition === true ? theme.palette.success.main : theme.palette.text.secondary}
              />
              {voltage != null && (
                <StatRow icon={BatteryChargingFullIcon} label={t('positionPower')}
                  value={`${Number(voltage).toFixed(1)} V`}
                  color={voltage < 11.5 ? theme.palette.error.main : theme.palette.success.main} />
              )}
              <StatRow icon={GpsFixedIcon} label={t('positionGps')}
                value={gpsValid ? t('positionValid') : t('deviceStatusUnknown')}
                color={gpsValid ? theme.palette.success.main : theme.palette.error.main} />
              {(overspeedCount > 0 || alarmCount > 0) && (
                <StatRow icon={WarningAmberIcon} label={t('reportEvents')}
                  value={`${t('eventDeviceOverspeed')}: ${overspeedCount} · ${t('eventAlarm')}: ${alarmCount}`}
                  color={theme.palette.warning.main} />
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              {t('date')} & {t('sharedMaintenance')}
            </Typography>
            <Stack spacing={1}>
              <ExpiryBar label={`TakipOn ${t('userExpirationTime')}`} dateStr={device.expirationTime} icon={PaymentIcon} />
              <ExpiryBar label={t('sigortaTarih')} dateStr={device.attributes?.insuranceExpiration} icon={SecurityIcon} />
              {(maintenances || []).slice(0, 2).map((m, i) => (
                <Box key={i} sx={{
                  px: 1.25, py: 0.9, borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                  display: 'flex', alignItems: 'center', gap: 1,
                }}>
                  <BuildIcon sx={{ fontSize: 13, color: theme.palette.info.main, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }} noWrap>{m.name || m.type || 'Bakım'}</Typography>
                    {m.date && <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>{fmtDate(m.date)}</Typography>}
                  </Box>
                  {m.date && daysLeft(m.date) <= 30 && (
                    <Chip label={`${daysLeft(m.date)}g`} size="small" color="warning" sx={{ height: 16, fontSize: 10, fontWeight: 700 }} />
                  )}
                </Box>
              ))}
              {Object.values(device.attributes?.bakimlar || {}).slice(0, 2).map((b, i) => (
                <Box key={i} sx={{ px: 1.25, py: 0.9, borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.1), border: `1px solid ${alpha(theme.palette.divider, 1)}` }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{b.servis}</Typography>
                  <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
                    {fmtDate(b.tarih)}{b.notlar?.length ? ` · ${b.notlar[0]}` : ''}
                  </Typography>
                </Box>
              ))}
              {allMaintenances.length === 0 && !device.expirationTime && !device.attributes?.insuranceExpiration && (
                <Typography sx={{ fontSize: 11.5, color: 'text.disabled', fontStyle: 'italic' }}>Bakım kaydı yok</Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// ─── VEHICLE DETAIL CARD ──────────────────────────────────────────────────────

const SELECTED_DEVICE_KEY = 'vdc_selected_device';

const VehicleDetailCard = ({ devices, positions, maintenanceMap, events }) => {
  const theme = useTheme();
  const [search, setSearch] = useState('');

  const [activeId, setActiveId] = useState(() => {
    const saved = localStorage.getItem(SELECTED_DEVICE_KEY);
    return saved ? Number(saved) : null;
  });

  const posMap = useMemo(
    () => Object.fromEntries((positions || []).map(p => [String(p.deviceId), p])),
    [positions],
  );

  const activeDevice = useMemo(() => {
    if (activeId) {
      const found = devices.find(d => d.id === activeId);
      if (found) return found;
    }
    return devices[0] || null;
  }, [activeId, devices]);

  if (!activeDevice) return null;

  const handleSelect = (device) => {
    setActiveId(device.id);
    localStorage.setItem(SELECTED_DEVICE_KEY, String(device.id));
    setSearch('');
  };

  const activePos = posMap[String(activeDevice.id)];
  const activeMaint = maintenanceMap?.[activeDevice.id] || [];
  const isOnline = (d) => d.status === 'online';
  const useSearchMode = devices.length > 5;
  const t = useTranslation();
  const filtered = useMemo(() => {
    if (!search.trim()) return devices;
    return devices.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [devices, search]);

  // Sekme/liste için paket uyarı hesabı
  const pkgWarnForDevice = (d) => {
    const days = daysLeft(d.expirationTime);
    return days !== null && days <= 30;
  };

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 1)}`, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 1)}`, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        {useSearchMode ? (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.25, py: 0.5, borderRadius: 2, flexShrink: 0,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, bgcolor: activeDevice.status === 'online' ? theme.palette.success.main : theme.palette.text.disabled }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.palette.primary.main, whiteSpace: 'nowrap' }}>
                  {activeDevice.name}
                </Typography>
                {pkgWarnForDevice(activeDevice) && (
                  <WarningAmberIcon sx={{ fontSize: 11, color: theme.palette.warning.main }} />
                )}
              </Box>
              <input
                placeholder={t("sharedSearch")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'inherit', fontFamily: 'inherit', minWidth: 0 }}
              />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25 }}>
                  <CloseIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                </IconButton>
              )}
            </Box>
            {search && (
              <Box sx={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                bgcolor: 'background.paper',
                border: `1px solid ${alpha(theme.palette.divider, 1)}`,
                borderTop: 'none', borderRadius: '0 0 12px 12px',
                maxHeight: 220, overflowY: 'auto', boxShadow: theme.shadows[4],
              }}>
                {filtered.length === 0 ? (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Sonuç bulunamadı</Typography>
                  </Box>
                ) : filtered.map((d) => {
                  const online = isOnline(d);
                  const moving = online && d.motionState;
                  const dotColor = moving ? theme.palette.info.main : online ? theme.palette.success.main : theme.palette.text.disabled;
                  const warn = pkgWarnForDevice(d);
                  return (
                    <Box key={d.id} onClick={() => handleSelect(d)} sx={{
                      px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1,
                      cursor: 'pointer', transition: 'background .12s',
                      bgcolor: d.id === activeDevice.id ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      '&:last-child': { borderBottom: 'none' },
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                    }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, bgcolor: dotColor }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{d.name}</Typography>
                      {warn && <WarningAmberIcon sx={{ fontSize: 12, color: theme.palette.warning.main }} />}
                      <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                        {moving ? 'Hareket' : online ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { height: 0 } }}>
            <Tabs
              value={activeDevice.id}
              onChange={(_, id) => handleSelect(devices.find(d => d.id === id))}
              variant="scrollable" scrollButtons={false}
              TabIndicatorProps={{ style: { backgroundColor: theme.palette.primary.main, height: 2 } }}
              sx={{ minHeight: 40 }}
            >
              {devices.map((d) => {
                const online = isOnline(d);
                const moving = online && d.motionState;
                const warn = pkgWarnForDevice(d);
                const dotColor = moving ? theme.palette.info.main : online ? theme.palette.success.main : theme.palette.text.disabled;
                return (
                  <Tab key={d.id} value={d.id}
                    sx={{ minHeight: 40, minWidth: 0, px: 1.5, py: 0 }}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
                        <Typography sx={{
                          fontSize: 12, fontWeight: activeDevice.id === d.id ? 700 : 500,
                          color: activeDevice.id === d.id ? theme.palette.primary.main : 'text.primary',
                          whiteSpace: 'nowrap',
                        }}>
                          {d.name}
                        </Typography>
                        {warn && <WarningAmberIcon sx={{ fontSize: 11, color: theme.palette.warning.main }} />}
                      </Stack>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>
        )}
      </Box>

      <VehiclePanel
        device={activeDevice}
        position={activePos}
        maintenances={activeMaint}
        events={events}
      />
    </Card>
  );
};

export default VehicleDetailCard;