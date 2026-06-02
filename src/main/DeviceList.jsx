import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';

import { List } from 'react-window';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow from './DeviceRow';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { Dialog, Stack, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip } from "@mui/material";
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
            borderRadius: 5,
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            backgroundImage: 'none',
            bgcolor: 'background.paper',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 12px 40px rgba(0,0,0,0.45)'
                : '0 12px 40px rgba(0,0,0,0.12)',
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 2.2,
            pt: 2.2,
            pb: 1.8,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,152,0,0.14) 0%, rgba(255,152,0,0.02) 100%)'
                : 'linear-gradient(180deg, rgba(255,152,0,0.12) 0%, rgba(255,152,0,0.03) 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'warning.main',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 6px 16px rgba(255,152,0,0.35)',
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 28 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={900}
                sx={{
                  lineHeight: 1.1,
                  color: 'text.primary',
                }}
              >
                {t("paketAlertgecmis")}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mt: 0.4,
                }}
              >
                {expiringDevices.length} araç için işlem gerekli
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* CONTENT */}
        <DialogContent
          sx={{
            px: 1.2,
            py: 1.2,
            maxHeight: '55vh',
            overflowY: 'auto',

            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'divider',
              borderRadius: 10,
            },
          }}
        >
          <Stack spacing={1}>
            {expiringDevices.map((d, i) => {
              const expired = dayjs(d.expirationTime).isBefore(dayjs());

              return (
                <Box
                  key={i}
                  sx={{
                    p: 1.2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: expired ? 'error.main' : 'warning.main',
                    bgcolor: expired
                      ? 'error.light'
                      : 'warning.main',
                    opacity: 0.92,
                    color: '#fff',
                    transition: '0.2s',

                    '&:hover': {
                      transform: 'translateY(-1px)',
                      opacity: 1,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        noWrap
                        sx={{
                          fontSize: '0.85rem',
                        }}
                      >
                        {d.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.9,
                          fontWeight: 600,
                          fontSize: '0.72rem',
                        }}
                      >
                        Son Tarih:{" "}
                        {dayjs(d.expirationTime).format("DD/MM/YYYY")}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={expired ? 'Süresi Geçti' : 'Yaklaşıyor'}
                      color={expired ? 'error' : 'warning'}
                      sx={{
                        fontWeight: 700,
                        height: 24,
                        bgcolor: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        backdropFilter: 'blur(6px)',

                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </DialogContent>

        {/* ACTIONS */}
        <DialogActions
          sx={{
            p: 1.5,
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1,
            flexDirection: 'column',
          }}
        >
          <Button
            fullWidth
            onClick={() => navigate("/settings/paymentpage")}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 3,
              py: 1.2,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.92rem',
              boxShadow: 'none',
            }}
          >
            {t("userBilling")}
          </Button>

          <Button
            fullWidth
            onClick={() => setDialogOpen(false)}
            variant="text"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              color: 'text.secondary',
              fontWeight: 700,
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
