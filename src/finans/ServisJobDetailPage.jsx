import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Divider, Table, TableBody, TableRow, TableCell,
  TextField, CircularProgress, Alert, Switch, Button,
  Avatar, Snackbar, FormControl, InputLabel, Select, MenuItem,
  IconButton, Dialog, InputAdornment, Collapse,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadIcon from '@mui/icons-material/Upload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CloseIcon from '@mui/icons-material/Close';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BuildIcon from '@mui/icons-material/Build';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync, useCatch } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useTranslation } from '../common/components/LocalizationProvider';
import deviceCategories from '../common/util/deviceCategories';
import { serviceFileUrl } from './serviceFileUrl';
import { parseNotes, serializeNotes, NotesCard } from './NotesSection';
import { useAdministrator } from '../common/util/permissions';

const InfoRow = ({ label, value }) => value ? (
  <TableRow>
    <TableCell sx={{ color: 'text.secondary', width: 120, py: 0.5, border: 'none', fontSize: 12 }}>{label}</TableCell>
    <TableCell sx={{ py: 0.5, border: 'none', fontSize: 12 }}>{value}</TableCell>
  </TableRow>
) : null;

const PhotoViewer = ({ src, label }) => {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <Box component="img" src={src} alt={label} onClick={() => setOpen(true)}
        sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1, mt: 1, cursor: 'zoom-in', '&:hover': { opacity: 0.9 } }} />
      {open && (
        <Dialog open fullScreen onClick={() => setOpen(false)}>
          <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}>
              <CloseIcon />
            </IconButton>
            <Box component="img" src={src} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </Box>
        </Dialog>
      )}
    </>
  );
};

const TARGET_SIZE_BYTES = 1 * 512 * 1024;
async function compressToTarget(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let q = 0.85;
      const attempt = () => {
        canvas.width = w; canvas.height = h;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL('image/jpeg', q);
        const sz = Math.round((data.length * 3) / 4);
        if (sz <= TARGET_SIZE_BYTES || w <= 400 || q <= 0.1) { URL.revokeObjectURL(url); resolve(data); return; }
        if (sz > TARGET_SIZE_BYTES * 2) { w = Math.round(w * 0.8); h = Math.round(h * 0.8); } else { q -= 0.1; }
        attempt();
      };
      attempt();
    };
    img.src = url;
  });
}

// ── Kontak doğrulama ────────────────────────────────────────────────────────
const IgnitionVerifyStep = ({ deviceId, onSaveComplete, onManualSave, onCancel, saving }) => {
  const position = useSelector((s) => s.session.positions[deviceId]);
  const device = useSelector((s) => s.devices.items[deviceId]);
  const isOnline = device?.status === 'online';
  const ignition = position?.attributes?.ignition ?? false;
  const prevIgnRef = useRef(ignition);
  const [cycleCount, setCycleCount] = useState(0);
  const [currentIgn, setCurrentIgn] = useState(ignition);
  const [done, setDone] = useState(false);
  const admin = useAdministrator();
  useEffect(() => {
    const prev = prevIgnRef.current;
    prevIgnRef.current = ignition;
    setCurrentIgn(ignition);
    if (prev && !ignition) {
      setCycleCount((c) => {
        const next = c + 1;
        if (next >= 1) { setDone(true); setTimeout(() => onSaveComplete(), 1500); }
        return next;
      });
    }
  }, [ignition]);

  if (done) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircleIcon sx={{ color: '#639922', fontSize: 36 }} />
      </Box>
      <Typography variant="h6" fontWeight={700}>Doğrulama tamamlandı!</Typography>
      <CircularProgress size={20} sx={{ color: '#639922' }} />
    </Box>
  );


  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Kontak doğrulaması</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Kontağı 1 kez açıp kapatın.</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
        <Box sx={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid', borderColor: currentIgn ? '#639922' : 'divider', transition: 'border-color 0.3s' }} />
          <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: currentIgn ? '#EAF3DE' : 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
            <VpnKeyIcon sx={{ fontSize: 26, color: currentIgn ? '#639922' : 'text.disabled', transform: currentIgn ? 'rotate(-45deg)' : 'none', transition: 'all 0.3s' }} />
          </Box>
        </Box>
      </Box>
      <Typography variant="body1" fontWeight={700} textAlign="center" sx={{ color: currentIgn ? '#3B6D11' : 'text.primary', mb: 2.5 }}>
        {!currentIgn ? 'Kontağı açın' : 'Kontak açık — kapatın'}
      </Typography>
      <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>← Geri</Button>
      {(!isOnline || admin) && (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}> {admin ? "Admin Kaydı" : "Çevrimdışı Kayıt"}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3, border: '1px solid', borderColor: 'warning.main', borderRadius: 2, mb: 2 }}>
            <WifiOffIcon sx={{ fontSize: 36, color: 'warning.main' }} />
            <Typography variant="body2" textAlign="center" color="text.secondary">
              Araç şu an <strong>çevrimdışı</strong>. Kontak durumu kontrol edilemiyor.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>← Geri</Button>
            <Button fullWidth variant="contained" color="warning" onClick={onManualSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
              {saving ? 'Kaydediliyor...' : 'Manuel Kaydet'}
            </Button>
          </Box>
        </>
      )}
    </Box>

  );
};

