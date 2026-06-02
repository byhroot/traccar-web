// src/dashboard/DemoModeBanner.jsx

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Chip, alpha, useTheme,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';

// ─── DEMO VERİLERİ ────────────────────────────────────────────────────────────

export const DEMO_DEVICES = [
  { id: 9001, name: '34 ABC 001 — Kamyon', status: 'online', motionState: true, category: 'truck', lastUpdate: new Date().toISOString(), contact: '0532 111 22 33', expirationTime: new Date(Date.now() + 160 * 86400000).toISOString(), attributes: { insuranceExpiration: new Date(Date.now() + 15 * 86400000).toISOString() } },
  { id: 9002, name: '06 XYZ 202 — Minibüs', status: 'online', motionState: false, category: 'van', lastUpdate: new Date(Date.now() - 5 * 60000).toISOString(), contact: '0533 222 33 44', expirationTime: new Date(Date.now() + 120 * 86400000).toISOString(), attributes: {} },
  { id: 9003, name: '35 DEF 777 — Binek', status: 'offline', motionState: false, category: 'car', lastUpdate: new Date(Date.now() - 2 * 3600000).toISOString(), contact: '0534 333 44 55', expirationTime: new Date(Date.now() + 50 * 86400000).toISOString(), attributes: { insuranceExpiration: new Date(Date.now() + 200 * 86400000).toISOString() } },
  { id: 9004, name: '07 GHI 444 — SUV', status: 'online', motionState: true, category: 'car', lastUpdate: new Date().toISOString(), contact: '', expirationTime: new Date(Date.now() + 90 * 86400000).toISOString(), attributes: {} },
];

export const DEMO_POSITIONS = [
  { deviceId: 9001, speed: 65, valid: true, latitude: 41.015, longitude: 28.979, attributes: { ignition: true, power: 13.8 } },
  { deviceId: 9002, speed: 0, valid: true, latitude: 39.925, longitude: 32.836, attributes: { ignition: true, power: 12.1 } },
  { deviceId: 9003, speed: 0, valid: true, latitude: 38.423, longitude: 27.142, attributes: { ignition: false, power: 11.9 } },
  { deviceId: 9004, speed: 88, valid: true, latitude: 40.762, longitude: 29.940, attributes: { ignition: true, power: 14.1 } },
];

export const DEMO_EVENTS = (() => {
  const now = Date.now();
  const ev = (id, deviceId, type, alarm, hoursAgo) => ({
    id, deviceId, type,
    eventTime: new Date(now - hoursAgo * 3600000).toISOString(),
    attributes: alarm ? { alarm } : {},
  });
  return [
    ev(1, 9001, 'deviceOverspeed', null, 1),
    ev(2, 9001, 'deviceOverspeed', null, 3),
    ev(3, 9004, 'deviceOverspeed', null, 5),
    ev(4, 9001, 'alarm', 'hardBraking', 2),
    ev(5, 9002, 'alarm', 'hardAcceleration', 4),
    ev(6, 9004, 'alarm', 'hardAcceleration', 6),
    ev(7, 9001, 'alarm', 'hardCornering', 8),
    ev(8, 9003, 'alarm', 'idle', 10),
    ev(9, 9002, 'geofenceExit', null, 12),
    ev(10, 9004, 'alarm', 'sos', 14),
    ev(11, 9001, 'ignitionOn', null, 0.5),
    ev(12, 9002, 'deviceStopped', null, 1.5),
  ];
})();

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

export const DashboardEmptyState = ({ onLoadDemo }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', py: 10, gap: 2,
      border: `1px dashed ${alpha(theme.palette.divider, 1)}`,
      borderRadius: 3,
      bgcolor: alpha(theme.palette.action.hover, 0.3),
    }}>
      <DirectionsCarIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
      <Typography variant="h6" fontWeight={700} color="text.secondary">
        Henüz araç yok
      </Typography>
      <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ maxWidth: 300 }}>
        Sisteme araç eklemek için Cihaz Aktivasyonu bölümüne gidin ya da arayüzü keşfetmek için demo verileri yükleyin.
      </Typography>
      <Stack direction="column" spacing={1.5} mt={1}>
        <Chip
          icon={<DirectionsCarIcon />}
          label="Aktivasyon & Canlı Destek"
          clickable
          onClick={() => navigate('/settings/supportpage')}
          sx={{ fontWeight: 600, px: 1 }}
        />
        <Chip
          icon={<DashboardIcon />}
          label="Demo Verileri Yükle"
          clickable
          color="primary"
          onClick={onLoadDemo}
          sx={{ fontWeight: 600, px: 1 }}
        />
      </Stack>
    </Box>
  );
};

// ─── DEMO BANNER ─────────────────────────────────────────────────────────────

export const DemoModeBanner = ({ onClear }) => {
  const theme = useTheme();

  return (
    <Box sx={{
      mb: 2, px: 2, py: 1, borderRadius: 2,
      bgcolor: alpha(theme.palette.warning.main, 0.08),
      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
    }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <WarningAmberIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
        <Typography variant="caption" sx={{ fontSize: 12, color: theme.palette.warning.dark, fontWeight: 600 }}>
          Demo modu — gerçek veriler gösterilmiyor
        </Typography>
      </Stack>
      <Chip
        label="Gerçek veriye dön"
        size="small"
        onClick={onClear}
        onDelete={onClear}
        deleteIcon={<CloseIcon />}
        sx={{ fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
      />
    </Box>
  );
};