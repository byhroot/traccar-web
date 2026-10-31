import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Dialog,
  Box, Button, Typography, Card, CardContent,
  Chip, Divider, CircularProgress, Alert,
  Table, TableBody, TableRow, TableCell,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync, useCatch } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import { serviceFileUrl } from './serviceFileUrl';
import { parseNotes, NotesCard } from './NotesSection';

import fetchOrThrow from '../common/util/fetchOrThrow';
import { useSelector } from 'react-redux';

const statusLabel = (s) => ({ PENDING: 'Bekliyor', PENDING_OWNER_REG: 'Sahip Kayıt Bekleniyor', APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapatıldı', CANCELLED: 'İptal' }[s] || s);
const statusColor = (s) => ({ PENDING: 'warning', PENDING_OWNER_REG: 'warning', APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default', CANCELLED: 'error' }[s] || 'default');
const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer' }[t] || t);

// Bilgi satırı bileşeni
const InfoRow = ({ label, value, mono }) => (
  value ? (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: 140, py: 0.75, border: 'none', fontSize: 13 }}>{label}</TableCell>
      <TableCell sx={{ py: 0.75, border: 'none', fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 500 : 400 }}>{value}</TableCell>
    </TableRow>
  ) : null
);

const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const devicesMap = useSelector((state) => state.devices.items);
  const [request, setRequest] = useState(null);
  const [devices, setDevices] = useState([]);
  const [serviceCenter, setServiceCenter] = useState(null);
  const [deviceLogs, setDeviceLogs] = useState([]);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [viewerSrc, setViewerSrc] = useState(null);
  const [requestFiles, setRequestFiles] = useState([]);
  const [notesArr, setNotesArr] = useState([]);

  useEffectAsync(async () => {
    const res = await fetch(`/api/service-requests/${id}`);
    if (!res.ok) return;
    const r = await res.json();
    setRequest(r);
    setNotesArr(parseNotes(r.notes));

    // Klasör dosyalarını yükle
    const filesRes = await fetch(`/api/service-requests/${id}/files`);
    if (filesRes.ok) setRequestFiles(await filesRes.json());

    // Cihaz bilgilerini çek
    if (r.deviceIds && r.deviceIds !== '{}') {
      const ids = r.deviceIds.replace(/[{}]/g, '').split(',').filter(Boolean);
      const found = ids.map((did) => ({
        id: Number(did),
        ...(devicesMap[parseInt(did)] || {}),
      }));

      setDevices(found);
    }

    // Servis merkezi bilgisi
    if (r.serviceCenterId > 0) {
      const scRes = await fetch(`/api/service-centers/${r.serviceCenterId}`);
      if (scRes.ok) setServiceCenter(await scRes.json());
    }

    // Her cihaz için history çek
    if (r.deviceIds && r.deviceIds !== '{}') {
      const ids = r.deviceIds.replace(/[{}]/g, '').split(',').filter(Boolean);
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
  }, [id]);

  const handleCancel = useCatch(async () => {
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
    await fetchOrThrow(`/api/service-requests/${id}/cancel`, { method: 'PUT' });
    navigate('/finans/requests');
  });

  if (!request) {
    return (
      <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', 'Talep Detayı']}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      </PageLayout>
    );
  }

  const isPending = ['PENDING', 'PENDING_OWNER_REG'].includes(request.status);
  const isClosed = ['CLOSED', 'CANCELLED'].includes(request.status);
  const customerVisibleNotes = notesArr.filter(
    (n) => n.type === 'customer' || (n.type === 'admin' && n.showCustomer === true)
  );

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', `Talep #${id}`]}>
      <Box sx={{ maxWidth: 640, mx: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Başlık */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/finans/requests')} color="inherit">Geri</Button>
          <Box sx={{ flex: 1 }} />
          <Chip label={statusLabel(request.status)} color={statusColor(request.status)} size="small" />
        </Box>
        {/* Notlar */}
        {customerVisibleNotes.length > 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <NotesCard
                notes={notesArr}
                canAdd={false}
                isAdmin={false}
                currentUser={null}
                viewerRole="customer"
                onSave={() => { }}
                onDelete={() => { }}
              />
            </CardContent>
          </Card>
        ) : null}

        {/* Talep özeti */}
        <Card variant="outlined">
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <BuildIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700}>
                {typeLabel(request.type)} Talebi #{request.id}
              </Typography>
            </Box>
            <Table size="small">
              <TableBody>
                <InfoRow label="Oluşturulma" value={formatTime(request.createdAt, 'date')} />
                <InfoRow label="Güncelleme" value={formatTime(request.updatedAt, 'date')} />
                {request.completedAt && <InfoRow label="Tamamlanma" value={formatTime(request.completedAt, 'date')} />}
                {request.closedAt && <InfoRow label="Kapatılma" value={formatTime(request.closedAt, 'date')} />}
                <InfoRow label="Konum" value={[request.city, request.district].filter(Boolean).join(' / ')} />

                {request.wixOrderId && <InfoRow label="Sipariş" value={request.orderItems || request.wixOrderId} />}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Servis merkezi */}
        {serviceCenter && (
          <Card variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LocationOnIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>Atanan Servis</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Servis Adı" value={serviceCenter.name} />
                  <InfoRow label="Konum" value={[serviceCenter.city, serviceCenter.district].filter(Boolean).join(' / ')} />
                  <InfoRow label="Adres" value={serviceCenter.address} />
                  <InfoRow label="Telefon" value={serviceCenter.phone} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {/* Cihaz bilgileri */}
        {devices.length > 0 && (
          <Card variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <DirectionsCarIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>Araç Bilgileri</Typography>
              </Box>
              {devices.map((d) => (
                <Box key={d.id} sx={{ mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Table size="small">
                    <TableBody>
                      <InfoRow
                        label="Plaka / Ad"
                        value={d.name || `Araç #${d.id}`}
                      />                     <InfoRow
                        label="Seri No"
                        value={
                          d.uniqueId
                            ? `••••${d.uniqueId.slice(-6)}`
                            : `ID:${d.id}`
                        }
                        mono
                      />
                      <InfoRow label="Kategori" value={d.category} />
                      {d.attributes?.km && <InfoRow label="KM" value={`${d.attributes.km} km`} />}
                    </TableBody>
                  </Table>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Devir bilgileri */}
        {request.type === 'DEVIR' && (
          <Card variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PersonIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>Devir Bilgileri</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Yeni Sahip" value={request.newOwnerName} />
                  <InfoRow label="E-posta" value={request.newOwnerEmail} />
                  <InfoRow label="Telefon" value={request.newOwnerPhone} />
                  {request.newDeviceName && <InfoRow label="Yeni Plaka" value={request.newDeviceName} />}
                  <InfoRow label="Kayıt Durumu" value={request.newOwnerUserId > 0 ? '✓ Uygulamaya kayıtlı' : '⚠ Kayıt bekleniyor'} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Belge fotoğrafları — files API'den */}
        {(() => {
          const ruhsatFiles = requestFiles.filter(f =>
            f.filename.includes('_ruhsat') && !f.filename.includes('_montaj_')
          );
          if (!ruhsatFiles.length) return null;
          return (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Yüklenen Belgeler</Typography>
                {ruhsatFiles.map((f, i) => (
                  <Box key={i} component="img"
                    src={serviceFileUrl(request.id, f.filename)}
                    onClick={() => setViewerSrc(serviceFileUrl(request.id, f.filename))}
                    sx={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 1, mb: 1, cursor: 'zoom-in' }}
                  />
                ))}
              </CardContent>
            </Card>
          );
        })()}



        {/* Araç işlem kayıtları */}
        {devices.length > 0 && (
          <Card variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Araç İşlem Kayıtları</Typography>
              {devices.map((d) => {
                const logs = deviceLogs.filter((l) => l.deviceId === d.id || l.originalUniqueId === d.uniqueId);
                const isExpanded = expandedDevice === d.id;
                const hasLog = logs.length > 0;
                return (
                  <Box key={d.id} sx={{ mb: 1, border: '1px solid', borderColor: hasLog ? 'success.light' : 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                    <Box onClick={() => setExpandedDevice(isExpanded ? null : d.id)}
                      sx={{ px: 1.5, py: 1, bgcolor: hasLog ? 'success.50' : 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {d.name || `Araç #${d.id}`}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {d.uniqueId
                            ? `••••${d.uniqueId.slice(-6)}`
                            : `ID:${d.id}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                        <Chip size="small" label={hasLog ? 'Servis tamamlandı' : 'Bekliyor'} color={hasLog ? 'success' : 'default'} sx={{ fontSize: 10 }} />
                        <Typography variant="caption">{isExpanded ? '▲' : '▼'}</Typography>
                      </Box>
                    </Box>
                    {isExpanded && (
                      <Box sx={{ p: 1.5 }}>
                        {logs.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">Henüz işlem kaydı girilmemiş.</Typography>
                        ) : logs.map((log) => (
                          <Box key={log.id}>
                            <Table size="small">
                              <TableBody>
                                <InfoRow label="Tarih" value={formatTime(log.processedAt, 'date')} />
                                <InfoRow label="Ruhsat Kontrolü" value={log.licenseVerified ? '✓ Onaylandı' : '— Yapılmadı'} />
                                <InfoRow label="Blokaj Kiti" value={log.blockerInstalled ? '✓ Takıldı' : '— Takılmadı'} />
                                {log.km > 0 && <InfoRow label="KM" value={`${log.km.toLocaleString()} km`} />}
                              </TableBody>
                            </Table>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Fotoğraf viewer */}
        {viewerSrc && (
          <Dialog open fullScreen onClick={() => setViewerSrc(null)}>
            <Box sx={{ width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
              <Box component="img" src={viewerSrc} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
          </Dialog>
        )}



        {/* Fatura */}
        {request.invoicePath && (
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" fontWeight={700}>Fatura</Typography>
                <Chip size="small" label={request.invoiceStatus || 'PENDING'}
                  color={request.invoiceStatus === 'PAID' ? 'success' : 'warning'} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* İptal butonu — sadece PENDING durumunda */}
        {isPending && (
          <>
            <Divider />
            <Button variant="outlined" color="error" onClick={handleCancel}>
              Talebi İptal Et
            </Button>
          </>
        )}

      </Box>
    </PageLayout>
  );
};

export default RequestDetailPage;