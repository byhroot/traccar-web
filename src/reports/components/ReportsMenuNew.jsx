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
import HubIcon from '@mui/icons-material/Hub';
import PageLayout from '../../common/components/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import ReportsMenu from './ReportsMenu';
import AreaChartIcon from '@mui/icons-material/AreaChart';
import ReportsMenuNewAICard from './ReportsMenuNewAICard';

const ReportsMenuNew = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const menuItems = [
    { title: t('reportPositions'), link: '/reports/route', icon: <TimelineIcon />, adminOnly: true },
    { title: t('reportEvents'), link: '/reports/events', icon: <NotificationsActiveIcon />, adminOnly: false, subItems: [t("eventAlarm"), t('sharedGeofence'), t('eventMaintenance')] },
    { title: t('reportTrips'), link: '/reports/trips', icon: <RouteIcon />, adminOnly: false, subItems: [t("reportReplay"), t('positionHours'), t('sharedDrivers')] },
    { title: t('reportStops'), link: '/reports/stops', icon: <PauseCircleFilledIcon />, adminOnly: false, subItems: [t("eventDeviceStopped"), t('alarmIdle')] },
    //{ title: t('sharedGeofences'), link: '/reports/geofences', icon: <AreaChartIcon />, adminOnly: false, subItems: [t("eventGeofenceEnter"), t('eventGeofenceExit')] },
    { title: t('reportSummary'), link: '/reports/summary', icon: <FormatListBulletedIcon />, adminOnly: false, subItems: [t("reportDaily"), t('calendarWeekly'), t('calendarMonthly')] },
    { title: t('reportCombined'), link: '/reports/combined', icon: <StarIcon />, adminOnly: false, subItems: [t("reportEvents"), t('sharedGetMapState')] },
    { title: t('reportChart'), link: '/reports/chart', icon: <TrendingUpIcon />, adminOnly: false, subItems: [t('commandData')] },
    { title: t('reportReplay'), link: '/replay', icon: <PlayCircleFilledIcon />, adminOnly: false, subItems: [t('commandTimezone')] },
    { title: t('userAdmin'), link: '/reports/actions', icon: <HubIcon />, adminOnly: true },
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
          overflowY: 'auto',       // dikey kaydırmayı aç
          boxSizing: 'border-box', // padding hesaba katılsın
        }}
      >      {/* Üst Başlık Kartı */}
        {/* Menü Kartları */}
        <ReportsMenuNewAICard />
        <Grid container spacing={3}>
          {menuItems.map((item, index) => {
            if (item.adminOnly && !admin) return null;
            if (item.readonlyDisabled && readonly) return null;

            const isSelected = location.pathname === item.link;

            return (
              <Grid size={{ xs: 6, sm: 4, md: 4, lg: 2 }} key={item.link}>                <Slide
                in
                direction={index % 2 === 0 ? 'up' : 'left'} // farklı yönlerden gelsin
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card
                  component={Link}
                  to={item.link}
                  sx={{
                    minHeight: 120, // sabit değil, gerektiğinde uzayabilir
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
                        p: 0, // 🔹 dikey boşluğu ciddi azaltır
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          color: isSelected ? 'primary.contrastText' : 'primary.main',
                          fontSize: 50,
                          lineHeight: 0,
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
                      {item.subItems && (
                        <Box
                          sx={{
                            mt: 0.4,
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 0.5, // aralar çok az boşluk
                          }}
                        >
                          {item.subItems.map((sub, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                color: isSelected ? 'primary.contrastText' : 'text.secondary',
                                lineHeight: 1.1,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              • {sub}
                            </Typography>
                          ))}
                        </Box>
                      )}


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
