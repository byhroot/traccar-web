import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Box,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  CardContent,
  FormControl,
  TableContainer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from './LocalizationProvider';
import { Add, Edit, Delete, Build, EventNote } from '@mui/icons-material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useDeviceReadonly } from '../util/permissions';
import { ExpandMore, ExpandLess } from "@mui/icons-material";


const MaintenanceDeviceUser = ({ deviceId , deviceName , devicePositionId}) => {
  const [maintenances, setMaintenances] = useState([]);
  const [position, setPositionData] = useState([]);
  const deviceReadonly = useDeviceReadonly();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // item to delete
  const t = useTranslation();
  const [form, setForm] = useState({
    name: '',
    type: 'totalDistance',
    start: '',
    period: '',
  });
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [openRowId, setOpenRowId] = useState(null);

  const handleRowClick = (id) => {
    setOpenRowId(prev => (prev === id ? null : id));
  };
  
const MAINTENANCE_TYPES = [
    { key: 'totalDistance', label: (t("deviceTotalDistance")) + " (" + (t("sharedKm")) + ")"  },
    { key: 'hours', label: (t("reportEngineHours")) + " (" + (t("sharedHours")) + ")" },
    { key: 'serverTime', label: (t("date")) + " (" + (t("date")) + ")"  },
  ];
  
  const formatValue = (type, value, isPeriod = false) => {
      if (type === 'hours') {
        return `${(value / 3600000).toFixed(0)} ${t("sharedHours")}`;
      }
    
      if (type === 'totalDistance') {
        return `${(value / 1000).toFixed(0)} km`;
      }
    
      if (type === 'serverTime') {
        if (isPeriod) {
          // milisaniyeyi güne çevir
          const days = value / (1000 * 60 * 60 * 24);
          return `${days} ${t("sharedDays")}`;
        } else {
          // timestamp to locale date
          const date = new Date(value);
          return date.toLocaleDateString('tr-TR');
        }
      }
    
      return value;
    };
    
    const formatDuration = (ms) => {
      const totalMinutes = Math.floor(ms / 60000); // 60000 ms = 1 dakika
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
    
      return `${hours} saat ${minutes} dakika`;
    };
    
    
  const fetchMaintenances = async () => {
    try {
      const response = await fetch(`/api/maintenance?deviceId=${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setMaintenances(data);
      }
    } catch (err) {
      console.error('Bakım verileri alınamadı', err);
    }
  };

  const fetchLastPosition = async () => {
    try {
      const response = await fetch(`/api/positions?id=${devicePositionId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPositionData(data[0]); // yalnızca ilk pozisyonu al
        } else {
          console.warn("Beklenen pozisyon verisi alınamadı veya boş.");
        }
      }
    } catch (err) {
      console.error("Son Position verileri alınamadı", err);
    }
  };
  

  useEffect(() => {
    if (deviceId) {
      fetchMaintenances();
      fetchLastPosition();
    }
  }, [deviceId]);

  const resetForm = () => {
    setForm({ name: '', type: 'totalDistance', start: '', period: '' });
    setEditingItem(null);
  };

  const convertToRaw = (formData) => {
    let startRaw = formData.start;
    let periodRaw = formData.period;

    if (formData.type === 'hours') {
      startRaw = Number(startRaw) * 3600000;
      periodRaw = Number(periodRaw) * 3600000;
    } else if (formData.type === 'totalDistance') {
      startRaw = Number(startRaw) * 1000;
      periodRaw = Number(periodRaw) * 1000;
    } else if (formData.type === 'serverTime') {
      startRaw = new Date(formData.start).getTime();
      periodRaw = Number(formData.period) * 86400000;
    }

    return { startRaw, periodRaw };
  };

  const openCreateDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const openEditDialog = (item) => {
    let start = item.start;
    let period = item.period;

    if (item.type === 'hours') {
      start = start / 3600000;
      period = period / 3600000;
    } else if (item.type === 'totalDistance') {
      start = start / 1000;
      period = period / 1000;
    } else if (item.type === 'serverTime') {
      const date = new Date(start);
      start = date.toISOString().split('T')[0]; // yyyy-MM-dd
      period = period / 86400000;
    }

    setForm({ name: item.name, type: item.type, start, period });
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    const { startRaw, periodRaw } = convertToRaw(form);
    const body = {
        name: editingItem
        ? form.name // güncellemede kullanıcı ne yazdıysa onu gönder, ekleme yok
        : `${form.name} [${deviceName}]`, // yeni kayıtta cihaz adı ekleniyor
        type: form.type,
        start: startRaw,
        period: periodRaw,
        ...(editingItem && { id: editingItem.id }) // sadece güncellemede id eklenecek
    };

    try {
      if (editingItem) {
        // Update
        const response = await fetch(`/api/maintenance/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (response.ok) {
          fetchMaintenances();
        }
      } else {
        // Create
        const response = await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const created = await response.json();
          await fetch('/api/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: deviceId.toString(),
              maintenanceId: created.id,
            }),
          });
          fetchMaintenances();
        }
      }
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      console.error('Kayıt hatası:', err);
    }
  };
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  const confirmDelete = (item) => {
    setDeleteConfirm(item);
  };

  const handleDelete = async () => {
    const item = deleteConfirm;
    if (!item) return;
    try {
      await fetch('/api/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: deviceId.toString(),
          maintenanceId: item.id,
        }),
      });

      await fetch(`/api/maintenance/${item.id}`, {
        method: 'DELETE',
      });

      fetchMaintenances();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  return (
    <Grid container spacing={2}>
    <Grid item xs={12}>
    <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom>
        <NotificationsActiveIcon sx={{ mr: 1, color: 'red' }} /> {t("sharedMaintenance")}
        </Typography>
        <Button disabled={deviceReadonly} variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog}>
        {t("sharedAdd")}
        </Button>
      </Box>


      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ width: '100%', maxWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>{t("notes")}</TableCell>
              <TableCell>{t("sharedType")}</TableCell>
              {desktop && (
                <>
                  <TableCell>{t("maintenanceStart")}</TableCell>
                  <TableCell>{t("maintenancePeriod")}</TableCell>
                </>
              )}
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maintenances.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow
                  hover
                  onClick={() => !desktop && handleRowClick(item.id)}
                >

                  <TableCell padding="none">
                    <NotificationsActiveIcon sx={{ fontSize: 13 }} />
                    {item.name}
                  </TableCell>
                  <TableCell padding="none">{t(`position${capitalizeFirst(item.type)}`)}</TableCell>
                  {desktop && (
                    <>
                      <TableCell padding="none" align="center">
                        {formatValue(item.type, item.start, false)}
                      </TableCell>
                      <TableCell padding="none" align="center">
                        {formatValue(item.type, item.period, true)}
                      </TableCell>
                    </>
                  )}
                  <TableCell padding="none" align="right">
                  {!desktop && (openRowId === item.id  ? <ExpandLess /> : <ExpandMore />) }
                    <IconButton onClick={() => openEditDialog(item)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => confirmDelete(item)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* 👇 Mobilde açılan satır */}
                {!desktop && openRowId === item.id && (
                  
                  <TableRow>

                    <TableCell colSpan={5}>
                      <Grid container spacing={1} sx={{ p: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight="bold">
                            {t("maintenanceStart")}
                          </Typography>
                          <Typography variant="body2">
                            {formatValue(item.type, item.start, false)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight="bold">
                            {t("maintenancePeriod")}
                          </Typography>
                          <Typography variant="body2">
                            {formatValue(item.type, item.period, true)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>



      {/* ➕ Ekle / Düzenle Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? `${t("sharedName")}`:`${t("sharedNew")} `+`${t("sharedMaintenance")}`}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt:0 }}>

          <TextField
            label={t("sharedMaintenance") + " " + t("notes")} 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />

          <FormControl fullWidth disabled={!!editingItem}>
            <InputLabel>{t("sharedType")}</InputLabel>
            <Select
              value={form.type}
              label="Tip"
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {MAINTENANCE_TYPES.map((t) => (
                <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
            <Typography>
                {t("live")} : 
                {form.type === 'hours' && position?.attributes?.hours && formatDuration(position.attributes.hours)}
                {form.type === 'totalDistance' && position?.attributes?.totalDistance && formatValue("totalDistance", position.attributes.totalDistance, true)}
            </Typography>

          <TextField
            label={form.type === 'hours' ? `${t("maintenanceStart")} `+ `(${t("positionHours")})` : form.type === 'serverTime' ? `${t("maintenanceStart")} `+ `(${t("date")})` : `${t("maintenanceStart")} `+ `(${t("sharedKm")})` }
            type={form.type === 'serverTime' ? 'date' : 'number'}
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
            fullWidth
          />

          <TextField
            label= {form.type === 'hours' ?  `${t("maintenancePeriod")} `+ `(${t("positionHours")})` : form.type === 'serverTime' ? `${t("maintenancePeriod")} `+ `(${t("sharedDays")})` : `${t("maintenancePeriod")} `+ `(${t("sharedKm")})` }
            type="number"
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t("sharedCancel")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.start || !form.period}>
          {t("sharedSave")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🗑️ Silme Onayı Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>{t("sharedAccept")}</DialogTitle>
        <DialogContent>
          <Typography> {t("sharedMaintenance")}: “{deleteConfirm?.name}” {t("sharedRemoveConfirm")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t("sharedCancel")}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
          {t("sharedAccept")}
          </Button>
        </DialogActions>
      </Dialog>
      </CardContent>
      </Card>

    </Grid>
    </Grid>
  );
};

export default MaintenanceDeviceUser;
