import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Step, StepLabel, Stepper, Typography,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Alert, CircularProgress,
  RadioGroup, FormControlLabel, Radio, Divider,
  List, ListItemButton, ListItemText, ListItemSecondaryAction, Chip, ButtonBase, alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import { useSelector } from 'react-redux';
import { useAdministrator } from '../common/util/permissions';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { Autocomplete } from '@mui/material';
import { useEffectAsync } from '../reactHelper';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import PowerOffOutlinedIcon from '@mui/icons-material/PowerOffOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

const STEPS = ['Talep Tipi', 'Araç / Sipariş', 'Belgeler', 'İl / İlçe', 'Sonuç'];
const ILLER = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale',
  'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum',
  'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin',
  'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli',
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat',
  'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın',
  'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
];

const TYPE_LABELS = {
  MONTAJ: 'Yeni Montaj — Servis Talebi',
  DEMONTAJ: 'Demontaj — Servis Talebi',
  DEVIR: 'Devir — Cihazı Farklı Hesaba Aktar',
  DIGER: 'Diğer Talepler — Plaka Değişiklik vb.',
};

const TYPE_META = {
  MONTAJ: {
    title: 'Yeni Montaj & Aktivasyon',
    desc: 'Yeni Aktivasyon ve/veya Servis talebi',
    icon: <BuildOutlinedIcon />,
    color: 'success',
  },
  DEMONTAJ: {
    title: 'Demontaj',
    desc: 'Demontaj bildirimi ve/veya Servis talebi',
    icon: <PowerOffOutlinedIcon />,
    color: 'error',
  },
  DEVIR: {
    title: 'Devir / Aktarım işlemleri',
    desc: 'Cihazı farklı bir kullanıcıya devret',
    icon: <SwapHorizOutlinedIcon />,
    color: 'info',
  },
  DIGER: {
    title: 'Diğer Talepler',
    desc: 'Plaka değişikliği, Arıza, Hata Bildirim vb.',
    icon: <MoreHorizOutlinedIcon />,
    color: 'secondary',
  },
};
// Fotoğrafı 512KB altına sıkıştır (ServisPage pattern'inden devşirildi)
const TARGET_SIZE_BYTES = 1 * 512 * 1024;
async function compressToTarget(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let q = 0.85;
      const attempt = () => {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL('image/jpeg', q);
        const sz = Math.round((data.length * 3) / 4);
        if (sz <= TARGET_SIZE_BYTES || w <= 400 || q <= 0.1) {
          URL.revokeObjectURL(url);
          resolve(data);
          return;
        }
        if (sz > TARGET_SIZE_BYTES * 2) {
          w = Math.round(w * 0.8);
          h = Math.round(h * 0.8);
        } else {
          q -= 0.1;
        }
        attempt();
      };
      attempt();
    };
    img.src = url;
  });
}

