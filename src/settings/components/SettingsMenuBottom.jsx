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

import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useManager, useRestriction } from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import DarkModeSwitch from '../components/DarkmodeSwicth';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

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
        <Box
          sx={{
            p: 1,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #00959E 30%, #42d7f5 90%)',
            color: '#fff'
          }}
        >
          <AssessmentIcon sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            {t('settingsTitle')}
          </Typography>
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