// ── Device Wizard Dialog ────────────────────────────────────────────────────
const DeviceWizardDialog = ({ open, device, requestId, servisText, onClose, onComplete }) => {
  const t = useTranslation();
  const sortedCategories = deviceCategories.map((c) => ({
    id: c, name: t(`category${c.replace(/^\w/, (x) => x.toUpperCase())}`),
  })).sort((a, b) => a.name.localeCompare(b.name));

  const [form, setForm] = useState({ name: '', category: '', km: '', ruhsatEslesti: false, blokajkiti: false });
  const [imgB64, setImgB64] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [verifyStep, setVerifyStep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  // device değişince formu resetle
  useEffect(() => {
    if (device) {
      setForm({ name: device.name || '', category: device.category || '', km: '', ruhsatEslesti: false, blokajkiti: false });
      setImgB64(null); setImgPreview(null); setErrors({}); setVerifyStep(false); setSaved(false);
    }
  }, [device?.id]);

  const handleImgSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await compressToTarget(file);
    setImgB64(b64); setImgPreview(b64);
  };

  const handleSave = () => {
    const e = {};
    if (!form.name?.trim()) e.name = true;
    if (!form.category) e.category = true;
    if (!imgB64) e.img = true;
    if (!form.ruhsatEslesti) e.ruhsat = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    setVerifyStep(true);
  };

  const doSave = useCallback(async () => {
    if (!device) return;
    setSaving(true);
    try {
      let photoPath = null;
      if (imgB64) {
        const bytes = atob(imgB64.split(',')[1]);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: 'image/jpeg' });
        const photoRes = await fetch(`/api/service-requests/${requestId}/device-photo?deviceId=${device.id}`, {
          method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob,
        });
        if (photoRes.ok) photoPath = (await photoRes.text()).trim();
      }
      await fetchOrThrow(`/api/service-requests/${requestId}/device-log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          originalUniqueId: device.uniqueId,
          licenseVerified: form.ruhsatEslesti,
          blockerInstalled: form.blokajkiti,
          km: parseInt(form.km) || 0,
          notes: `Servis: ${servisText}`,
          photoPath,
        }),
      });
      const updated = { ...device, name: form.name, category: form.category };
      updated.attributes = { ...(device.attributes || {}), km: form.km, ruhsatEslesti: form.ruhsatEslesti, blokajkiti: form.blokajkiti, servisislemyapan: servisText, lastUpdate: Date.now() };
      await fetch(`/api/devices/${device.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      if (form.km && parseFloat(form.km) > 0) {
        await fetch(`/api/devices/${device.id}/accumulators`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: device.id, hours: 0, totalDistance: parseFloat(form.km) * 1000 }) });
      }
      setSaved(true);
      setTimeout(() => { onComplete(device.id); onClose(); }, 1200);
    } finally { setSaving(false); }
  }, [form, imgB64, device, requestId, servisText]);

  if (!device) return null;

  return (
    <Dialog
      open={open}
      fullScreen
      onClose={() => { }} // kasıtlı kapatmayı engelle
      disableEscapeKeyDown
    >
      <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
        {/* Dialog başlık */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={onClose} disabled={saving}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{device.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>---{device.uniqueId}</Typography>
          </Box>
          <Chip size="small" label={device.status === 'online' ? '● Online' : '○ Offline'}
            color={device.status === 'online' ? 'success' : 'default'} sx={{ fontSize: 10 }} />
          <IconButton size="small" onClick={onClose} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ maxWidth: 480, mx: 'auto', p: 2 }}>
          {saved ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: '#639922' }} />
              <Typography variant="h6" fontWeight={700} color="#3B6D11">Montaj kaydedildi ✓</Typography>
            </Box>
          ) : verifyStep ? (
            <IgnitionVerifyStep
              deviceId={device.id}
              saving={saving}
              onSaveComplete={doSave}
              onManualSave={doSave}
              onCancel={() => setVerifyStep(false)}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight={700}>Montaj Kaydı</Typography>

              <TextField fullWidth size="small" label="Seri No" value={device.uniqueId}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' } }} />

              <TextField fullWidth size="small" label="Plaka" value={form.name} error={!!errors.name}
                helperText={errors.name ? 'Plaka zorunlu' : ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

              <FormControl fullWidth size="small" error={!!errors.category}>
                <InputLabel>Kategori</InputLabel>
                <Select value={form.category} label="Kategori"
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {sortedCategories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Fotoğraf */}
              <Box sx={{ border: '1px dashed', borderColor: errors.img ? 'error.main' : 'divider', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                {imgPreview ? (
                  <>
                    <Box component="img" src={imgPreview} sx={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 1 }} />
                    <Button size="small" startIcon={<CameraAltIcon />} onClick={() => fileRef.current?.click()} sx={{ mt: 1 }}>
                      Değiştir
                    </Button>
                  </>
                ) : (
                  <Box onClick={() => fileRef.current?.click()} sx={{ cursor: 'pointer', py: 2 }}>
                    <CameraAltIcon sx={{ fontSize: 36, color: errors.img ? 'error.main' : 'text.disabled' }} />
                    <Typography variant="caption" display="block" color={errors.img ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
                      Ruhsatı elinizde tutarak montaj noktasını fotoğraflayın
                    </Typography>
                  </Box>
                )}
                <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleImgSelect} />
              </Box>

              <TextField fullWidth size="small" label="Güncel KM" type="number" value={form.km}
                onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))} />

              <Box sx={{ border: '1px solid', borderColor: errors.ruhsat ? 'warning.main' : 'divider', borderRadius: 1.5, p: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Plaka/Ruhsat Eşleşti mi?</Typography>
                  <Switch size="small" checked={form.ruhsatEslesti}
                    onChange={(e) => setForm((f) => ({ ...f, ruhsatEslesti: e.target.checked }))} />
                </Box>
              </Box>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Blokaj Kiti Takıldı mı?</Typography>
                  <Switch size="small" checked={form.blokajkiti}
                    onChange={(e) => setForm((f) => ({ ...f, blokajkiti: e.target.checked }))} />
                </Box>
              </Box>

              {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  {errors.ruhsat ? 'Ruhsat eşleşmesini onaylayın' : errors.img ? 'Montaj fotoğrafı zorunlu' : 'Lütfen tüm alanları doldurun'}
                </Alert>
              )}

              <Button variant="contained" size="large" onClick={handleSave} disabled={saving} sx={{ mt: 1 }}>
                Kaydet ve Kontak Doğrula →
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};


