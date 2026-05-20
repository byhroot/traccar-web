import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { devicesActions } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, Grid, Chip, Avatar, CircularProgress,
  Dialog, DialogTitle, DialogContent, IconButton, Divider,
  TextField, Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Switch, Button, Alert, Snackbar, useTheme, useMediaQuery
} from '@mui/material';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import { alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CameraAlt as CameraIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from '../reports/components/ReportsMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import deviceCategories from '../common/util/deviceCategories'; // Kategoriler buradan geliyor
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SelectField from '../common/components/SelectField';
// Hedefi 50KB yapalım, 500 byte çok çok az.
const TARGET_SIZE_BYTES = 500 * 1024;

async function compressToTarget(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let q = 0.9; // Başlangıç kalitesini yüksek tutalım

      const attempt = () => {
        canvas.width = w;
        canvas.height = h;
        // Daha pürüzsüz görüntü için:
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const data = canvas.toDataURL('image/jpeg', q);
        const sz = Math.round((data.length * 3) / 4);

        // Eğer hedef boyuta ulaştıysak veya kalite/boyut sınırına dayandıysak bitir
        if (sz <= TARGET_SIZE_BYTES || (w <= 300) || q <= 0.1) {
          URL.revokeObjectURL(url);
          resolve(data);
          return;
        }

        // Boyut hala çok büyükse kademeli küçült
        if (sz > TARGET_SIZE_BYTES * 2) {
          w = Math.round(w * 0.85);
          h = Math.round(h * 0.85);
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
const isDone = (device) => !!(device.attributes && device.attributes.deviceImage);

// ─── KPI Kart ───────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, color, icon: Icon }) => (
  <Card
    elevation={0}
    sx={{ flex: 1, minWidth: 110, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
  >
    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: alpha(color, 0.12), width: 38, height: 38 }}>
        <Icon sx={{ color, fontSize: 20 }} />
      </Avatar>
      <Box>
        <Typography variant="h5" fontWeight={700} lineHeight={1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  </Card>
);
const IgnitionVerifyStep = ({ deviceId, onSaveComplete, onManualSave, onCancel, saving }) => {
  const position = useSelector((state) => state.session.positions[deviceId]);
  const device = useSelector((state) => state.devices.items[deviceId]);
  const isOnline = device?.status === 'online';
  const ignition = position?.attributes?.ignition ?? false;
  const prevIgnRef = useRef(ignition);
  const [cycleCount, setCycleCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [currentIgn, setCurrentIgn] = useState(ignition);
  const [done, setDone] = useState(false);
  const REQUIRED_CYCLES = 1;

  useEffect(() => {
    const prev = prevIgnRef.current;
    prevIgnRef.current = ignition;
    setCurrentIgn(ignition);

    if (!prev && ignition) {
      setOpenCount((c) => c + 1);
    }
    if (prev && !ignition) {
      setCycleCount((c) => {
        const next = c + 1;
        if (next >= REQUIRED_CYCLES) {
          setDone(true);
          setTimeout(() => onSaveComplete(), 1200);
        }
        return next;
      });
    }
  }, [ignition]);

  // ── Başarı ekranı ──────────────────────────────────────────────
  if (done) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%',
          bgcolor: '#EAF3DE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircleIcon sx={{ color: '#639922', fontSize: 40 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} textAlign="center">
          Doğrulama tamamlandı
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Veriler kaydediliyor...
        </Typography>
        <CircularProgress size={22} sx={{ color: '#639922' }} />
      </Box>
    );
  }

  // ── Adım göstergesi ───────────────────────────────────────────
  const stepState = (i) => {
    if (i < cycleCount) return 'done';
    if (i === cycleCount) return 'active';
    return 'idle';
  };

  const stepColors = {
    done: { border: '#639922', bg: '#EAF3DE', text: '#3B6D11', bar: '#639922' },
    active: { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', bar: '#EF9F27' },
    idle: { border: 'divider', bg: 'action.hover', text: 'text.disabled', bar: 'action.disabledBackground' },
  };
  // ── Online değilse manuel kayıt ekranı ──
  if (!isOnline) {
    return (
      <Box sx={{ py: 0.5 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          Kontak doğrulaması
        </Typography>

        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 2, py: 3, px: 1,
          border: '1px solid', borderColor: 'warning.main',
          borderRadius: 2, mb: 2.5, bgcolor: 'warning.50',
        }}>
          <WifiOffIcon sx={{ fontSize: 40, color: 'warning.main' }} />
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Araç şu an <strong>çevrimdışı</strong>. Kontak durumu kontrol edilemiyor.
            <br />
            Manuel olarak kaydetmek istiyor musunuz? veya aracın bağlantısını kontrol edin.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button disabled={saving} fullWidth variant="outlined" color="inherit" onClick={onCancel}>
            ← Geri
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="warning"
            onClick={onManualSave}
            disabled={saving}
            startIcon={
              saving
                ? <CircularProgress size={16} color="inherit" />
                : null
            }
          >
            {saving ? 'Kaydediliyor...' : 'Manuel Kaydet'}
          </Button>
        </Box>
      </Box>
    );
  }
  const hintText = () => {
    if (cycleCount === 0 && !currentIgn) return 'Aracın kontağını açın';
    if (cycleCount === 0 && currentIgn) return 'Kontak açıldı — şimdi kapatın (1/2)';
    if (cycleCount === 1 && !currentIgn) return 'Harika! Bir kez daha açıp kapatın';
    if (cycleCount === 1 && currentIgn) return 'Kontak açıldı — şimdi kapatın (2/2)';
    return '';
  };

  return (
    <Box sx={{ py: 0.5 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
        Kontak doğrulaması
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.5 }}>
        Aracın kontağını <strong>{REQUIRED_CYCLES} kez</strong> açıp 5 saniye sonra kapatın —
        İşlem tamamlanana kadar bu ekranı kapatmayın!
      </Typography>

      {/* ── Anahtar animasyonlu halka ── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Box sx={{
          position: 'relative', width: 110, height: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Dış halka — kontak açıkken pulse */}
          <Box sx={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2.5px solid',
            borderColor: currentIgn ? '#639922' : 'divider',
            transition: 'border-color 0.3s',
            ...(currentIgn && {
              animation: 'ign-ring 1.4s ease-in-out infinite',
              '@keyframes ign-ring': {
                '0%,100%': { boxShadow: '0 0 0 0 rgba(99,153,34,0.25)' },
                '50%': { boxShadow: '0 0 0 10px rgba(99,153,34,0)' },
              },
            }),
          }} />
          {/* İç daire */}
          <Box sx={{
            width: 74, height: 74, borderRadius: '50%',
            bgcolor: currentIgn ? '#EAF3DE' : 'action.hover',
            border: '0.5px solid',
            borderColor: currentIgn ? '#97C459' : 'divider',
            transition: 'background-color 0.3s, border-color 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <VpnKeyIcon sx={{
              fontSize: 30,
              color: currentIgn ? '#639922' : 'text.disabled',
              transform: currentIgn ? 'rotate(-45deg)' : 'rotate(0deg)',
              transition: 'color 0.3s, transform 0.3s',
            }} />
          </Box>
        </Box>
      </Box>

      {/* ── Durum etiketi ── */}
      <Typography variant="body1" fontWeight={700} textAlign="center"
        sx={{ color: currentIgn ? '#3B6D11' : 'text.primary', transition: 'color 0.3s', mb: 0.5 }}>
        {currentIgn ? 'Kontak açık' : 'Kontak kapalı'}
      </Typography>
      <Typography variant="body2" textAlign="center"
        sx={{ color: 'text.secondary', mb: 2.5, minHeight: 40, lineHeight: 1.5 }}>
        {hintText()}
      </Typography>

      {/* ── Adım göstergesi ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        {Array.from({ length: REQUIRED_CYCLES }).map((_, i) => {
          const s = stepState(i);
          const c = stepColors[s];
          return (
            <React.Fragment key={i}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: '1.5px solid', borderColor: c.border,
                  bgcolor: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {s === 'done'
                    ? <CheckCircleIcon sx={{ fontSize: 18, color: '#639922' }} />
                    : <Typography variant="caption" fontWeight={700} sx={{ color: c.text }}>{i + 1}</Typography>
                  }
                </Box>
                <Box sx={{
                  height: 4, width: '100%', borderRadius: 2,
                  bgcolor: c.bar, transition: 'background-color 0.3s',
                }} />
                <Typography variant="caption" color="text.secondary">
                  {i + 1}. Kontrol
                </Typography>
              </Box>
              {i < REQUIRED_CYCLES - 1 && (
                <Box sx={{
                  flexShrink: 0, width: 20, height: 2, borderRadius: 1,
                  bgcolor: cycleCount > 0 ? '#639922' : 'action.disabledBackground',
                  transition: 'background-color 0.3s', mb: 2.5,
                }} />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>
        ←GERİ
      </Button>
    </Box>
  );
};

// ─── Cihaz Satırı ────────────────────────────────────────────────────────────
const DeviceRow = React.memo(({ device, onEdit }) => {
  // Mevcut devicesMap satırının yanına ekleyin
  const groups = useSelector((state) => state.groups.items);
  const groupName = device.groupId ? groups[device.groupId]?.name : null;

  const done = isDone(device);
  // Resim URL'sini cache-busting ile oluştur
  const imageUrl = useMemo(() => {
    if (!done) return null;
    // Eğer attributes içinde bir güncellenme zamanı varsa onu kullan, yoksa statik çek
    const cacheBust = device.attributes.lastUpdate || Date.now();
    return `/api/media/${device.uniqueId}/${device.attributes.deviceImage}?t=${cacheBust}`;
  }, [device.uniqueId, device.attributes.deviceImage, device.attributes.lastUpdate, done]);

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, px: { xs: 1.5, sm: 2 }, py: 1.5,
        borderBottom: '1px solid', borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
        '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer', flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
      onClick={() => onEdit(device.id)}
    >
      <Box sx={{ flexShrink: 0 }}>
        {done ? (
          <Box
            component="img"
            src={imageUrl}
            sx={{
              width: 44, height: 44, borderRadius: 2, objectFit: 'cover',
              border: '1px solid', borderColor: 'divider',
              display: 'block'
            }}
            onError={(e) => {
              e.target.style.display = 'none'; // Resmi gizle
              e.target.nextElementSibling.style.display = 'flex'; // İkonu göster
            }}
          />
        ) : null}

        {/* Resim yoksa veya hata verirse görünecek yedek kutu */}
        <Box
          sx={{
            width: 44, height: 44, borderRadius: 2,
            bgcolor: 'action.selected', border: '1px dashed', borderColor: 'divider',
            display: done ? 'none' : 'flex', // Resim varsa başlangıçta gizli
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <CameraIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Box>
      </Box>
      <Box sx={{ flex: '1 1 120px', minWidth: 0 }}>
        <Typography fontWeight={700} fontSize={14} noWrap>{device.name}</Typography>
        {groupName && (
          <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontSize: 10 }} noWrap>
            Müşteri: {groupName}
          </Typography>
        )}
        <Typography fontSize={10} variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{device.uniqueId}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        <Chip
          size="small"
          label={device.status === 'online' ? 'Online' : 'Offline'}
          color={device.status === 'online' ? 'success' : 'default'}
          variant="outlined"
          sx={{
            fontSize: 14,
            fontWeight: 900,
            ...(device.status === 'online' && {
              animation: 'pulse-online 1.8s ease-in-out infinite',
              '@keyframes pulse-online': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }),
          }}
        />
        <Chip size="small" label={done ? 'Tamamlandı' : 'İşlemde'} color={done ? 'success' : 'warning'} sx={{ fontSize: 11 }} />
      </Box>
    </Box>
  );
});

// ─── Ana Sayfa ──────────────────────────────────────────────────────────────
const ServisPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useSelector((state) => state.session.user);
  const t = useTranslation();
  const sessionServis = useMemo(() => {
    const ad = user?.name || user?.login || 'Bilinmeyen Servis';
    const mail = user?.email ? ` (${user.email})` : '';
    const tel = user?.phone ? ` - ${user.phone}` : '';

    // Örn: "Hasan Türk (hasanturk@gmail.com) - 0532..."
    return `${ad}${mail}${tel}`;
  }, [user]);

  // Kullanıcı bilgisini düz metin olarak hazırlıyoruz
  const serviceText = useMemo(() => {
    const ad = user?.name || user?.login || 'Bilinmeyen Servis';
    const mail = user?.email ? ` (${user.email})` : '';
    const tel = user?.phone ? ` - ${user.phone}` : '';
    return `${ad}${mail}${tel}`;
  }, [user]);

  // Dinamik ve Sıralı Kategoriler
  const sortedCategories = useMemo(() => {
    return deviceCategories
      .map((category) => ({
        id: category,
        name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [t]);
  const devicesMap = useSelector((state) => state.devices.items);
  const devices = useMemo(() => Object.values(devicesMap), [devicesMap]);

  const groups = useSelector((state) => state.groups.items);
  const [groupOptions, setGroupOptions] = useState([
    { id: 'all', name: 'Tüm Gruplar' },
  ]);

  useEffect(() => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((data) => {
        setGroupOptions([
          { id: 'all', name: 'Tüm Gruplar' },
          ...data.map((g) => ({
            ...g,
            id: String(g.id),
          })),
        ]);
      });
  }, []);
  const [search, setSearch] = useState(() => {
    return localStorage.getItem('servis.search') || '';
  }); const [groupFilter, setGroupFilter] = useState(() => {
    return localStorage.getItem('servis.groupFilter') || 'all';
  }); const [tab, setTab] = useState('pending');
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [verifyStep, setVerifyStep] = useState(false);
  const [form, setForm] = useState({});
  const [imgPreview, setImgPreview] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [imgB64, setImgB64] = useState(null);
  const [errors, setErrors] = useState({});
  const fileRef = useRef();
  const dispatch = useDispatch();

  // EKLE — store'dan al

  const loading = false; // artık store her zaman hazır
  useEffect(() => {
    localStorage.setItem('servis.groupFilter', groupFilter);
    localStorage.setItem('servis.search', search);
  }, [groupFilter, search]);
  const kpiDevices = useMemo(() => {
    return devices.filter((d) => {
      if (
        groupFilter !== 'all'
        && String(d.groupId) !== String(groupFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [devices, groupFilter]);

  const kpi = useMemo(() => ({
    online: kpiDevices.filter((d) => d.status === 'online').length,
    offline: kpiDevices.filter((d) => d.status !== 'online').length,
    pending: kpiDevices.filter((d) => !isDone(d)).length,
    done: kpiDevices.filter((d) => isDone(d)).length,
  }), [kpiDevices]);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (tab === 'pending' && isDone(d)) return false;
      if (tab === 'done' && !isDone(d)) return false;
      const keyword = search.toLowerCase();

      const matchesSearch =
        d.name?.toLowerCase().includes(keyword)
        || d.uniqueId?.toLowerCase().includes(keyword)
        || groups[d.groupId]?.name?.toLowerCase().includes(keyword);

      if (search && !matchesSearch) {
        return false;
      }

      if (
        groupFilter !== 'all'
        && String(d.groupId) !== String(groupFilter)
      ) {
        return false;
      }
      return true;
    }).
      sort((a, b) => {
        const aOnline = a.status === 'online' ? 0 : 1;
        const bOnline = b.status === 'online' ? 0 : 1;
        return aOnline - bOnline;
      });
  }, [devices, tab, search, groupFilter, groups]);

  const openEdit = useCallback((id) => {
    const d = devices.find((x) => x.id === id);
    if (!d) return;
    const attr = d.attributes || {};
    setForm({
      id: d.id, name: d.name || '', uniqueId: d.uniqueId || '', category: d.category || '',
      deviceImage: attr.deviceImage || '', ruhsatEslesti: !!attr.ruhsatEslesti,
      blokajkiti: !!attr.blokajkiti, km: attr.km || '', _raw: d,
    });

    // 🛠️ BURAYI GÜNCELLE: URL'nin sonuna zaman damgası ekleyerek cache'i kırıyoruz.
    const cacheBust = attr.lastUpdate || Date.now();
    setImgPreview(attr.deviceImage ? `/api/media/${d.uniqueId}/${attr.deviceImage}?t=${cacheBust}` : null);

    setImgB64(null); setErrors({}); setEditId(id);
  }, [devices]);

  const handleImgSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result; // Fotoğraf artık RAM'de (Base64)

      // Sizin compressToTarget fonksiyonunuzu burada çağırabilirsiniz
      const compressed = await compressToTarget(file);
      setImgB64(compressed);
      setImgPreview(compressed);
    };
    reader.readAsDataURL(file); // Dosyayı galeriye bakmadan belleğe okur
  };

  // Eski handleSave → sadece validasyon + verifyStep aç
  const handleSave = async () => {
    const e = {};
    let snackMsg = '';

    const currentName = form.name?.trim();
    if (!currentName || currentName === form.uniqueId) {
      e.name = 'Plaka zorunlu';
      snackMsg = 'Lütfen geçerli bir plaka giriniz!';
    } else if (!form.category) {
      e.category = 'Kategori seçiniz';
      snackMsg = 'Lütfen bir araç kategorisi seçin!';
    } else if (!imgB64 && !form.deviceImage) {
      e.deviceImage = 'Fotoğraf zorunlu';
      snackMsg = 'Lütfen araç/Montaj Fotoğrafını yükleyin!';
    }

    if (snackMsg) {
      setErrors(e);
      setSnack({ open: true, msg: snackMsg, severity: 'error' });
      return;
    }

    if (!form.ruhsatEslesti) {
      setErrors({ ruhsatEslesti: 'Onay gerekli' });
      setSnack({ open: true, msg: 'Lütfen plaka ve ruhsatın eşleştiğini onaylayın!', severity: 'warning' });
      return;
    }

    // Validasyon geçti → kontak doğrulama adımına geç
    setVerifyStep(true);
  };

  // Asıl kayıt fonksiyonu — IgnitionVerifyStep tamamlanınca çağrılır
  const doSave = useCallback(async () => {
    setSaving(true);
    try {
      const raw = { ...form._raw };
      const attr = { ...(raw.attributes || {}) };
      attr.ruhsatEslesti = form.ruhsatEslesti;
      attr.blokajkiti = form.blokajkiti;
      attr.servisislemyapan = sessionServis;
      attr.km = form.km; // EKLE
      attr.lastUpdate = Date.now();

      if (imgB64) {
        try {
          const byteString = atob(imgB64.split(',')[1]);
          const mimeString = imgB64.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          const blob = new Blob([ab], { type: mimeString });

          const uploadRes = await fetch(`/api/devices/${raw.id}/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'image/jpeg' },
            body: blob,
          });
          if (!uploadRes.ok) {
            throw new Error(`Upload failed: ${uploadRes.status}`);
          }

          const serverFileName = (await uploadRes.text()).trim();

          if (!serverFileName) {
            throw new Error('Empty upload response');
          }

          attr.deviceImage = serverFileName;
        } catch (err) {
          console.error('Resim yükleme hatası:', err);

          setSnack({
            open: true,
            msg: 'Fotoğraf yüklenemedi, lütfen tekrar deneyin.',
            severity: 'error',
          });

          return;
        }
      }

      raw.name = form.name;
      raw.category = form.category;
      raw.attributes = attr;

      await fetch(`/api/devices/${raw.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(raw),
      });
      // Bunu ekle — store'u anında günceller
      dispatch(devicesActions.update([raw]));
      const km = parseFloat(form.km);
      if (!isNaN(km) && km > 0) {
        await fetch(`/api/devices/${raw.id}/accumulators`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: raw.id, hours: 0, totalDistance: km * 1000 }),
        });
      }

    } catch (err) {
      setSnack({ open: true, msg: 'Hata oluştu', severity: 'error' });
      setVerifyStep(false);
    } finally {
      setSaving(false);
    }
  }, [form, imgB64, sessionServis]);



  return (
    <PageLayout menu={null} breadcrumbs={['sharedServiceName', 'servisTitle']}>
      <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <KpiCard label="Online" value={kpi.online} color={theme.palette.success.main} icon={WifiIcon} />
          <KpiCard label="Offline" value={kpi.offline} color={theme.palette.text.disabled} icon={WifiOffIcon} />
          <KpiCard label="İşlemde" value={kpi.pending} color={theme.palette.warning.main} icon={PendingIcon} />
          <KpiCard label="Biten" value={kpi.done} color={theme.palette.success.main} icon={CheckCircleIcon} />
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            {[['all', 'Tümü'], ['pending', 'İşlemde'], ['done', 'Biten']].map(([key, label]) => (
              <Box key={key} onClick={() => setTab(key)} sx={{ flex: 1, py: 1.5, textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: tab === key ? 700 : 400, color: tab === key ? 'primary.main' : 'text.secondary', borderBottom: tab === key ? '2px solid' : 'none', borderColor: 'primary.main', bgcolor: tab === key ? 'background.paper' : 'transparent' }}>{label}</Box>
            ))}
          </Box>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              gap: 1,
              flexDirection: { xs: 'column', sm: 'row' },
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                minHeight: 40,
              }}
            >
              <SearchIcon
                sx={{
                  color: 'text.disabled',
                  fontSize: 20,
                }}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Plaka, IMEI veya müşteri ara..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: 'inherit',
                }}
              />
            </Box>

            <SelectField
              label="Grup Filtrele"
              data={groupOptions}
              value={String(groupFilter)}
              emptyValue="all"
              onChange={(e) => setGroupFilter(String(e.target.value))}
              fullWidth
              singleLine
            />
          </Box>
          {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box> : filtered.map(d => <DeviceRow key={d.id} device={d} onEdit={openEdit} />)}
        </Card>
        {/* Resmiyet katan servis alt bilgi alanı */}
        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
          <PersonPinIcon sx={{ color: 'text.disabled', mt: 0.3 }} />
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Yetkili Servis Bilgisi
            </Typography>
            <Typography variant="caption" color="text.primary" sx={{ lineHeight: 1.4, display: 'block', mt: 0.5, fontStyle: 'italic' }}>
              {serviceText}
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
              İşlemler dijital ortamda kayıt altına alınmaktadır.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Dialog open={!!editId} onClose={() => { setEditId(null); setVerifyStep(false); }}
        fullWidth maxWidth="xs">
        {editId && (
          <>
            {/* Sağ Üst Kapatma İkonu */}
            <IconButton
              aria-label="close"
              onClick={() => setEditId(null)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
                zIndex: 1
              }}
            >
              <CloseIcon />
            </IconButton>
            <DialogContent sx={{ py: 3 }}>
              {verifyStep ? (
                <IgnitionVerifyStep
                  deviceId={editId}
                  onSaveComplete={async () => {
                    await doSave();
                    setSnack({ open: true, msg: 'Başarıyla kaydedildi', severity: 'success' });
                    setTimeout(() => {
                      setEditId(null);
                      setVerifyStep(false);
                    }, 1500);
                  }}
                  onManualSave={async () => {
                    await doSave();
                    setSnack({ open: true, msg: 'Manuel olarak kaydedildi', severity: 'success' });
                    setTimeout(() => {
                      setEditId(null);
                      setVerifyStep(false);
                    }, 1500);
                  }}
                  onCancel={() => setVerifyStep(false)}
                  saving={saving}
                />
              ) : (
                <>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Montaj Kaydı</Typography>
                  <TextField
                    fullWidth
                    label="Seri No"
                    size="small"
                    value={form.uniqueId}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      mb: 2,
                      '& .MuiInputBase-input': { fontSize: 12, fontFamily: 'monospace', color: 'text.secondary' },
                    }}
                  />
                  <TextField fullWidth label="Plaka" size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={!!errors.name} sx={{ mb: 2 }} />

                  <FormControl fullWidth size="small" sx={{ mb: 2 }} error={!!errors.category}>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={form.category || ''}
                      label="Kategori"
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {sortedCategories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box
                    sx={{
                      border: '1px dashed',
                      borderColor: errors.deviceImage ? 'error.main' : 'divider',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      mb: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {imgPreview ? (
                      <>
                        <Box
                          component="img"
                          src={imgPreview}
                          onClick={() => {
                            setZoom(1);
                            setPosition({ x: 0, y: 0 });
                            setImageViewerOpen(true);
                          }}
                          sx={{
                            width: '100%',
                            maxHeight: 280,
                            borderRadius: 2,
                            objectFit: 'contain',
                            cursor: 'zoom-in',
                            transition: '0.2s',
                            '&:hover': {
                              opacity: 0.92,
                            },
                          }}
                        />

                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1.5 }}
                          startIcon={<CameraIcon />}
                          onClick={() => fileRef.current?.click()}
                        >
                          Fotoğrafı Değiştir
                        </Button>
                      </>
                    ) : (
                      <Box
                        onClick={() => fileRef.current?.click()}
                        sx={{ cursor: 'pointer' }}
                      >
                        <CameraIcon sx={{ fontSize: 32, color: 'text.disabled' }} />

                        <Typography variant="caption" display="block">
                          Fotoğraf Yükle(Ruhsatı elinizde tutarak montaj yapılan yerin fotoğrafını çekin, Ekranda hem ruhsat hemde montaj noktası görünmelidir)
                        </Typography>
                      </Box>
                    )}

                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImgSelect}
                    />
                  </Box>

                  <TextField fullWidth label="Güncel KM" type="number" size="small" sx={{ mb: 2 }} value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Plaka/Ruhsat Bilgileri Eşleşti mi?</Typography>
                      <Switch checked={form.ruhsatEslesti} onChange={(e) => setForm({ ...form, ruhsatEslesti: e.target.checked })} />
                    </Box>
                  </Box>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Blokaj Kiti Montajı Yapıldı Mı?</Typography>
                      <Switch checked={form.blokajkiti} onChange={(e) => setForm({ ...form, blokajkiti: e.target.checked })} />
                    </Box>
                  </Box>
                  {/* Resmiyet katan servis alt bilgi alanı */}
                  <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid' }}>
                    <PersonPinIcon sx={{ color: 'text.disabled', mt: 0.3 }} />
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Yetkili Servis Bilgisi
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ lineHeight: 1.4, display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                        {serviceText}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                        Bu işlem dijital olarak kayıt altına alınmıştır.
                      </Typography>
                    </Box>
                  </Box>
                  {/* Buton Grubu */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => setEditId(null)}
                      disabled={saving}
                    >
                      İptal
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={20} /> : 'Kaydet'}
                    </Button>
                  </Box>

                </>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
      <Dialog
        open={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        }} fullScreen
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            bgcolor: 'black',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={() => setImageViewerOpen(false)}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 5,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.45)',
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            onMouseMove={(e) => {
              if (!dragging) return;

              setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
              });
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchMove={(e) => {
              if (!dragging) return;

              const touch = e.touches[0];

              setPosition({
                x: touch.clientX - dragStartRef.current.x,
                y: touch.clientY - dragStartRef.current.y,
              });
            }}
            onTouchEnd={() => setDragging(false)}
            sx={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src={imgPreview}
              draggable={false}
              onMouseDown={(e) => {
                if (zoom <= 1) return;

                setDragging(true);

                dragStartRef.current = {
                  x: e.clientX - position.x,
                  y: e.clientY - position.y,
                };
              }}
              onTouchStart={(e) => {
                if (zoom <= 1) return;

                const touch = e.touches[0];

                setDragging(true);

                dragStartRef.current = {
                  x: touch.clientX - position.x,
                  y: touch.clientY - position.y,
                };
              }}
              onWheel={(e) => {
                e.preventDefault();

                setZoom((prev) => {
                  const next = prev + (e.deltaY < 0 ? 0.15 : -0.15);

                  if (next <= 1) {
                    setPosition({ x: 0, y: 0 });
                  }

                  return Math.min(Math.max(next, 1), 5);
                });
              }}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
                transition: dragging ? 'none' : 'transform 0.12s ease-out',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
            />
          </Box>

          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              bgcolor: 'rgba(0,0,0,0.45)',
              borderRadius: 10,
              p: 1,
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            >
              -
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}            >
              %100
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
            >
              +
            </Button>
          </Box>
        </Box>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default ServisPage;