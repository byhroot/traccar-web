import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Draggable from 'react-draggable';
import {
  AppBar,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,Badge,Box,Dialog,DialogContent,DialogTitle
} from '@mui/material';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import PackageStatusCard from '../../../src/main/PackageStatusCard';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
const useStyles = makeStyles((theme) => ({
  desktopRoot: {
    height: '100%',
    display: 'flex',
  },
  mobileRoot: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  desktopDrawer: {
    width: theme.dimensions.drawerWidthDesktop,
  },
  mobileDrawer: {
    width: theme.dimensions.drawerWidthTablet,
  },
  mobileToolbar: {
    zIndex: 1,
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
    return (
      <Typography variant="h6" noWrap>{t(breadcrumbs[0])}</Typography>
    );
  }
  return (
    <Breadcrumbs>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography variant="h6" color="inherit" key={breadcrumb}>{t(breadcrumb)}</Typography>
      ))}
      <Typography variant="h6" color="textPrimary">{t(breadcrumbs[breadcrumbs.length - 1])}</Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({ menu, breadcrumbs, children }) => {
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openDrawer, setOpenDrawer] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const user = useSelector((state) => state.session.user);
  const [attributes] = useState(user.attributes);
  const statuscarddisabled = attributes.statuscarddisabled;

  return desktop ? (
    <div className={classes.desktopRoot}>
      <Drawer
        variant="permanent"
        className={classes.desktopDrawer}
        classes={{ paper: classes.desktopDrawer }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          {!statuscarddisabled&&
            <Box position="absolute" top={10} right={16} zIndex={10} display="flex" gap={1}>
<Badge color="success" variant="dot">
  <IconButton
    onClick={() => setPackageDialogOpen(true)}
    sx={{
      width: 56,
      height: 40,
      borderRadius: 2, // 0 tam kare olur, 2 hafif yumuşatır
      backgroundColor: theme.palette.background.paper,
      boxShadow: 1,
      border: `1px solid ${theme.palette.primary.light}`,
      transition: 'all 0.25s ease-in-out',
      '&:hover': {
        transform: 'scale(1.08)',
        boxShadow: 4,
        backgroundColor: theme.palette.action.hover,
      },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <AssignmentIndIcon
      sx={{
        fontSize: 32,
        color: theme.palette.primary.main,
      }}
    />
  </IconButton>
</Badge>

          </Box>

          }
          <PageTitle breadcrumbs={breadcrumbs} />
        </Toolbar>
        <Divider />
        {menu}
      </Drawer>
      <div className={classes.content}>{children}</div>
    <Dialog open={packageDialogOpen} onClose={()=>setPackageDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogContent>
            <PackageStatusCard />
          </DialogContent>
      </Dialog>
    </div>
  ) : (
    <div className={classes.mobileRoot}>
      <Drawer
        variant="temporary"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        classes={{ paper: classes.mobileDrawer }}
      >
        {menu}
      </Drawer>
      <AppBar className={classes.mobileToolbar} position="static" color="inherit">
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => setOpenDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <PageTitle breadcrumbs={breadcrumbs} />
          {!statuscarddisabled&&
            <Box position="absolute" top={10} right={16} zIndex={10} display="flex" gap={1}>
<Badge color="success" variant="dot">
  <IconButton
    onClick={() => setPackageDialogOpen(true)}
    sx={{
      width: 56,
      height: 40,
      borderRadius: 2, // 0 tam kare olur, 2 hafif yumuşatır
      backgroundColor: theme.palette.background.paper,
      boxShadow: 1,
      border: `1px solid ${theme.palette.primary.light}`,
      transition: 'all 0.25s ease-in-out',
      '&:hover': {
        transform: 'scale(1.08)',
        boxShadow: 4,
        backgroundColor: theme.palette.action.hover,
      },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <AssignmentIndIcon
      sx={{
        fontSize: 32,
        color: theme.palette.primary.main,
      }}
    />
  </IconButton>
</Badge>

          </Box>

          }
        </Toolbar>
      </AppBar>
      <Dialog open={packageDialogOpen} onClose={()=>setPackageDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogContent>
            <PackageStatusCard />
          </DialogContent>
      </Dialog>
      <div className={classes.content}>{children}</div>
    </div>
  );
};

export default PageLayout;
