import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MapIcon from '@mui/icons-material/Map';
import SpeedIcon from '@mui/icons-material/Speed';
import AddIcon from '@mui/icons-material/Add';
import ExploreIcon from '@mui/icons-material/Explore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';

const DeviceGeofenceCard = ({ deviceId }) => {
  const t = useTranslation();
  const navigate = useNavigate();

  const [geofences, setGeofences] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allGeofences, setAllGeofences] = useState([]);
  const [selectedGeoIds, setSelectedGeoIds] = useState([]);

  // 🟡 Snackbar onay için state
  const [confirmSnack, setConfirmSnack] = useState({ open: false, geoId: null, geoName: '' });

  /** 🚀 Araçla ilişkili bölgeleri getir */
  const fetchDeviceGeofences = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/geofences?deviceId=${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setGeofences(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /** 🌍 Tüm bölgeleri getir (ekleme için) */
  const fetchAllGeofences = async () => {
    try {
      const res = await fetch('/api/geofences');
      if (res.ok) {
        const data = await res.json();
        setAllGeofences(data || []);
      }
    } catch (err) {
      console.error('Geofence list error', err);
    }
  };

  useEffect(() => {
    fetchDeviceGeofences();
  }, [deviceId]);

  /** 🗑️ Onay sonrası bölge kaldırma işlemi */
  const handleRemoveConfirmed = async (geoId) => {
    try {
      const res = await fetch('/api/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: String(deviceId), geofenceId: geoId }),
      });
      if (res.ok || res.status === 204) {
        setGeofences((prev) => prev.filter((g) => g.id !== geoId));
        setConfirmSnack({ open: false, geoId: null });
      } else {
        console.error('Kaldırma hatası:', res.status);
      }
    } catch (err) {
      console.error('Permission DELETE error:', err);
    }
  };

  /** 🟢 Snackbar onay başlat */
  const handleRemove = (geo) => {
    setConfirmSnack({ open: true, geoId: geo.id, geoName: geo.name });
  };

  /** ✏️ Bölge düzenleme */
  const handleEdit = (geo) => {
    setEditData(geo);
    setEditDialogOpen(true);
  };

  /** 💾 Bölge kaydetme */
  const handleSaveEdit = async () => {
    if (!editData) return;
    try {
      const res = await fetch(`/api/geofences/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        await fetchDeviceGeofences();
        setEditDialogOpen(false);
      }
    } catch (err) {
      console.error('Update error', err);
    }
  };

  /** ➕ Ekle butonu → dialog aç */
  const handleOpenAddDialog = async () => {
    await fetchAllGeofences();
    setAddDialogOpen(true);
  };

  /** ✅ Kaydet (seçilen bölgeleri araca ata) */
  const handleSaveAdd = async () => {
    if (!selectedGeoIds.length) {
      alert('Lütfen en az bir bölge seçiniz.');
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        selectedGeoIds.map((geoId) =>
          fetch('/api/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: String(deviceId),
              geofenceId: geoId,
            }),
          })
        )
      );
      await fetchDeviceGeofences();
      setAddDialogOpen(false);
      setSelectedGeoIds([]);
    } catch (err) {
      console.error('Permission POST error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGeoSelect = (id) => {
    setSelectedGeoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Box>
      {/* Üst başlık */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" fontWeight={700}>
          {t('devicesAndState') || 'Bölgeler'}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            {t('sharedAdd')}
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Typography variant="body2">{t('sharedLoading') || 'Yükleniyor...'}</Typography>
      ) : geofences.length === 0 ? (
        <Alert severity="info">{t('sharedNoData') || 'Bu araçla ilişkili bölge bulunamadı.'}</Alert>
      ) : (
        <Grid container spacing={1}>
          {geofences.map((geo) => (
            <Grid item xs={12} sm={4} md={4} lg={3} key={geo.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  p: 1,
                  '&:hover': { boxShadow: 3, borderColor: 'primary.light' },
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: '6px !important',
                    height: '100%',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {geo.name}
                    </Typography>
                    {geo.attributes?.speedLimit && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <SpeedIcon fontSize="small" color="warning" />
                        <Typography variant="caption">
                          {Math.round(geo.attributes.speedLimit * 1.852)} km/h
                        </Typography>
                      </Stack>
                    )}
                    <Box>
                      <Tooltip title={t('sharedEdit')}>
                        <IconButton size="small" onClick={() => handleEdit(geo)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('sharedDelete')}>
                        <IconButton size="small" onClick={() => handleRemove(geo)}>
                          <DeleteIcon color="error" fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 📍 Bölge Ekleme Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        {/* Sağ üstte sabit buton */}
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>

        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate('/geofences')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 12,
          }}
        >
          {t('attributeShowGeofences') || 'Bölgelere Göz At'}
        </Button>
        </Box>

        <DialogContent dividers>
          
          {allGeofences.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
{allGeofences.map((g) => (
  <FormControlLabel
    key={g.id}
    control={
      <Checkbox
        checked={selectedGeoIds.includes(g.id)}
        onChange={() => toggleGeoSelect(g.id)}
      />
    }
    label={
      g.attributes?.speedLimit
        ? `${g.name} (${Math.round(g.attributes.speedLimit * 1.852)} km/h)`
        : g.name
    }
  />
))}

            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            {t('sharedCancel') || 'Vazgeç'}
          </Button>
          <Button variant="contained" onClick={handleSaveAdd}>
            {t('sharedSave') || 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🧭 DÜZENLEME DİALOĞU */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      pr: 1,
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {t('sharedEdit')} – {editData?.name}
    </Typography>

    <Button
      size="small"
      variant="outlined"
      onClick={() => navigate('/geofences')}
      sx={{
        minWidth: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {t('attributeShowGeofences') || 'Bölgelere Göz At'}
    </Button>
  </DialogTitle>
        
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('geofenceEditWarning') ||
              'Yapacağınız düzenlemeler (bölge adı, hız limiti vb.) bu bölgeyle ilişkili diğer araçlar için de geçerli olacaktır.'}
          </Alert>

          <TextField
            label={t("sharedGeofence") + " " + t('sharedName') || 'Bölge Adı'}
            fullWidth
            margin="dense"
            value={editData?.name || ''}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <TextField
            type="number"
            label={t("sharedGeofence") + " " + t('attributeSpeedLimit') + "(" + t("sharedKmh")+")"}
            fullWidth
            margin="dense"
            value={
              editData?.attributes?.speedLimit
                ? Math.round(editData.attributes.speedLimit * 1.852)
                : ''
            }
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                attributes: {
                  ...prev.attributes,
                  speedLimit: Number(e.target.value) / 1.852,
                },
              }))
            }
          />

          <TextField
            label={t('sharedDescription') || 'Açıklama'}
            fullWidth
            margin="dense"
            value={editData?.description || ''}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('sharedCancel') || 'Vazgeç'}
          </Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            {t('sharedSave') || 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
{/* 🔔 Snackbar onay diyaloğu */}
<Snackbar
  open={confirmSnack.open}
  onClose={() => setConfirmSnack({ open: false, geoId: null })}
  autoHideDuration={6000}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  message={
    confirmSnack.geoName
      ? `"${confirmSnack.geoName}" ${t('sharedRemoveConfirm') || 'bölgesini kaldırmak istiyor musunuz?'}`
      : t('confirmAreYouSure') || 'Kaldırmak istiyor musunuz?'
  }
  action={
    <Stack direction="row" spacing={1}>
      <Button
        color="error"
        size="small"
        variant="contained"
        onClick={() => handleRemoveConfirmed(confirmSnack.geoId)}
      >
        {t('sharedYes') || 'Evet'}
      </Button>
      <Button
        color="inherit"
        size="small"
        variant="outlined"
        onClick={() => setConfirmSnack({ open: false, geoId: null })}
      >
        {t('sharedNo') || 'Hayır'}
      </Button>
    </Stack>
  }
/>

    </Box>
  );
};

export default DeviceGeofenceCard;