const statusLabel = (s) => ({ APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapalı' }[s] || s);
const statusColor = (s) => ({ APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default' }[s] || 'default');
const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer' }[t] || t);

// ── Ana sayfa ────────────────────────────────────────────────────────────────
const ServisJobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const devicesMap = useSelector((s) => s.devices.items);
  const user = useSelector((s) => s.session.user);
  const [request, setRequest] = useState(null);
  const [devices, setDevices] = useState([]);
  const [completedDevices, setCompletedDevices] = useState(new Set());
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // 'online'|'offline'|'done'|'pending'
  const [completing, setCompleting] = useState(false);
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [allUsers, setAllUsers] = useState({});
  const [customer, setCustomer] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [wizardDevice, setWizardDevice] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [notesArr, setNotesArr] = useState([]);
  const admin = useAdministrator();
  const servisText = `${user?.name || ''} (${user?.email || ''})${user?.phone ? ' - ' + user.phone : ''}`;

  const loadRequest = async () => {
    const logRes = await fetch(`/api/service-requests/history?serviceRequestId=${id}`);
    let historyLogs = [];
    if (logRes.ok) { historyLogs = await logRes.json(); setDeviceLogs(historyLogs); }

    const res = await fetch(`/api/service-requests/${id}`);
    if (!res.ok) return;
    const r = await res.json();
    setRequest(r);
    setNotesArr(parseNotes(r.notes));

    if (r.deviceIds && r.deviceIds !== '{}') {
      const ids = r.deviceIds.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean);
      const devList = ids.map((did) => {
        const live = devicesMap[did];
        if (live) return live;
        const log = historyLogs.find((l) => l.deviceId === did);
        const uid = log?.originalUniqueId || `ID:${did}`;
        return {
          id: did,
          name: log?.deviceName || `Araç #${did}`,
          uniqueId: uid.length > 6 ? '*'.repeat(uid.length - 6) + uid.slice(-6) : uid,
          status: 'unknown',
          permissionDenied: true,
        };
      });
      setDevices(devList);
    }

    const uRes = await fetch('/api/users?excludeAttributes=false');
    if (uRes.ok) {
      const users = await uRes.json();
      const map = Object.fromEntries(users.map((u) => [u.id, u]));
      setAllUsers(map);
      setCustomer(map[r.userId] || null);
    }
  };

  useEffectAsync(async () => { await loadRequest(); }, [id]);

  const handleComplete = useCatch(async () => {
    setCompleting(true);
    try {
      await fetchOrThrow(`/api/service-requests/${id}/complete`, { method: 'PUT' });
      setSnack({ open: true, msg: 'İş tamamlandı, onaya gönderildi!', severity: 'success' });
      setTimeout(() => navigate('/finans/servis/jobs'), 1500);
    } finally { setCompleting(false); }
  });

  const handleInvoiceUpload = useCatch(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await fetch(`/api/service-requests/${id}/invoice`, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    setSnack({ open: true, msg: 'Fatura yüklendi.', severity: 'success' });
    await loadRequest();
  });

  const handleSaveNotes = async (updatedArr) => {
    setNotesArr(updatedArr);
    try {
      await fetch(`/api/service-requests/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: serializeNotes(updatedArr) }),
      });
    } catch (e) { /* sessiz */ }
  };
  const handleWizardComplete = (deviceId) => {
    setCompletedDevices((prev) => new Set([...prev, deviceId]));
    setSnack({ open: true, msg: 'Araç kaydedildi ✓', severity: 'success' });
    loadRequest();
  };

  if (!request) return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['support', 'İş Detayı']}>
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
    </PageLayout>
  );

  const isActive = ['APPROVED', 'IN_PROGRESS'].includes(request.status);
  const allDone = devices.length > 0 && devices.every((d) =>
    completedDevices.has(d.id) || deviceLogs.some((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId)
  );

  // ── İstatistikler ──
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status !== 'online').length;
  const doneCount = devices.filter((d) =>
    completedDevices.has(d.id) || deviceLogs.some((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId)
  ).length;
  const pendingCount = devices.length - doneCount;

  // ── Filtre ──
  const toggleFilter = (f) => setActiveFilter((prev) => (prev === f ? null : f));

  const filtered = devices.filter((d) => {
    const isDone = completedDevices.has(d.id) || deviceLogs.some((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId);
    if (activeFilter === 'online' && d.status !== 'online') return false;
    if (activeFilter === 'offline' && d.status === 'online') return false;
    if (activeFilter === 'done' && !isDone) return false;
    if (activeFilter === 'pending' && isDone) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name?.toLowerCase().includes(q) || d.uniqueId?.toLowerCase().includes(q) || String(d.id).includes(q);
    }
    return true;
  });

  // ── Mini filtre kartı ──
  const FilterCard = ({ label, count, color, filter, icon }) => {
    const active = activeFilter === filter;
    return (
      <Box onClick={() => toggleFilter(filter)} sx={{
        flex: '1 1 0', minWidth: 0, px: 1, py: 0.75, borderRadius: 1.5,
        border: '1px solid', borderColor: active ? color : 'divider',
        bgcolor: active ? alpha(color, 0.1) : 'background.paper',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
        '&:hover': { borderColor: color, bgcolor: alpha(color, 0.06) },
      }}>
        <Typography variant="h6" fontWeight={800} sx={{ color: active ? color : 'text.primary', lineHeight: 1.2, fontSize: { xs: 18, sm: 20 } }}>
          {count}
        </Typography>
        <Typography variant="caption" sx={{ color: active ? color : 'text.secondary', fontSize: 10, fontWeight: active ? 700 : 400, display: 'block' }}>
          {label}
        </Typography>
      </Box>
    );
  };

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['support', `İş #${id}`]}>
      <Box sx={{ maxWidth: 640, mx: 'auto', p: { xs: 1, sm: 1.5 }, pb: 10, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

        {/* ── Başlık ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.5 }}>
          <IconButton size="small" onClick={() => navigate('/finans/servis/jobs')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {typeLabel(request.type)} — İş #{request.id}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {request.city}{request.district ? ` / ${request.district}` : ''} · {formatTime(request.createdAt, 'date')}
            </Typography>
          </Box>
          <Chip label={statusLabel(request.status)} color={statusColor(request.status)} size="small" sx={{ flexShrink: 0 }} />
        </Box>

        {/* ── Müşteri + notlar satırı — kompakt ── */}
        {(customer || request.notes || request.wixOrderId) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, bgcolor: 'action.hover', borderRadius: 1.5, flexWrap: 'wrap' }}>
            {customer && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: alpha('#1976d2', 0.15), color: '#1976d2', fontWeight: 700, flexShrink: 0 }}>
                  {customer.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" fontWeight={700} noWrap display="block">{customer.name}</Typography>
                  {customer.phone && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{customer.phone}</Typography>}
                </Box>
              </Box>
            )}
            {request.wixOrderId && (
              <Chip size="small" label={`Sipariş/Talep Id: ${request.orderItems || request.wixOrderId}`}
                sx={{ fontSize: 10, height: 20, ml: 'auto' }} />
            )}

          </Box>
        )}

        {/* ── Araçlar kartı ── */}
        {devices.length > 0 && (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: '12px !important', px: { xs: 1.5, sm: 2 } }}>

              {/* Mini filtre kartları */}
              <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
                <FilterCard label="Online" count={onlineCount} color="#2e7d32" filter="online" />
                <FilterCard label="Offline" count={offlineCount} color="#ed6c02" filter="offline" />
                <Box sx={{ width: 0.0001, bgcolor: 'divider', mx: 0.0001 }} />
                <FilterCard label="Tamamlandı" count={doneCount} color="#1976d2" filter="done" />
                <FilterCard label="Bekliyor" count={pendingCount} color="#9c27b0" filter="pending" />
              </Box>

              {/* Arama */}
              <TextField
                fullWidth size="small"
                placeholder="Plaka, IMEI veya ID ile ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 1.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { fontSize: 13 },
                }}
              />

              {/* Aktif filtre etiketi */}
              {(activeFilter || search) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">{filtered.length} araç gösteriliyor</Typography>
                  {activeFilter && (
                    <Chip size="small" label={activeFilter} onDelete={() => setActiveFilter(null)} sx={{ fontSize: 10, height: 18 }} />
                  )}
                </Box>
              )}

              {/* Araç listesi */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filtered.length === 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                    Araç bulunamadı
                  </Typography>
                )}
                {filtered.map((d) => {
                  const logs = deviceLogs.filter((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId);
                  const isDone = completedDevices.has(d.id) || logs.length > 0;
                  const lastLog = logs[logs.length - 1];
                  const LOCK_MS = 48 * 60 * 60 * 1000;
                  const locked = !admin && isDone && lastLog?.processedAt
                    && (Date.now() - new Date(lastLog.processedAt).getTime() > LOCK_MS);
                  const montajPhoto = lastLog?.photoPath;
                  const logOpen = expandedLogs.has(d.id);
                  const toggleLog = () => setExpandedLogs((prev) => {
                    const n = new Set(prev);
                    n.has(d.id) ? n.delete(d.id) : n.add(d.id);
                    return n;
                  });

                  return (
                    <Box key={d.id} sx={{
                      border: '1px solid', borderRadius: 1.5, overflow: 'hidden',
                      borderColor: isDone ? 'success.main' : d.status === 'online' ? 'info.light' : 'divider',
                    }}>
                      {/* Araç başlık */}
                      <Box sx={{
                        px: 1.25, py: 0.875,
                        bgcolor: isDone ? alpha('#2e7d32', 0.05) : 'action.hover',
                        display: 'flex', alignItems: 'center', gap: 0.75,
                      }}>
                        {/* Sol: durum ikonu */}
                        {isDone
                          ? <CheckCircleIcon sx={{ color: '#639922', fontSize: 16, flexShrink: 0 }} />
                          : <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: d.status === 'online' ? '#2e7d32' : '#bdbdbd' }} />
                        }
                        {/* İsim + IMEI */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: 13 }}>{d.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</Typography>
                        </Box>
                        {/* Sağ: buton + expand */}
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                          {isActive && (
                            <Button
                              size="small"
                              variant={isDone ? 'outlined' : 'contained'}
                              color={isDone ? 'inherit' : 'primary'}
                              startIcon={<BuildIcon sx={{ fontSize: '12px !important' }} />}
                              onClick={() => setWizardDevice(d)}
                              disabled={locked}
                              sx={{ fontSize: 10, py: 0.25, px: 0.875, minWidth: 0, whiteSpace: 'nowrap' }}
                            >
                              {isDone ? 'Ek Kayıt Ekle' : 'Başla'}
                            </Button>
                          )}
                          {logs.length > 0 && (
                            <IconButton size="small" onClick={toggleLog} sx={{ p: 0.25 }}>
                              {logOpen ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Montaj özeti — işlem varsa */}
                      {isDone && lastLog && (
                        <Box sx={{ px: 1.25, py: 0.875, display: 'flex', gap: 1, alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.25 }}>
                              <Chip size="small" label={lastLog.licenseVerified ? '✓ Ruhsat' : '— Ruhsat'}
                                color={lastLog.licenseVerified ? 'success' : 'default'} sx={{ fontSize: 9, height: 16 }} />
                              <Chip size="small" label={lastLog.blockerInstalled ? '✓ Blokaj' : '— Blokaj'}
                                color={lastLog.blockerInstalled ? 'success' : 'default'} sx={{ fontSize: 9, height: 16 }} />
                              {lastLog.km > 0 && (
                                <Chip size="small" label={`${Number(lastLog.km).toLocaleString()} km`} sx={{ fontSize: 9, height: 16 }} />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                              {formatTime(lastLog.processedAt, 'datetime')}
                              {allUsers[lastLog.processedBy] ? ` · ${allUsers[lastLog.processedBy].name}` : ''}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Detaylı log accordion */}
                      <Collapse in={logOpen}>
                        <Box sx={{ p: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
                          {logs.map((log) => (
                            <Box key={log.id} sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                              <Table size="small">
                                <TableBody>
                                  <InfoRow label="Tarih" value={formatTime(log.processedAt, 'datetime')} />
                                  {log.processedBy > 0 && allUsers[log.processedBy] && (
                                    <InfoRow label="Teknisyen" value={`${allUsers[log.processedBy].name}${allUsers[log.processedBy].phone ? ' · ' + allUsers[log.processedBy].phone : ''}`} />
                                  )}
                                  <InfoRow label="Ruhsat" value={log.licenseVerified ? '✓ Doğrulandı' : '— Yapılmadı'} />
                                  <InfoRow label="Blokaj" value={log.blockerInstalled ? '✓ Takıldı' : '— Takılmadı'} />
                                  {log.km > 0 && <InfoRow label="KM" value={`${Number(log.km).toLocaleString()} km`} />}
                                </TableBody>
                              </Table>
                              {log.photoPath && (
                                <PhotoViewer src={serviceFileUrl(id, log.photoPath.split('/').pop())} label="Montaj fotoğrafı" />
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ── Tamamla butonu ── */}
        {isActive && (
          <Button
            variant="contained" color="success" size="large" fullWidth
            startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            onClick={handleComplete}
            disabled={completing || (devices.length > 0 && !allDone)}
            sx={{ borderRadius: 2 }}
          >
            {devices.length > 0 && !allDone
              ? `${doneCount}/${devices.length} araç tamamlandı`
              : 'İşleri Tamamla → Onaya Gönder'}
          </Button>
        )}

        {/* ── Fatura ── */}
        {['COMPLETED', 'ADMIN_REVIEW', 'CLOSED'].includes(request.status) && (
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Fatura</Typography>
              {request.invoicePath ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: alpha('#2e7d32', 0.06), borderRadius: 1, border: '1px solid', borderColor: 'success.light' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} color="success.dark" noWrap>Fatura Yüklendi</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {request.invoicePath.split('/').pop()}
                    </Typography>
                  </Box>
                  <Chip size="small" label={request.invoiceStatus || 'PENDING'}
                    color={request.invoiceStatus === 'PAID' ? 'success' : 'warning'} sx={{ flexShrink: 0, fontSize: 10 }} />
                  <IconButton size="small" onClick={async () => {
                    const filename = request.invoicePath.split('/').pop();
                    const res = await fetch(serviceFileUrl(id, filename));
                    const blob = await res.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}>
                    <UploadIcon sx={{ transform: 'rotate(180deg)', fontSize: 18 }} />
                  </IconButton>
                </Box>
              ) : (
                <Button variant="outlined" component="label" fullWidth size="small" startIcon={<UploadIcon />}>
                  Fatura Yükle (PDF / Görsel)
                  <input type="file" hidden accept="image/*,application/pdf" onChange={handleInvoiceUpload} />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {request.status === 'ADMIN_REVIEW' && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>İş tamamlandı bildirimi yapıldı. Merkez onayı bekleniyor.</Alert>
        )}

        {/* ── Notlar ── */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ pb: '12px !important' }}>
            <NotesCard
              notes={notesArr}
              canAdd={isActive}
              isAdmin={false}
              currentUser={user}
              viewerRole="servis"
              forcedType="servis"
              onSave={handleSaveNotes}
              onDelete={handleSaveNotes}
            />
          </CardContent>
        </Card>

        {/* ── Servis bilgisi ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.875, borderRadius: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'action.hover' }}>
          <PersonPinIcon sx={{ color: 'text.disabled', fontSize: 18, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: 11 }}>
            {servisText}
          </Typography>
        </Box>

      </Box>

      <DeviceWizardDialog
        open={!!wizardDevice}
        device={wizardDevice}
        requestId={id}
        servisText={servisText}
        onClose={() => setWizardDevice(null)}
        onComplete={handleWizardComplete}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default ServisJobDetailPage;