import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Collapse,
  useMediaQuery,
} from '@mui/material';
import { Add, Edit, Delete, Build, EventNote } from '@mui/icons-material';
import { useTranslation } from './LocalizationProvider';
import { ExpandMore, ExpandLess, Note } from "@mui/icons-material";
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { useDeviceReadonly } from '../util/permissions';
import CheckIcon from '@mui/icons-material/Check';

const DeviceBakimCard = ({ deviceId , deviceData }) => {
  const [device, setDevice] = useState(null);
  const [bakimlar, setBakimlar] = useState({});
  const [selectedBakimKey, setSelectedBakimKey] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({ tarih: '', servis: '', notlar: [] });
  const [newNot, setNewNot] = useState('');
  const t = useTranslation();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState(null);

  const deviceReadonly = useDeviceReadonly();
  
  
  // Eğer deviceData değişirse state’i güncelle
  useEffect(() => {
    if (deviceData) {
      setDevice(deviceData);
      setBakimlar(deviceData.attributes?.bakimlar || {});
    }
  }, [deviceData]);

  const updateDeviceAttributes = async (newBakimlar) => {
    const updatedDevice = { ...device, attributes: { ...device.attributes, bakimlar: newBakimlar } };
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice),
    });
    if (response.ok) {
      setBakimlar(newBakimlar);
      setDevice(updatedDevice);
    }
  };

  const handleEdit = (key) => {
    setSelectedBakimKey(key);
    setEditData(bakimlar[key]);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    const updated = { ...bakimlar, [selectedBakimKey]: editData };
    updateDeviceAttributes(updated);
    setEditDialogOpen(false);
  };
  

  const handleDeleteNot = (index) => {
    const updatedNotlar = [...editData.notlar];
    updatedNotlar.splice(index, 1);
    setEditData({ ...editData, notlar: updatedNotlar });
  };

  const handleAddNot = () => {
    if (newNot.trim()) {
      setEditData({ ...editData, notlar: [...editData.notlar, newNot.trim()] });
      setNewNot('');
    }
  };

  const handleAddBakim = () => {
    const nextKey = (Object.keys(bakimlar).length + 1).toString();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında
    setSelectedBakimKey(nextKey);
    setEditData({ tarih: today , servis: '', notlar: [] });
    setEditDialogOpen(true);
  };
  

  const confirmDeleteBakim = (key) => {
    setPendingDeleteKey(key);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBakimConfirmed = () => {
    if (pendingDeleteKey) {
      const { [pendingDeleteKey]: _, ...rest } = bakimlar;
      updateDeviceAttributes(rest);
    }
    setDeleteDialogOpen(false);
    setPendingDeleteKey(null);
  };

  const [openDetails, setOpenDetails] = useState({});

  const toggleDetails = (key) => {
    setOpenDetails((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Button  disabled={deviceReadonly} variant="outlined" startIcon={<AddIcon/>} onClick={() => handleAddBakim()}>
              {t("sharedAdd")}
              </Button>
            </Box>
            {Object.entries(bakimlar).map(([key, bakim]) => (
                <div key={key}>
                  <Divider sx={{ my: 0 }} />
                    <Grid container alignItems="center" onClick={() => toggleDetails(key)} sx={{ cursor: "pointer" }}>
                      <Grid item xs={8}>
                        <Typography variant="subtitle1">
                          <EventNote sx={{ mr: 1 }} />
                          {bakim.tarih}  {bakim.servis}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4} textAlign="right">
                      {openDetails[key] ? <ExpandLess /> : <ExpandMore />}
                        <IconButton disabled={deviceReadonly} onClick={(e) => { e.stopPropagation(); handleEdit(key); }} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton disabled={deviceReadonly} onClick={(e) => { e.stopPropagation(); confirmDeleteBakim(key); }} color="error">
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>

                    <Collapse in={openDetails[key]} timeout="auto" unmountOnExit>
                      <List dense>
                        {bakim.notlar.map((note, index) => (
                          <ListItem key={index}>
                            <CheckIcon sx={{ mr: 1 }} color="action" />
                            <ListItemText primary={note} />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </div>
                ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("eventMaintenance")} {t("notes")}</DialogTitle>
        <DialogContent>
        <TextField
            fullWidth
            type="date"
            value={editData.tarih}
            onChange={(e) => setEditData({ ...editData, tarih: e.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: new Date().toISOString().split('T')[0] }} // bugünden sonrası engellenir
            sx={{ mt: 2 }}
            />


          <TextField
            fullWidth
            label={t("sharedServiceName")}
            value={editData.servis}
            onChange={(e) => setEditData({ ...editData, servis: e.target.value })}
            sx={{ mt: 2 }}
          />

          <Typography variant="subtitle2" sx={{ mt: 2 }}>{t("notes")}</Typography>
          <List>
            {editData.notlar.map((note, index) => (
              <ListItem key={index}>
                <ListItemText primary={note} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleDeleteNot(index)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Grid item xs={9}>
              <TextField
                label={t("notes")}
                value={newNot}
                onChange={(e) => setNewNot(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <Button onClick={handleAddNot} variant="contained" fullWidth>
              {t("sharedAdd")}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>{t("sharedCancel")}</Button>
          <Button onClick={handleSaveEdit}   disabled={!editData.notlar || editData.notlar.length === 0} variant="contained">{t("sharedSave")}</Button>
        </DialogActions>
      </Dialog>

      {/* Bakım Delete Onay Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t("notes")}</DialogTitle>
        <DialogContent>
            <Typography>{t("changeDetected")}</Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>{t("sharedCancel")}</Button>
            <Button onClick={handleDeleteBakimConfirmed} variant="contained" color="error">
            {t("sharedYes")}
            </Button>
        </DialogActions>
        </Dialog>
    </Grid>
  );
};

export default DeviceBakimCard;
