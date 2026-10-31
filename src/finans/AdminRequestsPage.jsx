import { useState, useReducer, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Chip, Avatar, Collapse, Divider,
  TextField, InputAdornment, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, IconButton, Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildIcon from '@mui/icons-material/Build';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync } from '../reactHelper';
import { formatTime } from '../common/util/formatter';

const PAGE_SIZE = 20;

const statusColor = (s) => ({ PENDING: 'warning', PENDING_OWNER_REG: 'warning', APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default', CANCELLED: 'error' }[s] || 'default');
const statusLabel = (s) => ({ PENDING: 'Bekliyor', PENDING_OWNER_REG: 'Sahip Bekleniyor', APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapalı', CANCELLED: 'İptal' }[s] || s);
const typeLabel = (t) => ({ MONTAJ: 'Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer Talepler' }[t] || t);
const typeColor = (t) => ({ MONTAJ: '#1976d2', DEVIR: '#7b1fa2', DEMONTAJ: '#ed6c02', DIGER: '#d32f2f' }[t] || '#888');

const TABS = [
  { label: 'Bekleyen', statuses: ['PENDING', 'PENDING_OWNER_REG'] },
  { label: 'Aktif', statuses: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
  { label: 'Onay', statuses: ['ADMIN_REVIEW'] },
  { label: 'Kapalı', statuses: ['CLOSED', 'CANCELLED'] },
  { label: 'Tümü', statuses: null },
];

// ── Talep kartı ──────────────────────────────────────────────────────────────
const RequestCard = ({ r, users, devicesMap, centers, navigate }) => {
  const [expanded, setExpanded] = useState(false);

  const customer = users[r.userId];
  const center = centers.find((c) => c.id === r.serviceCenterId);
  const serviceUser = r.serviceUserId > 0 ? users[r.serviceUserId] : null;

  const devices = useMemo(() => {
    if (!r.deviceIds || r.deviceIds === '{}') return [];
    return r.deviceIds.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean)
      .map((did) => devicesMap[did]).filter(Boolean);
  }, [r.deviceIds, devicesMap]);

  return (
    <Card elevation={0} sx={{
      border: '1px solid',
      borderColor: r.status === 'ADMIN_REVIEW' ? 'warning.main' : 'divider',
      borderRadius: 2, overflow: 'hidden', transition: '0.12s',
      '&:hover': { boxShadow: 1 },
    }}>
      {/* Ana satır */}
      <Box onClick={() => navigate(`/finans/admin/request/${r.id}`)}
        sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>

        {/* Tip avatar */}
        <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(typeColor(r.type), 0.12), flexShrink: 0 }}>
          <Box sx={{ color: typeColor(r.type) }}>
            {r.type === 'DEVIR' ? <SwapHorizIcon sx={{ fontSize: 17 }} /> : <BuildIcon sx={{ fontSize: 17 }} />}
          </Box>
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Satır 1: ID + tip + durum */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.2 }}>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: 13 }}>#{r.id}</Typography>
            <Chip size="small" label={typeLabel(r.type)}
              sx={{ fontSize: 16, height: 16, bgcolor: alpha(typeColor(r.type), 0.1), color: typeColor(r.type) }} />
            <Chip size="small" label={statusLabel(r.status)} color={statusColor(r.status)} sx={{ fontSize: 12, height: 16 }} />
          </Box>

          {/* Satır 2: Müşteri */}
          {customer && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.15 }}>
              <PersonIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11 }}>{customer.name}</Typography>
              {customer.phone && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>· {customer.phone}</Typography>}
            </Box>
          )}

          {/* Satır 3: Araçlar */}
          {devices.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.15 }}>
              <DirectionsCarIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
              <Typography variant="caption" noWrap sx={{ fontSize: 11, maxWidth: { xs: 160, sm: 280 } }}>
                {devices.map((d) => d.name).join(', ')}
              </Typography>
              {devices.length > 1 && (
                <Chip size="small" label={devices.length} color="primary" variant="outlined" sx={{ fontSize: 9, height: 14, ml: 0.25 }} />
              )}
            </Box>
          )}

          {/* Satır 4: Şehir + servis + tarih */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {r.city && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                <LocationOnIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{r.city}</Typography>
              </Box>
            )}
            {center && (
              <Typography variant="caption" color="primary" sx={{ fontSize: 10 }}>· {center.name}</Typography>
            )}
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>· {formatTime(r.createdAt, 'date')}</Typography>
          </Box>
        </Box>

        {/* Sağ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
          <IconButton size="small">{expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
          <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
        </Box>
      </Box>

      {/* Accordion */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1.25 }}>

          {/* Müşteri detay */}
          {customer && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9, display: 'block', mb: 0.5 }}>Müşteri</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#1976d2', 0.1), color: '#1976d2', fontSize: 12, fontWeight: 700 }}>
                  {customer.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="caption" fontWeight={700} display="block">{customer.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {customer.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}><PhoneIcon sx={{ fontSize: 10, color: 'text.disabled' }} /><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{customer.phone}</Typography></Box>}
                    {customer.email && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{customer.email}</Typography>}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Araç detayları */}
          {devices.length > 0 && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9, display: 'block', mb: 0.5 }}>Araçlar</Typography>
              {devices.map((d) => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, '&:last-child': { mb: 0 } }}>
                  <Chip size="small" label={d.status === 'online' ? '●' : '○'} color={d.status === 'online' ? 'success' : 'default'} sx={{ fontSize: 9, height: 14, minWidth: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} display="block" sx={{ fontSize: 11 }}>{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 9 }}>{d.uniqueId}</Typography>
                  </Box>
                  {d.attributes?.ruhsatEslesti && <Chip size="small" label="✓" color="success" sx={{ fontSize: 9, height: 14 }} />}
                </Box>
              ))}
            </Box>
          )}

          {/* Devir bilgileri */}
          {r.type === 'DEVIR' && r.newOwnerEmail && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9, display: 'block', mb: 0.5 }}>Yeni Sahip</Typography>
              <Typography variant="caption" fontWeight={700} display="block">{r.newOwnerName}</Typography>
              <Typography variant="caption" color="text.secondary">{r.newOwnerEmail}</Typography>
              {r.newOwnerUserId === 0 && <Chip size="small" label="Kayıt bekleniyor" color="warning" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />}
            </Box>
          )}

          {/* Servis + teknisyen */}
          {(center || serviceUser) && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9, display: 'block', mb: 0.5 }}>Servis</Typography>
              {center && <Typography variant="caption" fontWeight={700} display="block">{center.name} — {center.city}</Typography>}
              {serviceUser && <Typography variant="caption" color="text.secondary">{serviceUser.name}{serviceUser.phone ? ` · ${serviceUser.phone}` : ''}</Typography>}
            </Box>
          )}

          {/* Sipariş + notlar */}
          {/* Sipariş + notlar */}
          {(r.orderItems || r.notes) && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              {r.orderItems && (
                <Typography variant="caption" display="block"><strong>Sipariş:</strong> {r.orderItems}</Typography>
              )}
              {r.notes && (() => {
                // parseNotes inline — import eklemeden
                let notesArr = [];
                try {
                  const parsed = JSON.parse(r.notes);
                  notesArr = Array.isArray(parsed) ? parsed : [{ type: 'customer', text: String(parsed) }];
                } catch {
                  notesArr = r.notes.trim() ? [{ type: 'customer', text: r.notes.trim() }] : [];
                }
                if (!notesArr.length) return null;
                const typeColor = { customer: '#1976d2', admin: '#7b1fa2', servis: '#2e7d32' };
                const typeLabel = { customer: 'Müşteri', admin: 'Admin', servis: 'Servis' };
                return (
                  <Box sx={{ mt: r.orderItems ? 0.75 : 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {notesArr.map((n, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                        <Box sx={{ width: 2, borderRadius: 4, bgcolor: typeColor[n.type] || '#888', flexShrink: 0, alignSelf: 'stretch', mt: 0.25 }} />
                        <Box>
                          <Typography variant="caption" sx={{ fontSize: 11, display: 'block' }}>{n.text}</Typography>
                          <Chip size="small" label={typeLabel[n.type] || n.type}
                            sx={{ height: 13, fontSize: 9, bgcolor: `${typeColor[n.type]}18`, color: typeColor[n.type], '& .MuiChip-label': { px: 0.5 }, mt: 0.25 }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                );
              })()}
            </Box>
          )}

          {/* Tarihler */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Oluşturulma: {formatTime(r.createdAt, 'date')}</Typography>
            {r.completedAt && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Tamamlanma: {formatTime(r.completedAt, 'date')}</Typography>}
            {r.closedAt && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Kapatılma: {formatTime(r.closedAt, 'date')}</Typography>}
          </Box>

          {/* Detay butonu */}
          <Box onClick={() => navigate(`/finans/admin/request/${r.id}`)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 0.75, borderRadius: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
            <Typography variant="caption" fontWeight={700} color="primary" sx={{ fontSize: 11 }}>Detay / Yönet</Typography>
            <ArrowForwardIosIcon sx={{ fontSize: 10, color: 'primary.main' }} />
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

// ── Ana sayfa ────────────────────────────────────────────────────────────────
const AdminRequestsPage = () => {
  const navigate = useNavigate();
  const devicesMap = useSelector((s) => s.devices.items);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [reloadKey] = useReducer((k) => k + 1, 0);

  // Ham veri
  const [allRequests, setAllRequests] = useState([]);
  const [centers, setCenters] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  // Filtreler
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Debounce için ref
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 300);
  };

  useEffectAsync(async () => {
    setLoading(true);
    const [reqRes, centersRes, usersRes] = await Promise.all([
      fetch('/api/service-requests'),
      fetch('/api/service-centers'),
      fetch('/api/users?excludeAttributes=false'),
    ]);
    if (reqRes.ok) setAllRequests(await reqRes.json());
    if (centersRes.ok) setCenters(await centersRes.json());
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(Object.fromEntries(data.map((u) => [u.id, u])));
    }
    setLoading(false);
  }, [reloadKey]);

  // Filtrelenmiş liste
  const filtered = useMemo(() => {
    const tabStatuses = TABS[tab].statuses;
    return allRequests.filter((r) => {
      if (tabStatuses && !tabStatuses.includes(r.status)) return false;
      if (typeFilter && r.type !== typeFilter) return false;
      if (centerFilter && String(r.serviceCenterId) !== String(centerFilter)) return false;
      if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      // ID
      if (String(r.id).includes(q)) return true;
      // Müşteri
      const cust = users[r.userId];
      if (cust?.name?.toLowerCase().includes(q)) return true;
      if (cust?.phone?.includes(q)) return true;
      if (cust?.email?.toLowerCase().includes(q)) return true;
      // Araç
      if (r.deviceIds && r.deviceIds !== '{}') {
        const devMatch = r.deviceIds.replace(/[{}]/g, '').split(',').map(Number).filter(Boolean)
          .some((did) => {
            const d = devicesMap[did];
            return d?.name?.toLowerCase().includes(q) || d?.uniqueId?.toLowerCase().includes(q);
          });
        if (devMatch) return true;
      }
      // Şehir, sipariş, not
      if (r.city?.toLowerCase().includes(q)) return true;
      if (r.orderItems?.toLowerCase().includes(q)) return true;
      if (r.newOwnerEmail?.toLowerCase().includes(q)) return true;
      if (r.newOwnerName?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [allRequests, tab, typeFilter, centerFilter, dateFrom, dateTo, debouncedSearch, users, devicesMap]);

  const tabCounts = useMemo(() =>
    TABS.map((t) => t.statuses ? allRequests.filter((r) => t.statuses.includes(r.status)).length : allRequests.length),
    [allRequests]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = [typeFilter, centerFilter, dateFrom, dateTo].filter(Boolean).length;

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', 'Tüm Talepler']}>
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>

        {/* Tab bar */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 2, overflowX: 'auto', pb: 0.5 }}>
          {TABS.map((t, i) => (
            <Box key={t.label} onClick={() => { setTab(i); setPage(1); }} sx={{
              px: 1.25, py: 0.6, borderRadius: 2, cursor: 'pointer', flexShrink: 0,
              bgcolor: tab === i ? 'primary.main' : 'action.hover',
              color: tab === i ? 'primary.contrastText' : 'text.secondary',
              display: 'flex', alignItems: 'center', gap: 0.5,
            }}>
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11 }}>{t.label}</Typography>
              {tabCounts[i] > 0 && (
                <Box sx={{ bgcolor: tab === i ? 'rgba(255,255,255,0.25)' : 'action.selected', borderRadius: 10, px: 0.6, minWidth: 18, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontSize: 9, fontWeight: 700 }}>{tabCounts[i]}</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Arama + filtre toggle */}
        <Box sx={{ display: 'flex', gap: 1, mb: showFilters ? 1 : 2 }}>
          <TextField size="small" placeholder="Ara: #id, müşteri, araç, plaka, IMEI, şehir..." value={search}
            onChange={(e) => handleSearchChange(e.target.value)} sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <Box onClick={() => setShowFilters((v) => !v)} sx={{
            display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.75,
            border: '1px solid', borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
            borderRadius: 1, cursor: 'pointer', bgcolor: activeFilterCount > 0 ? 'primary.50' : 'transparent',
          }}>
            <TuneIcon sx={{ fontSize: 16, color: activeFilterCount > 0 ? 'primary.main' : 'text.secondary' }} />
            <Typography variant="caption" color={activeFilterCount > 0 ? 'primary' : 'text.secondary'}>
              Filtre{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Typography>
          </Box>
        </Box>

        {/* Genişletilmiş filtreler */}
        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Tip</InputLabel>
              <Select value={typeFilter} label="Tip" onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tümü</MenuItem>
                {['MONTAJ', 'DEMONTAJ', 'DEVIR', 'DIGER'].map((t) => (
                  <MenuItem key={t} value={t}>{typeLabel(t)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Servis Merkezi</InputLabel>
              <Select value={centerFilter} label="Servis Merkezi" onChange={(e) => { setCenterFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tümü</MenuItem>
                {centers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField size="small" type="date" label="Başlangıç" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              InputLabelProps={{ shrink: true }} sx={{ minWidth: 130 }} />

            <TextField size="small" type="date" label="Bitiş" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              InputLabelProps={{ shrink: true }} sx={{ minWidth: 130 }} />

            {activeFilterCount > 0 && (
              <Box onClick={() => { setTypeFilter(''); setCenterFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'error.light', cursor: 'pointer', '&:hover': { bgcolor: 'error.50' } }}>
                <Typography variant="caption" color="error">Temizle</Typography>
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Sonuç özeti */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} talep{filtered.length !== allRequests.length ? ` / toplam ${allRequests.length}` : ''}
          </Typography>
          {totalPages > 1 && (
            <Typography variant="caption" color="text.secondary">
              Sayfa {page} / {totalPages}
            </Typography>
          )}
        </Box>

        {/* Liste */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : paginated.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <FilterListIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">
              {debouncedSearch || activeFilterCount > 0 ? 'Arama kriterlerine uyan talep bulunamadı' : 'Bu kategoride talep yok'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 2 }}>
            {paginated.map((r) => (
              <RequestCard key={r.id} r={r} users={users} devicesMap={devicesMap} centers={centers} navigate={navigate} />
            ))}
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 10 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => { setPage(v); window.scrollTo(0, 0); }}
              size="small"
              color="primary"
              siblingCount={1}
            />
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default AdminRequestsPage;