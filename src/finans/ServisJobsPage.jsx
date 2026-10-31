import { useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Avatar,
  TextField, InputAdornment, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
  Collapse, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import { useAdministrator } from '../common/util/permissions';

const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer' }[t] || t);
const typeColor = (t) => ({ MONTAJ: '#1976d2', DEVIR: '#7b1fa2', DEMONTAJ: '#ed6c02', DIGER: '#d32f2f' }[t] || '#888');
const statusColor = (s) => ({ APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default' }[s] || 'default');
const statusLabel = (s) => ({ APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapalı' }[s] || s);

const TABS = [
  { label: 'Aktif', statuses: ['APPROVED', 'IN_PROGRESS'] },
  { label: 'Tamamlandı>Onayda', statuses: ['COMPLETED', 'ADMIN_REVIEW'] },
  { label: 'Fatura', statuses: ['CLOSED', 'ADMIN_REVIEW'], invoiceFilter: 'pending' },
  { label: 'Kapalı', statuses: ['CLOSED'] },
];

// KPI kart — dikey layout, mobilde taşma yok
const KpiCard = ({
  label,
  value,
  color,
  icon: Icon,
  badge,
  active,
  onClick,
}) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      flex: '1 1 0',
      minWidth: 0,
      border: '2px solid',
      borderColor: active ? color : 'divider',
      bgcolor: active ? alpha(color, 0.08) : 'background.paper',
      transition: '0.2s',
    }}
  >
    <CardContent sx={{ p: 1.25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, '&:last-child': { pb: 1.25 } }}>
      <Avatar sx={{ bgcolor: alpha(color, 0.1), width: 30, height: 30 }}>
        <Icon sx={{ color, fontSize: 15 }} />
      </Avatar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
        <Typography variant="h6" fontWeight={700} lineHeight={1}>{value}</Typography>
        {badge && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />}
      </Box>
      <Typography variant="caption" color="text.secondary" textAlign="center"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.3, fontSize: 9, lineHeight: 1.2 }}>
        {label}
      </Typography>
    </CardContent>
  </Card>
);

