import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, Box, Button, Typography, IconButton,
  Chip, CircularProgress, Alert, Divider, Avatar,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ImageIcon from '@mui/icons-material/Image';
import { alpha } from '@mui/material/styles';
import { serviceFileUrl } from './serviceFileUrl';
import fetchOrThrow from '../common/util/fetchOrThrow';

// ── Yardımcı ─────────────────────────────────────────────────────────────────
const TARGET_SIZE = 2 * 1024 * 1024;

async function compressImage(file) {
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
        ctx.drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL('image/jpeg', q);
        const sz = Math.round((data.length * 3) / 4);
        if (sz <= TARGET_SIZE || w <= 400 || q <= 0.1) {
          URL.revokeObjectURL(url);
          resolve(data);
          return;
        }
        if (sz > TARGET_SIZE * 2) { w = Math.round(w * 0.8); h = Math.round(h * 0.8); }
        else { q -= 0.1; }
        attempt();
      };
      attempt();
    };
    img.src = url;
  });
}

function b64ToBlob(b64) {
  const bytes = atob(b64.split(',')[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: 'image/jpeg' });
}

// Dosya adından türünü tahmin et
function fileRole(filename) {
  if (filename.includes('_montaj_')) return 'montaj';
  if (filename.includes('_fatura')) return 'fatura';
  if (filename.includes('_ruhsat')) return 'ruhsat';
  if (filename.includes('_unmatched_')) return 'unmatched';
  if (filename.includes('_extra_')) return 'extra';
  return 'other';
}

function roleLabel(role) {
  return { montaj: 'Montaj', fatura: 'Fatura', ruhsat: 'Ruhsat', unmatched: 'Eşleşmemiş', extra: 'Ek Belge', other: 'Dosya' }[role] || role;
}

function roleColor(role) {
  return { montaj: '#1976d2', fatura: '#2e7d32', ruhsat: '#6a1b9a', unmatched: '#e65100', extra: '#00695c', other: '#555' }[role] || '#555';
}

// ── Fotoğraf önizleme — tıklanınca tam ekran ─────────────────────────────────
const PhotoPreview = ({ src, filename, height = 100 }) => {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <Box component="img" src={src} alt={filename}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        sx={{ width: '100%', height, objectFit: 'cover', borderRadius: 1, cursor: 'zoom-in', display: 'block' }}
      />
      <Dialog open={open} fullScreen onClick={() => setOpen(false)}>
        <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', position: 'relative' }}>
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
          <Box component="img" src={src} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </Box>
      </Dialog>
    </>
  );
};

// ── Ana komponent ─────────────────────────────────────────────────────────────
/**
 * PhotoManagerDialog
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   request       — service request object { id, userId, ... }
 *   devices       — array of device objects { id, name, uniqueId, status }
 *   deviceLogs    — array of device log objects { deviceId, originalUniqueId, photoPath }
 *   onRefresh     — () => void — parent'ı yenile
 */
