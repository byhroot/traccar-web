import { Divider, List, Stack } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import RouteIcon from '@mui/icons-material/Route';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import NotesIcon from '@mui/icons-material/Notes';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import MenuItem from '../../common/components/MenuItem';
import HomeIcon from '@mui/icons-material/Home';
import { Card, CardContent, Typography, Slide, Box } from '@mui/material'; import AssessmentIcon from '@mui/icons-material/Assessment'; // ikon ekleyelim
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DashboardIcon from '@mui/icons-material/Dashboard';

const ReportsMenu = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');
  const navigate = useNavigate();
  const buildLink = (path) => {
    const sourceParams = new URLSearchParams(location.search);
    const deviceIds = sourceParams.getAll('deviceId');
    const groupIds = sourceParams.getAll('groupId');
    if (!deviceIds.length && !groupIds.length) {
      return path;
    }
    const params = new URLSearchParams();
    if (path === '/reports/chart' || path === '/reports/route' || path === '/replay') {
      const [firstDeviceId] = deviceIds;
      if (firstDeviceId != null) {
        params.append('deviceId', firstDeviceId);
      }
    } else {
      deviceIds.forEach((deviceId) => params.append('deviceId', deviceId));
      groupIds.forEach((groupId) => params.append('groupId', groupId));
    }
    const search = params.toString();
    return search ? `${path}?${search}` : path;
  };

  return (
    <>
      <Slide in direction="down" timeout={700}>
        <Box sx={{ px: 2, py: 1 }}>
          <Card
            onClick={() => navigate('/dashboard')}
            sx={{
              background: 'linear-gradient(135deg, #00959E 0%, #00bcd4 50%, #42d7f5 100%)',
              color: '#fff',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,149,158,0.35)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 28px rgba(0,149,158,0.45)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -40,
                left: '30%',
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                pointerEvents: 'none',
              },
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 3,
              px: 3,
              '&:last-child': { pb: 3 },
            }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}>
                  <AssessmentIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2 }}>
                    {t('reportTitle')}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 0.3 }}>
                    Dashboard
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <DashboardIcon sx={{ fontSize: 15 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Slide>

      <List>
        <MenuItem
          title={"AI " + t('reportTitle')}
          link="/reports/ai-details"
          icon={<AutoAwesomeIcon />}
          selected={location.pathname === '/reports/ai-details'}
        />
        <MenuItem
          title={t('reportTrips')}
          link={buildLink('/reports/trips')}
          icon={<PlayCircleFilledIcon />}
          selected={location.pathname === '/reports/trips'}
        />

        <MenuItem
          title={t('reportEvents')}
          link={buildLink('/reports/events')}
          icon={<NotificationsActiveIcon />}
          selected={location.pathname === '/reports/events'}
        />


        <MenuItem
          title={t('reportStops')}
          link={buildLink('/reports/stops')}
          icon={<PauseCircleFilledIcon />}
          selected={location.pathname === '/reports/stops'}
        />
        <MenuItem
          title={t('reportSummary')}
          link={buildLink('/reports/summary')}
          icon={<FormatListBulletedIcon />}
          selected={location.pathname === '/reports/summary'}
        />
        <MenuItem
          title={t('reportChart')}
          link={buildLink('/reports/chart')}
          icon={<TrendingUpIcon />}
          selected={location.pathname === '/reports/chart'}
        />
        <MenuItem
          title={t('reportCombined')}
          link={buildLink('/reports/combined')}
          icon={<StarIcon />}
          selected={location.pathname === '/reports/combined'}
        />
        <MenuItem title={t('reportReplay')} link={buildLink('/replay')} icon={<RouteIcon />} />
        {admin && (
          <MenuItem
            title={t('reportPositions')}
            link={buildLink('/reports/route')}
            icon={<TimelineIcon />}
            selected={location.pathname === '/reports/route'}
          />
        )}
      </List>
      <Divider />
      <List>

        {admin && (
          <MenuItem
            title={t('sharedLogs')}
            link="/reports/logs"
            icon={<NotesIcon />}
            selected={location.pathname === '/reports/logs'}
          />
        )}
        {!readonly && (
          <MenuItem
            title={t('reportScheduled')}
            link="/reports/scheduled"
            icon={<EventRepeatIcon />}
            selected={location.pathname === '/reports/scheduled'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('statisticsTitle')}
            link="/reports/statistics"
            icon={<BarChartIcon />}
            selected={location.pathname === '/reports/statistics'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('reportAudit')}
            link="/reports/actions"
            icon={<VerifiedUserIcon />}
            selected={location.pathname === '/reports/actions'}
          />
        )}
      </List>
    </>
  );
};

export default ReportsMenu;
