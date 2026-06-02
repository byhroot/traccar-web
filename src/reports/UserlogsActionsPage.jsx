import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, IconButton, Button, Box, Chip, Paper,
  Grid, Divider, Tooltip, Badge, OutlinedInput, Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import CloseIcon from '@mui/icons-material/Close';
import BarChartIcon from '@mui/icons-material/BarChart';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from '../settings/components/SearchHeader';
import UserLogsActionPageCard from './UserLogsActionPageCard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
const ACTION_META = {
  login: { color: 'success', label: 'Giriş', hex: '#22c55e' },
  socketlogin: { color: 'success', label: 'Socket Giriş', hex: '#16a34a' },
  logout: { color: 'default', label: 'Çıkış', hex: '#64748b' },
  create: { color: 'primary', label: 'Oluşturuldu', hex: '#3b82f6' },
  edit: { color: 'warning', label: 'Düzenlendi', hex: '#f59e0b' },
  remove: { color: 'error', label: 'Silindi', hex: '#ef4444' },
  denied: { color: 'error', label: 'Reddedildi', hex: '#dc2626' },
  link: { color: 'secondary', label: 'Bağlandı', hex: '#8b5cf6' },
  unlink: { color: 'warning', label: 'Ayrıldı', hex: '#f59e0b' },
  command: { color: 'warning', label: 'Komut', hex: '#f97316' },
  accumulators: { color: 'secondary', label: 'Akümülatör', hex: '#a855f7' },
  report: { color: 'info', label: 'Rapor', hex: '#0ea5e9' },
};

const actionChip = (type) => {
  const meta = ACTION_META[type] || { color: 'default', label: type };
  return (
    <Chip
      label={meta.label}
      color={meta.color}
      size="small"
      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
    />
  );
};

// ─── Alan adından hangi store'a bakılacağını çıkar ───────────────────────────
// "changes.groupId" → "group", "changes.deviceId" → "device" vs.
const FIELD_TO_STORE = {
  groupid: 'group',
  deviceid: 'device',
  driverid: 'driver',
  userid: 'user',
  maintenanceid: 'maintenance',
  geofenceid: 'geofence',
  calendarid: 'calendar',
  notificationid: 'notification',
  categoryid: 'category',
};

