import React, { useState, useEffect, useCallback, use } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Typography, Box, Chip, CircularProgress, Autocomplete,
  TextField, Switch, FormControlLabel, IconButton, Table, TableRow,
  TableCell, TableHead, TableBody, Button, TableSortLabel,
  Collapse, Paper, useMediaQuery, Divider, useTheme, Avatar,
  TableContainer, Stack, LinearProgress, Tooltip, Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import SpeedIcon from '@mui/icons-material/Speed';
import LinkIcon from '@mui/icons-material/Link';
import PaymentIcon from '@mui/icons-material/Payment';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import VerifiedIcon from '@mui/icons-material/Verified';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import DeviceUsersValue from './components/DeviceUsersValue';
import { useAdministrator } from '../common/util/permissions';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { useTranslation } from '../common/components/LocalizationProvider';
import AdminFinanceDialog from './DevicesPage2Statistic';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed) ? '—' : parsed.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysLeft = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
};

const expiryStatus = (dateStr) => {
  const days = daysLeft(dateStr);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 45) return 'warning';
  return 'ok';
};

const fmtSpeed = (knots) => (knots ? `${Math.round(knots * 1.852)} km/s` : '—');
const fmtLastUpdate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed)) return '—';
  const diff = Math.floor((Date.now() - parsed) / 60000);
  if (diff < 1) return 'Az önce';
  if (diff < 60) return `${diff} dk önce`;
  if (diff < 1440) return `${Math.floor(diff / 60)} sa önce`;
  return fmtDate(d);
};

// ─── Summary banner ───────────────────────────────────────────────────────────

const SummaryBanner = ({ devices, theme }) => {
  const expired = devices.filter((d) => expiryStatus(d.expirationTime) === 'expired');
  const warning = devices.filter((d) => expiryStatus(d.expirationTime) === 'warning');
  const online = devices.filter((d) => d.status === 'online');
  const t = useTranslation();
  const cards = [
    {
      icon: <CheckCircleOutlineIcon />,
      label: t("deviceStatusOnline"),
      value: online.length,
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, 0.08),
    },
    {
      icon: <WarningAmberIcon />,
      label: t("userExpirationTime"),
      value: warning.length,
      sub: warning.map((d) => d.name).join(', ') || null,
      color: theme.palette.warning.main,
      bg: alpha(theme.palette.warning.main, 0.08),
    },
    {
      icon: <ErrorOutlineIcon />,
      label: t("paketExpired"),
      value: expired.length,
      sub: expired.map((d) => d.name).join(', ') || null,
      color: theme.palette.error.main,
      bg: alpha(theme.palette.error.main, 0.08),
    },
    {
      icon: <DirectionsCarIcon />,
      label: t("deviceTitle"),
      value: devices.length,
      color: theme.palette.primary.main,
      bg: alpha(theme.palette.primary.main, 0.08),
    },
  ];

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {cards.map((c, i) => (
        <Grid size={{ xs: 6, md: 3 }} key={i}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 3,
              border: `1px solid ${alpha(c.color, 0.25)}`,
              background: c.bg,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box sx={{ color: c.color, display: 'flex' }}>{c.icon}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1, color: c.color }}>
                {c.value}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.3 }}>
                {c.label}
              </Typography>
              {c.sub && (
                <Tooltip title={c.sub}>
                  <Typography
                    noWrap
                    sx={{ fontSize: '0.65rem', color: c.color, maxWidth: 100, mt: 0.3 }}
                  >
                    {c.sub}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// ─── Expiry progress bar ──────────────────────────────────────────────────────

const ExpiryBar = ({ dateStr, theme }) => {
  const days = daysLeft(dateStr);
  if (days === null) return <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>—</Typography>;

  const status = expiryStatus(dateStr);
  const color =
    status === 'expired' ? theme.palette.error.main
      : status === 'warning' ? theme.palette.warning.main
        : theme.palette.success.main;
  const t = useTranslation();
  const totalDays = 365;
  const pct = Math.max(0, Math.min(100, (days / totalDays) * 100));

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          {days < 0 ? '' : `${days} ${t("sharedDays")}`}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color }}>{fmtDate(dateStr)}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: alpha(color, 0.15),
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
        }}
      />
    </Box>
  );
};

