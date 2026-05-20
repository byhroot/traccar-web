import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  IconButton, Collapse, Box, Typography, Chip,
  Grid, Divider, Stack, Switch, FormControlLabel, TableFooter,
  useMediaQuery, useTheme, Paper, Tabs, Tab, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, List, ListItem, ListItemText, ListItemIcon,
  Badge, LinearProgress, Alert,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HistoryIcon from '@mui/icons-material/History';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { useCatch, useEffectAsync } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import { useAdministrator, useManager } from '../common/util/permissions';
import SearchHeader from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

// ─── LocalStorage Cache ───────────────────────────────────────────────────────
const CACHE_KEY = 'usersPage_globalCache';
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), ...data }));
  } catch { /* storage full */ }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ─── Action Log Icon ──────────────────────────────────────────────────────────
function ActionTypeIcon({ type }) {
  const map = {
    login: <LoginOutlinedIcon fontSize="small" color="primary" />,
    socketlogin: <LoginOutlinedIcon fontSize="small" color="info" />,
    logout: <LoginOutlinedIcon fontSize="small" color="warning" />,
    create: <AddCircleOutlineIcon fontSize="small" color="success" />,
    update: <EditOutlinedIcon fontSize="small" color="warning" />,
    remove: <RemoveCircleOutlineIcon fontSize="small" color="error" />,
    link: <LinkOutlinedIcon fontSize="small" color="secondary" />,
    unlink: <LinkOutlinedIcon fontSize="small" color="error" />,
  };
  return map[type] || <CheckCircleOutlineIcon fontSize="small" />;
}