// İş kartı
const JobCard = ({ r, devicesMap, centers, navigate }) => {
  const [expanded, setExpanded] = useState(false);

  function parseIds(raw) {
    if (!raw || raw === '{}') return [];
    return raw.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean);
  }

  const devices = parseIds(r.deviceIds).map((did) => devicesMap[did]).filter(Boolean);
  const center = centers.find((c) => c.id === r.serviceCenterId);
  const needsInvoice = ['CLOSED', 'ADMIN_REVIEW'].includes(r.status) && !r.invoicePath;

  return (
    <Card elevation={0} sx={{
      border: '1px solid',
      borderColor: needsInvoice ? 'warning.light' : r.status === 'ADMIN_REVIEW' ? 'secondary.light' : 'divider',
      borderRadius: 2, overflow: 'hidden', transition: '0.15s', '&:hover': { boxShadow: 1 },
    }}>


      {/* Ana satır */}
      <Box onClick={() => navigate(`/finans/servis/job/${r.id}`)}
        sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>

        {/* Tip avatar */}
        <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(typeColor(r.type), 0.12), flexShrink: 0 }}>
          <Box sx={{ color: typeColor(r.type) }}>
            {r.type === 'DEVIR' ? <SwapHorizIcon sx={{ fontSize: 18 }} /> : <BuildIcon sx={{ fontSize: 18 }} />}
          </Box>
        </Avatar>

        {/* İçerik */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}>
            <Typography variant="body2" fontWeight={700}>#{r.id} — {typeLabel(r.type)}</Typography>
            <Chip size="small" label={statusLabel(r.status)} color={statusColor(r.status)} sx={{ fontSize: 10, height: 18 }} />
            {devices.length > 1 && (
              <Chip size="small" label={`${devices.length} araç`} color="primary" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
            )}
          </Box>

          {/* Araçlar */}
          {devices.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
              <DirectionsCarIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: { xs: 180, sm: 300 } }}>
                {devices.map((d) => d.name).join(', ')}
              </Typography>
            </Box>
          )}

          {/* Şehir + tarih */}
          <Typography variant="caption" color="text.secondary">
            {r.city}{r.district ? ` / ${r.district}` : ''} · {formatTime(r.createdAt, 'date')}
          </Typography>

          {/* Servis merkezi — admin için */}
          {center && (
            <Typography variant="caption" color="primary" display="block">{center.name}</Typography>
          )}
        </Box>

        {/* Sağ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          <ArrowForwardIosIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
        </Box>
      </Box>

      {/* Accordion detay */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1 }}>

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
                    <Typography variant="caption" fontWeight={700}>{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10, display: 'block' }}> {(() => {
                      const uid = d?.uniqueId || '';
                      return uid?.length > 6
                        ? '*'.repeat(uid.length - 6) + uid.slice(-6)
                        : uid;
                    })()}</Typography>
                  </Box>
                </Box>
              ))}
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

          {/* Tamamlanma */}
          {r.completedAt && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                Tamamlanma
              </Typography>
              <Typography variant="caption">{formatTime(r.completedAt, 'datetime')}</Typography>
            </Box>
          )}

          {/* Fatura durumu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {r.invoicePath ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                <Typography variant="caption" color="success.main">Fatura yüklendi — {r.invoiceStatus}</Typography>
              </>
            ) : (
              <>
                <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption" color="warning.main">Fatura henüz yüklenmedi</Typography>
              </>
            )}
          </Box>

          {/* Notlar */}
          {r.notes && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                Notlar
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{r.notes}</Typography>
            </Box>
          )}

          {/* Detay butonu */}
          <Box onClick={() => navigate(`/finans/servis/job/${r.id}`)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.75, borderRadius: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
            <Typography variant="caption" fontWeight={700} color="primary">İş Detayına Git</Typography>
            <ArrowForwardIosIcon sx={{ fontSize: 11, color: 'primary.main' }} />
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

const ServisJobsPage = () => {
  const navigate = useNavigate();
  const admin = useAdministrator();
  const devicesMap = useSelector((s) => s.devices.items);
  const [tab, setTab] = useState(0);
  const [reloadKey] = useReducer((k) => k + 1, 0);
  const [allRequests, setAllRequests] = useState([]);
  const [centers, setCenters] = useState([]);
  const [centerFilter, setCenterFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffectAsync(async () => {
    setLoading(true);
    const [reqRes, centerRes] = await Promise.all([
      fetch('/api/service-requests'),
      admin ? fetch('/api/service-centers') : Promise.resolve(null),
    ]);
    if (reqRes.ok) setAllRequests(await reqRes.json());
    if (centerRes?.ok) setCenters(await centerRes.json());
    setLoading(false);
  }, [reloadKey]);

  function parseIds(raw) {
    if (!raw || raw === '{}') return [];
    return raw.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean);
  }

  const kpi = {
    active: allRequests.filter((r) => ['APPROVED', 'IN_PROGRESS'].includes(r.status)).length,
    review: allRequests.filter((r) => r.status === 'ADMIN_REVIEW').length,
    done: allRequests.filter((r) => r.status === 'CLOSED').length,
    invoicePending: allRequests.filter((r) => ['CLOSED', 'ADMIN_REVIEW'].includes(r.status) && !r.invoicePath).length,
  };

  const filtered = allRequests.filter((r) => {
    if (!TABS[tab].statuses.includes(r.status)) return false;
    // Fatura sekmesi — fatura yüklenmemiş olanlar
    if (TABS[tab].invoiceFilter === 'pending' && r.invoicePath) return false;
    if (centerFilter && String(r.serviceCenterId) !== String(centerFilter)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const devMatch = parseIds(r.deviceIds).some((did) => {
      const d = devicesMap[did];
      return d?.name?.toLowerCase().includes(q) || d?.uniqueId?.toLowerCase().includes(q);
    });
    return devMatch || r.city?.toLowerCase().includes(q) || String(r.id).includes(q);
  });

  const tabCounts = TABS.map((t) => allRequests.filter((r) => {
    if (!t.statuses.includes(r.status)) return false;
    if (t.invoiceFilter === 'pending' && r.invoicePath) return false;
    return true;
  }).length);

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['support', 'atanan-isler']}>
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>

        {/* KPI kartlar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <KpiCard
            label="Bekleyen"
            value={kpi.active}
            color="#1976d2"
            icon={BuildIcon}
            active={tab === 0}
            onClick={() => setTab(0)}
          />

          <KpiCard
            label="Onaya Gönderildi"
            value={kpi.review}
            color="#7b1fa2"
            icon={PendingActionsIcon}
            active={tab === 1}
            onClick={() => setTab(1)}
          />

          <KpiCard
            label="Fatura"
            value={kpi.invoicePending}
            color="#ed6c02"
            icon={ReceiptIcon}
            active={tab === 2}
            onClick={() => setTab(2)}
          />

          <KpiCard
            label="Tamamlanan"
            value={kpi.done}
            color="#2e7d32"
            icon={CheckCircleIcon}
            active={tab === 3}
            onClick={() => setTab(3)}
          />
        </Box>

        {/* Filtreler */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Araç, plaka, şehir, # ara..." value={search}
            onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 180 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          {admin && centers.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Servis Merkezi</InputLabel>
              <Select value={centerFilter} label="Servis Merkezi" onChange={(e) => setCenterFilter(e.target.value)}>
                <MenuItem value="">Tümü</MenuItem>
                {centers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Tab bar kaldırıldı */}

        {/* Liste */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">Bu kategoride iş bulunmuyor</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 10 }}>
            {filtered.map((r) => (
              <JobCard key={r.id} r={r} devicesMap={devicesMap} centers={centers} navigate={navigate} />
            ))}
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default ServisJobsPage;