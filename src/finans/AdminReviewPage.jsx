import { useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Avatar, Collapse,
  CircularProgress, Divider, Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import StoreIcon from '@mui/icons-material/Store';
import BadgeIcon from '@mui/icons-material/Badge';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync } from '../reactHelper';
import { formatTime } from '../common/util/formatter';

const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer' }[t] || t);
const typeColor = (t) => ({ MONTAJ: '#1976d2', DEVIR: '#7b1fa2', DEMONTAJ: '#ed6c02', DIGER: '#d32f2f' }[t] || '#888');

const InfoRow = ({ icon: Icon, label, value }) => value ? (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    <Icon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
    <Typography variant="caption" color="text.secondary">{label}:</Typography>
    <Typography variant="caption" fontWeight={600}>{value}</Typography>
  </Box>
) : null;

const ReviewCard = ({ r, devicesMap, users, centers, navigate }) => {
  const [expanded, setExpanded] = useState(false);

  const devices = r.deviceIds && r.deviceIds !== '{}'
    ? r.deviceIds.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean)
      .map((did) => devicesMap[did]).filter(Boolean)
    : [];

  const customer = users[r.userId];
  const center = centers.find((c) => c.id === r.serviceCenterId);
  const serviceUser = users[r.serviceUserId];
  const isDevir = r.type === 'DEVIR';

  return (
    <Card elevation={0} sx={{
      border: '2px solid', borderColor: 'warning.light', borderRadius: 2,
      overflow: 'hidden', transition: '0.15s', '&:hover': { boxShadow: 2, borderColor: 'warning.main' },
    }}>
      {/* Ana satır */}
      <Box onClick={() => navigate(`/finans/admin/request/${r.id}`)}
        sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>

        <Avatar sx={{ width: 42, height: 42, bgcolor: alpha(typeColor(r.type), 0.12), flexShrink: 0 }}>
          <Box sx={{ color: typeColor(r.type) }}>
            {isDevir ? <SwapHorizIcon sx={{ fontSize: 20 }} /> : <BuildIcon sx={{ fontSize: 20 }} />}
          </Box>
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}>
            <Typography variant="body2" fontWeight={700}>#{r.id} — {typeLabel(r.type)}</Typography>
            <Chip size="small" label="Onay Bekliyor" color="secondary" sx={{ fontSize: 10, height: 18 }} />
          </Box>

          {/* Müşteri özeti */}
          {customer && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
              <PersonIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" fontWeight={600}>{customer.name}</Typography>
              {customer.phone && (
                <Typography variant="caption" color="text.secondary">· {customer.phone}</Typography>
              )}
            </Box>
          )}

          {/* Araçlar özeti */}
          {devices.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
              <DirectionsCarIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" noWrap sx={{ maxWidth: { xs: 160, sm: 300 } }}>
                {devices.map((d) => d.name).join(', ')}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            {r.city}{r.district ? ` / ${r.district}` : ''} · Tamamlandı: {formatTime(r.completedAt, 'date')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          <ArrowForwardIosIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
        </Box>
      </Box>

      {/* Accordion */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* Müşteri bilgileri */}
          {customer && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                Müşteri
              </Typography>
              <InfoRow icon={PersonIcon} label="Ad" value={customer.name} />
              <InfoRow icon={PhoneIcon} label="Tel" value={customer.phone} />
              <InfoRow icon={BadgeIcon} label="E-posta" value={customer.email} />
            </Box>
          )}

          {/* Servis merkezi + teknisyen */}
          {(center || serviceUser) && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                Servis
              </Typography>
              {center && (
                <>
                  <InfoRow icon={StoreIcon} label="Merkez" value={center.name} />
                  <InfoRow icon={PhoneIcon} label="Tel" value={center.phone} />
                </>
              )}
              {serviceUser && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Teknisyen</Typography>
                  <InfoRow icon={PersonIcon} label="Ad" value={serviceUser.name} />
                  <InfoRow icon={PhoneIcon} label="Tel" value={serviceUser.phone} />
                  <InfoRow icon={BadgeIcon} label="E-posta" value={serviceUser.email} />
                </>
              )}
            </Box>
          )}

          {/* Araç detayları */}
          {devices.length > 0 && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Araçlar ({devices.length})
              </Typography>
              {devices.map((d) => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, p: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Chip size="small" label={d.status === 'online' ? '●' : '○'}
                    color={d.status === 'online' ? 'success' : 'default'} sx={{ fontSize: 10, height: 14, minWidth: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} display="block">{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>{d.uniqueId}</Typography>
                  </Box>
                  {d.attributes?.ruhsatEslesti && (
                    <Chip size="small" label="Ruhsat ✓" color="success" sx={{ fontSize: 9, height: 16 }} />
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Devir bilgileri */}
          {isDevir && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                Yeni Sahip
              </Typography>
              <InfoRow icon={PersonIcon} label="Ad" value={r.newOwnerName} />
              <InfoRow icon={BadgeIcon} label="E-posta" value={r.newOwnerEmail} />
              <InfoRow icon={PhoneIcon} label="Tel" value={r.newOwnerPhone} />
              {r.newDeviceName && <InfoRow icon={DirectionsCarIcon} label="Yeni Plaka" value={r.newDeviceName} />}
              {r.newOwnerUserId === 0 && (
                <Alert severity="warning" sx={{ py: 0.25, mt: 0.5 }} icon={<WarningAmberIcon fontSize="small" />}>
                  Yeni sahip henüz kayıt olmadı
                </Alert>
              )}
            </Box>
          )}

          {/* Fatura */}
          {r.invoicePath && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: 0.75, bgcolor: 'success.50', borderRadius: 1 }}>
              <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography variant="caption" color="success.main" fontWeight={600}>Fatura yüklendi</Typography>
              <Chip size="small" label={r.invoiceStatus || 'PENDING'} color={r.invoiceStatus === 'PAID' ? 'success' : 'warning'} sx={{ fontSize: 10, height: 16 }} />
            </Box>
          )}

          {/* Notlar */}
          {r.notes && (
            <Box sx={{ p: 0.75, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>{r.notes}</Typography>
            </Box>
          )}

          {/* Onayla butonu */}
          <Box onClick={() => navigate(`/finans/admin/request/${r.id}`)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1, borderRadius: 1.5, bgcolor: 'warning.light', cursor: 'pointer', '&:hover': { bgcolor: 'warning.main', '& *': { color: 'white' } }, transition: '0.15s' }}>
            <Typography variant="caption" fontWeight={700} color="warning.dark">
              {isDevir ? '→ Devri İncele ve Onayla' : '→ İşlemi İncele ve Kapat'}
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

const AdminReviewPage = () => {
  const navigate = useNavigate();
  const devicesMap = useSelector((s) => s.devices.items);
  const [reloadKey] = useReducer((k) => k + 1, 0);
  const [requests, setRequests] = useState([]);
  const [centers, setCenters] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffectAsync(async () => {
    setLoading(true);
    const [reqRes, centersRes, usersRes] = await Promise.all([
      fetch('/api/service-requests'),
      fetch('/api/service-centers'),
      fetch('/api/users?excludeAttributes=false'),
    ]);
    if (reqRes.ok) {
      const data = await reqRes.json();
      setRequests(data.filter((r) => r.status === 'ADMIN_REVIEW'));
    }
    if (centersRes.ok) setCenters(await centersRes.json());
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(Object.fromEntries(data.map((u) => [u.id, u])));
    }
    setLoading(false);
  }, [reloadKey]);

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', 'Onay Kuyruğu']}>
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>

        {/* Banner */}
        {!loading && requests.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'warning.light', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon sx={{ color: 'warning.dark' }} />
            <Typography variant="body2" fontWeight={700} color="warning.dark">
              {requests.length} talep final onayı bekliyor — cihaz işlemleri bu onaydan sonra gerçekleşir
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : requests.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
            <Typography variant="body2">Onay bekleyen talep yok</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 10 }}>
            {requests.map((r) => (
              <ReviewCard
                key={r.id} r={r} devicesMap={devicesMap}
                users={users} centers={centers} navigate={navigate}
              />
            ))}
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default AdminReviewPage;