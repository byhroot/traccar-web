import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AppBar,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Badge,
  Box,
  Dialog,
  DialogContent,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import PackageStatusCard from '../../../src/main/PackageStatusCard';
import BackIcon from './BackIcon';

const useStyles = makeStyles()((theme, { miniVariant }) => ({
  root: {
    height: '100%',
    display: 'flex',
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
    },
  },
  desktopDrawer: {
    width: miniVariant ? `calc(${theme.spacing(8)} + 1px)` : theme.dimensions.drawerWidthDesktop,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    '@media print': {
      display: 'none',
    },
  },
  mobileDrawer: {
    width: theme.dimensions.drawerWidthTablet,
    '@media print': {
      display: 'none',
    },
  },
  mobileToolbar: {
    zIndex: 1,
    '@media print': {
      display: 'none',
    },
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const theme = useTheme();
  const t = useTranslation();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  if (desktop) {
    return <Typography variant="h6" noWrap>{t(breadcrumbs[0])}</Typography>;
  }
  return (
    <Breadcrumbs sx={{ flexGrow: 1 }}>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography variant="h6" sx={{ fontSize: "16px" }} color="inherit" key={breadcrumb}>{t(breadcrumb)}</Typography>
      ))}
      <Typography variant="h6" sx={{ fontSize: "14px" }} color="textPrimary">{t(breadcrumbs[breadcrumbs.length - 1])}</Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({ menu, breadcrumbs, children }) => {
  const [miniVariant, setMiniVariant] = useState(false);
  const { classes } = useStyles({ miniVariant });
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openDrawer, setOpenDrawer] = useState(!desktop && searchParams.has('menu'));
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);

  const user = useSelector((state) => state.session.user);
  const statuscarddisabled = user?.attributes?.statuscarddisabled;
  const { id } = useParams();

  // Eğer URL'de bir id VARSA (detay sayfasıysa) butonu GİZLE
  const showPackageButton = !statuscarddisabled && !id;

  const toggleDrawer = () => setMiniVariant(!miniVariant);

  // Paket Butonu: Absolute kaldırıldı, yan yana gelmesi için margin-right eklendi.
  const PackageButton = ({ isMobile = false }) => (
    <Box sx={{ ml: isMobile ? 'auto' : 1, mr: 1 }}>
      <Badge color="success" variant="dot">
        <IconButton
          onClick={() => setPackageDialogOpen(true)}
          sx={{
            width: 48, // Biraz küçültüldü yan yana daha iyi durması için
            height: 40,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 1,
            border: `1px solid ${theme.palette.primary.light}`,
            transition: 'all 0.25s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: 3,
              backgroundColor: theme.palette.action.hover,
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AssignmentIndIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
        </IconButton>
      </Badge>
    </Box>
  );

  return (
    <div className={classes.root}>
      {/* DESKTOP DRAWER */}
      {desktop ? (
        <Drawer
          variant="permanent"
          className={classes.desktopDrawer}
          classes={{ paper: classes.desktopDrawer }}
        >
          <Toolbar sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            {!miniVariant ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                  <IconButton color="inherit" edge="start" sx={{ mr: 1 }} onClick={() => navigate('/')}>
                    <BackIcon />
                  </IconButton>
                  <PageTitle breadcrumbs={breadcrumbs} />
                </Box>
                {/* Daraltma ikonunun yanına geldi */}
                {!statuscarddisabled && <PackageButton />}
              </>
            ) : null}

            <IconButton
              color="inherit"
              edge="start"
              sx={{ ml: miniVariant ? 'auto' : 0, mr: miniVariant ? 'auto' : 0 }}
              onClick={toggleDrawer}
            >
              {miniVariant !== (theme.direction === 'rtl') ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Toolbar>
          <Divider />
          {menu}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          classes={{ paper: classes.mobileDrawer }}
        >
          {menu}
        </Drawer>
      )}

      {/* MOBIL APPBAR */}
      {!desktop && (
        <AppBar className={classes.mobileToolbar} position="static" color="inherit">
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => setOpenDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <PageTitle breadcrumbs={breadcrumbs} />
            </Box>
            {!statuscarddisabled && showPackageButton && < PackageButton isMobile />}
          </Toolbar>
        </AppBar>
      )}

      {/* ANA İÇERİK */}
      <div className={classes.content}>
        {children}
      </div>
      <Dialog open={packageDialogOpen} onClose={() => setPackageDialogOpen(false)} maxWidth="500px">
        <DialogContent>
          <PackageStatusCard />
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default PageLayout;