// ─── İstatistik Kartı (tam ekran dialog) ─────────────────────────────────────
const StatsDialog = ({ open, onClose, items, users, userNames, deviceNames }) => {
  if (!items.length) return null;

  const actionCounts = items.reduce((acc, i) => {
    acc[i.actionType] = (acc[i.actionType] || 0) + 1;
    return acc;
  }, {});

  const userCounts = items.reduce((acc, i) => {
    const name = userNames[i.userId] || `#${i.userId}`;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const objectCounts = items.reduce((acc, i) => {
    if (i.objectType) acc[i.objectType] = (acc[i.objectType] || 0) + 1;
    return acc;
  }, {});

  const topUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]);
  const topObjects = Object.entries(objectCounts).sort((a, b) => b[1] - a[1]);
  const maxUserCount = topUsers[0]?.[1] || 1;

  return (
    <Dialog open={open} onClose={onClose} fullScreen
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0f0f1a 0%, #141428 100%)',
          color: '#e2e8f0',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(99,179,237,0.15)',
        background: 'rgba(99,179,237,0.07)',
        py: 2,
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <BarChartIcon sx={{ color: '#63b3ed' }} />
          <Typography fontWeight={700} fontSize="1.1rem" color="#90cdf4">Log İstatistikleri</Typography>
          <Chip label={`${items.length} kayıt`} size="small"
            sx={{ bgcolor: 'rgba(99,179,237,0.15)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.3)', height: 22 }} />
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#718096' }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Toplam İşlem', value: items.length, color: '#63b3ed' },
            { label: 'Benzersiz Kullanıcı', value: Object.keys(userCounts).length, color: '#68d391' },
            { label: 'İşlem Türü', value: Object.keys(actionCounts).length, color: '#b794f4' },
            { label: 'Nesne Türü', value: Object.keys(objectCounts).length, color: '#f6ad55' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}30`, borderRadius: 3 }}>
                <Typography fontSize="2rem" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                <Typography variant="caption" color="#718096">{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="overline" color="#90cdf4" fontWeight={700} sx={{ mb: 1.5, display: 'block' }}>İşlem Türleri</Typography>
            <Paper sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              {topActions.map(([type, count], i) => {
                const pct = Math.round((count / items.length) * 100);
                const meta = ACTION_META[type] || { label: type };
                return (
                  <Box key={type}>
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight={600} color="#e2e8f0">{meta.label || type}</Typography>
                          <Typography variant="body2" color="#718096">{count} <span style={{ fontSize: '0.7rem' }}>({pct}%)</span></Typography>
                        </Box>
                        <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: '#63b3ed', borderRadius: 2, transition: 'width 0.6s ease' }} />
                        </Box>
                      </Box>
                    </Box>
                    {i < topActions.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                  </Box>
                );
              })}
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography variant="overline" color="#68d391" fontWeight={700} sx={{ mb: 1.5, display: 'block' }}>En Aktif Kullanıcılar</Typography>
            <Paper sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              {topUsers.map(([name, count], i) => {
                const pct = Math.round((count / maxUserCount) * 100);
                return (
                  <Box key={name}>
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600} color="#e2e8f0">{name}</Typography>
                        <Typography variant="body2" color="#718096">{count}</Typography>
                      </Box>
                      <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: '#68d391', borderRadius: 2 }} />
                      </Box>
                    </Box>
                    {i < topUsers.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                  </Box>
                );
              })}
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="overline" color="#f6ad55" fontWeight={700} sx={{ mb: 1.5, display: 'block' }}>Nesne Türleri</Typography>
            <Paper sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2 }}>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {topObjects.map(([type, count]) => (
                  <Chip key={type} label={`${type} (${count})`} size="small"
                    sx={{ bgcolor: 'rgba(246,173,85,0.12)', color: '#f6ad55', border: '1px solid rgba(246,173,85,0.25)', fontWeight: 600, fontSize: '0.72rem' }} />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

// ─── Attributes Dialog ────────────────────────────────────────────────────────
const AttributesDialog = ({ open, onClose, attributes, actionType, resolveChangeValue }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
    PaperProps={{
      sx: {
        borderRadius: 3,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(99,179,237,0.2)',
        color: '#e2e8f0',
      }
    }}
  >
    <DialogTitle sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid rgba(99,179,237,0.15)',
      color: '#90cdf4', fontWeight: 700, fontSize: '0.95rem',
    }}>
      <Box display="flex" alignItems="center" gap={1}>
        <FilterListIcon fontSize="small" />
        Detaylar {actionType && actionChip(actionType)}
      </Box>
      <IconButton onClick={onClose} size="small" sx={{ color: '#718096' }}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent sx={{ pt: 2 }}>
      {attributes && Object.keys(attributes).length > 0 ? (
        <Box>
          {Object.entries(attributes).map(([key, val]) => {
            // "changes.XxxId" formatındaki değerleri isimle göster
            const displayVal = resolveChangeValue ? resolveChangeValue(key, val) : val;
            const isResolved = displayVal !== val;

            return (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'flex-start',
                  gap: { xs: 0.5, sm: 2 },
                  py: 1,
                  minWidth: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Typography
                  variant="body2"
                  color="#63b3ed"
                  fontWeight={600}
                  sx={{
                    width: { xs: '100%', sm: 180 },
                    flexShrink: 0,
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {key}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    color="#e2e8f0"
                    sx={{
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {typeof displayVal === 'object' ? JSON.stringify(displayVal, null, 2) : String(displayVal)}
                  </Typography>
                  {/* Orijinal ID değerini soluk göster */}
                  {isResolved && (
                    <Typography variant="caption" color="#4a5568" sx={{ fontFamily: 'monospace' }}>
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography color="#718096" fontStyle="italic" sx={{ py: 2 }}>Ek bilgi yok</Typography>
      )}
    </DialogContent>
  </Dialog>
);

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
const ActionsPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();

  // Redux store'dan lookup map'leri
  const deviceMap = useSelector((state) => state.devices.items);
  const groupMap = useSelector((state) => state.groups.items);
  const geofenceMap = useSelector((state) => state.geofences.items);

  const [items, setItems] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [deviceNames, setDeviceNames] = useState({});
  const [groupNames, setGroupNames] = useState({});
  const [driverNames, setDriverNames] = useState({});
  const [maintenanceNames, setMaintenanceNames] = useState({});
  const [calendarNames, setCalendarNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Filtreler
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('');
  const [selectedObjectType, setSelectedObjectType] = useState('');
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hiddenUserIds, setHiddenUserIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('actions-hidden-users') || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(
      'actions-hidden-users',
      JSON.stringify(hiddenUserIds)
    );
  }, [hiddenUserIds]);

  const toggleHiddenUser = (userId) => {
    setHiddenUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Dialoglar
  const [statsOpen, setStatsOpen] = useState(false);
  const [attrDialog, setAttrDialog] = useState({ open: false, attributes: null, actionType: null });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [uRes, dRes, gRes, drRes, mRes, cRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/devices'),
          fetch('/api/groups'),
          fetch('/api/drivers'),
          fetch('/api/maintenance'),
          fetch('/api/calendars'),
        ]);
        const [uData, dData, gData, drData, mData, cData] = await Promise.all([
          uRes.json(), dRes.json(), gRes.json(),
          drRes.ok ? drRes.json() : [],
          mRes.ok ? mRes.json() : [],
          cRes.ok ? cRes.json() : [],
        ]);
        setUsers(uData);
        setUserNames(uData.reduce((a, u) => ({ ...a, [u.id]: u.name }), {}));
        setDeviceNames(dData.reduce((a, d) => ({ ...a, [d.id]: d.name }), {}));
        setGroupNames(gData.reduce((a, g) => ({ ...a, [g.id]: g.name }), {}));
        setDriverNames(drData.reduce((a, d) => ({ ...a, [d.id]: d.name }), {}));
        setMaintenanceNames(mData.reduce((a, m) => ({ ...a, [m.id]: m.name }), {}));
        setCalendarNames(cData.reduce((a, c) => ({ ...a, [c.id]: c.name }), {}));
      } catch (e) { /* ignore */ }
    };
    fetchAll();
  }, []);

  // "changes.groupId": "87 -> 33"  →  "Filo A -> Filo B"
  const resolveId = useCallback((storeKey, id) => {
    const numId = Number(id);
    if (Number.isNaN(numId)) return id;
    switch (storeKey) {
      case 'device': return deviceNames[numId] || deviceMap[numId]?.name || `#${id}`;
      case 'group': return groupNames[numId] || groupMap[numId]?.name || `#${id}`;
      case 'user': return userNames[numId] || `#${id}`;
      case 'driver': return driverNames[numId] || `#${id}`;
      case 'maintenance': return maintenanceNames[numId] || `#${id}`;
      case 'calendar': return calendarNames[numId] || `#${id}`;
      case 'geofence': return geofenceMap[numId]?.name || `#${id}`;
      default: return id;
    }
  }, [deviceNames, groupNames, userNames, driverNames, maintenanceNames, calendarNames, deviceMap, groupMap, geofenceMap]);

  const resolveChangeValue = useCallback((key, val) => {
    if (typeof val !== 'string') return val;

    // Hangi alan? "changes.groupId" → "groupid"
    const fieldKey = key.split('.').pop().toLowerCase();
    const storeKey = FIELD_TO_STORE[fieldKey];
    if (!storeKey) return val;

    // "87 -> 33" formatı mı?
    const arrowMatch = val.match(/^(\S+)\s*->\s*(\S+)$/);
    if (arrowMatch) {
      const fromName = resolveId(storeKey, arrowMatch[1]);
      const toName = resolveId(storeKey, arrowMatch[2]);
      return `${fromName} → ${toName}`;
    }

    // "(yeni) -> 33" formatı
    const newMatch = val.match(/^\(yeni\)\s*->\s*(\S+)$/);
    if (newMatch) {
      return `(yeni) → ${resolveId(storeKey, newMatch[1])}`;
    }

    // "87 -> (silindi)" formatı
    const deletedMatch = val.match(/^(\S+)\s*->\s*\(silindi\)$/);
    if (deletedMatch) {
      return `${resolveId(storeKey, deletedMatch[1])} → (silindi)`;
    }

    // Tekil ID
    return resolveId(storeKey, val);
  }, [resolveId]);

  const onShow = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (from) query.append('from', from);
      if (to) query.append('to', to);
      if (selectedUserId) query.append('userId', selectedUserId);
      if (selectedActionType) query.append('actionType', selectedActionType);
      if (selectedObjectType) query.append('objectType', selectedObjectType);
      if (selectedObjectId) query.append('objectId', selectedObjectId);

      const response = await fetch(`/api/actions?${query.toString()}`);
      if (!response.ok) throw Error(await response.text());
      const data = await response.json();
      setItems(data.sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime)));
    } finally {
      setLoading(false);
    }
  });

  const resolveObjectName = (item) => {
    if (!item.objectId) return '-';
    if (item.objectType === 'device') return deviceNames[item.objectId] || `#${item.objectId}`;
    if (item.objectType === 'user') return users.find((u) => u.id === item.objectId)?.name || `#${item.objectId}`;
    if (item.objectType === 'group') return groupNames[item.objectId] || `#${item.objectId}`;
    if (item.objectType === 'driver') return driverNames[item.objectId] || `#${item.objectId}`;
    if (item.objectType === 'maintenance') return maintenanceNames[item.objectId] || `#${item.objectId}`;
    if (item.objectType === 'calendar') return calendarNames[item.objectId] || `#${item.objectId}`;
    if (item.objectType === 'geofence') return geofenceMap[item.objectId]?.name || `#${item.objectId}`;
    return item.objectId;
  };

  const distinctObjectTypes = [...new Set(items.map((i) => i.objectType).filter(Boolean))];

  const objectOptions = selectedObjectType === 'device'
    ? Object.entries(deviceNames).map(([id, name]) => ({ id: Number(id), name }))
    : selectedObjectType === 'user'
      ? users.map((u) => ({ id: u.id, name: u.name }))
      : selectedObjectType === 'group'
        ? Object.entries(groupNames).map(([id, name]) => ({ id: Number(id), name }))
        : selectedObjectType === 'driver'
          ? Object.entries(driverNames).map(([id, name]) => ({ id: Number(id), name }))
          : selectedObjectType === 'maintenance'
            ? Object.entries(maintenanceNames).map(([id, name]) => ({ id: Number(id), name }))
            : selectedObjectType === 'calendar'
              ? Object.entries(calendarNames).map(([id, name]) => ({ id: Number(id), name }))
              : [];

  const filteredItems = items
    .filter((item) => !hiddenUserIds.includes(item.userId))
    .filter(filterByKeyword(searchKeyword));
  const [logsCardOpen, setLogsCardOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const logUsers = [...new Set(items.map(i => i.userId))]
    .map(id => ({
      id,
      name: userNames[id] || `#${id}`
    }));
  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'actionsTitle']}>
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Kullanıcı Filtreleri ({hiddenUserIds.length} gizli)
        </AccordionSummary>

        <AccordionDetails>
          <Box display="flex" gap={1} flexWrap="wrap">
            {logUsers.map((u) => (
              <Chip
                key={u.id}
                label={u.name}
                onClick={() => toggleHiddenUser(u.id)}
                color={hiddenUserIds.includes(u.id) ? 'default' : 'primary'}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
      {items.length > 0 && (
        <Box sx={{ px: 2, pt: 1 }}>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={2}>
            <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => setStatsOpen(true)}
              sx={{ borderColor: 'rgba(99,179,237,0.4)', color: '#63b3ed', borderRadius: 2, fontWeight: 600, '&:hover': { bgcolor: 'rgba(99,179,237,0.08)', borderColor: '#63b3ed' } }}>
              İstatistikler
              <Badge badgeContent={items.length} max={9999} color="info" sx={{ ml: 1.5 }} />
            </Button>
            <Button variant="contained" startIcon={<BarChartIcon />} onClick={() => setLogsCardOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Gelişmiş Analiz
            </Button>
          </Box>
        </Box>
      )}

      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

      <ReportFilter onShow={onShow} deviceType="none" loading={loading}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 170, mr: 1 }}>
          <InputLabel>Kullanıcı</InputLabel>
          <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} label="Kullanıcı">
            <MenuItem value=""><em>Tümü</em></MenuItem>
            {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 160, mr: 1 }}>
          <InputLabel>İşlem Türü</InputLabel>
          <Select value={selectedActionType} onChange={(e) => setSelectedActionType(e.target.value)} label="İşlem Türü">
            <MenuItem value=""><em>Tümü</em></MenuItem>
            {Object.keys(ACTION_META).map((type) => (
              <MenuItem key={type} value={type}>{ACTION_META[type].label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 1 }}>
          <InputLabel>Nesne Türü</InputLabel>
          <Select value={selectedObjectType}
            onChange={(e) => { setSelectedObjectType(e.target.value); setSelectedObjectId(''); }}
            label="Nesne Türü">
            <MenuItem value=""><em>Tümü</em></MenuItem>
            {distinctObjectTypes.length > 0
              ? distinctObjectTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)
              : ['device', 'user', 'group', 'geofence', 'driver', 'calendar', 'attribute', 'notification', 'maintenance'].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))
            }
          </Select>
        </FormControl>

        {selectedObjectType && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 1 }}>
            {objectOptions.length > 0 && (
              <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Nesne</InputLabel>
                <Select
                  value={objectOptions.some(o => String(o.id) === String(selectedObjectId)) ? selectedObjectId : ''}
                  onChange={(e) => setSelectedObjectId(e.target.value)}
                  label="Nesne"
                >
                  <MenuItem value=""><em>Tümü</em></MenuItem>
                  {objectOptions.map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl variant="outlined" size="small" sx={{ width: 120 }}>
              <InputLabel>Manuel ID</InputLabel>
              <OutlinedInput
                value={selectedObjectId}
                onChange={(e) => setSelectedObjectId(e.target.value)}
                label="Manuel ID"
                type="number"
              />
            </FormControl>
          </Box>
        )}
      </ReportFilter>

      <Table
        className={classes.table}
        size="small"
        sx={{ tableLayout: 'fixed', width: '100%', '& .MuiTableCell-root': { px: 1, py: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' } }}
      >
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                width: isMobile ? 52 : 145,
                fontWeight: 700,
                fontSize: '0.75rem',
                color: '#90cdf4'
              }}
            >
              Tarih
            </TableCell>
            {!isMobile && <TableCell sx={{ width: 115, fontWeight: 700, fontSize: '0.75rem', color: '#90cdf4' }}>IP</TableCell>}
            <TableCell sx={{ width: isMobile ? 90 : 140, fontWeight: 700, fontSize: '0.75rem', color: '#90cdf4' }}>Kullanıcı</TableCell>
            <TableCell sx={{ width: 95, fontWeight: 700, fontSize: '0.75rem', color: '#90cdf4' }}>İşlem</TableCell>
            {!isMobile && <TableCell sx={{ width: 90, fontWeight: 700, fontSize: '0.75rem', color: '#90cdf4' }}>Tür</TableCell>}
            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#90cdf4' }}>Nesne</TableCell>
            <TableCell align="center" sx={{ width: 56, minWidth: 56, maxWidth: 56, px: 0.5, fontWeight: 700, fontSize: '0.75rem', color: '#90cdf4' }}>Detay</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {!loading ? filteredItems.map((item) => (
            <TableRow
              key={item.id}
              hover
              onClick={() => {
                if (isMobile) {
                  setAttrDialog({
                    open: true,
                    attributes: {
                      ...item.attributes,
                      ip: item.address || '-',
                      objectType: item.objectType || '-',
                      objectName: resolveObjectName(item),
                      user: userNames[item.userId] || `#${item.userId}`,
                    },
                    actionType: item.actionType,
                  });
                }
              }}
              sx={{ cursor: isMobile ? 'pointer' : 'default', '&:hover': { bgcolor: 'rgba(99,179,237,0.04)' } }}
            >
              <TableCell
                sx={{
                  width: isMobile ? 55 : 145,
                  fontSize: '0.72rem',
                  color: '#a0aec0',
                  lineHeight: 1.1,
                }}
              >
                {item.actionTime ? (
                  isMobile ? (
                    <>
                      {new Date(item.actionTime).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                      <br />
                      {new Date(item.actionTime).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  ) : (
                    formatTime(item.actionTime, 'DD.MM.YYYY HH:mm:ss')
                  )
                ) : '-'}
              </TableCell>
              {!isMobile && <TableCell sx={{ width: 115, fontSize: '0.72rem', fontFamily: 'monospace', color: '#718096' }}>{item.address || '-'}</TableCell>}

              <TableCell sx={{ width: isMobile ? 90 : 140, fontSize: '0.75rem', fontWeight: 600 }}>
                {userNames[item.userId] || `#${item.userId}`}
              </TableCell>

              <TableCell sx={{ width: 95 }}>
                {actionChip(item.actionType)}
              </TableCell>

              {!isMobile && (
                <TableCell sx={{ width: 90 }}>
                  {item.objectType ? (
                    <Chip label={item.objectType} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20, color: '#f6ad55', borderColor: 'rgba(246,173,85,0.4)' }} />
                  ) : '-'}
                </TableCell>
              )}

              <TableCell sx={{ fontSize: '0.75rem' }}>
                {resolveObjectName(item)}
              </TableCell>

              <TableCell align="center" sx={{ width: 56, minWidth: 56, maxWidth: 56, px: 0.5 }}>
                {item.attributes && Object.keys(item.attributes).length > 0 ? (
                  <Tooltip title="Detayları gör">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttrDialog({
                          open: true,
                          attributes: {
                            ...item.attributes,
                            ip: item.address || '-',
                            objectType: item.objectType || '-',
                            objectName: resolveObjectName(item),
                            user: userNames[item.userId] || `#${item.userId}`,
                          },
                          actionType: item.actionType,
                        });
                      }}
                      sx={{ color: '#63b3ed', '&:hover': { bgcolor: 'rgba(99,179,237,0.1)' } }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Typography variant="caption" color="#4a5568">—</Typography>
                )}
              </TableCell>
            </TableRow>
          )) : (
            <TableShimmer columns={isMobile ? 4 : 7} />
          )}
        </TableBody>
      </Table>

      <StatsDialog open={statsOpen} onClose={() => setStatsOpen(false)}
        items={items} users={users} userNames={userNames} deviceNames={deviceNames} />

      <AttributesDialog
        open={attrDialog.open}
        onClose={() => setAttrDialog({ open: false, attributes: null, actionType: null })}
        attributes={attrDialog.attributes}
        actionType={attrDialog.actionType}
        resolveChangeValue={resolveChangeValue}
      />

      <Dialog open={logsCardOpen} onClose={() => setLogsCardOpen(false)} fullScreen maxWidth="xl">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Kullanıcı Log Analizi
          <IconButton onClick={() => setLogsCardOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <UserLogsActionPageCard items={items} users={users} userNames={userNames} deviceNames={deviceNames} />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default ActionsPage;