// ─── User Logs Dialog ─────────────────────────────────────────────────────────
const UserLogsDialog = ({ open, onClose, userId, userName }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffectAsync(async () => {
    if (!open || !userId) return;

    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const to = now.toISOString().replace('Z', '+00:00');
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().replace('Z', '+00:00');
      const res = await fetchOrThrow(
        `/api/actions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&userId=${userId}`
      );
      setLogs(await res.json());
    } catch (e) {
      setError(e.message || 'Loglar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [open, userId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <HistoryIcon color="primary" />
          <Typography variant="h6">Son 24 Saat Logları</Typography>
          <Typography variant="body2" color="textSecondary">— {userName}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading && <LinearProgress />}
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {!loading && !error && logs.length === 0 && (
          <Box p={3} textAlign="center">
            <Typography color="textSecondary">Son 24 saatte işlem bulunamadı.</Typography>
          </Box>
        )}
        {!loading && logs.length > 0 && (
          <List dense disablePadding>
            {logs.map((log, idx) => (
              <ListItem
                key={log.id}
                divider
                sx={{ px: 2, py: 0.75, bgcolor: idx % 2 === 0 ? 'background.paper' : 'action.hover' }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ActionTypeIcon type={log.actionType} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip label={log.actionType} size="small" variant="outlined" sx={{ fontSize: '11px', height: 20 }} />
                      {log.objectType && (
                        <Typography variant="caption" color="textSecondary">
                          {log.objectType} #{log.objectId}
                        </Typography>
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Typography variant="caption">{formatTime(log.actionTime, 'seconds')}</Typography>
                      <Typography variant="caption" color="textSecondary">IP: {log.address}</Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Device Node ──────────────────────────────────────────────────────────────
const DeviceNode = ({ device }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.3 }}>
    <DirectionsCarIcon sx={{ fontSize: 16, color: device.disabled ? 'text.disabled' : 'primary.main', flexShrink: 0 }} />
    <Box>
      <Typography variant="body2" fontWeight={500} lineHeight={1.2}>{device.name}</Typography>
      <Typography variant="caption" color="textSecondary">{device.id}</Typography>
    </Box>
    <Chip
      label={device.status || 'unknown'}
      size="small"
      sx={{ height: 18, fontSize: '10px', ml: 0.5 }}
      color={device.status === 'online' ? 'success' : device.status === 'offline' ? 'default' : 'warning'}
    />
    {device.disabled && <Chip label="Disabled" size="small" sx={{ height: 18, fontSize: '10px' }} />}
  </Stack>
);

// ─── Group Node (recursive) ───────────────────────────────────────────────────
const GroupNode = ({ group, allGroups, allDevices, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const childGroups = allGroups.filter((g) => g.groupId === group.id);
  const childDevices = allDevices.filter((d) => d.groupId === group.id);
  const hasChildren = childGroups.length > 0 || childDevices.length > 0;

  return (
    <Box
      sx={{
        ml: depth > 0 ? 2 : 0,
        borderLeft: depth > 0 ? '2px solid' : 'none',
        borderColor: 'divider',
        pl: depth > 0 ? 1.5 : 0,
        mt: 0.5,
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{ cursor: hasChildren ? 'pointer' : 'default', '&:hover': hasChildren ? { opacity: 0.8 } : {} }}
        onClick={() => hasChildren && setExpanded((p) => !p)}
      >
        {hasChildren ? (
          <IconButton size="small" sx={{ p: 0.2 }}>
            {expanded ? <KeyboardArrowUpIcon sx={{ fontSize: 16 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}
        {expanded
          ? <FolderOpenIcon sx={{ fontSize: 18, color: 'warning.main', flexShrink: 0 }} />
          : <FolderIcon sx={{ fontSize: 18, color: 'warning.light', flexShrink: 0 }} />
        }
        <Typography variant="body2" fontWeight={600}>{group.name}</Typography>
        {childDevices.length > 0 && (
          <Chip label={`${childDevices.length} cihaz`} size="small" sx={{ height: 18, fontSize: '10px' }} />
        )}
      </Stack>

      <Collapse in={expanded} timeout="auto">
        <Box>
          {childGroups.map((cg) => (
            <GroupNode key={cg.id} group={cg} allGroups={allGroups} allDevices={allDevices} depth={depth + 1} />
          ))}
          {childDevices.map((d) => (
            <Box key={d.id} sx={{ ml: 3, mt: 0.5 }}>
              <DeviceNode device={d} />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// ─── Accordion Content ────────────────────────────────────────────────────────
const UserAccordionContent = ({
  item, allGroups, allDevices, userGroupIds, userDeviceIds,
  loadingConnections, isMobile, t, onOpenLogs, admin, userSubUsers
}) => {
  const userGroups = allGroups.filter((g) => userGroupIds.includes(g.id));
  const topLevelGroups = userGroups.filter((g) => !g.groupId || !userGroups.find((pg) => pg.id === g.groupId));
  const directDevices = allDevices.filter((d) => userDeviceIds.includes(d.id));

  return (
    <Box sx={{ margin: isMobile ? 1 : 2, padding: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FingerprintIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="caption" color="textSecondary">User ID</Typography>
              <Typography variant="body2" fontWeight="bold">#{item.id}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EmailIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="caption" color="textSecondary">{t('userEmail')}</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{item.email}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PhoneIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="caption" color="textSecondary">{t('sharedPhone')}</Typography>
              <Typography variant="body2">{item.phone || '—'}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }} />
          <Stack direction="row" spacing={isMobile ? 2 : 4} mt={1} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="textSecondary">{t('userExpirationTime')}</Typography>
              <Typography variant="body2" fontWeight={500}>
                {item.expirationTime ? formatTime(item.expirationTime, 'date') : '∞'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Cihaz Limiti</Typography>
              <Typography variant="body2" fontWeight={500}>{item.deviceLimit === -1 ? '∞' : item.deviceLimit}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">SMS Limiti</Typography>
              <Typography variant="body2" fontWeight={500}>{item.attributes?.smsLimit || 0}</Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
      {admin &&
        <Box mt={2}>
          <Button size="small" variant="outlined" startIcon={<HistoryIcon />} onClick={onOpenLogs} sx={{ borderRadius: 2 }}>
            Logs
          </Button>
        </Box>
      }
      <Divider sx={{ my: 2 }} />

      {loadingConnections ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} />
          <Typography variant="caption" color="textSecondary">Bağlantılar yükleniyor…</Typography>
        </Stack>
      ) : topLevelGroups.length === 0 && directDevices.length === 0 ? (
        <Typography variant="caption" color="textSecondary">Bu kullanıcıya bağlı grup veya cihaz bulunamadı.</Typography>
      ) : (
        <>
          {topLevelGroups.length > 0 && (
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Gruplar
              </Typography>
              {topLevelGroups.map((g) => (
                <GroupNode key={g.id} group={g} allGroups={allGroups} allDevices={allDevices} depth={0} />
              ))}
            </Box>
          )}
          {directDevices.length > 0 && (
            <Box mt={topLevelGroups.length > 0 ? 2 : 0}>
              <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Doğrudan Bağlı Cihazlar
              </Typography>
              <Stack mt={0.5} spacing={0.5}>
                {directDevices.map((d) => <DeviceNode key={d.id} device={d} />)}
              </Stack>
            </Box>
          )}
          {userSubUsers.length > 0 && (
            <Box mt={2}>
              <Typography
                variant="caption"
                color="textSecondary"
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Alt Kullanıcılar
              </Typography>

              <Stack mt={0.5} spacing={0.5}>
                {userSubUsers.map((u) => (
                  <Stack
                    key={u.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ py: 0.3 }}
                  >
                    <VerifiedUserIcon
                      sx={{ fontSize: 16, color: 'info.main', flexShrink: 0 }}
                    />

                    <Box>
                      <Typography variant="body2" fontWeight={500} lineHeight={1.2}>
                        {u.name}
                      </Typography>

                      <Typography variant="caption" color="textSecondary">
                        #{u.id}
                        {u.email ? ` • ${u.email}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// ─── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({
  item, manager, classes, actionLogin, actionConnections,
  setTimestamp, t, allGroups, allDevices, connectionCache, connectionsReady, admin, onConnectionFetched, subUsersRes // ← EKLENDİ
}) => {
  const [open, setOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [lazyLoading, setLazyLoading] = useState(false); // ← EKLENDİ

  const isPro = item.attributes?.smsLimit >= 10;
  const isManager = useManager();
  const isuserManager = item.userLimit !== 0;
  const conn = connectionCache[item.id];
  // Show spinner in accordion only while global batch is still in progress

  const loadingConnections = (!connectionsReady && !conn) || lazyLoading;


  const handleFetchConnection = async () => {
    if (lazyLoading) return;
    setLazyLoading(true);
    try {
      const [groupsRes, devicesRes, subUsersRes] = await Promise.all([
        fetchOrThrow(`/api/groups?userId=${item.id}`),
        fetchOrThrow(`/api/devices?userId=${item.id}`),
        fetchOrThrow(`/api/users?userId=${item.id}&excludeAttributes=true`),

      ]);
      const [groups, devices, subUsers] = await Promise.all([groupsRes.json(), devicesRes.json(), subUsersRes.json(),
      ]);
      onConnectionFetched(item.id, {
        groupIds: groups.map((g) => g.id),
        deviceIds: devices.map((d) => d.id),
        subUsers: subUsers.map((u) => ({ ...u, parentUserId: item.id }))
      });
    } catch {
      onConnectionFetched(item.id, { groupIds: [], deviceIds: [], subUsers: [] });
    } finally {
      setLazyLoading(false);
    }
  };

  return (
    <>
      <TableRow
        sx={{
          bgcolor: open
            ? 'action.selected'
            : item.disabled
              ? 'action.hover'
              : 'inherit',

          transition: 'all 0.2s ease',

          '& > *': {
            borderBottom: open ? '0 !important' : '2px solid',
            borderColor: 'divider',
          },

          ...(open && {
            boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
          }),
        }}
      >
        <TableCell
          padding="none"
          sx={{
            width: 20,
            minWidth: 20,
            maxWidth: 20,
            px: 0,
          }}
        >         <IconButton
          size="small"
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next && isManager && !admin) handleFetchConnection();
          }}
          sx={{
            p: 0.25,
            width: 28,
            height: 28,
          }}
        >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        {!isMobile && (
          <TableCell sx={{ py: isMobile ? 1 : 1.5 }}>
            <Typography variant="body2" color="textSecondary">#{item.id}</Typography>
          </TableCell>
        )}

        <TableCell sx={{ py: isMobile ? 1 : 1.5 }}>
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                fontWeight={600}
                noWrap
                sx={{ maxWidth: isMobile ? 140 : 'unset' }}
              >{item.name}</Typography>
              {isMobile && <Typography variant="caption" color="textSecondary">(#{item.id})</Typography>}
              {item.administrator && (
                <Chip size="small" icon={<AdminPanelSettingsIcon />} label="Admin" color="error" variant="outlined" />
              )}
              {/* Refresh butonu — sadece conn yoksa veya yenilemek isteyince */}
              <Tooltip title={conn ? 'Bağlantıları yenile' : 'Bağlantıları yükle'}>
                <span>
                  <IconButton size="small" onClick={handleFetchConnection} disabled={lazyLoading} sx={{ p: 0.3 }}>
                    <SyncIcon
                      sx={{
                        fontSize: 20,
                        color: 'success.main',
                        animation: lazyLoading ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            {isMobile && <Typography variant="caption" color="textSecondary">{item.email}</Typography>}
            <Stack
              direction="row"
              spacing={0.5}
              mt={0.5}
              flexWrap="wrap"
              useFlexGap
            >              {isuserManager && (
              <Chip size="small" icon={<VerifiedUserIcon />} label="Manager" color="primary" variant="outlined" />
            )}
              {isPro && (
                <Chip size="small" label="PRO" sx={{ bgcolor: 'gold', color: 'black', fontWeight: 'bold', fontSize: '10px', height: '20px' }} />
              )}
              {conn && (
                <>
                  {conn.groupIds?.length > 0 && (
                    <Chip
                      size="small"
                      icon={<FolderIcon />}
                      label={`Grup (${conn.groupIds.length})`}
                      variant="outlined"
                      color="warning"
                      sx={{ height: 22, fontSize: '11px' }}
                    />
                  )}

                  {conn.deviceIds?.length > 0 && (
                    <Chip
                      size="small"
                      icon={<DirectionsCarIcon />}
                      label={`Araç (${conn.deviceIds.length})`}
                      variant="outlined"
                      color="success"
                      sx={{ height: 22, fontSize: '11px' }}
                    />
                  )}
                  {conn.subUsers?.length > 0 && (
                    <Chip
                      size="small"
                      icon={<FolderIcon />}
                      label={`Kullanıcı (${conn.subUsers.length})`}
                      variant="outlined"
                      color="default"
                      sx={{ height: 22, fontSize: '11px' }}
                    />
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </TableCell>

        {!isMobile && <TableCell>{item.email}</TableCell>}

        <TableCell
          align="center"
          sx={{
            width: 50,
            minWidth: 50,
            maxWidth: 50,
            px: 0.5,
          }}
        >
          <Tooltip
            title={item.disabled
              ? t('sharedDisabled')
              : t('sharedEnabled')}
          >
            <Box display="flex" justifyContent="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: item.disabled
                    ? 'text.disabled'
                    : 'success.main',
                }}
              />
            </Box>
          </Tooltip>
        </TableCell>

        <TableCell className={classes.columnAction} padding="none">
          <CollectionActions
            itemId={item.id}
            editPath="/settings/user"
            endpoint="users"
            setTimestamp={setTimestamp}
            customActions={admin ? [actionLogin, actionConnections] : [actionConnections]}
          />
        </TableCell>
      </TableRow>

      <TableRow
        sx={{
          bgcolor: open ? 'action.selected' : 'inherit',

          '& > *': {
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
        }}
      >
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isMobile ? 4 : 6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <UserAccordionContent
              item={item}
              allGroups={allGroups}
              allDevices={allDevices}
              userGroupIds={conn?.groupIds || []}
              userDeviceIds={conn?.deviceIds || []}
              loadingConnections={loadingConnections}
              userSubUsers={conn?.subUsers || []}
              isMobile={isMobile}
              t={t}
              onOpenLogs={() => setLogsOpen(true)}
              admin={admin}
            />
          </Collapse>
        </TableCell>
      </TableRow>

      <UserLogsDialog open={logsOpen} onClose={() => setLogsOpen(false)} userId={item.id} userName={item.name} />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 75;

const UsersPage = () => {
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const manager = useManager();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const admin = useAdministrator();
  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [connectionCache, setConnectionCache] = useState({});
  // connectionsReady = true once ALL user connections have been fetched
  const [connectionsReady, setConnectionsReady] = useState(false);
  // fetchProgress: null when idle, { done, total } while fetching
  const [fetchProgress, setFetchProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheTime, setCacheTime] = useState(null);
  // YENİ
  const handleConnectionFetched = useCallback((userId, data) => {
    setConnectionCache((prev) => {
      const updated = { ...prev, [userId]: data };
      const cached = readCache();
      // Cache'deki groups/devices'ı kullan, yoksa state'ten al
      // allGroups/allDevices closure yerine cache'den okuyoruz — stale değer riski yok
      writeCache({
        groups: cached?.groups ?? [],
        devices: cached?.devices ?? [],
        connections: updated,   // mevcut tüm connections üzerine bu user'ı ekle/güncelle
      });
      return updated;
    });
  }, []); // dependency yok — cache'den okuduğu için
  // ── Batch-fetch connections for all users ──────────────────────────────────
  const fetchAllConnections = useCallback(async (users, existingConnections = {}) => {
    // Only fetch users whose connections aren't already cached
    // YENİ
    const missing = users.filter((u) => !existingConnections[u.id]);
    if (missing.length === 0) {
      setFetchProgress(null);
      return existingConnections;
    }
    const connections = { ...existingConnections };
    setFetchProgress({ done: 0, total: missing.length });

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (user) => {
          try {
            const [groupsRes, devicesRes, subUsersRes] = await Promise.all([
              fetchOrThrow(`/api/groups?userId=${user.id}`),
              fetchOrThrow(`/api/devices?userId=${user.id}`),
              fetchOrThrow(`/api/users?userId=${user.id}&excludeAttributes=true`),
            ]);

            const [groups, devices, subUsers] = await Promise.all([
              groupsRes.json(),
              devicesRes.json(),
              subUsersRes.json(),
            ]);

            connections[user.id] = {
              groupIds: groups.map((g) => g.id),
              deviceIds: devices.map((d) => d.id),
              subUsers,
            };
          } catch {
            connections[user.id] = { groupIds: [], deviceIds: [] };
          }
        })
      );
      // Update state progressively so rows become usable as data arrives
      setConnectionCache({ ...connections });
      setFetchProgress({ done: Math.min(i + BATCH_SIZE, missing.length), total: missing.length });

      if (i + BATCH_SIZE < missing.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    setFetchProgress(null);
    return connections;
  }, []);

  // ── Load: try cache, else fetch fresh ─────────────────────────────────────
  useEffectAsync(async () => {
    setLoading(true);
    setConnectionsReady(false);
    try {
      await loadFreshData();
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const loadFreshData = async () => {
    setRefreshing(true);
    try {
      const cached = readCache();

      // Users her zaman taze çek
      const usersRes = await fetchOrThrow('/api/users?excludeAttributes=false');
      const users = (await usersRes.json()).sort((a, b) => b.id - a.id);
      setItems(users);

      // Groups + Devices: cache varsa kullan, yoksa fetch et
      let groups, devices;
      if (cached?.groups && cached?.devices) {
        groups = cached.groups;
        devices = cached.devices;
      } else {
        const [groupsRes, devicesRes] = await Promise.all([
          fetchOrThrow('/api/groups'),
          fetchOrThrow('/api/devices'),
        ]);
        [groups, devices] = await Promise.all([groupsRes.json(), devicesRes.json()]);
      }
      setAllGroups(groups);
      setAllDevices(devices);

      // Connections: cache'dekini hemen yükle, eksikleri batch fetch et
      const existingConnections = cached?.connections || {};
      setConnectionCache(existingConnections);

      const connections = await fetchAllConnections(users, existingConnections);
      setConnectionsReady(true);

      setCacheTime(Date.now());
      // users'ı cache'e yazmıyoruz, her seferinde taze çekiyoruz
      writeCache({ groups, devices, connections });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    clearCache();
    setConnectionCache({});
    setConnectionsReady(false);
    await loadFreshData();
  }, []);

  const handleLogin = useCatch(async (userId) => {
    await fetchOrThrow(`/api/session/${userId}`);
    window.location.replace('/');
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (userId) => navigate(`/settings/user/${userId}/connections`),
  };

  // Recursively collect all descendant group IDs from a root set
  const getAllDescendantGroupIds = useCallback((rootIds, groups) => {
    const result = new Set(rootIds);
    let changed = true;
    while (changed) {
      changed = false;
      groups.forEach((g) => {
        if (g.groupId && result.has(g.groupId) && !result.has(g.id)) {
          result.add(g.id);
          changed = true;
        }
      });
    }
    return result;
  }, []);

  // Deep search map: userId → searchable string covering all connected groups+devices (incl. nested)
  const userConnectionSearchMap = useMemo(() => {
    const map = {};
    Object.entries(connectionCache).forEach(([userId, conn]) => {
      // All groups reachable from this user (direct + nested children)
      const allGroupIds = getAllDescendantGroupIds(conn.groupIds || [], allGroups);

      const groupText = allGroups
        .filter((g) => allGroupIds.has(g.id))
        .map((g) => g.name?.toLowerCase() || '')
        .join(' ');

      // Devices directly assigned to user
      const directDeviceText = allDevices
        .filter((d) => (conn.deviceIds || []).includes(d.id))
        .map((d) => [d.name, d.uniqueId, d.phone, d.contact, d.model, d.category].filter(Boolean).join(' ').toLowerCase())
        .join(' ');

      // Devices belonging to any of the user's groups (via device.groupId)
      const groupDeviceText = allDevices
        .filter((d) => d.groupId && allGroupIds.has(d.groupId))
        .map((d) => [d.name, d.uniqueId, d.phone, d.contact, d.model, d.category].filter(Boolean).join(' ').toLowerCase())
        .join(' ');

      map[userId] = [groupText, directDeviceText, groupDeviceText].filter(Boolean).join(' ');
    });
    return map;
  }, [connectionCache, allGroups, allDevices, getAllDescendantGroupIds]);

  const filteredItems = useMemo(() => items.filter((u) => {
    if (!temporary && u.temporary) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const userFields = [u.name, u.email, u.phone, String(u.id)].filter(Boolean).join(' ').toLowerCase();
      const connFields = userConnectionSearchMap[u.id] || '';
      if (!userFields.includes(kw) && !connFields.includes(kw)) return false;
    }
    switch (filterType) {
      case 'pro': return u.attributes?.smsLimit >= 10;
      case 'manager': return u.userLimit !== 0;
      case 'servis': return u.attributes?.servis === true;
      case 'admin': return u.administrator;
      default: return true;
    }
  }), [items, searchKeyword, temporary, filterType, userConnectionSearchMap]);

  const counts = useMemo(() => ({
    pro: items.filter((u) => u.attributes?.smsLimit >= 10).length,
    manager: items.filter((u) => u.userLimit !== 0).length,
    servis: items.filter((u) => u.attributes?.servis === true).length,
    admin: items.filter((u) => u.administrator).length,
  }), [items]);

  const progressPct = fetchProgress
    ? Math.round((fetchProgress.done / fetchProgress.total) * 100)
    : null;

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsUsers']}>
      {/* Top progress bar: full blue during user load, segmented orange during batch fetch */}
      {(refreshing || fetchProgress) && (
        <Box sx={{ position: 'sticky', top: 0, zIndex: 1200 }}>
          <LinearProgress
            variant={fetchProgress ? 'determinate' : 'indeterminate'}
            value={progressPct ?? 0}
            color={fetchProgress ? 'warning' : 'primary'}
          />
          {fetchProgress && (
            <Box sx={{ bgcolor: 'warning.light', px: 2, py: 0.3 }}>
              <Typography variant="caption" color="warning.contrastText">
                Bağlantılar yükleniyor… {fetchProgress.done}/{fetchProgress.total} kullanıcı
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Search + Refresh */}
      <Stack direction="row" alignItems="center" spacing={1} px={1} pt={1}>
        <Box flex={1}>
          <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
        </Box>
        <Tooltip
          title={
            fetchProgress
              ? `Bağlantılar yükleniyor (${fetchProgress.done}/${fetchProgress.total})`
              : cacheTime
                ? `Son güncelleme: ${new Date(cacheTime).toLocaleTimeString('tr-TR')} — Yenile`
                : 'Yenile'
          }
        >
          <span>
            <IconButton onClick={handleRefresh} disabled={refreshing || !!fetchProgress} color="primary" size="small">
              <Badge color="warning" variant="dot" invisible={connectionsReady && !fetchProgress}>
                <SyncIcon
                  sx={{
                    animation: (refreshing || fetchProgress) ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
                  }}
                />
              </Badge>
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Filter Tabs */}
      <Paper square sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', position: 'relative', zIndex: 1100 }}>
        <Tabs
          value={filterType}
          onChange={(_, val) => setFilterType(val)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{ px: 2, minHeight: 48 }}
        >
          <Tab label={`Hepsi (${items.length})`} value="all" sx={{ fontWeight: 'bold' }} />
          {counts.pro > 0 && <Tab label={`PRO (${counts.pro})`} value="pro" sx={{ fontWeight: 'bold' }} />}
          {counts.manager > 0 && <Tab label={`Manager (${counts.manager})`} value="manager" sx={{ fontWeight: 'bold' }} />}
          {counts.servis > 0 && <Tab label={`Servis (${counts.servis})`} value="servis" sx={{ fontWeight: 'bold' }} />}
          {counts.admin > 0 && <Tab label={`Admin (${counts.admin})`} value="admin" sx={{ fontWeight: 'bold' }} />}
        </Tabs>
      </Paper>

      {/* Table */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table className={classes.table} stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ height: '40px', bgcolor: 'background.default' }}>
              <TableCell padding="checkbox" sx={{ py: 0, height: '40px' }} />
              {!isMobile && <TableCell sx={{ py: 0, fontWeight: 'bold' }}>ID</TableCell>}
              <TableCell sx={{ py: 0, fontWeight: 'bold' }}>{t('sharedName')}</TableCell>
              {!isMobile && <TableCell sx={{ py: 0, fontWeight: 'bold' }}>{t('userEmail')}</TableCell>}
              <TableCell sx={{ py: 0, fontWeight: 'bold' }}>{isMobile ? '' : t('sharedDisabled')}</TableCell>
              <TableCell className={classes.columnAction} sx={{ py: 0 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              filteredItems.map((item) => (
                <UserRow
                  key={item.id}
                  item={item}
                  manager={manager}
                  classes={classes}
                  actionLogin={actionLogin}
                  actionConnections={actionConnections}
                  setTimestamp={setTimestamp}
                  t={t}
                  allGroups={allGroups}
                  allDevices={allDevices}
                  connectionCache={connectionCache}
                  connectionsReady={connectionsReady}
                  admin={admin}
                  onConnectionFetched={handleConnectionFetched}
                />
              ))
            ) : (
              <TableShimmer columns={isMobile ? 4 : 6} endAction />
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={isMobile ? 4 : 6} align="right">
                <FormControlLabel
                  control={<Switch checked={temporary} onChange={(e) => setTemporary(e.target.checked)} size="small" />}
                  label={t('userTemporary')}
                  labelPlacement="start"
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Box>

      <CollectionFab editPath="/settings/user" />
    </PageLayout>
  );
};

export default UsersPage;