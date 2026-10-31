import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Card, CardContent,
  Chip, Divider, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableRow, TableCell,
  Dialog, IconButton, Collapse, Avatar,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BuildIcon from '@mui/icons-material/Build';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { alpha } from '@mui/material/styles';
import { Autocomplete, TextField as MuiTextField } from '@mui/material';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync, useCatch } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import { serviceFileUrl } from './serviceFileUrl';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useSelector } from 'react-redux';
import DownloadIcon from '@mui/icons-material/Download';
import PhotoManagerDialog from './PhotoManagerDialog';
import { parseNotes, serializeNotes, NotesCard } from './NotesSection';
import { useAdministrator } from '../common/util/permissions';

const statusLabel = (s) => ({ PENDING: 'Bekliyor', PENDING_OWNER_REG: 'Sahip Kayıt Bekleniyor', APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapalı', CANCELLED: 'İptal' }[s] || s);
const statusColor = (s) => ({ PENDING: 'warning', PENDING_OWNER_REG: 'warning', APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default', CANCELLED: 'error' }[s] || 'default');
const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer Talepler' }[t] || t);
const typeColor = (t) => ({ MONTAJ: '#1976d2', DEVIR: '#7b1fa2', DEMONTAJ: '#ed6c02', DIGER: '#d32f2f' }[t] || '#888');

// ── Bildirim kanalı seçici ────────────────────────────────────────────────────
const CHANNELS = [
  { key: 'firebase', label: 'Uygulama', icon: PhoneAndroidIcon, color: '#ff6d00' },
  { key: 'sms', label: 'SMS', icon: SmsIcon, color: '#1565c0' },
  { key: 'email', label: 'E-posta', icon: EmailIcon, color: '#2e7d32' },
];

const NotificationChannelPicker = ({ value, onChange }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
      <NotificationsIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Bildirim Kanalları
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {CHANNELS.map(({ key, label, icon: Icon, color }) => {
        const selected = value.includes(key);
        return (
          <Chip
            key={key}
            size="small"
            icon={<Icon sx={{ fontSize: '14px !important', color: selected ? `${color} !important` : 'text.disabled' }} />}
            label={label}
            onClick={() => {
              if (selected) {
                // firebase her zaman seçili kalır
                if (key === 'firebase') return;
                onChange(value.filter((v) => v !== key));
              } else {
                onChange([...value, key]);
              }
            }}
            variant={selected ? 'filled' : 'outlined'}
            sx={{
              fontSize: 11,
              height: 26,
              cursor: key === 'firebase' ? 'default' : 'pointer',
              borderColor: selected ? color : 'divider',
              bgcolor: selected ? alpha(color, 0.1) : 'transparent',
              color: selected ? color : 'text.secondary',
              fontWeight: selected ? 700 : 400,
              transition: 'all 0.15s',
              '&:hover': key !== 'firebase' ? {
                borderColor: color,
                bgcolor: alpha(color, 0.08),
              } : {},
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        );
      })}
    </Box>
  </Box>
);

// Bilgi satırı
const InfoRow = ({ label, value, mono, bold }) => value ? (
  <TableRow>
    <TableCell sx={{ color: 'text.secondary', width: 130, py: 0.6, border: 'none', fontSize: 12 }}>{label}</TableCell>
    <TableCell sx={{ py: 0.6, border: 'none', fontSize: 12, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: bold ? 700 : 400 }}>{value}</TableCell>
  </TableRow>
) : null;

// Bölüm başlığı
const SectionTitle = ({ icon: Icon, title, color = 'primary' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(color === 'primary' ? '#1976d2' : color, 0.1) }}>
      <Icon sx={{ fontSize: 15, color }} />
    </Avatar>
    <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
  </Box>
);


// Araç için küçük ruhsat önizleme — tıklanınca tam ekran
const DevicePhotoThumb = ({ src }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box component="img" src={src}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: '2px solid', borderColor: 'success.light', flexShrink: 0, cursor: 'zoom-in', '&:hover': { borderColor: 'success.main' } }}
        title="Eşleşmiş ruhsat — büyütmek için tıklayın"
      />
      <Dialog open={open} fullScreen onClick={() => setOpen(false)}>
        <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'zoom-out' }}>
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
          <Box component="img" src={src} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </Box>
      </Dialog>
    </>
  );
};

// Fotoğraf — tıklanınca tam ekran
const PhotoViewer = ({ src, label }) => {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <Box
        component="img"
        src={src}
        alt={label}
        onClick={() => setOpen(true)}
        sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 1.5, cursor: 'zoom-in', transition: '0.2s', '&:hover': { opacity: 0.9, transform: 'scale(1.01)' } }}
      />
      {label && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>{label} — büyütmek için tıklayın</Typography>}
      <Dialog open={open} fullScreen onClick={() => setOpen(false)}>
        <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'zoom-out' }}>
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
          <Box component="img" src={src} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </Box>
      </Dialog>
    </>
  );
};


