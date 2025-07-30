import React from 'react';
import {
  Divider, List, ListItemButton, ListItemIcon, ListItemText,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import RouteIcon from '@mui/icons-material/Route';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import NotesIcon from '@mui/icons-material/Notes';
import HomeIcon from '@mui/icons-material/Home';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import { Card, CardContent, Typography, Slide, Box } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment'; // ikon ekleyelim


const MenuItem = ({
  title, link, icon, selected,
}) => (
  <ListItemButton key={link} component={Link} to={link} selected={selected}>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText primary={title} />
  </ListItemButton>
);

const ReportsMenu = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  return (
    <>
      <Slide in direction="down" timeout={700}>
        <Box sx={{ px: 2, py: 1 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #00959E 30%, #42d7f5 90%)',
              color: '#fffFFf',
              borderRadius: 3,
              boxShadow: 3,
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
              <AssessmentIcon sx={{ fontSize: 32, mr: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                {t('reportTitle')}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Slide>

      <List>
        <MenuItem
          title={t('dashboardTitle')}
          link="/dashboard"
          icon={<HomeIcon />}
          selected={location.pathname === '/dashboard'}
        />
        <MenuItem
          title={t('reportCombined')}
          link="/reports/combined"
          icon={<StarIcon />}
          selected={location.pathname === '/reports/combined'}
        />
        {admin && (
          <MenuItem
            title={t('reportRoute')}
            link="/reports/route"
            icon={<TimelineIcon />}
            selected={location.pathname === '/reports/route'}
          />
        )}
        <MenuItem
          title={t('reportEvents')}
          link="/reports/event"
          icon={<NotificationsActiveIcon />}
          selected={location.pathname === '/reports/event'}
        />
        <MenuItem
          title={t('reportTrips')}
          link="/reports/trip"
          icon={<RouteIcon />}
          selected={location.pathname === '/reports/trip'}
        />
        <MenuItem
          title={t('reportStops')}
          link="/reports/stop"
          icon={<PauseCircleFilledIcon />}
          selected={location.pathname === '/reports/stop'}
        />
        <MenuItem
          title={t('reportSummary')}
          link="/reports/summary"
          icon={<FormatListBulletedIcon />}
          selected={location.pathname === '/reports/summary'}
        />
        <MenuItem
          title={t('reportChart')}
          link="/reports/chart"
          icon={<TrendingUpIcon />}
          selected={location.pathname === '/reports/chart'}
        />
        <MenuItem
          title={t('reportReplay')}
          link="/replay"
          icon={<PlayCircleFilledIcon />}
        />
      </List>
      <Divider />
      <List>
        {admin && (
            <MenuItem
              title={t('userAdmin')}
              link="/reports/userlogs"
              icon={<NotesIcon />}
              selected={location.pathname === '/reports/userlogs'}
            />
          )}
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
      </List>
    </>
  );
};

export default ReportsMenu;
