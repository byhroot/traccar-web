import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Typography, Button, Box, Paper, Stack, Chip, Alert, IconButton, Divider, useTheme
} from '@mui/material';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useNavigate } from 'react-router-dom';
import { useAdministrator } from '../common/util/permissions';
import PaymentIcon from '@mui/icons-material/Payment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HistoryIcon from '@mui/icons-material/History';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const AlertListCard = ({ deviceDetails }) => {
  const [alertDevices, setAlertDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [smsWarning, setSmsWarning] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const theme = useTheme();
  const user = useSelector((state) => state.session.user);
  const smsLimit = user.attributes?.smsLimit;
  const t = useTranslation();
  const admin = useAdministrator();
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);
    const lastYear = new Date();
    lastYear.setFullYear(now.getFullYear() - 1);

    const devices = deviceDetails.filter(device => {
      const expirationTime = device.expirationTime ? new Date(device.expirationTime) : null;
      const insuranceExpiration = device.attributes?.insuranceExpiration ? new Date(device.attributes.insuranceExpiration) : null;

      const isExpirationValid = expirationTime && expirationTime >= lastYear && expirationTime <= oneMonthLater;
      const isInsuranceExpiring = insuranceExpiration && insuranceExpiration >= lastYear && insuranceExpiration <= oneMonthLater;

      return isExpirationValid || isInsuranceExpiring;
    });

    setAlertDevices(devices);
    setFilteredDevices(devices);

    if (smsLimit < 500) {
      setSmsWarning(`SMS ${t("userUserLimit")}: ${smsLimit}`);
    } else {
      setSmsWarning(null);
    }
  }, [deviceDetails, smsLimit]);

  const handleFilterChange = (type) => {
    setFilterType(type);
    const now = new Date();
    const filtered = alertDevices.filter(device => {
      const expirationTime = device.expirationTime ? new Date(device.expirationTime) : null;
      const insuranceExpiration = device.attributes?.insuranceExpiration ? new Date(device.attributes.insuranceExpiration + "T00:00:00") : null;

      if (type === 'package') return expirationTime && expirationTime <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (type === 'insurance') return insuranceExpiration && insuranceExpiration <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return true;
    });
    setFilteredDevices(filtered);
  };

  const handleClickDevice = (deviceId) => {
    admin ? navigate(`/settings/device/${deviceId}`) : navigate(`/settings/device/${deviceId}/details`);
  };

  const getAlertData = (device) => {
    const now = new Date();
    const exp = device.expirationTime ? new Date(device.expirationTime) : null;
    const ins = device.attributes?.insuranceExpiration ? new Date(device.attributes.insuranceExpiration + "T00:00:00") : null;

    if (exp && exp < now) return { msg: t("paketAlertgecmis"), date: exp, type: 'danger', isPackage: true };
    if (exp && exp <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())) return { msg: t("paketAlert"), date: exp, type: 'warning', isPackage: true };
    if (ins && ins < now) return { msg: t("insuranceAlertGecmis"), date: ins, type: 'danger', isPackage: false };
    if (ins && ins <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())) return { msg: t("insuranceAlert"), date: ins, type: 'warning', isPackage: false };
    return { msg: '', date: null, type: 'default', isPackage: false };
  };

  return (
    <Box>
      {smsWarning && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} variant="outlined">
          {smsWarning}
        </Alert>
      )}

      {/* Modern Filtre Barı */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 1 }}>
        {[
          { id: 'all', label: t("eventAll") },
          { id: 'package', label: t("deviceTitle") },
          { id: 'insurance', label: t("sigortaTarih") }
        ].map((btn) => (
          <Chip
            key={btn.id}
            label={btn.label}
            onClick={() => handleFilterChange(btn.id)}
            color={filterType === btn.id ? "primary" : "default"}
            variant={filterType === btn.id ? "contained" : "outlined"}
            sx={{ fontWeight: 'bold' }}
          />
        ))}
      </Stack>

      {/* Masaüstü Tablo Görünümü */}
      <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t("sharedDevice")}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t("userExpirationTime")}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t("sharedDescription")}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices.map(device => {
              const data = getAlertData(device);
              return (
                <TableRow key={device.id} hover>
                  <TableCell onClick={() => handleClickDevice(device.id)} sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}>
                    {device.name}
                  </TableCell>
                  <TableCell>{data.date?.toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: data.type === 'danger' ? 'error.main' : 'warning.main', fontWeight: 700 }}>
                      {data.msg}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {data.isPackage && (
                      <Button size="small" variant="contained" startIcon={<PaymentIcon />} onClick={() => navigate("/settings/paymentpage")}>
                        {t("userBilling")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobil Kart Görünümü */}
      {/* Mobil Kart Görünümü */}
      <Stack spacing={0.3} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {filteredDevices.length === 0 ? (
          <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
            {t("uyariYokAlert")}
          </Typography>
        ) : (
          filteredDevices.map(device => {
            const data = getAlertData(device);
            return (
              <Paper
                key={device.id}
                elevation={0}
                sx={{
                  p: 1.2,
                  border: '1px solid',
                  borderColor: data.type === 'danger' ? 'error.light' : 'divider',
                  borderRadius: '12px'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box onClick={() => handleClickDevice(device.id)}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}
                    >
                      {device.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.1 }}
                      display="block"
                    >
                      {data.isPackage ? t("userExpirationTime") : t("sigortaTarih")}:{" "}
                      <b>{data.date?.toLocaleDateString('tr-TR')}</b>
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => handleClickDevice(device.id)}
                    sx={{ p: 0.4 }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    mt: 0.8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Chip
                    label={data.msg}
                    size="small"
                    color={data.type === 'danger' ? 'error' : 'warning'}
                    variant="soft"
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      height: 20
                    }}
                  />

                  {data.isPackage && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate("/settings/paymentpage")}
                      sx={{
                        borderRadius: '7px',
                        textTransform: 'none',
                        minHeight: 24,
                        px: 1.2,
                        fontSize: '0.7rem'
                      }}
                    >
                      {t("userBilling")}
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })
        )}
      </Stack>
    </Box>
  );
};

export default AlertListCard;