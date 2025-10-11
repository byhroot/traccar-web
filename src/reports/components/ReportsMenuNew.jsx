import React from 'react';
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Slide,
  useThemeProps,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

// 🔹 İkonlar tek tek import edildi
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
import AssessmentIcon from '@mui/icons-material/Assessment';
import PageLayout from '../../common/components/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import ReportsMenu from './ReportsMenu';

const ReportsMenuNew = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const menuItems = [
    { title: t('dashboardTitle'), link: '/dashboard', icon: <HomeIcon />, adminOnly: false },
    { title: t('reportRoute'), link: '/reports/route', icon: <TimelineIcon />, adminOnly: true },
    { title: t('reportEvents'), link: '/reports/event', icon: <NotificationsActiveIcon />, adminOnly: false },
    { title: t('reportTrips'), link: '/reports/trip', icon: <RouteIcon />, adminOnly: false },
    { title: t('reportStops'), link: '/reports/stop', icon: <PauseCircleFilledIcon />, adminOnly: false },
    { title: t('reportSummary'), link: '/reports/summary', icon: <FormatListBulletedIcon />, adminOnly: false },
    { title: t('reportCombined'), link: '/reports/combined', icon: <StarIcon />, adminOnly: false },
    { title: t('reportChart'), link: '/reports/chart', icon: <TrendingUpIcon />, adminOnly: false },
    { title: t('reportReplay'), link: '/replay', icon: <PlayCircleFilledIcon />, adminOnly: false },
    { title: t('userAdmin'), link: '/reports/userlogs', icon: <NotesIcon />, adminOnly: true },
    { title: t('sharedLogs'), link: '/reports/logs', icon: <NotesIcon />, adminOnly: true },
    { title: t('reportScheduled'), link: '/reports/scheduled', icon: <EventRepeatIcon />, readonlyDisabled: true },
    { title: t('statisticsTitle'), link: '/reports/statistics', icon: <BarChartIcon />, adminOnly: true },
  ];

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'dashboardTitle']}>

<Box
  sx={{
    p: { xs: 2, md: 4 },
    pb: 8,
    minHeight: '100vh',      // ekran yüksekliği kadar
    overflowY: 'auto',       // dikey kaydırmayı aç
    boxSizing: 'border-box', // padding hesaba katılsın
  }}
>      {/* Üst Başlık Kartı */}
      
      {!desktop && 
      <Slide in direction="down" timeout={700}>
        <Card
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, #00959E 30%, #42d7f5 90%)',
            color: '#fff',
            borderRadius: 4,
            boxShadow: 4,
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
            }}
          >
            <AssessmentIcon sx={{ fontSize: 40, mr: 1 }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', letterSpacing: 1 }}
            >
              {t('reportTitle')}
            </Typography>
          </CardContent>
        </Card>
      </Slide>
      }
      {/* Menü Kartları */}
      <Grid container spacing={3}>
        {menuItems.map((item, index) => {
          if (item.adminOnly && !admin) return null;
          if (item.readonlyDisabled && readonly) return null;

          const isSelected = location.pathname === item.link;

          return (
            <Grid item xs={6} sm={4} md={4} lg={2} key={item.link}>
              <Slide
                in
                direction={index % 2 === 0 ? 'up' : 'left'} // farklı yönlerden gelsin
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card
  component={Link}
  to={item.link}
  sx={{
    height: 140,
    borderRadius: 4,
    overflow: 'hidden', // 🔹 köşe yuvarlamaları düzgün olsun
    textDecoration: 'none',
    color: 'inherit',
    background: isSelected
      ? `linear-gradient(135deg, ${theme.palette.primary.light} 20%, ${theme.palette.primary.main} 90%)`
      : theme.palette.background.paper, // 🔹 sadece Card seviyesinde background
    boxShadow: isSelected ? 6 : 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
  }}
>
  <CardActionArea sx={{ height: '100%' }}>
    <CardContent
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    > 
      <Box
        sx={{
          mb: 1,
          color: isSelected ? 'primary.contrastText' : 'primary.main',
          fontSize: 50,
        }}
      >
        {React.cloneElement(item.icon, { fontSize: 'inherit' })}
      </Box>

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 'bold',
          color: isSelected ? 'primary.contrastText' : 'text.primary',
        }}
      >
        {item.title}
      </Typography>
    </CardContent>
  </CardActionArea>
</Card>

              </Slide>
            </Grid>
          );
        })}
      </Grid>
    </Box>
    </PageLayout>
  );
};

export default ReportsMenuNew;