const PhotoManagerDialog = ({ open, onClose, request, devices, deviceLogs, onRefresh }) => {
  const [allFiles, setAllFiles] = useState([]);   // klasördeki tüm dosyalar
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // filename
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // eşleştirme için seçili dosya
  const [assignTarget, setAssignTarget] = useState(null); // hangi cihaza eşleştirilecek

  // Her cihazın eşleşmiş ruhsatı — dosya sisteminden hesapla (DB kolonu yok)
  const devicePhotoMap = React.useMemo(() => {
    const map = {};
    devices.forEach(d => {
      const match = allFiles.find(f =>
        f.filename.includes(d.uniqueId) && f.filename.includes('_ruhsat')
      );
      if (match) map[d.id] = match.filename;
    });
    return map;
  }, [allFiles, devices]);

  // Klasör dosyalarını yükle
  const loadFiles = useCallback(async () => {
    if (!request?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/service-requests/${request.id}/files`);
      if (res.ok) setAllFiles(await res.json());
    } catch (e) {
      setError('Dosyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [request?.id]);

  useEffect(() => {
    if (open) {
      loadFiles();
      setError('');
      setSuccess('');
      setSelectedFile(null);
      setAssignTarget(null);
    }
  }, [open, loadFiles]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Dosya sil
  const handleDelete = async (filename) => {
    if (!window.confirm(`"${filename}" silinsin mi? Bu işlem geri alınamaz.`)) return;
    setActionLoading(filename);
    setError('');
    try {
      await fetchOrThrow(`/api/service-requests/${request.id}/files/${filename}`, { method: 'DELETE' });
      showSuccess(`${filename} silindi`);
      await loadFiles();
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Ruhsat olarak ata (eşleştir)
  const handleAssign = async (filename, device) => {
    setActionLoading(filename);
    setError('');
    try {
      await fetchOrThrow(`/api/service-requests/${request.id}/remap-photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assign: { oldFilename: filename, deviceUniqueId: device.uniqueId } }),
      });
      showSuccess(`${filename} → ${device.name} eşleştirildi`);
      setSelectedFile(null);
      setAssignTarget(null);
      await loadFiles();
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Eşleşmeyi kaldır (unmatched'a taşı)
  const handleUnassign = async (filename, device) => {
    setActionLoading(filename);
    setError('');
    try {
      // remap-photos ile unmatched adına rename
      const ts = Date.now();
      const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg';
      const unmatchedName = `user_${request.userId}_unmatched_${ts}.${ext}`;
      await fetchOrThrow(`/api/service-requests/${request.id}/remap-photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unassign: { oldFilename: filename, newFilename: unmatchedName } }),
      });
      showSuccess(`${device.name} eşleşmesi kaldırıldı`);
      await loadFiles();
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Yeni fotoğraf yükle
  const handleUpload = async (file, device) => {
    setActionLoading('upload_' + (device?.id || 'extra'));
    setError('');
    try {
      const b64 = await compressImage(file);
      const blob = b64ToBlob(b64);
      const params = device
        ? `photoType=license&deviceUniqueId=${device.uniqueId}`
        : `photoType=extra`;
      await fetch(`/api/service-requests/${request.id}/photos?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      showSuccess(device ? `${device.name} için ruhsat yüklendi` : 'Ek belge yüklendi');
      await loadFiles();
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Dosyayı extra'dan license'a (veya tersi) taşı — db güncelleme
  const handleMoveToLicense = async (filename, device) => {
    if (!device) {
      setAssignTarget(null);
      setSelectedFile(filename);
      return;
    }
    await handleAssign(filename, device);
  };

  // Kategorize dosyalar
  const montajFiles = allFiles.filter(f => fileRole(f.filename) === 'montaj');
  const faturaFiles = allFiles.filter(f => fileRole(f.filename) === 'fatura');
  const ruhsatFiles = allFiles.filter(f => fileRole(f.filename) === 'ruhsat' || fileRole(f.filename) === 'unmatched');
  const extraFiles = allFiles.filter(f => fileRole(f.filename) === 'extra');
  const otherFiles = allFiles.filter(f => fileRole(f.filename) === 'other');

  const isLoading = (fn) => actionLoading === fn;
  const reqId = request?.id;

  // Seçili dosya için eşleştirme paneli
  const renderAssignPanel = () => {
    if (!selectedFile) return null;
    return (
      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '2px solid', borderColor: 'primary.main', p: 2, zIndex: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
            "{selectedFile}" hangi araca eşleştirilsin?
          </Typography>
          <IconButton size="small" onClick={() => setSelectedFile(null)}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {devices.map(d => (
            <Button key={d.id} variant="outlined" size="small" fullWidth
              sx={{ justifyContent: 'flex-start', gap: 1 }}
              disabled={isLoading(selectedFile)}
              onClick={() => handleAssign(selectedFile, d)}>
              <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{d.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</Typography>
              </Box>
              {devicePhotoMap[d.id] && (
                <Chip size="small" label="Mevcut var" color="warning" sx={{ fontSize: 9, height: 16 }} />
              )}
              {isLoading(selectedFile) && <CircularProgress size={14} />}
            </Button>
          ))}
        </Box>
      </Box>
    );
  };

  // Dosya kartı
  const FileCard = ({ file, actions }) => {
    const role = fileRole(file.filename);
    const color = roleColor(role);
    const src = serviceFileUrl(reqId, file.filename);
    const busy = isLoading(file.filename);

    return (
      <Box sx={{
        border: '1px solid', borderColor: selectedFile === file.filename ? 'primary.main' : 'divider',
        borderRadius: 1.5, overflow: 'hidden', bgcolor: 'background.paper',
        outline: selectedFile === file.filename ? '2px solid' : 'none',
        outlineColor: 'primary.main',
      }}>
        {/* Fotoğraf */}
        <Box sx={{ position: 'relative' }}>
          <PhotoPreview src={src} filename={file.filename} height={110} />
          <Chip size="small" label={roleLabel(role)}
            sx={{ position: 'absolute', top: 4, left: 4, fontSize: 9, height: 18, bgcolor: alpha(color, 0.9), color: 'white', fontWeight: 700 }}
          />
          {busy && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} sx={{ color: 'white' }} />
            </Box>
          )}
        </Box>
        {/* Dosya adı */}
        <Box sx={{ px: 0.75, py: 0.5 }}>
          <Typography variant="caption" noWrap display="block" sx={{ fontSize: 9, color: 'text.secondary' }}>
            {file.filename}
          </Typography>
        </Box>
        {/* Aksiyonlar */}
        <Box sx={{ px: 0.75, pb: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {actions}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

        {/* Header */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={onClose}><ArrowBackIcon fontSize="small" /></IconButton>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
            Fotoğraf Yöneticisi — Talep #{reqId}
          </Typography>
          <Typography variant="caption" color="text.secondary">{allFiles.length} dosya</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* İçerik */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: selectedFile ? 20 : 2 }}>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 1.5 }}>{success}</Alert>}

          {/* ── Araç Ruhsatları ── */}
          {devices.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6a1b9a' }} />
                Araç Ruhsatları
              </Typography>

              {devices.map(d => {
                const matchedFilename = devicePhotoMap[d.id];
                const montajLog = deviceLogs.find(l => l.deviceId === d.id || l.originalUniqueId === d.uniqueId);
                const montajPhoto = montajLog?.photoPath;

                return (
                  <Box key={d.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'visible' }}>
                    {/* Araç başlık */}
                    <Box sx={{ px: 1.5, py: 1, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}>{d.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</Typography>
                      </Box>
                      <Chip size="small" label={d.status === 'online' ? '● Online' : '○ Offline'}
                        color={d.status === 'online' ? 'success' : 'default'} sx={{ fontSize: 9, height: 16 }} />
                      {matchedFilename && (
                        <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                          label="Ruhsat eşli" color="success" sx={{ fontSize: 9, height: 16 }} />
                      )}
                    </Box>

                    <Box sx={{ p: 1.5, display: 'flex', gap: 1.5 }}>
                      {/* Montaj fotoğrafı */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block"
                          sx={{ mb: 0.5, textTransform: 'uppercase', fontSize: 10 }}>Montaj</Typography>
                        {montajPhoto ? (
                          <PhotoPreview src={serviceFileUrl(reqId, montajPhoto.split('/').pop())} filename="montaj" height={90} />
                        ) : (
                          <Box sx={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.disabled">Yok</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Ruhsat fotoğrafı */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block"
                          sx={{ mb: 0.5, textTransform: 'uppercase', fontSize: 10 }}>Ruhsat</Typography>
                        {matchedFilename ? (
                          <PhotoPreview src={serviceFileUrl(reqId, matchedFilename)} filename="ruhsat" height={90} />
                        ) : (
                          <Box sx={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'warning.50', border: '1px dashed', borderColor: 'warning.main', borderRadius: 1 }}>
                            <Typography variant="caption" color="warning.dark">Eşleşmemiş</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Araç aksiyonları */}
                    <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', gap: 0.75 }}>
                      {/* Yeni ruhsat yükle */}
                      <Button size="small" variant="outlined" color="primary" component="label"
                        disabled={!!actionLoading} sx={{ fontSize: 10, flex: 1 }}
                        startIcon={<UploadIcon sx={{ fontSize: '14px !important' }} />}>
                        {actionLoading === 'upload_' + d.id ? '...' : 'Yeni Yükle'}
                        <input type="file" hidden accept="image/*" onChange={async (e) => {
                          if (e.target.files[0]) await handleUpload(e.target.files[0], d);
                        }} />
                      </Button>

                      {/* Mevcut ruhsatı değiştir — listeden seç */}
                      <Button size="small" variant="outlined" color="warning"
                        disabled={!!actionLoading} sx={{ fontSize: 10, flex: 1 }}
                        startIcon={<LinkIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => {
                          setAssignTarget(d);
                          setSelectedFile(null);
                          // scroll to unmatched
                          document.getElementById('unmatched-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                        {matchedFilename ? 'Değiştir' : 'Eşleştir'}
                      </Button>

                      {/* Eşleşmeyi kaldır */}
                      {matchedFilename && (
                        <Tooltip title="Eşleşmeyi kaldır">
                          <IconButton size="small" color="error"
                            disabled={!!actionLoading || isLoading(matchedFilename)}
                            onClick={() => handleUnassign(matchedFilename, d)}>
                            <LinkOffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* assignTarget bu cihazsa fotoğraf seçim paneli göster */}
                    {assignTarget?.id === d.id && (
                      <Box sx={{ px: 1.5, pb: 1.5 }}>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="caption" fontWeight={700} color="primary.main" display="block" sx={{ mb: 1 }}>
                          Aşağıdaki fotoğraflardan birini seçin:
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 0.75 }}>
                          {[...ruhsatFiles, ...extraFiles].filter(f => !Object.values(devicePhotoMap).includes(f.filename)).map(f => (
                            <Box key={f.filename}
                              onClick={() => handleAssign(f.filename, d)}
                              sx={{
                                border: '2px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                                '&:hover': { borderColor: 'primary.main' }
                              }}>
                              <PhotoPreview src={serviceFileUrl(reqId, f.filename)} filename={f.filename} height={70} />
                              <Typography variant="caption" noWrap display="block" sx={{ px: 0.5, py: 0.25, fontSize: 8, color: 'text.secondary' }}>
                                {f.filename}
                              </Typography>
                            </Box>
                          ))}
                          {[...ruhsatFiles, ...extraFiles].filter(f => !Object.values(devicePhotoMap).includes(f.filename)).length === 0 && (
                            <Typography variant="caption" color="text.disabled">Seçilebilecek fotoğraf yok</Typography>
                          )}
                        </Box>
                        <Button size="small" color="inherit" sx={{ mt: 1 }} onClick={() => setAssignTarget(null)}>İptal</Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* ── Eşleşmemiş Ruhsatlar ── */}
          {(() => {
            const unmatched = ruhsatFiles.filter(f => !Object.values(devicePhotoMap).includes(f.filename));
            if (!unmatched.length && !extraFiles.length) return null;
            return (
              <Box id="unmatched-section" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e65100' }} />
                  Eşleşmemiş / Ek Belgeler
                  <Chip size="small" label={unmatched.length + extraFiles.length} color="warning" sx={{ fontSize: 10, height: 18, ml: 0.5 }} />
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
                  {[...unmatched, ...extraFiles].map(f => (
                    <FileCard key={f.filename} file={f} actions={[
                      // Araca ata
                      devices.length > 0 && (
                        <Button key="assign" size="small" variant="outlined" color="primary" fullWidth
                          sx={{ fontSize: 9 }}
                          disabled={!!actionLoading}
                          onClick={() => {
                            if (devices.length === 1) {
                              handleAssign(f.filename, devices[0]);
                            } else {
                              setSelectedFile(f.filename);
                              setAssignTarget(null);
                            }
                          }}>
                          <LinkIcon sx={{ fontSize: 12, mr: 0.25 }} />
                          {devices.length === 1 ? devices[0].name.substring(0, 8) : 'Araca Ata'}
                        </Button>
                      ),
                      // Sil
                      <Tooltip key="del" title="Sil">
                        <IconButton size="small" color="error"
                          disabled={!!actionLoading || isLoading(f.filename)}
                          onClick={() => handleDelete(f.filename)}>
                          {isLoading(f.filename) ? <CircularProgress size={14} /> : <DeleteIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>,
                    ]} />
                  ))}
                </Box>
              </Box>
            );
          })()}

          {/* ── Servis Fotoğrafları (montaj/fatura) ── */}
          {(montajFiles.length > 0 || faturaFiles.length > 0) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976d2' }} />
                Servis Fotoğrafları
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
                {[...montajFiles, ...faturaFiles].map(f => (
                  <FileCard key={f.filename} file={f} actions={[
                    <Typography key="info" variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </Typography>,
                  ]} />
                ))}
              </Box>
            </Box>
          )}

          {/* ── Diğer dosyalar ── */}
          {otherFiles.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Diğer Dosyalar
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
                {otherFiles.map(f => (
                  <FileCard key={f.filename} file={f} actions={[
                    <Tooltip key="del" title="Sil">
                      <IconButton size="small" color="error" disabled={!!actionLoading}
                        onClick={() => handleDelete(f.filename)}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>,
                  ]} />
                ))}
              </Box>
            </Box>
          )}

          {/* Boş */}
          {!loading && allFiles.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
              <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">Bu talebe ait dosya bulunamadı</Typography>
            </Box>
          )}

          {/* ── Yeni ek belge yükle ── */}
          <Divider sx={{ my: 2 }} />
          <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />}
            disabled={!!actionLoading}>
            {actionLoading === 'upload_extra' ? 'Yükleniyor...' : 'Ek Belge Yükle'}
            <input type="file" hidden accept="image/*" onChange={async (e) => {
              if (e.target.files[0]) await handleUpload(e.target.files[0], null);
            }} />
          </Button>
        </Box>

        {/* Seçili dosya eşleştirme paneli */}
        {selectedFile && renderAssignPanel()}
      </Box>
    </Dialog>
  );
};

export default PhotoManagerDialog;
