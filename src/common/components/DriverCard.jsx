import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardContent, Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, Stack,
  Avatar, CircularProgress, Box, Tooltip, InputAdornment, Snackbar, Alert, FormHelperText,
  Paper, Divider, Chip
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useDeviceReadonly, useManager, useRestriction } from '../util/permissions';
import { useTranslation } from './LocalizationProvider';
import SearchIcon from '@mui/icons-material/Search';
// Modern Sürücü Kartı Stili
const StyledDriverPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
  },
}));

export default function DriverCard({ deviceId, deviceName, position }) {
  const [drivers, setDrivers] = useState([]);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNewDriverDialog, setOpenNewDriverDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unregisteredDriver, setUnregisteredDriver] = useState(false);
  const userReadonly = useRestriction('readonly');
  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();
  const t = useTranslation();

  const [newDriver, setNewDriver] = useState({
    name: '', uniqueId: '', license: '', tel: '', notes: '',
  });

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      const data = await res.json();
      setDrivers(data);
    } catch (err) { console.error('Sürücü listesi alınamadı:', err); }
  };

  const fetchAssignedDriver = async () => {
    try {
      const res = await fetch(`/api/drivers?deviceId=${deviceId}`);
      const data = await res.json();
      if (data?.length > 0) setAssignedDriver(data[0]);
      else setAssignedDriver(null);
    } catch (err) { console.error('Bağlı sürücü alınamadı:', err); }
  };

  useEffect(() => {
    if (position || drivers.length) {
      const driverIdInPosition = position?.attributes?.driverUniqueId;
      const unreg = driverIdInPosition && !drivers.some(d => d.uniqueId === driverIdInPosition);
      setUnregisteredDriver(!!unreg);
    }
  }, [position, drivers]);

  useEffect(() => {
    fetchDrivers();
    fetchAssignedDriver();
  }, [deviceId]);

  const assignDriver = async (driver) => {
    setLoading(true);
    try {
      if (assignedDriver) {
        await fetch('/api/permissions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: `${deviceId}`, driverId: assignedDriver.id }),
        });
      }
      if (driver) {
        await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: `${deviceId}`, driverId: driver.id }),
        });
      }
      await fetchAssignedDriver();
    } catch (err) {
      console.error('Atama işlemi hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDriver.name,
          uniqueId: newDriver.uniqueId,
          attributes: { license: newDriver.license, tel: newDriver.tel, notes: newDriver.notes },
        }),
      });
      if (res.ok) {
        setNewDriver({ name: '', uniqueId: '', license: '', tel: '', notes: '' });
        setOpenNewDriverDialog(false);
        await fetchDrivers();
      }
    } catch (err) { console.error('Yeni sürücü eklenemedi:', err); }
  };

  const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '' });

  const handleSnackbarInfo = (id) => {
    const messages = {
      driver: 'Sürücü bilgileri aracın Geçmiş konumlarında Kalıcı olarak saklanır. Veri bütünlüğü sebebiyle Geçmiş veri üzerinde Sürücü Değişikliği yapılamaz. Değişiklikler araç hareket ettiğinde veya sonraki veri güncellemesinde kaydedilir.',
    };
    setSnackbarInfo({ open: true, message: messages[id] || '' });
  };

  return (
    <Card
      sx={{
        maxWidth: 450,
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        mx: 'auto',
        overflow: 'visible' // Help ikonunun taşması gerekirse diye
      }}
    >
      <CardHeader
        sx={{ pb: 0 }}
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <AssignmentIndIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1 }}>
                {deviceName || 'Araç'}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {t("sharedDriver")} Yönetimi
              </Typography>
            </Box>
          </Stack>
        }
        action={
          <Stack direction="row" spacing={0.5}>
            <IconButton onClick={() => handleSnackbarInfo('driver')} size="small">
              <HelpOutlineIcon fontSize="small" color="action" />
            </IconButton>
            <Tooltip title={t("sharedNew")}>
              <IconButton onClick={() => setOpenNewDriverDialog(true)} color="primary" sx={{ bgcolor: alpha('#1976d2', 0.1) }}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />

      <CardContent sx={{ pt: 3 }}>
        {/* AKTİF SÜRÜCÜ GÖSTERİM ALANI */}
        <Box sx={{ mb: 4 }}>
          {assignedDriver ? (
            <StyledDriverPaper elevation={0} onClick={() => setOpenDialog(true)}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 56, height: 56,
                    bgcolor: 'primary.main',
                    boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  {assignedDriver.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800} color="primary.dark">
                    {assignedDriver.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <BadgeIcon sx={{ fontSize: 14 }} /> {assignedDriver.uniqueId}
                  </Typography>
                </Box>
                <AccountBoxIcon color="primary" opacity={0.5} />
              </Stack>
            </StyledDriverPaper>
          ) : unregisteredDriver ? (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ borderRadius: 3 }}
            >
              <Typography variant="caption" fontWeight={700} display="block">Bilinmeyen Sürücü</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {manager ? "Kimlik numarası listenizde mevcut değil." : "Farklı bir kullanıcı tarafından atama yapılmış. Lütfen birkaç dakika sonra tekrar deneyiniz"}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                ID: {position?.attributes?.driverUniqueId}
              </Typography>
            </Alert>
          ) : (
            <Box
              sx={{
                py: 4, textAlign: 'center', border: '2px dashed',
                borderColor: 'divider', borderRadius: 4, bgcolor: alpha('#000', 0.02)
              }}
            >
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Atanmış Sürücü Bulunmuyor
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3, borderStyle: 'dashed' }}>
          <Chip label="Sürücü Değiştir" size="small" sx={{ fontSize: 10, fontWeight: 700 }} />
        </Divider>

        {/* Sürücü kaldır butonu */}
        {assignedDriver && !deviceReadonly && !userReadonly && (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            size="small"
            sx={{ mb: 2, borderRadius: 3 }}
            onClick={() => assignDriver(null)}
            disabled={loading}
          >
            Sürücüyü Kaldır
          </Button>
        )}

        {/* SEÇİM ALANI */}
        <Autocomplete
          options={drivers}
          disabled={deviceReadonly || userReadonly || unregisteredDriver}
          getOptionLabel={(opt) => opt.name || ''}
          value={assignedDriver || null}
          onChange={(e, newVal) => assignDriver(newVal)}
          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={assignedDriver ? "Farklı Sürücü Seç" : "Sürücü Ata"}
              variant="outlined"
              placeholder="Sürücü ara..."
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 3 }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </CardContent>



      {/* 👁️ Sürücü detay dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {t("sharedSaved")} – {t("positionDriverUniqueId")}
        </DialogTitle>
        <DialogContent dividers>
          {assignedDriver && (
            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="primary" />
                <Typography><b>{t("sharedName")}:</b> {assignedDriver.name}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CreditCardIcon color="primary" />
                <Typography><b>{t("positionDriverUniqueId")}:</b> {assignedDriver?.attributes?.license}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon color="primary" />
                <Typography><b>{t("sharedPhone")}:</b> {assignedDriver?.attributes?.tel}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <NotesIcon color="primary" />
                <Typography><b>{t("notes")}:</b> {assignedDriver?.attributes?.notes}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <BadgeIcon color="primary" />
                <Typography><b>{t("deviceIdentifier")}:</b> {assignedDriver?.uniqueId}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} startIcon={<CloseIcon />}>
            {t("sharedClose") || "Kapat"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ➕ Yeni sürücü ekleme dialog */}
      <Dialog open={openNewDriverDialog} onClose={() => setOpenNewDriverDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("sharedNew")} {t("sharedDriver")} - {t("sharedAdd")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField label={t("sharedName")} placeholder="Ad Soyad" value={newDriver.name} onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon color="primary" /></InputAdornment>) }} />
            <Stack spacing={0.5}>

              <TextField label={t("deviceIdentifier")} placeholder="T.C. veya Belge No" value={newDriver.uniqueId} onChange={(e) => setNewDriver({ ...newDriver, uniqueId: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeIcon color="primary" /></InputAdornment>) }} />
              <FormHelperText sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, color: 'text.secondary' }}>
                Kimlik Numarasının doğru olması önemlidir. Sürücüyü hesabınızdan silseniz dahi, İlgili Araç Geçmişinde kimlik numarası kayıtlı kalır.
              </FormHelperText>
            </Stack>
            <TextField label={t("positionDriverUniqueId")} placeholder="A2, B, Ehliyet Sınıfı" value={newDriver.license} onChange={(e) => setNewDriver({ ...newDriver, license: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><CreditCardIcon color="primary" /></InputAdornment>) }} />
            <TextField label={t("sharedPhone")} placeholder="0555 123 44 55" value={newDriver.tel} onChange={(e) => setNewDriver({ ...newDriver, tel: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIcon color="primary" /></InputAdornment>) }} />
            <TextField label={t("notes")} multiline rows={2} value={newDriver.notes} onChange={(e) => setNewDriver({ ...newDriver, notes: e.target.value })} InputProps={{ startAdornment: (<InputAdornment position="start"><NotesIcon color="primary" /></InputAdornment>) }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDriverDialog(false)} startIcon={<CloseIcon />}>{t("sharedCancel") || "İptal"}</Button>
          <Button disabled={!newDriver.name.trim() || !newDriver.uniqueId.trim()} onClick={handleAddDriver} variant="contained" startIcon={<AddIcon />}>{t("sharedSave") || "Kaydet"}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarInfo.open}
        autoHideDuration={6000}
        onClose={() => setSnackbarInfo({ ...snackbarInfo, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarInfo({ ...snackbarInfo, open: false })} severity="info">
          {snackbarInfo.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
