import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, CardContent, Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, Stack,
  Avatar, CircularProgress, Box, Tooltip,InputAdornment,Snackbar,Alert,FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from './LocalizationProvider';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useDeviceReadonly, useManager, useRestriction } from '../util/permissions';

export default function DriverCard({ deviceId, deviceName , position}) {
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
  // Yeni sürücü formu
  const [newDriver, setNewDriver] = useState({
    name: '',
    uniqueId: '',
    license: '',
    tel: '',
    notes: '',
  });

  /** 🧩 Sürücüleri getir */
  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error('Sürücü listesi alınamadı:', err);
    }
  };

  /** 🚗 Araçla eşleşmiş sürücüyü getir */
  const fetchAssignedDriver = async () => {
    try {
      const res = await fetch(`/api/drivers?deviceId=${deviceId}`);
      const data = await res.json();
      if (data?.length > 0) setAssignedDriver(data[0]);
      else setAssignedDriver(null);
    } catch (err) {
      console.error('Bağlı sürücü alınamadı:', err);
    }
  };

  useEffect(() => {
    if (position || drivers.length) {
      // position.attributes.driverUniqueId varsa ve drivers listesinde yoksa
      const driverIdInPosition = position.attributes?.driverUniqueId;
      const unreg = driverIdInPosition && !drivers.some(d => d.uniqueId === driverIdInPosition);
      setUnregisteredDriver(!!unreg);
    }
  }, [position, drivers]);

  useEffect(() => {
    fetchDrivers();
    fetchAssignedDriver();
  }, [deviceId]);

  /** 🔗 Sürücü ataması yap */
  const assignDriver = async (driver) => {
    setLoading(true);
    try {
      // önce varsa eski sürücü atamasını kaldır
      if (assignedDriver) {
        await fetch('/api/permissions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: `${deviceId}`, driverId: assignedDriver.id }),
        });
      }

      // yeni sürücü ataması
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

  /** ➕ Yeni sürücü ekle */
  const handleAddDriver = async () => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDriver.name,
          uniqueId: newDriver.uniqueId,
          attributes: {
            license: newDriver.license,
            tel: newDriver.tel,
            notes: newDriver.notes,
          },
        }),
      });

      if (res.ok) {
        setNewDriver({ name: '', uniqueId: '', license: '', tel: '', notes: '' });
        setOpenNewDriverDialog(false);
        await fetchDrivers();
      }
    } catch (err) {
      console.error('Yeni sürücü eklenemedi:', err);
    }
  };

     
    // 🔹 Tooltip açıklamaları yerine Snackbar açıklaması
    const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '' });

    // Açıklama metinlerini yöneten fonksiyon
    const getSnackbarMessage = (id) => {
      switch (id) {
        case 'vibration':
          return 'Araç park halindeyken herhangi bir sarsıntı tespit edildiğinde bildirim alırsınız. Kontak Kapandıktan 2dk sonra devreye girer.';
        case 'engine':
          return 'Aracınızda Blokaj Kiti varsa, 20 km/h altında ve uydulara tam bağlandığında motoru durdurabilirsiniz.';
        case 'speed':
          return 'Hız limiti bildirimleriniz aktifse, hız ihlali durumunda anında bildirim alırsınız. Aracın hızını sınırlamaz.';
        case 'driver':
          return 'Sürücü bilgileri aracın Geçmiş konumlarında Kalıcı olarak saklanır. Veri bütünlüğü sebebiyle Geçmiş veri üzerinde Sürücü Değişikliği yapılamaz. Sürücü değişikliği Araç hareket halindeyse Hemen, Park Halindeyse birkaç dakika içerisinde güncellenir.';
        case 'bakımHatirlatma':
          return 'Km, motor saati veya tarihe göre bakım hatırlatmaları ekleyebilir, ilgili periyotlarda bildirim alabilirsiniz.';
        case 'bakimNotları':
          return 'Geçmiş bakım notlarınızı görüntüleyebilir ve takip edebilirsiniz.';
        default:
          return '';
      }
    };

  // Snackbar açıklamasını aç/kapa fonksiyonu
  const handleSnackbarInfo = (id) => {
    const message = getSnackbarMessage(id);
    setSnackbarInfo({ open: true, message });
  };
  
  return (
<Card sx={{ borderRadius: 2, boxShadow: 3, p: 2, position: 'relative' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <SentimentSatisfiedAltIcon color="primary" />
            <Typography variant="h6">
              {deviceName || 'Araç'}  {t("sharedSaved")} {t("sharedDriver")}
            </Typography>
          </Stack>
        }
        action={
          <Tooltip title={t("sharedNew") +" " + t("sharedDriver") }>
            <IconButton onClick={() => setOpenNewDriverDialog(true)} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <IconButton
        size="small"
        sx={{ position: 'absolute', top: 8, left: 8, color: 'text.secondary', zIndex: 1 }}
        onClick={() => handleSnackbarInfo('driver')}
      >
        <HelpOutlineIcon fontSize="medium" />
      </IconButton>
      <CardContent>
        
        {/* Mevcut sürücü */}
        {assignedDriver ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              bgcolor: '',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#d0ebff' },
              mb: 3, // 🔹 Altına boşluk eklendi

            }}
            onClick={() => setOpenDialog(true)}
          >
            <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
              {assignedDriver.name?.[0]?.toUpperCase() || 'S'}
            </Avatar>
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              {assignedDriver.name}
            </Typography>
            <SentimentSatisfiedAltIcon color="primary" />
          </Box>
) : unregisteredDriver ? (
  <Box sx={{ mb: 1 }}>
    <Typography variant="body2" color="warning.main">
      {manager ?  
      "Sürücü ataması yapılmış ancak Kimlik numarası Sürücüler listenizde mevcut değil."
      :
      "Farklı bir kullanıcı tarafından araca sürücü ataması yapılmış veya atanan sürücü kayıtlarınızda mevcut değil. Lütfen değişiklik yapmadan önce yöneticinizle iletişime geçin ve sürücüyü kaldırmasını isteyin."
    }
    </Typography>
    <Typography variant="body2" color="text.secondary">
      ID: {position?.attributes?.driverUniqueId}
    </Typography>
  </Box>
) : (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
    {t("sharedNoData")}
  </Typography>
)}

        {/* Sürücü seçimi */}
        <Autocomplete
          options={drivers}
          disabled={deviceReadonly || userReadonly } // 🔹 position driver kayıtlı değilse değişiklik devre dışı
          getOptionLabel={(opt) => opt.name || ''}
          value={assignedDriver || null}
          onChange={(e, newVal) => assignDriver(newVal)}
          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("eventDriverChanged")}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          clearIcon={<CloseIcon />}
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
                <Typography><b>{t("positionDriverUniqueId")}:</b> {assignedDriver.attributes?.license}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon color="primary" />
                <Typography><b>{t("sharedPhone")}:</b> {assignedDriver.attributes?.tel}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <NotesIcon color="primary" />
                <Typography><b>{t("notes")}:</b> {assignedDriver.attributes?.notes}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <BadgeIcon color="primary" />
                <Typography><b>{t("deviceIdentifier")}:</b> {assignedDriver.uniqueId}</Typography>
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
              <FormHelperText sx={{     fontSize: { xs: '0.6rem', sm: '0.75rem' }, color: 'text.secondary' }}>
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
          <Button   disabled={!newDriver.name.trim() || !newDriver.uniqueId.trim()} onClick={handleAddDriver} variant="contained" startIcon={<AddIcon />}>{t("sharedSave") || "Kaydet"}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarInfo.open}
        autoHideDuration={12000}
        onClose={() => setSnackbarInfo({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          {snackbarInfo.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
