import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';

import { List } from 'react-window';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow from './DeviceRow';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { Dialog, Stack, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"; // import ekle
import { useTranslation } from '../common/components/LocalizationProvider';


const useStyles = makeStyles()((theme) => ({
  list: {
    height: '100%',
    direction: theme.direction,
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
}));

const DeviceList = ({ devices }) => {
  const { classes } = useStyles();
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
      {
        !statuscarddisabled &&
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
    const response = await fetchOrThrow('/api/devices');
    dispatch(devicesActions.refresh(await response.json()));
  }, []);

  return (
    <>
      <List
        className={classes.list}
        rowComponent={DeviceRow}
        rowCount={devices.length}
        rowHeight={72}
        rowProps={{ devices }}
        overscanCount={5}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxHeight: '90vh' // Mobilde ekranın dışına taşmaması için
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="900" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
              {t("paketAlertgecmis")}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 2, py: 0.5 }}> {/* Padding'i minimuma indirdik */}
          <Stack spacing={0.5} sx={{ mt: 1, mb: 1 }}>
            {expiringDevices.map((d, i) => (
              <Box
                key={i}
                sx={{
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ width: '100%' }}>
                  <Typography
                    variant="body2"
                    fontWeight="800"
                    sx={{ color: 'text.primary', fontSize: '0.85rem' }}
                  >
                    • {d.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'error.main', fontSize: '0.75rem', fontWeight: '600', opacity: 0.9 }}
                  >
                    ({dayjs(d.expirationTime).format("DD/MM/YYYY")})
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 0.5 }}>
          <Button
            fullWidth
            onClick={() => navigate("/settings/paymentpage")}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '10px',
              py: 1,
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '0.9rem'
            }}
          >
            {t("userBilling")}
          </Button>
          <Button
            fullWidth
            onClick={() => setDialogOpen(false)}
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              textTransform: 'none',
              minHeight: '32px'
            }}
          >
            {t("sharedCancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeviceList;
