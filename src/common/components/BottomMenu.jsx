import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper, Box, BottomNavigation, BottomNavigationAction, Menu, MenuItem, Typography, Badge, ListItemIcon, Snackbar
} from '@mui/material';
import OtherHousesIcon from '@mui/icons-material/OtherHouses';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';


import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useTheme } from '@mui/material/styles';
import HandymanIcon from '@mui/icons-material/Handyman';
import { sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useAdministrator, useManager, useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';
import ModernSettingsMenu from '../../settings/components/SettingsMenuBottom';

const BottomMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();
  const admin = useAdministrator();
  const manager = useManager();
  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');
  const devices = useSelector((state) => state.devices.items);
  const user = useSelector((state) => state.session.user);
  const servis = useSelector((state) => (state.session?.user?.attributes?.servis || false) === true);
  const socket = useSelector((state) => state.session.socket);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const theme = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const currentSelection = () => {
    if (location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    }
    if (location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    if (location.pathname.startsWith('/reports')) {
      return 'reports';
    }
    if (location.pathname.startsWith('/Reportsmenu')) {
      return 'Reportsmenu';
    }
    if (location.pathname === '/') {
      return 'map';
    }
    if (location.pathname === '/dashboard') {
      return 'dashboard';
    } if (location.pathname === '/servis') {
      return 'servis';
    }
    if (location.pathname === '/settings/supportpage') {
      return 'settings';
    }
    return null;
  };

  const handleAccount = () => {
    setAnchorEl(null);
    navigate(`/settings/user/${user.id}`);
  };

  const handleLogout = async () => {
    setAnchorEl(null);

    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens:
              tokens.length > 1
                ? tokens.filter((it) => it !== notificationToken).join(',')
                : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }

    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  const handleSelection = (event, value) => {
    switch (value) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'servis':
        navigate('/servis');
        break;
      case 'map':
        navigate('/');
        break;
      case 'reports': {
        let id = selectedDeviceId;
        if (id == null) {
          const deviceIds = Object.keys(devices);
          if (deviceIds.length === 1) {
            id = deviceIds[0];
          }
        }

        if (id != null) {
          navigate('/reports/reports');//navigate(`/reports/trips?deviceId=${id}`);
        } else {
          navigate('/reports/reports');
        }
        break;
      }
      case 'reportsmenu':
        navigate('/Reportsmenu');
        break;
      case 'settings':
        navigate('/settings/preferences?menu=true');
        break;
      case 'account':
        setSettingsOpen(true);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <Paper square elevation={3}>
      <BottomNavigation
        value={currentSelection()}
        onChange={handleSelection}
        showLabels
        sx={{
          left: 0,
          right: 0,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: 'isvisible',
          clipPath: 'path("M0,0 Hcalc(50% - 50px) Q50%,20 50%,0 Hcalc(50% + 40px) V100% H0 Z")',
        }}
      >
        {[
          { label: t('mainpageTitle'), value: 'dashboard', disabled: servis, icon: <OtherHousesIcon /> },
          { label: t('sharedServiceName'), value: 'servis', disabled: !servis, icon: <HandymanIcon /> },
          { label: t('mapTitle'), value: 'map', icon: <SatelliteAltIcon />, badge: socket === false },
          { label: t('reportTitle'), value: 'reports', icon: <AssessmentIcon />, disabled: disableReports },
          { label: readonly ? t('loginLogout') : t('commandIndex'), value: readonly ? 'logout' : 'account', icon: readonly ? <ExitToAppIcon /> : <SettingsSuggestIcon /> },
        ].map((item) => (
          !item.disabled && (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    mt: currentSelection() === item.value ? -3 : 0,
                    bgcolor: currentSelection() === item.value ? theme.palette.primary.contrastText : 'transparent',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: currentSelection() === item.value ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                  }}
                >
                  {item.badge ? (
                    <Badge color="error" variant="dot" overlap="circular">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </Box>
              }
              sx={{
                color: currentSelection() === item.value ? '#7c3aed' : '##4a6166',
                fontWeight: currentSelection() === item.value ? 'bold' : 'normal',
                minWidth: 60,
                paddingTop: 1,
                paddingBottom: 1.5,
                gap: '0px',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.80rem',
                  marginTop: '0px',
                },
              }}
            />
          )
        ))}
      </BottomNavigation>
      <ModernSettingsMenu
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        handleLogout={handleLogout}
      />
    </Paper>
  );
};

export default BottomMenu;
