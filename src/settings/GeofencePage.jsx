import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Tooltip,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoodIcon from '@mui/icons-material/Mood';
import PaletteIcon from '@mui/icons-material/Palette';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useTranslation } from '../common/components/LocalizationProvider';
import { geofencesActions } from '../store';
import EditItemView from './components/EditItemView';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';

const GeofencePage = () => {
  const classes = useSettingsStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const [item, setItem] = useState();
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loadingDialog, setLoadingDialog] = useState(false);
  const [prevLinkedMap, setPrevLinkedMap] = useState({});
  const [searchKeyword, setSearchKeyword] = useState(''); // component üst kısmında

  useEffect(() => {
    const fetchDevicesWithRelations = async () => {
      try {
        // 1️⃣ Devices listesi çekilsin (bu hızlı, dialog kapalı)
        const res = await fetch('/api/devices');
        const deviceList = await res.json();

        if (item?.id) {
          setLoadingDialog(true); // 🔹 Dialog sadece geofence istekleri için açılıyor

          // 2️⃣ Her cihaz için geofence bağlantısı sorgusu
          const results = await Promise.allSettled(
            deviceList.map(async (dev) => {
              try {
                const geoRes = await fetch(`/api/geofences?deviceId=${dev.id}`);
                const geoList = geoRes.status === 204 ? [] : await geoRes.json();
                const isLinked = geoList.some((g) => g.id === item.id);
                return { ...dev, linked: isLinked };
              } catch {
                return { ...dev, linked: false };
              }
            })
          );

          // 3️⃣ Başarılı sonuçları filtrele
          const updatedDevices = results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);

          setDevices(updatedDevices);
          setSelectedDevices(updatedDevices.filter((d) => d.linked).map((d) => d.id));
          setPrevLinkedMap(Object.fromEntries(updatedDevices.map((d) => [d.id, d.linked])));
        } else {
          setDevices(deviceList);
        }
      } catch (err) {
        console.error('Araç listesi alınamadı:', err);
      } finally {
        setLoadingDialog(false); // 🔹 Tüm geofence sorguları tamamlandı
      }
    };

    fetchDevicesWithRelations();
  }, [item?.id]);

  const onItemSaved = async (result) => {
    // frontend state km/h olarak kalacak
    dispatch(geofencesActions.update([result]));
    setItem(result);
    setLoadingDialog(true);

    const updatePermission = async (method, deviceId) => {
      try {
        const res = await fetch('/api/permissions', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: String(deviceId),
            geofenceId: result.id,
          }),
        });
        if (!res.ok && res.status !== 204) {
          console.error(`${method} hatası (deviceId=${deviceId})`);
        }
      } catch (err) {
        console.error(`${method} izin hatası (deviceId=${deviceId}):`, err);
      }
    };

    const added = selectedDevices.filter((id) => !prevLinkedMap[id]);
    const removed = Object.keys(prevLinkedMap)
      .filter((id) => prevLinkedMap[id] && !selectedDevices.includes(Number(id)))
      .map(Number);

    // 🔹 API’ye göndereceğimiz veri (speed kn olarak)
    const itemToSend = {
      ...result,
      attributes: {
        ...result.attributes,
        speedLimit: result.attributes?.speedLimit
          ? result.attributes.speedLimit / 1.852
          : 0,
      },
    };

    // 🔄 permission işlemleri paralel
    await Promise.all([
      ...added.map((id) => updatePermission('POST', id)),
      ...removed.map((id) => updatePermission('DELETE', id)),
    ]);

    setLoadingDialog(false);
  };

  const validate = () => item && item.name;

  /** 🎨 Renk seçenekleri */
  const colorOptions = [
    { value: 'yellow', label: '🟡' },
    { value: 'red', label: '🔴' },
    { value: 'green', label: '🟢' },
    { value: 'blue', label: '🔵' },
    { value: 'orange', label: '🟠' },
    { value: 'purple', label: '🟣' },
  ];

  /** 🚙 Tek araç seçimi */
  const handleDeviceSelect = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  /** ✅ Tüm araçları seç/kaldır */
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedDevices(checked ? devices.map((d) => d.id) : []);
  };

  return (
    <>
      {/* ⏳ Loading Dialog */}
      <Dialog
        open={loadingDialog}
        PaperProps={{
          style: {
            background: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            justifyContent: 'center',
          },
        }}
      >
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={60} thickness={5} />
        </DialogContent>
      </Dialog>

      <EditItemView
        endpoint="geofences"
        item={item}
        setItem={setItem}
        validate={validate}
        onItemSaved={onItemSaved}
        menu={<SettingsMenu />}
        breadcrumbs={['settingsTitle', 'sharedGeofence']}
      >

        {item && (
          <>
            {/* 🧩 Gerekli Alanlar */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <MoodIcon color="primary" /> {t('sharedGeofence')} {t('sharedName')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <TextField
                  value={item.name || ''}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                  label={`${t("stateTitle")} ${t("sharedName")}`}
                  fullWidth
                />
              </AccordionDetails>
            </Accordion>

            {/* 🎨 Görsel Ayarlar */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PaletteIcon color="primary" /> {t("settingsTitle")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>🎨 {t("attributeColor")} {t("sharedSet")}</InputLabel>
                  <Select
                    value={item.attributes?.color || ''}
                    label="Renk"
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: {
                          ...item.attributes,
                          color: e.target.value,
                        },
                      })
                    }
                  >
                    {colorOptions.map((c) => (
                      <MenuItem key={c.value} value={c.value}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  type="number"
                  label={`🚗 ${t("sharedGeofence")} ${t("attributeSpeedLimit")}`}
                  value={item.attributes?.speedLimit != null ? Math.round(item.attributes.speedLimit * 1.852) : ''}
                  onChange={(e) => {
                    const km = Number(e.target.value);
                    setItem({
                      ...item,
                      attributes: {
                        ...item.attributes,
                        speedLimit: km / 1.852, // knots olarak backend için
                      },
                    });
                  }}
                  fullWidth
                />


              </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <DirectionsCarIcon color="primary" /> {t("positionValid")} {t("deviceTitle")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  overflowY: 'auto', // taşınca scroll
                  px: 1,
                  py: 1,
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* 🔍 Arama kutusu */}
                  <TextField
                    size="small"
                    placeholder={t("sharedSearch")}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    fullWidth
                  />

                  {/* ✅ Tüm araçlar checkbox */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    }
                    label={t("eventAll")}
                  />

                  {/* 🚘 Araç listesi grid */}
                  {/* 🚘 Araç listesi grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr 1fr', // küçük ekran: 2 sütun
                        sm: '1fr 1fr', // orta ekran: 2 sütun
                      },
                      gap: 1,
                      maxHeight: 300, // yüksekliği sabitle (örneğin 300px)
                      overflowY: 'auto', // dikey kaydırma aktif
                      pr: 1, // sağ tarafa biraz padding (scroll çubuğu için)
                      '&::-webkit-scrollbar': {
                        width: 6,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#aaa',
                        borderRadius: 3,
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: '#888',
                      },
                    }}
                  >
                    {devices
                      .filter((dev) =>
                        dev.name.toLowerCase().includes(searchKeyword.toLowerCase())
                      )
                      .sort((a, b) => {
                        const isASelected = selectedDevices.includes(a.id);
                        const isBSelected = selectedDevices.includes(b.id);

                        // Eğer biri seçili diğeri değilse, seçili olanı başa al
                        if (isASelected && !isBSelected) return -1;
                        if (!isASelected && isBSelected) return 1;

                        // Her ikisi de seçili veya her ikisi de seçili değilse, alfabetik sırala
                        return a.name.localeCompare(b.name);
                      })
                      .map((dev) => (
                        <FormControlLabel
                          key={dev.id}
                          control={
                            <Checkbox
                              checked={selectedDevices.includes(dev.id)}
                              onChange={() => handleDeviceSelect(dev.id)}
                            />
                          }
                          label={`${dev.name}${dev.linked ? ' ✅' : ''}`}
                        />
                      ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

          </>
        )}
      </EditItemView>
    </>
  );
};

export default GeofencePage;
