import { useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, IconButton, Fab,
  TextField, InputAdornment, CircularProgress,
  Collapse, Divider, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BuildIcon from '@mui/icons-material/Build';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BadgeIcon from '@mui/icons-material/Badge';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync, useCatch } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useAdministrator } from '../common/util/permissions';

const useStyles = makeStyles()((theme) => ({
  fab: { position: 'fixed', bottom: theme.spacing(10), right: theme.spacing(2) },
}));

const statusColor = (s) => ({ PENDING: 'warning', PENDING_OWNER_REG: 'warning', APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default', CANCELLED: 'error' }[s] || 'default');
const statusLabel = (s) => ({ PENDING: 'Bekliyor', PENDING_OWNER_REG: 'Sahip Bekleniyor', APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapatıldı', CANCELLED: 'İptal' }[s] || s);
const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer Talepler' }[t] || t);
const typeColor = (t) => ({ MONTAJ: '#1976d2', DEVIR: '#7b1fa2', DEMONTAJ: '#ed6c02', DIGER: '#d32f2f' }[t] || '#888');

const TABS = [
  { label: 'Aktif', statuses: ['PENDING', 'PENDING_OWNER_REG', 'APPROVED', 'IN_PROGRESS', 'ADMIN_REVIEW'] },
  { label: 'Kapandı', statuses: ['COMPLETED', 'CLOSED', 'CANCELLED'] },
];

const RequestCard = ({ r, currentUserId, isAdmin, isServis, devicesMap, users, onCancel, navigate }) => {
  const [expanded, setExpanded] = useState(false);

  const isOwn = r.userId === currentUserId;
  const isCustomerRecord = !isOwn && (isAdmin || isServis);

  const devices = r.deviceIds && r.deviceIds !== '{}'
    ? r.deviceIds
      .replace(/[{}]/g, '')
      .split(',')
      .map(Number)
      .filter(Boolean)
      .map((did) => ({
        id: did,
        ...(devicesMap[did] || {}),
      }))
    : [];

  const customer = users[r.userId];
  const canCancel = isOwn && ['PENDING', 'PENDING_OWNER_REG'].includes(r.status);
  const detailPath = isAdmin
    ? `/finans/admin/request/${r.id}`
    : `/finans/requests/${r.id}`;

  return (
    <Card elevation={0} sx={{
      border: '1px solid',
      borderColor: isCustomerRecord ? 'info.light' : 'divider',
      borderRadius: 2, overflow: 'hidden', transition: '0.15s',
      '&:hover': { boxShadow: 1 },
    }}>
      {/* Müşteri kaydı bandı */}
      {isCustomerRecord && (
        <Box sx={{ px: 1.5, py: 0.4, bgcolor: 'info.light', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <BadgeIcon sx={{ fontSize: 12, color: 'info.dark' }} />
          <Typography variant="caption" fontWeight={700} color="info.dark" sx={{ fontSize: 10 }}>
            MÜŞTERİ KAYDI — #{r.userId} {customer?.name ? `· ${customer.name}` : ''}
          </Typography>
        </Box>
      )}

      {/* Ana satır */}
      <Box onClick={() => navigate(detailPath)}
        sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
        {/* Tip avatar */}
        <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(typeColor(r.type), 0.12), flexShrink: 0 }}>
          <Box sx={{ color: typeColor(r.type) }}>
            {r.type === 'DEVIR' ? <SwapHorizIcon sx={{ fontSize: 18 }} /> : <BuildIcon sx={{ fontSize: 18 }} />}
          </Box>
        </Avatar>

        {/* İçerik */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Üst satır: tip + durum */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}>
            <Typography variant="body2" fontWeight={700}>#{r.id} — {typeLabel(r.type)}</Typography>
            <Chip size="small" label={statusLabel(r.status)} color={statusColor(r.status)} sx={{ fontSize: 10, height: 18 }} />
          </Box>

          {/* Araç adı */}
          {devices.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
              <DirectionsCarIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: { xs: 180, sm: 320 } }}>
                {devices.map((d) => d.name || `Araç #${d.id}`).join(', ')}              </Typography>
            </Box>
          )}

          {/* Müşteri adı — admin/servis için */}
          {(isAdmin || isServis) && customer?.name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
              <PersonIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" noWrap>{customer.name}</Typography>
            </Box>
          )}

          {/* Şehir + tarih */}
          <Typography variant="caption" color="text.secondary">
            {r.city}{r.district ? ` / ${r.district}` : ''} · {formatTime(r.createdAt, 'date')}
          </Typography>
        </Box>

        {/* Sağ aksiyonlar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
          {canCancel && (
            <IconButton size="small" color="error"
              onClick={(e) => { e.stopPropagation(); onCancel(r.id); }}>
              <CancelIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
          <ArrowForwardIosIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
        </Box>
      </Box>

      {/* Accordion detay */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1 }}>

          {/* Müşteri bilgileri — admin/servis için */}
          {(isAdmin || isServis) && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Müşteri Bilgileri
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {customer?.name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption">{customer.name}</Typography>
                  </Box>
                )}
                {customer?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption">{customer.phone}</Typography>
                  </Box>
                )}
                {customer?.email && (
                  <Typography variant="caption" color="text.secondary">{customer.email}</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Araç detayları */}
          {devices.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Araçlar
              </Typography>
              {devices.map((d) => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, p: 0.75, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Chip size="small" label={d.status === 'online' ? '● Online' : '○ Offline'}
                    color={d.status === 'online' ? 'success' : 'default'} sx={{ fontSize: 10, height: 16 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700}>{d.name || `Araç #${d.id}`}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10, display: 'block' }}> {d.uniqueId
                      ? `*****${d.uniqueId.slice(-6)}`
                      : `ID:${d.id}`}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Devir */}
          {r.type === 'DEVIR' && r.newOwnerEmail && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Yeni Sahip
              </Typography>
              <Typography variant="caption">{r.newOwnerName} — {r.newOwnerEmail}</Typography>
              {r.newOwnerUserId === 0 && (
                <Chip size="small" label="Kayıt bekleniyor" color="warning" sx={{ fontSize: 10, ml: 1 }} />
              )}
            </Box>
          )}

          {/* Sipariş */}
          {r.orderItems && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                Sipariş
              </Typography>
              <Typography variant="caption">{r.orderItems}</Typography>
            </Box>
          )}

          {/* Notlar */}


          {/* Detay */}
          <Box onClick={() => navigate(detailPath)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.75, borderRadius: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' }, transition: '0.15s' }}>
            <Typography variant="caption" fontWeight={700} color="primary">
              {isAdmin ? 'Detay / Yönet' : 'Detayı Görüntüle'}
            </Typography>
            <ArrowForwardIosIcon sx={{ fontSize: 11, color: 'primary.main' }} />
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

const RequestsPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const admin = useAdministrator();
  const sessionUser = useSelector((s) => s.session.user);
  const devicesMap = useSelector((s) => s.devices.items);
  const currentUserId = sessionUser?.id;
  const isServis = !admin && (sessionUser?.attributes?.servis === true || sessionUser?.attributes?.servis === 'true');

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  const handleCancel = useCatch(async (id) => {
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
    await fetchOrThrow(`/api/service-requests/${id}/cancel`, { method: 'PUT' });
    reload();
  });

  useEffectAsync(async () => {
    void reloadKey;
    setLoading(true);
    const [reqRes, usersRes] = await Promise.all([
      fetch('/api/service-requests'),
      (admin || isServis) ? fetch('/api/users?excludeAttributes=false') : Promise.resolve(null),
    ]);
    if (reqRes.ok) setRequests(await reqRes.json());
    if (usersRes?.ok) {
      const data = await usersRes.json();
      setUsers(Object.fromEntries(data.map((u) => [u.id, u])));
    }
    setLoading(false);
  }, [reloadKey]);

  const filtered = requests.filter((r) => {
    if (!TABS[tab].statuses.includes(r.status)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const devNames = r.deviceIds
      ? r.deviceIds.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean)
        .map((did) => devicesMap[did]?.name?.toLowerCase() || '').join(' ')
      : '';
    const customerName = users[r.userId]?.name?.toLowerCase() || '';
    return String(r.id).includes(q)
      || r.city?.toLowerCase().includes(q)
      || typeLabel(r.type).toLowerCase().includes(q)
      || devNames.includes(q)
      || customerName.includes(q);
  });

  const tabCounts = TABS.map((t) => requests.filter((r) => t.statuses.includes(r.status)).length);

  return (
    // <PageLayout menu={<FinansMenu />} breadcrumbs={['menucommandIndex', admin ? 'menucommandIndex' : isServis ? 'menucommandIndex' : 'menucommandIndex']}>
    <PageLayout menu={<FinansMenu />} breadcrumbs={['sharedServiceName', 'records']}>

      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>

        {/* Tab + Arama */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
            {TABS.map((t, i) => (
              <Box key={t.label} onClick={() => setTab(i)} sx={{
                px: 1.5, py: 0.75, cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400,
                color: tab === i ? 'primary.main' : 'text.secondary',
                bgcolor: tab === i ? 'action.selected' : 'transparent',
                borderRight: i < TABS.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                {t.label}
                {tabCounts[i] > 0 && (
                  <Box sx={{ bgcolor: tab === i ? 'primary.light' : 'action.disabledBackground', borderRadius: 10, px: 0.6, minWidth: 18, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700, color: tab === i ? 'primary.contrastText' : 'text.secondary' }}>{tabCounts[i]}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
          <TextField size="small" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </Box>

        {/* Liste */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">{search ? 'Sonuç bulunamadı' : 'Talep bulunamadı'}</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 12 }}>
            {filtered.map((r) => (
              <RequestCard
                key={r.id}
                r={r}
                currentUserId={currentUserId}
                isAdmin={admin}
                isServis={isServis}
                devicesMap={devicesMap}
                users={users}
                onCancel={handleCancel}
                navigate={navigate}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Yeni talep butonu — servis için gizle */}
      {!isServis && (
        <Fab size="medium" color="primary" className={classes.fab} onClick={() => navigate('/finans/requests/new')}>
          <AddIcon />
        </Fab>
      )}
    </PageLayout>
  );
};

export default RequestsPage;