// base64 → Blob
function b64ToBlob(b64, mime) {
  const bytes = atob(b64.split(',')[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

const OptionCard = ({ icon, title, description, color = 'primary', selected, onClick, vertical = false }) => (
  <ButtonBase
    onClick={onClick}
    focusRipple
    sx={(theme) => ({
      width: '100%',
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: vertical ? 'center' : 'flex-start',
      textAlign: vertical ? 'center' : 'left',
      gap: vertical ? 1 : 2,
      p: 2,
      position: 'relative',
      borderRadius: 2,
      border: `2px solid ${selected ? theme.palette[color].main : theme.palette.divider}`,
      bgcolor: selected ? alpha(theme.palette[color].main, 0.08) : 'transparent',
      transition: theme.transitions.create(['border-color', 'background-color']),
      '&:hover': { borderColor: theme.palette[color].main },
    })}
  >
    <Box
      sx={(theme) => ({
        width: 44,
        height: 44,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 2,
        color: theme.palette[color].main,
        bgcolor: alpha(theme.palette[color].main, 0.14),
      })}
    >
      {icon}
    </Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
      {description && (
        <Typography variant="caption" color="text.secondary">{description}</Typography>
      )}
    </Box>
    {selected && (
      <CheckCircleIcon
        color={color}
        sx={{ fontSize: 22, ...(vertical && { position: 'absolute', top: 8, right: 8 }) }}
      />
    )}
  </ButtonBase>
);

const NewRequestPage = () => {
  const navigate = useNavigate();
  const admin = useAdministrator();
  const devicesMap = useSelector((state) => state.devices.items);
  const groupsMap = useSelector((state) => state.groups.items);
  const groups = Object.values(groupsMap);
  const devices = useSelector((state) => Object.values(devicesMap));
  const [allUsers, setAllUsers] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [centers, setCenters] = useState([]);
  const [centersExpanded, setCentersExpanded] = useState(false);

  const [nearbyCenter, setNearbyCenter] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSlotCount, setOrderSlotCount] = useState(0); // shippable araç adedi
  const [orderSlotLicenses, setOrderSlotLicenses] = useState({}); // { slot_1: {b64, preview} }
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [form, setForm] = useState({
    type: '',
    sourceType: 'device',
    deviceIds: [],
    selectedOrderId: '',
    selectedOrderLabel: '',
    licensePhotoFile: null,
    licensePhotoPreview: null,
    licensePhotoB64: null,
    // MONTAJ — birden fazla cihaz için ayrı ruhsat fotoğrafları
    // { deviceId: { file, preview, b64 } }
    deviceLicenses: {},
    city: '',
    district: '',
    notes: '',
    newOwnerEmail: '',
    newOwnerName: '',
    newOwnerPhone: '',
    newDeviceName: '',
  });

  // Admin için kullanıcı listesi
  useEffectAsync(async () => {
    if (admin) {
      const res = await fetch('/api/users');
      if (res.ok) setAllUsers(await res.json());
    }
  }, [admin]);

  // Siparişleri MONTAJ + order seçildiğinde çek
  useEffectAsync(async () => {
    if (form.type === 'MONTAJ' && form.sourceType === 'order' && orders.length === 0) {
      setLoadingOrders(true);
      try {
        const res = await fetch('/api/paylinks/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } finally {
        setLoadingOrders(false);
      }
    }
  }, [form.type, form.sourceType]);

  // İl/İlçe değişince servisleri çek
  useEffectAsync(async () => {
    if (step === 3 && form.city && form.type !== 'DEVIR') {
      setCentersExpanded(false); // ← bunu ekle

      const params = new URLSearchParams({ city: form.city, onlyActive: true });

      const res = await fetch(`/api/service-centers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCenters(data);
        setNearbyCenter(
          data.find((c) => !form.district || c.district === form.district) || data[0] || null,
        );
      }
    }
  }, [step, form.city, form.district, form.type]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await compressToTarget(file);
    setForm((f) => ({
      ...f,
      licensePhotoFile: file,
      licensePhotoPreview: b64,
      licensePhotoB64: b64,
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        type: form.type,
        userId: (admin && targetUser) ? targetUser.id : undefined,
        city: form.city,
        district: form.district || null,
        // YENİ
        notes: form.notes?.trim()
          ? JSON.stringify([{
            id: Date.now(),
            type: 'customer',
            text: form.notes.trim(),
            by: targetUser?.name || 'Müşteri',
            byId: targetUser?.id || 0,
            at: new Date().toISOString(),
            showServis: false,
          }])
          : null,
        deviceIds: form.deviceIds.length ? `{${form.deviceIds.join(',')}}` : null,
        wixOrderId: form.selectedOrderId || null,
        orderItems: form.selectedOrderLabel || null,
        newOwnerEmail: form.type === 'DEVIR' ? form.newOwnerEmail : null,
        newOwnerName: form.type === 'DEVIR' ? form.newOwnerName : null,
        newOwnerPhone: form.type === 'DEVIR' ? form.newOwnerPhone : null,
        newDeviceName: form.type === 'DEVIR'
          ? (form.newDeviceName?.toLocaleUpperCase('tr-TR') || null)
          : null,
      };

      const res = await fetchOrThrow('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await res.json();

      // Ruhsat fotoğrafı yükle
      if (form.licensePhotoB64) {
        const blob = b64ToBlob(form.licensePhotoB64, 'image/jpeg');
        // İlk cihazın uniqueId'sini al
        const firstDeviceUniqueId = form.deviceIds.length > 0
          ? (devicesMap[form.deviceIds[0]]?.uniqueId || '')
          : '';
        const orderRef = form.selectedOrderId || '';
        const ref = firstDeviceUniqueId || orderRef;
        await fetch(
          `/api/service-requests/${created.id}/photos?photoType=license&deviceUniqueId=${ref}`,
          { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob }
        );
      }

      // Birden fazla araç için ruhsat fotoğrafları yükle (MONTAJ cihaz bazlı)
      if (form.type === 'MONTAJ' && form.sourceType === 'device' && Object.keys(form.deviceLicenses).length > 0) {
        for (const [deviceId, photo] of Object.entries(form.deviceLicenses)) {
          if (photo.b64) {
            const dev = devicesMap[parseInt(deviceId)];
            const blob = b64ToBlob(photo.b64, 'image/jpeg');
            await fetch(
              `/api/service-requests/${created.id}/photos?photoType=license&deviceUniqueId=${dev?.uniqueId || deviceId}`,
              { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob }
            );
          }
        }
      }

      // Sipariş bazlı — slot fotoğrafları
      // İlk slot → licensePhoto (license), diğerleri → extraPhotos (extra) olarak kaydedilir
      if (form.type === 'MONTAJ' && form.sourceType === 'order') {
        const slotEntries = Object.entries(orderSlotLicenses)
          .sort(([a], [b]) => a.localeCompare(b)); // slot_1, slot_2, slot_3 sırası
        for (let i = 0; i < slotEntries.length; i++) {
          const [slotKey, photo] = slotEntries[i];
          if (photo.b64) {
            const blob = b64ToBlob(photo.b64, 'image/jpeg');
            const photoType = 'extra'; // slot_ → extraPhotos'a gider, override olmaz
            await fetch(
              `/api/service-requests/${created.id}/photos?photoType=${photoType}&deviceUniqueId=${slotKey}`,
              { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob }
            );
          }
        }
      }

      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (admin)
      return true; // Admin her adımı geçebilir, çünkü kullanıcı seçimi opsiyonel
    if (step === 0) return !!form.type;
    if (step === 1) {
      if (form.type === 'MONTAJ') {
        return form.sourceType === 'device'
          ? form.deviceIds.length > 0
          : (!!form.selectedOrderId && orderSlotCount > 0);
      }
      // Diğer tipler sadece araç seçimi
      return form.deviceIds.length > 0;
    }
    if (step === 2) {
      if (form.type === 'MONTAJ') {
        if (form.sourceType === 'order') {
          if (orderSlotCount === 0) return false;
          return Array.from({ length: orderSlotCount }, (_, i) => `slot_${i + 1}`)
            .every((k) => !!orderSlotLicenses[k]?.b64);
        }
        if (form.deviceIds.length <= 1) return !!form.licensePhotoB64;
        return form.deviceIds.every((did) => !!form.deviceLicenses[did]?.b64);
      }
      if (form.type === 'DEVIR') return !!form.newOwnerEmail && !!form.newOwnerName;
      return true; // DEMONTAJ ve DIGER'da belge opsiyonel
    }
    if (step === 3) return form.type === 'DIGER' || !!form.city;
    return false;
  };

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['sharedServiceName', 'settingsSupport']}>
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {/* Admin için kullanıcı seçimi */}
        {admin && (
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Kullanıcı adına talep oluştur (opsiyonel)
              </Typography>
              <Autocomplete
                options={allUsers.filter((u) => !u.administrator)}
                getOptionLabel={(u) => `${u.name} (${u.email})`}
                value={targetUser}
                onChange={(_, val) => setTargetUser(val)}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Kullanıcı seç" />
                )}
              />
              {targetUser && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Talep {targetUser.name} adına oluşturulacak
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* ADIM 0: Tip Seç */}
        {step === 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Talep tipini seçin</Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {Object.entries(TYPE_META).map(([val, m]) => (
                  <OptionCard
                    key={val}
                    icon={m.icon}
                    title={m.title}
                    description={m.desc}
                    color={m.color}
                    selected={form.type === val}
                    onClick={() =>
                      setForm((f) => ({ ...f, type: val, deviceIds: [], selectedOrderId: '', sourceType: 'device' }))
                    }
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ADIM 1: Araç veya Sipariş */}
        {step === 1 && (
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {form.type === 'MONTAJ' ? 'Hangi araç veya sipariş için?' : 'Hangi araç için?'}
              </Typography>

              {/* MONTAJ'da sipariş seçimi de var */}
              {form.type === 'MONTAJ' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <OptionCard
                    vertical
                    icon={<DirectionsCarOutlinedIcon />}
                    title="Hesabımdaki araç"
                    selected={form.sourceType === 'device'}
                    onClick={() => setForm((f) => ({ ...f, sourceType: 'device', deviceIds: [], selectedOrderId: '' }))}
                  />
                  <OptionCard
                    vertical
                    color="warning"
                    icon={<ShoppingBagOutlinedIcon />}
                    title="Siparişimden seç"
                    selected={form.sourceType === 'order'}
                    onClick={() => setForm((f) => ({ ...f, sourceType: 'order', deviceIds: [], selectedOrderId: '' }))}
                  />
                </Box>
              )}
              {/* Admin — grup bazlı toplu araç ekleme */}
              {admin && form.type !== 'DEVIR' && (form.type !== 'MONTAJ' || form.sourceType === 'device') && (
                <FormControl fullWidth size="small">
                  <InputLabel>Grup seçerek tüm araçları ekle (opsiyonel)</InputLabel>
                  <Select
                    value={selectedGroupId}
                    label="Grup seçerek tüm araçları ekle (opsiyonel)"
                    onChange={(e) => {
                      const gid = Number(e.target.value);
                      setSelectedGroupId(e.target.value);
                      if (!gid) return;
                      // Gruba ait araçları bul ve mevcut listeye ekle (duplicate olmadan)
                      const groupDevices = devices.filter((d) => d.groupId === gid);
                      const newIds = groupDevices.map((d) => d.id).filter((did) => !form.deviceIds.includes(did));
                      if (newIds.length > 0) {
                        setForm((f) => ({ ...f, deviceIds: [...f.deviceIds, ...newIds] }));
                      }
                      // Seçimi sıfırla (tekrar seçilebilsin)
                      setTimeout(() => setSelectedGroupId(''), 300);
                    }}
                  >
                    <MenuItem value=""><em>Grup seç</em></MenuItem>
                    {groups
                      .filter((g) => devices.some((d) => d.groupId === g.id))
                      .map((g) => {
                        const count = devices.filter((d) => d.groupId === g.id).length;
                        return (
                          <MenuItem key={g.id} value={g.id}>
                            {g.name} ({count} araç)
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>
              )}
              {/* Araç seçimi — MONTAJ araç veya DEVIR/DEMONTAJ/DIGER */}
              {(form.type !== 'MONTAJ' || form.sourceType === 'device') && (
                <Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Araç {form.type !== 'DEVIR' ? 'ekle' : 'seçin'}</InputLabel>
                    <Select
                      value=""
                      label={form.type !== 'DEVIR' ? 'Araç ekle' : 'Araç seçin'}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!val) return;
                        if (form.type === 'DEVIR') {
                          setForm((f) => ({ ...f, deviceIds: [val] }));
                        } else {
                          if (!form.deviceIds.includes(val)) {
                            setForm((f) => ({ ...f, deviceIds: [...f.deviceIds, val] }));
                          }
                        }
                      }}
                    >
                      <MenuItem value=""><em>Seçin</em></MenuItem>
                      {devices
                        .filter(d => form.type === 'DEVIR' || !form.deviceIds.includes(d.id))
                        .map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  {/* Seçili araçlar chip olarak */}
                  {form.deviceIds.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                      {form.deviceIds.map((did) => {
                        const dev = devicesMap[did];
                        return (
                          <Chip
                            key={did}
                            size="small"
                            label={dev?.name || `Araç #${did}`}
                            onDelete={form.type !== 'DEVIR' ? () => setForm((f) => ({
                              ...f,
                              deviceIds: f.deviceIds.filter((id) => id !== did),
                              deviceLicenses: Object.fromEntries(
                                Object.entries(f.deviceLicenses).filter(([k]) => k !== String(did))
                              ),
                            })) : undefined}
                            color="primary"
                            variant="outlined"
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}

              {/* MONTAJ sipariş seçimi */}
              {form.type === 'MONTAJ' && form.sourceType === 'order' && (
                <>
                  {loadingOrders ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} /></Box>
                  ) : orders.length === 0 ? (
                    <Alert severity="info">Siparişiniz bulunamadı. Sipariş numarasını manuel girin.</Alert>
                  ) : (
                    <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 240, overflow: 'auto' }}>
                      {orders.map((o) => (
                        <ListItemButton
                          key={o.id}
                          selected={form.selectedOrderId === o.id}
                          onClick={() => {
                            const shippableCount = (o.lineItems || []).reduce((sum, item) => {
                              const qty = item.quantity || 1;
                              const shippable = item.physicalProperties?.shippable ?? true;
                              return sum + (shippable ? qty : 0);
                            }, 0);
                            setOrderSlotCount(shippableCount);
                            setOrderSlotLicenses({});
                            setForm((f) => ({
                              ...f,
                              selectedOrderId: o.id,
                              selectedOrderLabel: `#${o.number} — ${o.lineItems?.map((i) => i.productName?.original).join(', ')}`,
                            }));
                          }}
                        >
                          <ListItemText
                            primary={`Sipariş #${o.number}`}
                            secondary={o.lineItems?.map((i) => i.productName?.original).join(', ')}
                          />
                          <ListItemSecondaryAction>
                            <Chip size="small" label={o.paymentStatus} color={o.paymentStatus === 'PAID' ? 'success' : 'default'} />
                          </ListItemSecondaryAction>
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                  {/* Manuel giriş — sipariş listede yoksa */}
                  <TextField
                    fullWidth size="small"
                    label="Sipariş numarası (listede yoksa)"
                    value={form.selectedOrderId}
                    onChange={(e) => setForm((f) => ({ ...f, selectedOrderId: e.target.value, selectedOrderLabel: e.target.value }))}
                  />
                  {form.selectedOrderId && (
                    <TextField
                      fullWidth size="small" type="number"
                      label="Araç/Cihaz Sayısı? "
                      value={orderSlotCount || ''}
                      onChange={(e) => { setOrderSlotCount(parseInt(e.target.value) || 0); setOrderSlotLicenses({}); }}
                    />
                  )}
                </>
              )}

              {/* DEVİR bilgi notu */}
              {form.type === 'DEVIR' && (
                <Alert severity="info">
                  Devir işlemi, cihazın mevcut data ve abonelik paketiyle birlikte, yeni bir kullanıcıya aktarılmasını sağlar! Aktarılacak hesap kullanıcısı önceden uygulamaya kayıt olmalıdır!
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* ADIM 2: Belgeler */}
        {step === 2 && (
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Belgeler</Typography>

              {/* MONTAJ — her araç için ruhsat fotoğrafı */}
              {form.type === 'MONTAJ' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Ruhsat Fotoğrafı (zorunlu)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Her araç için ruhsatı elinizde tutarak fotoğraf çekin. Ruhsat sahibi ve araç bilgileri net görünmelidir. Birden fazla araç varsa, her biri için ayrı fotoğraf yükleyin.
                  </Typography>

                  {/* Sipariş bazlı — her slot için ruhsat */}
                  {form.sourceType === 'order' && orderSlotCount > 0 && (
                    Array.from({ length: orderSlotCount }, (_, i) => {
                      const key = `slot_${i + 1}`;
                      const photo = orderSlotLicenses[key];
                      return (
                        <Box key={key} sx={{ p: 1.5, border: '1px solid', borderColor: photo?.b64 ? 'success.main' : 'divider', borderRadius: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                            {photo?.b64 && <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />}
                            <Typography variant="caption" fontWeight={600}>Araç {i + 1} — Ruhsat</Typography>
                          </Box>
                          {photo?.preview ? (
                            <Box>
                              <Box component="img" src={photo.preview} sx={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 1 }} />
                              <Button size="small" onClick={() => setOrderSlotLicenses((prev) => { const n = { ...prev }; delete n[key]; return n; })}>Kaldır</Button>
                            </Box>
                          ) : (
                            <Button variant="outlined" component="label" size="small" fullWidth>
                              Ruhsat Fotoğrafı Seç
                              <input type="file" hidden accept="image/*" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const b64 = await compressToTarget(file);
                                setOrderSlotLicenses((prev) => ({ ...prev, [key]: { file, preview: b64, b64 } }));
                              }} />
                            </Button>
                          )}
                        </Box>
                      );
                    })
                  )}

                  {/* Tek araç — eski davranış */}
                  {form.sourceType === 'device' && form.deviceIds.length <= 1 && (
                    <Box>
                      {form.licensePhotoPreview ? (
                        <Box>
                          <Box component="img" src={form.licensePhotoPreview} sx={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 1, mb: 1 }} />
                          <Button size="small" onClick={() => setForm((f) => ({ ...f, licensePhotoFile: null, licensePhotoPreview: null, licensePhotoB64: null }))}>
                            Kaldır
                          </Button>
                        </Box>
                      ) : (
                        <Button variant="outlined" component="label" fullWidth>
                          Ruhsat Fotoğrafı Seç
                          <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* Birden fazla araç — her biri için ayrı */}
                  {form.sourceType === 'device' && form.deviceIds.length > 1 && form.deviceIds.map((did) => {
                    const dev = devicesMap[did];
                    const photo = form.deviceLicenses[did];
                    return (
                      <Box key={did} sx={{ p: 1.5, border: '1px solid', borderColor: photo?.b64 ? 'success.main' : 'divider', borderRadius: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                          {photo?.b64 && <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />}
                          <Typography variant="caption" fontWeight={600}>
                            {dev?.name || did}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {dev?.uniqueId}
                          </Typography>
                        </Box>
                        {photo?.preview ? (
                          <Box>
                            <Box component="img" src={photo.preview} sx={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 1 }} />
                            <Button size="small" onClick={() => setForm((f) => {
                              const dl = { ...f.deviceLicenses };
                              delete dl[did];
                              return { ...f, deviceLicenses: dl };
                            })}>Kaldır</Button>
                          </Box>
                        ) : (
                          <Button variant="outlined" component="label" size="small" fullWidth>
                            Ruhsat Fotoğrafı Seç
                            <input type="file" hidden accept="image/*" onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const b64 = await compressToTarget(file);
                              setForm((f) => ({ ...f, deviceLicenses: { ...f.deviceLicenses, [did]: { file, preview: b64, b64 } } }));
                            }} />
                          </Button>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* DEVİR — yeni sahip bilgileri + plaka */}
              {form.type === 'DEVIR' && (
                <>
                  <Alert severity="warning">
                    Yeni sahibin uygulamaya kayıtlı olması gerekiyor. Kayıtlı değilse önce kayıt yaptırın.
                  </Alert>
                  <TextField fullWidth size="small" label="Yeni Sahibin E-postası (uygulamaya kayıtlı)" value={form.newOwnerEmail} onChange={(e) => setForm((f) => ({ ...f, newOwnerEmail: e.target.value }))} />
                  <TextField fullWidth size="small" label="Yeni Sahibin Adı Soyadı" value={form.newOwnerName} onChange={(e) => setForm((f) => ({ ...f, newOwnerName: e.target.value }))} />
                  <TextField fullWidth size="small" label="Yeni Sahibin Telefonu" value={form.newOwnerPhone} onChange={(e) => setForm((f) => ({ ...f, newOwnerPhone: e.target.value }))} />
                  <Divider />
                  <Typography variant="body2" color="text.secondary">Plaka değişikliği varsa yeni plakayı girin (opsiyonel)</Typography>
                  <TextField fullWidth size="small" label="Yeni Plaka (değişmiyorsa boş bırakın)" value={form.newDeviceName} onChange={(e) => setForm((f) => ({ ...f, newDeviceName: e.target.value }))} />
                  <Typography variant="body2" color="text.secondary"> Yeni Araç Ruhsatı veya Noter Satış Belgesi</Typography>
                  {form.licensePhotoPreview ? (
                    <Box>
                      <Box component="img" src={form.licensePhotoPreview} sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1, mb: 1 }} />
                      <Button size="small" onClick={() => setForm((f) => ({ ...f, licensePhotoFile: null, licensePhotoPreview: null, licensePhotoB64: null }))}>Kaldır</Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" fullWidth>
                      Belge Yükle
                      <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
                    </Button>
                  )}
                </>
              )}

              {/* DEMONTAJ / DIGER — opsiyonel fotoğraf */}
              {(form.type === 'DEMONTAJ' || form.type === 'DIGER') && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Fotoğraf (opsiyonel)</Typography>
                  {form.licensePhotoPreview ? (
                    <Box>
                      <Box component="img" src={form.licensePhotoPreview} sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1, mb: 1 }} />
                      <Button size="small" onClick={() => setForm((f) => ({ ...f, licensePhotoFile: null, licensePhotoPreview: null, licensePhotoB64: null }))}>Kaldır</Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" fullWidth>
                      Fotoğraf Yükle (opsiyonel)
                      <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
                    </Button>
                  )}
                </Box>
              )}

              <TextField fullWidth size="small" multiline rows={2} label="Müşteri notu (opsiyonel)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </CardContent>
          </Card>
        )}

        {/* ADIM 3: İl / İlçe */}
        {step === 3 && (
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Konum bilgisi</Typography>

              {form.type === 'DEVIR' ? (
                <Alert severity="info">
                  Devir işleminde servis ataması yapılmaz. Belgeleriniz incelenip onaylandıktan sonra Cihaz yeni sahibine aktarılacaktır. Bilgi amaçlı Şehir bilgisi belirtiniz.
                </Alert>
              ) : form.type === 'DIGER' ? (
                <Alert severity="info">
                  Servis talebiniz varsa şehir ve ilçe bilgisi belirtiniz. Servis talebiniz yoksa boş bırakabilirsiniz.
                </Alert>
              ) : null}

              {/* İl — 81 il Autocomplete */}
              <Autocomplete
                options={ILLER}
                value={form.city || null}
                onChange={(_, val) => setForm((f) => ({ ...f, city: val || '', district: '' }))}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="İl" required={form.type !== 'DIGER'} />
                )}
              />
              <TextField fullWidth size="small" label="İlçe (opsiyonel)" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} />

              {/* Servis listesi — DEVİR hariç */}
              {form.type !== 'DEVIR' && form.city && centers.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {form.city} ilindeki servis merkezleri ({centers.length})
                  </Typography>
                  {(centersExpanded ? centers : centers.slice(0, 1)).map((c, i) => (
                    <Alert key={c.id || i} severity={i === 0 ? 'success' : 'info'} icon={<LocationOnIcon />}>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      <Typography variant="caption" display="block">{c.address}</Typography>
                      {c.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 13 }} />
                          <Typography variant="caption">{c.phone}</Typography>
                        </Box>
                      )}
                      {i === 0 && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          Serviste sıra beklememek için talebiniz onaylandığında randevu almanızı tavsiye ederiz.
                        </Alert>
                      )}
                    </Alert>
                  ))}
                  {centers.length > 1 && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setCentersExpanded((v) => !v)}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none', p: 0 }}
                    >
                      {centersExpanded ? 'Daha az göster ▲' : `+${centers.length - 1} servis daha ▼`}
                    </Button>
                  )}
                </Box>
              )}
              {form.type !== 'DEVIR' && form.city && centers.length === 0 && (
                <Alert severity="info">
                  Adresinize göre en yakın Servis bilgileri ayrıca iletilecektir. Talep oluşturulduktan sonra birkaç saat içerisinde(ortalama) servis ataması yapılmaktadır.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* ADIM 4: Sonuç */}
        {step === 4 && (
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Talebiniz Alındı, Onay Sürecinde..</Typography>
              <Typography variant="body2" color="text.secondary">
                {form.type === 'DEVIR'
                  ? 'Devir talebiniz oluşturuldu. Belge onayından sonra araç yeni sahibine aktarılacak.'
                  : 'Servis talebiniz oluşturuldu. Belge onayından sonra servis atanacak ve bildirim gönderilecek.'}
              </Typography>
              <Button sx={{ mt: 3 }} variant="contained" onClick={() => navigate('/finans/requests')}>
                Taleplerime Git
              </Button>
            </CardContent>
          </Card>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {step < 4 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => (step === 0 ? navigate('/finans/requests') : setStep((s) => s - 1))}>
              {step === 0 ? 'İptal' : 'Geri'}
            </Button>
            {step < 3 ? (
              <Button variant="contained" disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>İleri</Button>
            ) : (
              <Button variant="contained" disabled={!canNext() || saving} onClick={handleSubmit}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                {saving ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default NewRequestPage;