// ─── Category icon ────────────────────────────────────────────────────────────

const CategoryAvatar = ({ category, status, theme }) => {
  const isOnline = status === 'online';
  const icon = mapIcons[mapIconKey(category)];

  const bgColor = isOnline
    ? alpha(theme.palette.success.main, 1)
    : alpha(theme.palette.grey[500], 0.15);

  const borderColor = isOnline
    ? alpha(theme.palette.success.main, 0.4)
    : alpha(theme.palette.grey[500], 0.3);

  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <FiberManualRecordIcon
          sx={{
            fontSize: 10,
            color: isOnline
              ? theme.palette.success.main
              : theme.palette.grey[400],
          }}
        />
      }
    >
      <Avatar
        sx={{
          bgcolor: bgColor,
          border: `1.5px solid ${borderColor}`,
          boxShadow: 2,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon && (
          <img
            src={icon}
            alt=""
            style={{
              width: 22,
              height: 22,
              objectFit: 'contain',
              filter: isOnline
                ? 'brightness(0) invert(1)' // beyaz ikon
                : 'grayscale(1) opacity(0.6)',
            }}
          />
        )}
      </Avatar>
    </Badge>
  );
};

// ─── Device card ──────────────────────────────────────────────────────────────

const DeviceCard = ({ device, maintenances, admin, theme, t, navigate }) => {
  const [open, setOpen] = useState(false);
  const status = expiryStatus(device.expirationTime);
  const isOnline = device.status === 'online';
  const insStatus = expiryStatus(device.attributes?.insuranceExpiration);
  const days = daysLeft(device.expirationTime);

  const borderColor =
    status === 'expired' ? theme.palette.error.main
      : status === 'warning' ? theme.palette.warning.main
        : isOnline ? alpha(theme.palette.success.main, 0.5)
          : alpha(theme.palette.divider, 1);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1.5px solid ${borderColor}`,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: `0 4px 20px ${alpha(borderColor, 0.25)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Card header — always visible */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <CategoryAvatar category={device.category} status={device.status} theme={theme} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              noWrap
              sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}
            >
              {device.name}
            </Typography>
            {device.attributes?.ticari && (
              <Tooltip title="Ticari araç">
                <LocalShippingIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              </Tooltip>
            )}
          </Box>
          <Typography noWrap sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
            {t(`category${device?.category?.charAt(0).toUpperCase()}${device?.category?.slice(1)}`)} · {fmtLastUpdate(device.lastUpdate)}
          </Typography>

          {/* Mini expiry bar */}
          <Box sx={{ mt: 0.8 }}>
            <ExpiryBar dateStr={device.expirationTime} theme={theme} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          {status === 'expired' && (
            <Chip label="Doldu" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
          )}
          {status === 'warning' && (
            <Chip label={`${days}g`} size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
          )}
          <IconButton size="small" sx={{ p: 0.25 }}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded detail */}
      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Grid container spacing={1}>

            {/* Row: contact + speed */}
            <Grid size={{ xs: 6 }}>
              <InfoRow
                icon={<PersonIcon sx={{ fontSize: 13 }} />}
                label={t("deviceContact")}
                value={device.contact || '—'}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <InfoRow
                icon={<SpeedIcon sx={{ fontSize: 13 }} />}
                label={t("attributeSpeedLimit")}
                value={fmtSpeed(device.attributes?.speedLimit)}
              />
            </Grid>

            {/* Row: motion + unique id */}
            <Grid size={{ xs: 6 }}>
              <InfoRow
                icon={
                  <FiberManualRecordIcon
                    sx={{ fontSize: 13, color: device.motionState ? theme.palette.success.main : theme.palette.grey[400] }}
                  />
                }
                label={t("positionMotion")}
                value={device.motionState ? t("eventDeviceMoving") : t("eventDeviceStopped")}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <InfoRow icon={<VerifiedIcon sx={{ fontSize: 13 }} />} label="ID" value={device.id || '—'} mono />
            </Grid>

            {/* Sigorta */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: `1px solid ${alpha(
                    insStatus === 'expired' ? theme.palette.error.main
                      : insStatus === 'warning' ? theme.palette.warning.main
                        : theme.palette.divider, 0.4)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                  <SecurityIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t("sigortaTarih")}
                  </Typography>
                </Box>
                <ExpiryBar dateStr={device.attributes?.insuranceExpiration} theme={theme} />
              </Box>
            </Grid>

            {/* Bakımlar */}
            {maintenances && maintenances.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                    <BuildIcon sx={{ fontSize: 13, color: theme.palette.info.main }} />
                    <Typography sx={{ fontSize: '0.68rem', color: theme.palette.info.main, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🔔 Bakım hatırlatmaları ({maintenances.length})
                    </Typography>
                  </Box>
                  {maintenances.slice(0, 2).map((m, i) => (
                    <Typography key={i} sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.6 }}>
                      • {m.name || m.type || 'Bakım'}{m.date ? ` — ${fmtDate(m.date)}` : ''}
                    </Typography>
                  ))}
                  {maintenances.length > 2 && (
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                      +{maintenances.length - 2} daha…
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            {/* Custom bakimlar attribute */}
            {device.attributes?.bakimlar && Object.keys(device.attributes.bakimlar).length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1, borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 1)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                    <BuildIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📝  Servis geçmişi
                    </Typography>
                  </Box>
                  {Object.values(device.attributes.bakimlar).slice(0, 2).map((b, i) => (
                    <Box key={i} sx={{ mb: 0.4 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
                        {b.servis}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                        {fmtDate(b.tarih)}{b.notlar?.length ? ` · ${b.notlar[0]}` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<OnlinePredictionIcon sx={{ fontSize: 14 }} />}
              onClick={() => navigate(`/settings/device/${device.id}/details`)}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', fontWeight: 600, flex: 1 }}
            >
              {t("settingsTitle")}
            </Button>

            {admin && (
              <>
                <IconButton
                  size="small"
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    width: 30, height: 30,
                  }}
                  onClick={() => navigate(`/settings/device/${device.id}/connections`)}
                >
                  <LinkIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    width: 30, height: 30,
                  }}
                  onClick={() => navigate(`/settings/device/${device.id}`)}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </>
            )}

            {(status === 'expired' || status === 'warning') && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<PaymentIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate('/settings/paymentpage')}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', fontWeight: 600 }}
              >
                {t("userBilling")}
              </Button>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

// small helper row
const InfoRow = ({ icon, label, value, mono }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
      <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
    </Box>
    <Typography
      noWrap
      sx={{
        fontSize: '0.78rem',
        fontWeight: 600,
        color: 'text.primary',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}
    >
      {value}
    </Typography>
  </Box>
);

// ─── Table row ────────────────────────────────────────────────────────────────

const DeviceTableRow = ({ device, maintenances, admin, theme, t, navigate }) => {
  const [open, setOpen] = useState(false);
  const status = expiryStatus(device.expirationTime);
  const insStatus = expiryStatus(device.attributes?.insuranceExpiration);
  const isOnline = device.status === 'online';

  const statusColor =
    status === 'expired' ? theme.palette.error.main
      : status === 'warning' ? theme.palette.warning.main
        : theme.palette.success.main;

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& .MuiTableCell-root': { borderBottom: open ? 'none' : undefined } }}
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell sx={{ width: 36, px: 1 }}>
          <FiberManualRecordIcon sx={{ fontSize: 10, color: isOnline ? theme.palette.success.main : theme.palette.grey[400] }} />
        </TableCell>
        {admin && (
          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace' }}>
            {device.id}
          </TableCell>
        )}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{device.name}</Typography>
            {device.attributes?.ticari && (
              <Chip label="Ticari" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
            )}
          </Box>
          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
            {device.model || device.category || '—'} · {device.contact || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <ExpiryBar dateStr={device.expirationTime} theme={theme} />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8, height: 8, borderRadius: '50%',
                bgcolor:
                  insStatus === 'expired' ? theme.palette.error.main
                    : insStatus === 'warning' ? theme.palette.warning.main
                      : theme.palette.success.main,
              }}
            />
            <Typography sx={{ fontSize: '0.75rem' }}>{fmtDate(device.attributes?.insuranceExpiration)}</Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {fmtLastUpdate(device.lastUpdate)}
        </TableCell>
        <TableCell>
          <Chip
            label={isOnline ? t("deviceStatusOnline") : t("deviceStatusOffline")}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              fontWeight: 600,
              bgcolor: alpha(isOnline ? theme.palette.success.main : theme.palette.grey[500], 0.1),
              color: isOnline ? theme.palette.success.main : theme.palette.grey[600],
            }}
          />
        </TableCell>
        {admin && (
          <TableCell>
            <DeviceUsersValue deviceId={device.id} />
          </TableCell>
        )}
        <TableCell sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.3 }} onClick={(e) => e.stopPropagation()}>
            {admin && (
              <>
                <IconButton size="small" onClick={() => navigate(`/settings/device/${device.id}/connections`)}>
                  <LinkIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton size="small" onClick={() => navigate(`/settings/device/${device.id}`)}>
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </>
            )}
            <IconButton size="small" onClick={() => navigate(`/settings/device/${device.id}/details`)}>
              <OnlinePredictionIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        </TableCell>
        <TableCell sx={{ width: 32, px: 0.5 }}>
          {open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        </TableCell>
      </TableRow>

      {/* Expanded row */}
      <TableRow>
        <TableCell colSpan={admin ? 11 : 9} sx={{ p: 0, border: 'none' }}>
          <Collapse in={open}>
            <Box
              sx={{
                px: 3, py: 1.5,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              }}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    {t("sharedShowDetails")}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    <DetailLine label={t("deviceID")} value={device.id} mono />
                    <DetailLine label={t("deviceCategory")} value={device.category || '—'} />
                    <DetailLine label={t("deviceModel")} value={device.model || '—'} />
                    <DetailLine label={t("attributeSpeedLimit")} value={fmtSpeed(device.attributes?.speedLimit)} />
                    <DetailLine label={t("positionMotion")} value={device.motionState ? t("deviceMotionMoving") : t("deviceMotionParked")} />
                  </Box>
                </Grid>

                {(maintenances?.length > 0 || device.attributes?.bakimlar) && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      📝  {t("eventMaintenance")} {t("notes")}
                    </Typography>
                    {maintenances?.slice(0, 3).map((m, i) => (
                      <Typography key={i} sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.7 }}>
                        • {m.name || m.type}{m.date ? ` — ${fmtDate(m.date)}` : ''}
                      </Typography>
                    ))}
                    {device.attributes?.bakimlar && Object.values(device.attributes.bakimlar).slice(0, 2).map((b, i) => (
                      <Box key={i}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.6 }}>{b.servis}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{fmtDate(b.tarih)}</Typography>
                      </Box>
                    ))}
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    {t("sigortaTarih")}
                  </Typography>
                  <ExpiryBar dateStr={device.attributes?.insuranceExpiration} theme={theme} />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const DetailLine = ({ label, value, mono }) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', width: 80, flexShrink: 0 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit' }} noWrap>
      {value || '—'}
    </Typography>
  </Box>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const DevicesPage2 = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();
  const admin = useAdministrator();
  const groups = useSelector((state) => state.groups.items);

  const [items, setItems] = useState([]);
  const [maintenanceMap, setMaintenanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showList, setShowList] = useState(false);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const devs = await res.json();
          setItems(devs);
          // Fetch maintenances for each device
          const mMap = {};
          await Promise.all(
            devs.map(async (d) => {
              try {
                const mr = await fetch(`/api/maintenance?deviceId=${d.id}`);
                if (mr.ok) mMap[d.id] = await mr.json();
              } catch (_) { }
            }),
          );
          setMaintenanceMap(mMap);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const filteredItems = items.filter((item) => {
    const kw = searchKeyword.toLowerCase();
    const matchSearch =
      !kw ||
      item.name?.toLowerCase().includes(kw) ||
      item.id?.toString().includes(kw) ||
      item.uniqueId?.toLowerCase().includes(kw) ||
      item.category?.toLowerCase().includes(kw) ||
      item.contact?.toLowerCase().includes(kw) ||
      filterByKeyword(searchKeyword)(item);
    const matchGroup = !selectedGroup || item.groupId === selectedGroup.id;
    return matchSearch && matchGroup;
  });

  const handleSort = (col) => {
    setOrder(orderBy === col && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(col);
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    let av = a[orderBy] ?? '';
    let bv = b[orderBy] ?? '';
    if (orderBy === 'insurance') {
      av = a.attributes?.insuranceExpiration ?? '';
      bv = b.attributes?.insuranceExpiration ?? '';
    }
    return order === 'asc' ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
  });

  const SortCell = ({ col, label }) => (
    <TableCell>
      <TableSortLabel active={orderBy === col} direction={order} onClick={() => handleSort(col)}
        sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceTitle']}>
      <Box sx={{ px: { xs: 1, sm: 2 }, py: 2 }}>

        {/* Summary banner */}
        {!loading && <SummaryBanner devices={items} theme={theme} />}

        {/* Filter bar */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 1)}`,
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={0} alignItems="stretch">
            <Grid size={{ xs: 12, md: 5 }} sx={{ borderRight: { md: `1px solid ${alpha(theme.palette.divider, 1)}` } }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
                </Box>
                {admin && (
                  <IconButton
                    onClick={() => setFinanceDialogOpen(true)}
                    sx={{ mx: 0.5 }}
                    size="small"
                  >
                    <AnalyticsIcon fontSize="small" />
                  </IconButton>
                )}
                {!desktop && (
                  <FormControlLabel
                    sx={{ m: 0, mr: 1, whiteSpace: 'nowrap' }}
                    control={
                      <Switch size="small" checked={showList} onChange={(e) => setShowList(e.target.checked)} />
                    }
                    label={<Typography sx={{ fontSize: '0.75rem' }}>Liste</Typography>}
                  />
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ borderRight: { md: `1px solid ${alpha(theme.palette.divider, 1)}` } }}>
              <Autocomplete
                options={Object.values(groups)}
                getOptionLabel={(opt) => opt.name || ''}
                value={selectedGroup}
                onChange={(_, v) => setSelectedGroup(v)}
                fullWidth
                size="small"
                renderInput={(params) => (
                  <TextField {...params} placeholder={t("settingsGroups")} variant="outlined"
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }} />
                )}
              />
            </Grid>

            {desktop && (
              <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FormControlLabel
                  control={<Switch checked={showList} onChange={(e) => setShowList(e.target.checked)} size="small" />}
                  label={<Typography sx={{ fontSize: '0.75rem' }}>Liste</Typography>}
                  sx={{ m: 0 }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
            <CircularProgress size={48} thickness={3} />
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{t("sharedLoading")}…</Typography>
          </Box>
        ) : showList ? (
          /* ── Table view ── */
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 1)}`,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Table sx={{ minWidth: 700, borderCollapse: 'separate', borderSpacing: 0 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 36, px: 1 }} />
                  {admin && <SortCell col="id" label="ID" />}
                  <SortCell col="name" label={t("deviceTitle")} />
                  <SortCell col="expirationTime" label={"TakipOn " + t("userExpirationTime")} />
                  <SortCell col="insurance" label={t("sigortaTarih")} />
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t("deviceLastUpdate")}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t("deviceStatus")}
                  </TableCell>
                  {admin && (
                    <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t("deviceUsers")}
                    </TableCell>
                  )}
                  <TableCell />
                  <TableCell sx={{ width: 32 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedItems.map((item) => (
                  <DeviceTableRow
                    key={item.id}
                    device={item}
                    maintenances={maintenanceMap[item.id]}
                    admin={admin}
                    theme={theme}
                    t={t}
                    navigate={navigate}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* ── Card grid view — 2 columns on mobile ── */
          <Grid container spacing={1.5}>
            {sortedItems.map((device) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={device.id}>
                <DeviceCard
                  device={device}
                  maintenances={maintenanceMap[device.id]}
                  admin={admin}
                  theme={theme}
                  t={t}
                  navigate={navigate}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {admin && <CollectionFab editPath="/settings/device" />}

      {admin && (
        <AdminFinanceDialog
          open={financeDialogOpen}
          onClose={() => setFinanceDialogOpen(false)}
          devices={items}
        />
      )}
    </PageLayout>
  );
};

export default DevicesPage2;