// ── Fotoğraf Eşleştirme Dialog ─────────────────────────────────────────────

const AdminRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const devicesMap = useSelector((s) => s.devices.items);
  const sessionUser = useSelector((s) => s.session.user);
  const admin = useAdministrator();
  const [request, setRequest] = useState(null);
  const [centers, setCenters] = useState([]);
  const [servisUsers, setServisUsers] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [devices, setDevices] = useState([]);
  const [serviceCenter, setServiceCenter] = useState(null);
  const [serviceTechnician, setServiceTechnician] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [allUsers, setAllUsers] = useState({});
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoRemapMap, setPhotoRemapMap] = useState({});
  const [requestFiles, setRequestFiles] = useState([]);
  const [notesArr, setNotesArr] = useState([]);
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bildirim kanalları — her işlem için ayrı state (firebase her zaman dahil)
  const [approveChannels, setApproveChannels] = useState(['firebase']);
  const [assignChannels, setAssignChannels] = useState(['firebase']);
  const [devirChannels, setDevirChannels] = useState(['firebase']);
  const [closeChannels, setCloseChannels] = useState(['firebase']);
  const [cancelChannels, setCancelChannels] = useState(['firebase']);
  const [ownerDevices, setOwnerDevices] = useState([]);
  const [permissionMap, setPermissionMap] = useState({});
  const [permissionNotify, setPermissionNotify] = useState(true);

  const loadRequest = async () => {
    const res = await fetch(`/api/service-requests/${id}`);
    if (!res.ok) return;
    const r = await res.json();
    setRequest(r);
    setNotesArr(parseNotes(r.notes));
    const filesRes = await fetch(`/api/service-requests/${id}/files`);
    if (filesRes.ok) setRequestFiles(await filesRes.json());
    setSelectedCenterId(r.serviceCenterId > 0 ? String(r.serviceCenterId) : '');
    setSelectedUserId(r.serviceUserId > 0 ? String(r.serviceUserId) : '');

    if (r.deviceIds && r.deviceIds !== '{}') {
      const ids = r.deviceIds.replace(/[{}]/g, '').split(',').filter(Boolean);
      setDevices(ids.map((did) => devicesMap[parseInt(did)]).filter(Boolean));

      const allLogs = [];
      for (const did of ids) {
        const dev = devicesMap[parseInt(did)];
        if (dev) {
          const hRes = await fetch(`/api/service-requests/history?uniqueId=${dev.uniqueId}`);
          if (hRes.ok) {
            const logs = await hRes.json();
            allLogs.push(...logs.filter((l) => String(l.serviceRequestId) === String(id)));
          }
        }
      }
      setDeviceLogs(allLogs);
    }

    if (r.serviceCenterId > 0) {
      const scRes = await fetch(`/api/service-centers/${r.serviceCenterId}`);
      if (scRes.ok) setServiceCenter(await scRes.json());
    }

    if (r.userId > 0) {
      const odRes = await fetch(`/api/devices?userId=${r.userId}`);
      if (odRes.ok) setOwnerDevices(await odRes.json());
    }
    const uRes = await fetch('/api/users?excludeAttributes=false');
    if (uRes.ok) {
      const users = await uRes.json();
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      setAllUsers(userMap);
      setCustomer(userMap[r.userId] || null);
      if (r.serviceUserId > 0) setServiceTechnician(userMap[r.serviceUserId] || null);
    }
  };

  useEffectAsync(async () => {
    const [, centersRes] = await Promise.all([loadRequest(), fetch('/api/service-centers?onlyActive=true')]);
    if (centersRes.ok) setCenters(await centersRes.json());
  }, [id]);

  useEffectAsync(async () => {
    if (!selectedCenterId || selectedCenterId === '0') { setServisUsers([]); return; }
    const res = await fetch(`/api/service-centers/${selectedCenterId}/users`);
    if (res.ok) setServisUsers(await res.json());
  }, [selectedCenterId]);

  const handleApprove = useCatch(async () => {
    setLoading(true); setError('');
    try {
      const body = request.type === 'DEVIR'
        ? { notificationChannels: devirChannels }
        : { serviceCenterId: selectedCenterId || '0', serviceUserId: selectedUserId || '', notificationChannels: approveChannels };
      await fetchOrThrow(`/api/service-requests/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSuccess('Talep onaylandı.');
      await loadRequest();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  });

  const handleAssign = useCatch(async () => {
    setLoading(true); setError('');
    try {
      await fetchOrThrow(`/api/service-requests/${id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCenterId: selectedCenterId || '0', serviceUserId: selectedUserId || '', notificationChannels: assignChannels }),
      });
      setSuccess('Servis ataması güncellendi.');
      await loadRequest();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  });

  const handleClose = useCatch(async () => {
    setLoading(true); setError('');
    try {
      await fetchOrThrow(`/api/service-requests/${id}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationChannels: closeChannels }),
      });
      navigate('/finans/admin/requests');
    } catch (e) { setError(e.message); setLoading(false); }
  });

  const handleGrantPermission = useCatch(async (deviceId) => {
    if (!request) return;
    const userId = String(request.userId);
    const deviceLog = deviceLogs
      .filter((l) => l.deviceId === deviceId)
      .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))[0];
    const serviceUserId = deviceLog?.processedBy;

    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deviceId: String(deviceId) }),
    });
    if (serviceUserId) {
      try {
        await fetchOrThrow('/api/permissions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: String(serviceUserId), deviceId: String(deviceId) }),
        });
      } catch (e) { /* zaten yoksa sorun değil */ }
    }

    setPermissionMap((prev) => ({ ...prev, [deviceId]: true }));
    setOwnerDevices((prev) => [...prev, devices.find((d) => d.id === deviceId)].filter(Boolean));

    if (permissionNotify) {
      const dev = devices.find((d) => d.id === deviceId);
      try {
        await fetch(`/api/notifications/send/firebase?userId=${userId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: '⭐️ Araç İşlemi Tamamlandı!', body: `💫 ${dev?.name || 'Aracınız'} plakalı aracınıza artık erişebilirsiniz.` }),
        });
        if (serviceUserId) {
          await fetch(`/api/notifications/send/firebase?userId=${serviceUserId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: '⭐️ Kısmi İş Tamamlandı', body: `💫 ${dev?.name || 'Araç'} için müşteri hesabına aktarıldı` }),
          });
        }
      } catch (e) { /* sessiz */ }
    }

    setSuccess('Erişim verildi' + (permissionNotify ? ' ve bildirim gönderildi' : ''));
    setTimeout(() => setSuccess(''), 3000);
  });

  const handleRevokePermission = useCatch(async (deviceId) => {
    if (!request) return;
    const userId = String(request.userId);
    await fetchOrThrow('/api/permissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, deviceId: String(deviceId) }),
    });
    setOwnerDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setPermissionMap((prev) => ({ ...prev, [deviceId]: false }));
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

  const handleCancel = useCatch(async () => {
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
    await fetchOrThrow(`/api/service-requests/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationChannels: cancelChannels }),
    });
    navigate('/finans/admin/requests');
  });

  if (!request) return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', 'Talep Detayı']}>
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
    </PageLayout>
  );

  const isDevir = request.type === 'DEVIR';
  const isDiger = request.type === 'DIGER';

  const isPending = ['PENDING', 'PENDING_OWNER_REG'].includes(request.status);
  const isClosed = ['CLOSED', 'CANCELLED'].includes(request.status);
  const isAdminReview = ['ADMIN_REVIEW'].includes(request.status);


  return (
    <>
      <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', `Talep #${id}`]}>
        <Box sx={{ maxWidth: 680, mx: 'auto', p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2, pb: 4 }}>

          {/* Başlık */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} color="inherit">Geri</Button>
            <Box sx={{ flex: 1 }} />
            <Chip label={typeLabel(request.type)} size="large" variant="outlined"
              sx={{ mr: 0.5, color: typeColor(request.type), borderColor: typeColor(request.type) }} />
            <Chip label={statusLabel(request.status)} color={statusColor(request.status)} size="large" />
          </Box>

          {/* ── Talep özeti ── */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(typeColor(request.type), 0.12) }}>
                  <Box sx={{ color: typeColor(request.type) }}>
                    {isDevir ? <SwapHorizIcon sx={{ fontSize: 20 }} /> : <BuildIcon sx={{ fontSize: 20 }} />}
                  </Box>
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Talep #{request.id}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {request.city}{request.district ? ` / ${request.district}` : ''} · {formatTime(request.createdAt, 'date')}
                  </Typography>
                </Box>
              </Box>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Müşteri ID" value={customer ? null : String(request.userId)} />
                  {request.completedAt && <InfoRow label="Tamamlanma" value={formatTime(request.completedAt, 'datetime')} />}
                  {request.closedAt && <InfoRow label="Kapatılma" value={formatTime(request.closedAt, 'date')} />}

                  {request.wixOrderId && <InfoRow label="Sipariş" value={request.orderItems || request.wixOrderId} />}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ── Notlar ── */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <NotesCard
                notes={notesArr}
                canAdd
                isAdmin
                currentUser={sessionUser || { id: 0, name: 'Admin' }}
                viewerRole="admin"
                onSave={handleSaveNotes}
                onDelete={handleSaveNotes}
              />
            </CardContent>
          </Card>

          {/* ── Müşteri bilgileri ── */}
          {customer && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <SectionTitle icon={PersonIcon} title="Müşteri Bilgileri" color="#1976d2" />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#1976d2', 0.12), fontWeight: 700, color: '#1976d2' }}>
                    {customer.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>{customer.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                        </Box>
                      )}
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <BadgeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{customer.email}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ── Araç bilgileri ── */}
          {devices.length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <SectionTitle icon={DirectionsCarIcon} title={`Araçlar (${devices.length})`} />
                  <Button size="small" variant="outlined" startIcon={<BadgeIcon />}
                    onClick={() => setPhotoManagerOpen(true)} sx={{ fontSize: 10 }}>
                    Fotoğraf Eşleştir
                  </Button>
                </Box>
                {devices.map((d) => {
                  const logs = deviceLogs.filter((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId);
                  const isExpanded = expandedDevice === d.id;
                  const hasLog = logs.length > 0;
                  return (
                    <Box key={d.id} sx={{ mb: 1.5, border: '1px solid', borderColor: hasLog ? 'success.light' : 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                      <Box sx={{ px: 1.5, py: 1, bgcolor: hasLog ? alpha('#2e7d32', 0.05) : 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={700}>{d.name}</Typography>

                            <Chip size="small"
                              label={d.status === 'online' ? '● Online' : '○ Offline'}
                              color={d.status === 'online' ? 'success' : 'default'}
                              variant={d.status === 'online' ? 'filled' : 'outlined'}
                              sx={{ fontSize: 10, height: 18 }}
                            />
                            {hasLog && <Chip size="small" label="İşlem kaydı var" color="success" sx={{ fontSize: 10, height: 18 }} />}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</Typography>
                          {admin && <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>M2M Data: {`${d?.phone}`.startsWith('0') ? d?.phone : `0${d?.phone}`}</Typography>
                          }
                        </Box>
                        {/* Araç için eşleşmiş ruhsat fotoğrafı — tıklanınca tam ekran */}
                        {(() => {
                          const matched = requestFiles.find(f =>
                            f.filename.includes(d.uniqueId) && f.filename.includes('_ruhsat')
                          );
                          if (!matched) return null;
                          return <DevicePhotoThumb src={serviceFileUrl(request.id, matched.filename)} />;
                        })()}
                        <IconButton size="small" onClick={() => setExpandedDevice(isExpanded ? null : d.id)}>
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                      <Collapse in={isExpanded}>
                        <Box sx={{ p: 1.5 }}>
                          {logs.length === 0 ? (
                            <Typography variant="caption" color="text.secondary">Henüz işlem kaydı girilmemiş.</Typography>
                          ) : logs.map((log) => (
                            <Box key={log.id} sx={{ mb: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                              <Table size="small">
                                <TableBody>
                                  <InfoRow label="Tarih" value={formatTime(log.processedAt, 'datetime')} />
                                  {log.processedBy > 0 && allUsers[log.processedBy] && (
                                    <InfoRow label="Teknisyen"
                                      value={`${allUsers[log.processedBy].name}${allUsers[log.processedBy].phone ? ' · ' + allUsers[log.processedBy].phone : ''}`}
                                      bold />
                                  )}
                                  <InfoRow label="Ruhsat" value={log.licenseVerified ? '✓ Doğrulandı' : '— Yapılmadı'} />
                                  <InfoRow label="Blokaj" value={log.blockerInstalled ? '✓ Takıldı' : '— Takılmadı'} />
                                  {log.km > 0 && <InfoRow label="KM" value={`${Number(log.km).toLocaleString()} km`} />}
                                  {log.notes && <InfoRow label="Not" value={log.notes} />}
                                </TableBody>
                              </Table>
                              {log.photoPath && (
                                <Box sx={{ mt: 1 }}>
                                  <PhotoViewer src={serviceFileUrl(request.id, log.photoPath)} label="Montaj fotoğrafı" />
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── Müşteri belgesi — tek araç varsa göster, birden fazlaysa araç önizlemesinden erişilir ── */}
          {devices.length <= 1 && (() => {
            const ruhsatFiles = requestFiles.filter(f =>
              f.filename.includes('_ruhsat') && !f.filename.includes('_montaj_')
            );
            if (!ruhsatFiles.length) return null;
            return (
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionTitle icon={BadgeIcon} title="Müşteri Belgesi" />
                  {ruhsatFiles.map((rf, idx) => (
                    <Box key={idx} sx={{ mb: idx < ruhsatFiles.length - 1 ? 1 : 0 }}>
                      <PhotoViewer src={serviceFileUrl(request.id, rf.filename)} label="Ruhsat" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* ── Sipariş bazlı cihaz eşleştirme ── */}
          {request.wixOrderId && !request.deviceIds?.replace(/[{}]/g, '').trim() && !isClosed && (
            <Card variant="outlined" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'warning.light' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <SectionTitle icon={DirectionsCarIcon} title="Cihaz Eşleştirme" color="#ed6c02" />
                <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }}>
                  Sipariş bazlı talep — cihazları fotoğraflarla eşleştirin, ardından servis atayın.
                </Alert>
                {(() => {
                  const slots = requestFiles
                    .filter(f => f.filename.match(/_(slot_\d+)_ruhsat/))
                    .map(f => {
                      const m = f.filename.match(/_(slot_\d+)_ruhsat/);
                      return { key: m[1], filename: f.filename };
                    });
                  if (slots.length === 0) {
                    return <Typography variant="caption" color="text.secondary">Henüz fotoğraf yüklenmemiş.</Typography>;
                  }
                  return slots.map(({ key, filename }) => (
                    <Box key={key} sx={{ mb: 1.5, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" fontWeight={700}>{key.replace('_', ' ').toUpperCase()}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{filename}</Typography>
                      </Box>
                      <PhotoViewer src={serviceFileUrl(request.id, filename)} label={`${key.replace('_', ' ').toUpperCase()} ruhsat`} />
                      <Autocomplete
                        size="small"
                        sx={{ mt: 1 }}
                        options={Object.values(devicesMap)}
                        getOptionLabel={(d) => `${d.name} — ${d.uniqueId}`}
                        value={devicesMap[photoRemapMap[key]] || null}
                        onChange={(_, val) => setPhotoRemapMap((prev) => ({ ...prev, [key]: val?.id || '' }))}
                        renderInput={(params) => <MuiTextField {...params} label="Cihaz Seç" size="small" />}
                        renderOption={(props, d) => (
                          <li {...props} key={d.id}>
                            <Box>
                              <Typography variant="body2">{d.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{d.uniqueId}</Typography>
                            </Box>
                          </li>
                        )}
                        noOptionsText="Cihaz bulunamadı"
                      />
                    </Box>
                  ));
                })()}
                {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}
                <Button
                  fullWidth variant="contained" color="warning"
                  disabled={loading || Object.keys(photoRemapMap).length === 0}
                  onClick={async () => {
                    setLoading(true); setError('');
                    try {
                      const remapBody = {};
                      for (const [slotKey, deviceId] of Object.entries(photoRemapMap)) {
                        const dev = devicesMap[deviceId];
                        if (!dev) continue;
                        let oldFilename = null;
                        const matchFile = requestFiles.find(f => f.filename.includes(slotKey));
                        if (matchFile) oldFilename = matchFile.filename;
                        if (oldFilename) remapBody[slotKey] = { oldFilename, deviceUniqueId: dev.uniqueId };
                      }
                      await fetchOrThrow(`/api/service-requests/${id}/remap-photos`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(remapBody),
                      });
                      const deviceIdList = Object.values(photoRemapMap).filter(Boolean);
                      await fetchOrThrow(`/api/service-requests/${id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...request, deviceIds: `{${deviceIdList.join(',')}}` }),
                      });
                      setSuccess('Cihazlar eşleştirildi.');
                      setPhotoRemapMap({});
                      await loadRequest();
                    } catch (e) { setError(e.message); }
                    finally { setLoading(false); }
                  }}
                >
                  Eşleştir ve Kaydet
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Devir bilgileri ── */}
          {isDevir && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <SectionTitle icon={PersonIcon} title="Devir Bilgileri" color="#7b1fa2" />
                {(() => {
                  const registeredUser = request.newOwnerUserId > 0 ? allUsers[request.newOwnerUserId] : null;
                  const nameMismatch = registeredUser && request.newOwnerName &&
                    registeredUser.name?.toLowerCase().trim() !== request.newOwnerName?.toLowerCase().trim();
                  const phoneMismatch = registeredUser && request.newOwnerPhone &&
                    registeredUser.phone?.replace(/\s/g, '') !== request.newOwnerPhone?.replace(/\s/g, '');
                  return (
                    <>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', width: 130, py: 0.6, border: 'none', fontSize: 12 }}>Talepteki Ad</TableCell>
                            <TableCell sx={{ py: 0.6, border: 'none', fontSize: 12, fontWeight: 700 }}>{request.newOwnerName}</TableCell>
                          </TableRow>
                          {registeredUser && (
                            <TableRow>
                              <TableCell sx={{ color: 'text.secondary', width: 130, py: 0.6, border: 'none', fontSize: 12 }}>Sistemdeki Ad</TableCell>
                              <TableCell sx={{ py: 0.6, border: 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontSize: 12, fontWeight: nameMismatch ? 700 : 400, color: nameMismatch ? 'warning.dark' : 'inherit' }}>
                                  {registeredUser.name}
                                </Typography>
                                {nameMismatch
                                  ? <Chip size="small" label="Uyuşmuyor" color="warning" sx={{ fontSize: 9, height: 16 }} />
                                  : <Chip size="small" label="✓" color="success" sx={{ fontSize: 9, height: 16 }} />}
                              </TableCell>
                            </TableRow>
                          )}
                          <InfoRow label="E-posta" value={request.newOwnerEmail} />
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', width: 130, py: 0.6, border: 'none', fontSize: 12 }}>Talepteki Tel</TableCell>
                            <TableCell sx={{ py: 0.6, border: 'none', fontSize: 12, fontWeight: 700 }}>{request.newOwnerPhone || '—'}</TableCell>
                          </TableRow>
                          {registeredUser && (
                            <TableRow>
                              <TableCell sx={{ color: 'text.secondary', width: 130, py: 0.6, border: 'none', fontSize: 12 }}>Sistemdeki Tel</TableCell>
                              <TableCell sx={{ py: 0.6, border: 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontSize: 12, fontWeight: phoneMismatch ? 700 : 400, color: phoneMismatch ? 'warning.dark' : 'inherit' }}>
                                  {registeredUser.phone || '—'}
                                </Typography>
                                {request.newOwnerPhone && (phoneMismatch
                                  ? <Chip size="small" label="Uyuşmuyor" color="warning" sx={{ fontSize: 9, height: 16 }} />
                                  : <Chip size="small" label="✓" color="success" sx={{ fontSize: 9, height: 16 }} />)}
                              </TableCell>
                            </TableRow>
                          )}
                          {request.newDeviceName && (
                            <TableRow>
                              <TableCell sx={{ color: 'text.secondary', width: 130, py: 0.6, border: 'none', fontSize: 12 }}>Yeni Plaka</TableCell>
                              <TableCell sx={{ py: 0.6, border: 'none' }}>
                                <Chip label={request.newDeviceName} size="small" color="warning"
                                  icon={<DirectionsCarIcon sx={{ fontSize: '14px !important' }} />}
                                  sx={{ fontWeight: 700, fontSize: 12 }} />
                              </TableCell>
                            </TableRow>
                          )}
                          <InfoRow label="Kayıt Durumu" value={request.newOwnerUserId > 0 ? '✓ Uygulamaya kayıtlı' : '⚠ Kayıt bekleniyor'} />
                        </TableBody>
                      </Table>
                      {(nameMismatch || phoneMismatch) && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          Talepteki bilgiler ile sistemdeki kullanıcı bilgileri uyuşmuyor.
                          {nameMismatch && ' Ad farklı.'}{phoneMismatch && ' Telefon farklı.'}
                          {' '}Onaylamadan önce doğrulayın.
                        </Alert>
                      )}
                      {request.newOwnerUserId === 0 && (
                        <Alert severity="warning" sx={{ mt: 1 }}>Yeni sahip henüz uygulamaya kayıt olmadı</Alert>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* ── Atanan servis + teknisyen ── */}
          {(serviceCenter || serviceTechnician) && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <SectionTitle icon={LocationOnIcon} title="Atanan Servis" color="#2e7d32" />
                {serviceCenter && (
                  <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, mb: serviceTechnician ? 1.5 : 0 }}>
                    <Typography variant="body2" fontWeight={700}>{serviceCenter.name}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <LocationOnIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">
                          {serviceCenter.city}{serviceCenter.district ? ` / ${serviceCenter.district}` : ''}
                        </Typography>
                      </Box>
                      {serviceCenter.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{serviceCenter.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                    {serviceCenter.address && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>{serviceCenter.address}</Typography>
                    )}
                  </Box>
                )}
                {serviceTechnician && (
                  <Box sx={{ p: 1, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="info.dark" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                      İşlem Yapan Teknisyen
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'info.main', fontSize: 13 }}>
                        {serviceTechnician.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{serviceTechnician.name}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {serviceTechnician.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <PhoneIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.secondary">{serviceTechnician.phone}</Typography>
                            </Box>
                          )}
                          {serviceTechnician.email && (
                            <Typography variant="caption" color="text.secondary">{serviceTechnician.email}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Fatura ── */}
          {/* ── Fatura ── */}
          {request.invoicePath && (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#2e7d32', 0.1) }}>
                  <ReceiptIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={700}>Fatura Yüklendi</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {request.invoicePath.split('/').pop()}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={request.invoiceStatus || 'PENDING'}
                  color={request.invoiceStatus === 'PAID' ? 'success' : 'warning'}
                />
                <IconButton
                  size="small"
                  title="Faturayı indir"
                  sx={{ color: 'text.secondary', '&:hover': { color: '#2e7d32' } }}
                  onClick={async () => {
                    const filename = request.invoicePath.split('/').pop();
                    const res = await fetch(serviceFileUrl(request.id, filename));
                    const blob = await res.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          )}

          {/* ── Kısmi tamamlama — müşteri permission yönetimi ── */}
          {!isClosed && request.userId > 0 && devices.length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1, gap: 0.75 }}>
                  <PhoneAndroidIcon sx={{ fontSize: 14, color: permissionNotify ? '#ff6d00' : 'text.disabled' }} />
                  <Typography variant="caption" sx={{ fontSize: 11, color: permissionNotify ? 'text.primary' : 'text.secondary' }}>Bildirim</Typography>
                  <Box onClick={() => setPermissionNotify((v) => !v)} sx={{ width: 32, height: 18, borderRadius: 9, cursor: 'pointer', position: 'relative', bgcolor: permissionNotify ? '#ff6d00' : 'action.disabledBackground', transition: 'background 0.2s' }}>
                    <Box sx={{ position: 'absolute', top: 2, left: permissionNotify ? 14 : 2, width: 14, height: 14, borderRadius: '50%', bgcolor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </Box>
                </Box>
                <SectionTitle icon={CheckCircleIcon} title="Kısmi Tamamlama — Cihaz Erişimi(Talep Kullanıcısı)" color="#1976d2" />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Servis işini tamamlanan araçları müşteriye erken açabilirsiniz.
                </Typography>
                {devices.map((d) => {
                  const logs = deviceLogs.filter((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId);
                  const hasLog = logs.length > 0;
                  const alreadyOwned = ownerDevices.some((od) => od.id === d.id);
                  const granted = permissionMap[d.id] || alreadyOwned;
                  return (
                    <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{d?.name}</Typography>
                        {admin && <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>M2M Data: {`${d?.phone}`.startsWith('0') ? d?.phone : `0${d?.phone}`}</Typography>
                        }
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                          <Chip size="small" label={d.status === 'online' ? '● Online' : '○ Offline'}
                            color={d.status === 'online' ? 'success' : 'default'} sx={{ fontSize: 9, height: 16 }} />
                          {hasLog && <Chip size="small" label="İşlem kaydı var" color="success" sx={{ fontSize: 9, height: 16 }} />}
                          {alreadyOwned && <Chip size="small" label="Müşteride mevcut" color="info" sx={{ fontSize: 9, height: 16 }} />}
                        </Box>
                      </Box>
                      {granted ? (
                        <Button size="small" variant="outlined" color="error" sx={{ fontSize: 10, whiteSpace: 'nowrap' }}
                          onClick={() => handleRevokePermission(d.id)}>Erişimi Kaldır</Button>
                      ) : (
                        <Button size="small" variant="contained" color="info" sx={{ fontSize: 10, whiteSpace: 'nowrap' }}
                          disabled={!hasLog} onClick={() => handleGrantPermission(d.id)}
                          title={!hasLog ? 'Önce servisin işlem kaydı girmesi lazım' : ''}>Erişim Ver</Button>
                      )}
                    </Box>
                  );
                })}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  * Erişim Ver butonu Servisden Cihazı kaldırır
                </Typography>
                {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
              </CardContent>
            </Card>
          )}

          {/* ── Admin işlem paneli ── */}
          {!isClosed && (
            <Card variant="outlined" sx={{ borderRadius: 2, border: '1px solid', borderColor: isPending ? 'warning.light' : 'divider' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {isDevir ? 'Devir Onayı' : isPending ? 'Servis Ata ve Onayla' : 'Servis Güncelle'}
                </Typography>

                {isDevir ? (
                  request.newOwnerUserId === 0 ? (
                    <Alert severity="warning">Onaylamak için yeni sahibin uygulamaya kayıt olması gerekiyor.</Alert>
                  ) : isPending ? (
                    <>
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        Onaylandığında araç yeni sahibine otomatik aktarılacak. Servis ataması gerekmez.
                      </Alert>
                      {/* Devir onayı bildirim seçici */}
                      <NotificationChannelPicker value={devirChannels} onChange={setDevirChannels} />
                      {error && <Alert severity="error">{error}</Alert>}
                      {success && <Alert severity="success">{success}</Alert>}
                      <Button fullWidth variant="contained" color="success" size="large"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                        onClick={handleApprove} disabled={loading}>
                        Devri Onayla → ADMIN_REVIEW'a Al
                      </Button>
                    </>
                  ) : null
                ) : (
                  <>
                    <FormControl fullWidth size="small">
                      <InputLabel>Servis Merkezi</InputLabel>
                      <Select value={selectedCenterId} label="Servis Merkezi"
                        onChange={(e) => { setSelectedCenterId(e.target.value); setSelectedUserId(''); }}>
                        <MenuItem value=""><em>Seçiniz</em></MenuItem>
                        {centers.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name} — {c.city}</MenuItem>)}
                      </Select>
                    </FormControl>

                    {servisUsers.length > 0 && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Teknisyen (opsiyonel)</InputLabel>
                        <Select value={selectedUserId} label="Teknisyen (opsiyonel)"
                          onChange={(e) => setSelectedUserId(e.target.value)}>
                          <MenuItem value=""><em>Merkeze genel</em></MenuItem>
                          {servisUsers.map((u) => (
                            <MenuItem key={u.id} value={String(u.id)}>
                              {u.name} {u.phone ? `· ${u.phone}` : ''} ({u.email})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {/* Onayla / Güncelle bildirim seçici */}
                    <NotificationChannelPicker
                      value={isPending ? approveChannels : assignChannels}
                      onChange={isPending ? setApproveChannels : setAssignChannels}
                    />
                    {isDiger && !isAdminReview &&
                      <>
                        <Alert severity="info" sx={{ py: 0.5 }}>
                          Diğer Talepler, Onaylandığında doğrudan admin Reviewe alınır.
                        </Alert>
                        {/* Devir onayı bildirim seçici */}
                        <NotificationChannelPicker value={devirChannels} onChange={setDevirChannels} />
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}
                        <Button fullWidth variant="contained" color="success" size="small"
                          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                          onClick={handleApprove} disabled={loading}>
                          Onayla → ADMIN_REVIEW'a Al- Servisten iş Geri Çekilir.
                        </Button>
                      </>
                    }
                    {error && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">{success}</Alert>}

                    {isPending && !isDiger ? (
                      <Button fullWidth variant="contained" color="success" size="large"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                        onClick={handleApprove} disabled={loading || !selectedCenterId}>
                        Onayla ve Servise Ata
                      </Button>
                    ) : (
                      <Button fullWidth variant="outlined" startIcon={<SwapHorizIcon />}
                        onClick={handleAssign} disabled={loading}>
                        Servis Atamasını Güncelle
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Final onayı ── */}
          {request.status === 'ADMIN_REVIEW' && (
            <Card variant="outlined" sx={{ borderRadius: 2, border: '2px solid', borderColor: 'warning.main' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="subtitle1" fontWeight={700}>Final Onayı Bekliyor</Typography>
                </Box>
                <Alert severity="info" sx={{ py: 0.5 }}>
                  {isDevir
                    ? 'Onaylandığında araç yeni sahibine aktarılacak, eski kayıt arşivlenecek.'
                    : 'Onaylandığında servis kaydı kapatılacak ve cihaz işlemleri yapılacak.'}
                  {' '}Cihazın online/offline olması engel değil.
                </Alert>
                {/* Kapatma bildirim seçici */}
                <NotificationChannelPicker value={closeChannels} onChange={setCloseChannels} />
                {error && <Alert severity="error">{error}</Alert>}
                <Button fullWidth variant="contained" color="success" size="large"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                  onClick={handleClose} disabled={loading}>
                  {isDevir ? 'Devri Tamamla ve Kapat' : 'Onayla ve Kapat'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Alt butonlar — iptal */}
          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {!isClosed && (
              <>
                {/* İptal bildirimi seçici */}
                <NotificationChannelPicker value={cancelChannels} onChange={setCancelChannels} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button fullWidth variant="outlined" color="inherit" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Geri</Button>
                  <Button fullWidth variant="outlined" color="error" startIcon={<CloseIcon />} onClick={handleCancel}>
                    İptal Et
                  </Button>
                </Box>
              </>
            )}
            {isClosed && (
              <Button fullWidth variant="outlined" color="inherit" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Geri</Button>
            )}
          </Box>

        </Box>
      </PageLayout>

      <PhotoManagerDialog
        open={photoManagerOpen}
        onClose={() => setPhotoManagerOpen(false)}
        request={request}
        devices={devices}
        deviceLogs={deviceLogs}
        onRefresh={loadRequest}
      />
    </>
  );
};

export default AdminRequestDetailPage;