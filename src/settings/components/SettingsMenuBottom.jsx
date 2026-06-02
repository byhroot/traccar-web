import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  Snackbar
} from '@mui/material';

import TuneIcon from '@mui/icons-material/Tune';
import DrawIcon from '@mui/icons-material/Draw';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import SendIcon from '@mui/icons-material/Send';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HelpIcon from '@mui/icons-material/Help';
import PaymentIcon from '@mui/icons-material/Payment';
import CampaignIcon from '@mui/icons-material/Campaign';
import CalculateIcon from '@mui/icons-material/Calculate';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useManager, useRestriction } from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import DarkModeSwitch from '../components/DarkmodeSwicth';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HandymanIcon from '@mui/icons-material/Handyman';
import { Avatar, Chip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const ModernSettingsMenu = ({ open, onClose, handleLogout }) => {
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const readonly = useRestriction('readonly');
  const admin = useAdministrator();
  const manager = useManager();
  const userId = useSelector((state) => state.session.user.id);
  const supportLink = useSelector((state) => state.session.server.attributes.support);
  const billingLink = useSelector((state) => state.session.user.attributes.billingLink);
  const features = useFeatures();
  const [logoutOpen, setLogoutOpen] = useState(false);
  // Önce selector'ları ekle (diğer useSelector'ların yanına):
  const userName = useSelector((state) => state.session.user.name);
  const userEmail = useSelector((state) => state.session.user.email);
  const sms = useSelector((state) => state.session.user.attributes?.sms || 0);
  const servis = useSelector((state) => state.session.user?.attributes?.servis || false);

  const go = (link) => {
    navigate(link);
    onClose();
  };

  const renderItem = (title, link, icon, selected) => (
    <ListItemButton
      key={link}
      selected={selected}
      onClick={() => go(link)}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        '&.Mui-selected': {
          backgroundColor: 'rgba(0,149,158,0.12)',
        },
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={title} />
    </ListItemButton>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: {
            xs: '70%',   // mobil
            sm: 300,   // küçük tablet
            md: 300,     // desktop
          },
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* HEADER */}
        {/* HEADER */}
        <Box
          sx={{
            position: 'relative',
            pt: 3,
            pb: 2.5,
            px: 2.5,
            background: 'linear-gradient(145deg, #00959E 0%, #006f75 60%, #005a60 100%)',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -30, right: -30,
              width: 130, height: 130,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -20, left: -20,
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                width: 46, height: 46,
                background: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                border: '2px solid rgba(255,255,255,0.4)',
              }}
            >
              {userName ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
            </Avatar>

            <Box>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.2 }}>
                {userName || 'Kullanıcı'}
              </Typography>
              {userEmail && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                  {userEmail}
                </Typography>
              )}

              {/* Rozet — mailin hemen altında */}
              {admin ? (
                <Chip
                  size="small"
                  icon={<AdminPanelSettingsIcon sx={{ fontSize: '0.75rem !important', color: '#f0a500 !important' }} />}
                  label="Admin"
                  sx={{
                    height: 20, fontSize: '0.65rem',
                    backgroundColor: 'rgba(240,165,0,0.18)',
                    color: '#f0d080',
                    mb: 1.5,
                    border: '1px solid rgba(240,165,0,0.30)',
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              ) : manager ? (
                <Chip
                  size="small"
                  icon={<ManageAccountsIcon sx={{ fontSize: '0.75rem !important', color: '#42d7f5 !important' }} />}
                  label="Manager"
                  sx={{
                    height: 20, fontSize: '0.65rem',
                    backgroundColor: 'rgba(0,149,158,0.20)',
                    color: '#42d7f5',
                    border: '1px solid rgba(0,149,158,0.35)',
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              ) : sms > 100 ? (
                <Chip
                  size="small"
                  label="PRO"
                  sx={{
                    height: 20, fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                    color: '#fff',
                    border: 'none',
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              ) : servis ? (
                <Chip
                  size="small"
                  label="Servis Yetkilisi"
                  sx={{
                    height: 20, fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                    color: '#fff',
                    border: 'none',
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              ) : null}
            </Box>
          </Box>
        </Box>

        {/* MENU SCROLL AREA */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DarkModeSwitch />
          </Box>
          <List>

            {renderItem(
              t('settingsTitle'),
              '/settings/preferences',
              <TuneIcon />,
              location.pathname === '/settings/preferences'
            )}

            {!readonly && (
              <>
                {renderItem(
                  t('sharedNotifications'),
                  '/settings/notificationsnew',
                  <NotificationsIcon />,
                  location.pathname.startsWith('/settings/notification')
                )}

                {renderItem(
                  t('settingsUser'),
                  `/settings/user/${userId}`,
                  <PersonIcon />,
                  location.pathname === `/settings/user/${userId}`
                )}

                {renderItem(
                  t('deviceTitle'),
                  '/settings/devicesuser',
                  <DirectionsCarIcon />,
                  location.pathname.startsWith('/settings/device')
                )}

                {renderItem(
                  t('sharedGeofences'),
                  '/geofences',
                  <DrawIcon />,
                  location.pathname.startsWith('/settings/geofence')
                )}

                {!features.disableGroups &&
                  renderItem(
                    t('settingsGroups'),
                    '/settings/groups',
                    <FolderIcon />,
                    location.pathname.startsWith('/settings/group')
                  )}

                {!features.disableDrivers &&
                  renderItem(
                    t('sharedDrivers'),
                    '/settings/drivers',
                    <PersonIcon />,
                    location.pathname.startsWith('/settings/driver')
                  )}

                {!features.disableCalendars &&
                  renderItem(
                    t('sharedCalendars'),
                    '/settings/calendars',
                    <TodayIcon />,
                    location.pathname.startsWith('/settings/calendar')
                  )}

                {!features.disableComputedAttributes && admin &&
                  renderItem(
                    t('sharedComputedAttributes'),
                    '/settings/attributes',
                    <CalculateIcon />,
                    location.pathname.startsWith('/settings/attribute')
                  )}

                {!features.disableMaintenance &&
                  renderItem(
                    t('sharedMaintenance'),
                    '/settings/maintenances',
                    <BuildIcon />,
                    location.pathname.startsWith('/settings/maintenance')
                  )}

                {!features.disableSavedCommands && admin &&
                  renderItem(
                    t('sharedSavedCommands'),
                    '/settings/commands',
                    <SendIcon />,
                    location.pathname.startsWith('/settings/command')
                  )}
              </>
            )}

            {renderItem(
              t('settingsSupport'),
              '/settings/supportpage',
              <SupportAgentIcon fontSize="small" color="primary" />,
              location.pathname.startsWith('/settings/supportpage')
            )}
            {billingLink &&
              renderItem(
                t('userBilling'),
                billingLink,
                <PaymentIcon />,
                false
              )}

            {supportLink &&
              renderItem(
                t('settingsSupport'),
                supportLink,
                <HelpIcon />,
                false
              )}

          </List>

          {manager && (
            <>
              <Divider sx={{ my: 2 }} />
              <List>
                {admin &&
                  renderItem(
                    t('serverAnnouncement'),
                    '/settings/announcement',
                    <CampaignIcon />,
                    location.pathname === '/settings/announcement'
                  )}

                {admin &&
                  renderItem(
                    t('settingsServer'),
                    '/settings/server',
                    <SettingsIcon />,
                    location.pathname === '/settings/server'
                  )}
                {admin &&
                  renderItem(
                    t('sharedLogs'),
                    '/reports/actions',
                    <VerifiedUserIcon />,
                    location.pathname === '/reports/actions'
                  )}
                {admin &&
                  renderItem(
                    t('sharedServiceName'),
                    '/servis',
                    <HandymanIcon />,
                    location.pathname === '/reports/actions'
                  )}

                {renderItem(
                  t('settingsUsers'),
                  '/settings/users',
                  <PeopleIcon />,
                  location.pathname.startsWith('/settings/user') &&
                  location.pathname !== `/settings/user/${userId}`
                )}
              </List>
            </>
          )}
        </Box>

        <Divider />

        {/* LOGOUT */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setLogoutOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            {t('loginLogout')}
          </Button>
        </Box>

      </Box>
      <Snackbar
        open={logoutOpen}
        autoHideDuration={4000}
        onClose={() => setLogoutOpen(false)}
        message={t('loginLogout')}
        action={
          <>

            <Button
              color="error"
              size="small"
              onClick={async () => {
                setLogoutOpen(false);
                await handleLogout();
              }}
            >
              {t('sharedYes')}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={() => setLogoutOpen(false)}
              sx={{ mr: 1 }}
            >
              {t('sharedNo')}
            </Button>

          </>
        }
      />
    </Drawer>
  );
};

export default ModernSettingsMenu;