import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import makeStyles from '@mui/styles/makeStyles';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow from './DeviceRow';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"; // import ekle
import { useTranslation } from '../common/components/LocalizationProvider';


const useStyles = makeStyles((theme) => ({
  list: {
    maxHeight: '100%',
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
}));

const DeviceList = ({ devices }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const listInnerEl = useRef(null);
// DeviceList fonksiyonunun içinde:
const [dialogOpen, setDialogOpen] = useState(false);
const navigate = useNavigate();
// DeviceList içinde state olarak ekle
const [expiringDevices, setExpiringDevices] = useState([]);
const t = useTranslation();

const user = useSelector((state) => state.session.user);
const [attributes] = useState(user.attributes);
const statuscarddisabled = attributes.statuscarddisabled;

useEffect(() => {
  const lastShown = localStorage.getItem("expirationDialogLastShown");
  const now = Date.now();

  if (lastShown && now - parseInt(lastShown, 10) < 24 * 60 * 60 * 1000) return; //10 Dakika göstermes

  const expDevicesPast = devices.filter(d => {
    if (!d.expirationTime) return false;
    const expTime = new Date(d.expirationTime).getTime();
    return expTime < now; // geçmiş olanlar
  });
  
  const expDevicesSoon = devices.filter(d => {
    if (!d.expirationTime) return false;
    const expTime = new Date(d.expirationTime).getTime();
    return expTime >= now && expTime - now <= 30 * 24 * 60 * 60 * 1000; // 30 gün içinde bitecek olanlar
  });
  
  // ikisini birleştir
  const expDevices = [...expDevicesPast, ...expDevicesSoon];
  

  if (expDevices.length > 0) {
    setExpiringDevices(expDevices);
    {!statuscarddisabled && 
      setDialogOpen(true);
    }
    localStorage.setItem("expirationDialogLastShown", now.toString());
  }
}, [devices]);

  if (listInnerEl.current) {
    listInnerEl.current.className = classes.listInner;
  }

  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffectAsync(async () => {
    const response = await fetch('/api/devices');
    if (response.ok) {
      dispatch(devicesActions.refresh(await response.json()));
    } else {
      throw Error(await response.text());
    }
  }, []);

  return (
    <>
    <AutoSizer className={classes.list}>
      {({ height, width }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={devices.length}
          itemData={devices}
          itemSize={72}
          overscanCount={10}
          innerRef={listInnerEl}
        >
          {DeviceRow}
        </FixedSizeList>
      )}
    </AutoSizer>
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>
    <Box display="flex" alignItems="center" gap={1}>
      <WarningAmberIcon color="warning" />
      {t("paketAlert")}
    </Box>
  </DialogTitle>
  <DialogContent dividers>
    <Typography>
      {t("paketAlert")} & {t("paketAlertgecmis")} 
    </Typography>
    <Box mt={2}>
      {expiringDevices.map((d, i) => (
        <Typography key={i} variant="body2">
          • {d.name} ({dayjs(d.expirationTime).format("DD/MM/YYYY")})
        </Typography>
      ))}
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => navigate("/settings/paymentpage")} variant="contained" color="primary">
     {t("positionCard")} 
    </Button>
    <Button onClick={() => setDialogOpen(false)}>{t("sharedCancel")}</Button>
  </DialogActions>
</Dialog>
</>
  );
};

export default DeviceList;
