import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  IconButton, Collapse, Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, Select, FormControl, InputLabel, Chip, Avatar,
  Tooltip, CircularProgress, Alert, Paper, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import PublishIcon from '@mui/icons-material/Publish';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableRowsIcon from '@mui/icons-material/TableRows';
import SchemaIcon from '@mui/icons-material/Schema';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { useAdministrator, useManager, useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import CollectionActionsGroup from './components/CollectionActionsGroup';
import GroupsManagerFab from './GroupsManagerFab';
// ─── Grup Değiştirme Dialogu ─────────────────────────────────────────────────
const ChangeGroupDialog = ({ open, onClose, device, groups, onSuccess }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(device?.groupId ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Tüm cihaz bilgilerini gönderiyoruz, sadece groupId'yi değiştiriyoruz
        body: JSON.stringify({ ...device, groupId: selectedGroupId }),
      });
      if (!response.ok) throw new Error('Kayıt başarısız');
      onSuccess();
      onClose();
    } catch (e) {
      setError('Grup değiştirme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };
  const [editGroupId, setEditGroupId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleGroupEdit = useCallback((groupId) => {
    setEditGroupId(groupId);
    setEditOpen(true);
  }, []);
  if (!device) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid rgba(99,179,237,0.2)',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        borderBottom: '1px solid rgba(99,179,237,0.15)',
        pb: 2, fontWeight: 700, fontSize: '1rem',
      }}>
        <DriveFileMoveIcon />
        Grup Değiştir — {device.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <FormControl fullWidth>
          <InputLabel >Yeni Grup</InputLabel>
          <Select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            label="Yeni Grup"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99,179,237,0.3)' },
              '& .MuiSvgIcon-root': { color: '#90cdf4' },
            }}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving}
          sx={{ color: '#90cdf4', borderColor: 'rgba(99,179,237,0.3)', borderRadius: 2 }}
          variant="outlined">
          İptal
        </Button>
        <Button onClick={handleSave} disabled={saving} variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DriveFileMoveIcon />}
          sx={{
            background: 'linear-gradient(135deg, #3182ce, #2b6cb0)',
            borderRadius: 2, fontWeight: 600,
            '&:hover': { background: 'linear-gradient(135deg, #4299e1, #3182ce)' },
          }}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Cihaz Satırı (Liste görünümü için) ──────────────────────────────────────
const DeviceListItem = ({ device, isLast, manager, onGroupChange }) => (
  <Box key={device.id}>
    <ListItemButton sx={{ py: 0.75, px: 2, '&:hover': { bgcolor: 'rgba(99,179,237,0.08)' } }}>
      <ListItemIcon sx={{ minWidth: 36 }}>
        <FiberManualRecordIcon
          sx={{ fontSize: 10, color: device.status === 'online' ? '#48bb78' : '#718096' }}
        />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" fontWeight={600} >{device.name}</Typography>
        }
        secondary={
          <Typography variant="caption" color={device.status === 'online' ? '#48bb78' : '#718096'}>
            {device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
            {device.contact && ` · ${device.contact}`}
          </Typography>
        }
      />
      {manager && (
        <Tooltip title="Grubu Değiştir">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onGroupChange(device); }}
            sx={{ color: '#005998', '&:hover': { bgcolor: 'rgba(99,179,237,0.15)' } }}>
            <DriveFileMoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </ListItemButton>
    {!isLast && <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />}
  </Box>
);

// ─── Diagram Görünümü ─────────────────────────────────────────────────────────
const DiagramView = ({ groups, devices, manager, onGroupChange }) => {
  // Sadece kök grupları (groupId === 0 veya null) göster
  const rootGroups = groups.filter((g) => !g.groupId || g.groupId === 0);
  const ungrouped = devices.filter((d) => !d.groupId || d.groupId === 0);

  const renderGroupNode = (group, depth = 0) => {
    const groupDevices = devices.filter((d) => d.groupId === group.id);
    const subGroups = groups.filter((g) => g.groupId === group.id);

    return (
      <Box key={group.id} sx={{ position: 'relative', ml: depth > 0 ? 3 : 0 }}>
        {/* Dikey bağlantı çizgisi */}
        {depth > 0 && (
          <Box sx={{
            position: 'absolute', left: -20, top: 28, bottom: 0,
            width: 2, bgcolor: 'rgba(99,179,237,0.25)',
          }} />
        )}
        {depth > 0 && (
          <Box sx={{
            position: 'absolute', left: -20, top: 28,
            width: 18, height: 2, bgcolor: 'rgba(99,179,237,0.25)',
          }} />
        )}

        <Paper sx={{
          mb: 2,
          background: depth === 0
            ? 'linear-gradient(135deg, rgba(49,130,206,0.18) 0%, rgba(43,108,176,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(128,90,213,0.14) 0%, rgba(107,70,193,0.08) 100%)',
          border: depth === 0 ? '1px solid rgba(99,179,237,0.3)' : '1px solid rgba(159,122,234,0.25)',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: '0 4px 24px rgba(99,179,237,0.15)' },
        }}>
          {/* Grup Başlığı */}
          <Box sx={{
            px: 2, py: 1.5,
            background: depth === 0 ? 'rgba(99,179,237,0.12)' : 'rgba(159,122,234,0.12)',
            display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <AccountTreeIcon sx={{ fontSize: 18 }} />
            <Typography fontWeight={700} fontSize="0.9rem"
            >
              {group.name}
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {groupDevices.length > 0 && (
                <Chip size="small" icon={<DirectionsCarIcon style={{ fontSize: 12 }} />}
                  label={groupDevices.length}
                  sx={{
                    bgcolor: 'rgba(72,187,120,0.15)', color: '#029339',
                    border: '1px solid rgba(72,187,120,0.3)',
                    height: 22, '& .MuiChip-icon': { color: '#008734' },
                  }} />
              )}
              {subGroups.length > 0 && (
                <Chip size="small" icon={<AccountTreeIcon style={{ fontSize: 12 }} />}
                  label={subGroups.length}
                  sx={{
                    bgcolor: 'rgba(159,122,234,0.15)', color: '#4c02b5',
                    border: '1px solid rgba(159,122,234,0.3)',
                    height: 22, '& .MuiChip-icon': { color: '#4f06b4' },
                  }} />
              )}
            </Box>
          </Box>

          {/* Bu gruba bağlı cihazlar */}
          {groupDevices.length > 0 && (
            <Box sx={{ px: 2, py: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {groupDevices.map((device) => (
                  <Chip
                    key={device.id}
                    avatar={
                      <Avatar sx={{
                        bgcolor: device.status === 'online' ? 'rgba(72,187,120,0.2)' : 'rgba(113,128,150,0.2)',
                        width: 20, height: 20,
                      }}>
                        <FiberManualRecordIcon sx={{
                          fontSize: 8,
                          color: device.status === 'online' ? '#48bb78' : '#718096',
                        }} />
                      </Avatar>
                    }
                    label={device.name}
                    size="small"
                    onClick={manager ? () => onGroupChange(device) : undefined}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.75rem',
                      cursor: manager ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                      '&:hover': manager ? {
                        bgcolor: 'rgba(99,179,237,0.15)',
                        borderColor: 'rgba(99,179,237,0.4)',
                      } : {},
                    }}
                    onDelete={manager ? () => onGroupChange(device) : undefined}
                    deleteIcon={manager
                      ? <Tooltip title="Grubu Değiştir"><DriveFileMoveIcon style={{ fontSize: 14, }} /></Tooltip>
                      : undefined}
                  />
                ))}
              </Box>
            </Box>
          )}

          {groupDevices.length === 0 && subGroups.length === 0 && (
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                Bu grupta cihaz veya alt grup yok
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Alt grupları recursive render et */}
        {subGroups.length > 0 && (
          <Box sx={{ position: 'relative' }}>
            {subGroups.map((sg) => renderGroupNode(sg, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {rootGroups.map((g) => renderGroupNode(g, 0))}

      {/* Gruba bağlı olmayan cihazlar */}
      {ungrouped.length > 0 && (
        <Paper sx={{
          mt: 1,
          border: '1px solid rgba(237,137,54,0.25)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <Box sx={{
            px: 2, py: 1.5,
            background: 'rgba(237,137,54,0.12)',
            display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <DirectionsCarIcon sx={{ fontSize: 18, color: '#f6ad55' }} />
            <Typography fontWeight={700} fontSize="0.9rem" color="#fbd38d">
              Grupsuz Araçlar
            </Typography>
            <Chip size="small" label={ungrouped.length}
              sx={{
                ml: 'auto', bgcolor: 'rgba(237,137,54,0.15)',
                color: '#f6ad55', border: '1px solid rgba(237,137,54,0.3)', height: 22,
              }} />
          </Box>
          <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ungrouped.map((device) => (
              <Chip
                key={device.id}
                avatar={
                  <Avatar sx={{ bgcolor: 'transparent', width: 20, height: 20 }}>
                    <FiberManualRecordIcon sx={{
                      fontSize: 8,
                      color: device.status === 'online' ? '#48bb78' : '#718096',
                    }} />
                  </Avatar>
                }
                label={device.name}
                size="small"
                onClick={manager ? () => onGroupChange(device) : undefined}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', fontSize: '0.75rem',
                  cursor: manager ? 'pointer' : 'default',
                  '&:hover': manager ? {
                    bgcolor: 'rgba(237,137,54,0.15)',
                    borderColor: 'rgba(237,137,54,0.4)',
                  } : {},
                }}
                onDelete={manager ? () => onGroupChange(device) : undefined}
                deleteIcon={manager
                  ? <Tooltip title="Grubu Değiştir"><DriveFileMoveIcon style={{ fontSize: 14, color: '#f6ad55' }} /></Tooltip>
                  : undefined}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

// ─── Grup Satırı (Liste görünümü için) ───────────────────────────────────────
const GroupRow = ({
  item, allGroups, devices, admin, navigate, classes,
  actionConnections, actionCommand, limitCommands, setTimestamp,
  manager, onGroupChange,
}) => {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  const groupDevices = devices.filter((d) => d.groupId === item.id);
  const subGroups = allGroups.filter((g) => g.groupId === item.id);
  const [expandedSubGroup, setExpandedSubGroup] = useState(null);
  // GroupRow içinde:
  const getAllDescendantDeviceCount = (groupId) => {
    const direct = devices.filter((d) => String(d.groupId) === String(groupId)).length;
    const subs = allGroups.filter((g) => String(g.groupId) === String(groupId));
    return direct + subs.reduce((sum, sg) => sum + getAllDescendantDeviceCount(sg.id), 0);
  };

  const totalDeviceCount = getAllDescendantDeviceCount(item.id);
  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          bgcolor: open ? 'rgba(99,179,237,0.05)' : 'transparent',
          transition: 'background 0.2s',
          '&:hover': { bgcolor: 'rgba(99,179,237,0.07)' },
        }}
      >
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen(!open)}
            sx={{ color: open ? '#63b3ed' : '#718096' }}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <AccountTreeIcon sx={{ fontSize: 18, color: '#63b3ed', opacity: 0.8 }} />
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {item.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ ml: 1 }}>
              <Chip
                size="small"
                icon={<DirectionsCarIcon style={{ fontSize: 12 }} />}
                label={groupDevices.length}
                sx={{
                  bgcolor: 'rgba(72,187,120,0.12)',
                  border: '1px solid rgba(72,187,120,0.25)',
                  height: 20,
                }}
              />
              {subGroups.length > 0 && (
                <Chip
                  size="small"
                  icon={<AccountTreeIcon style={{ fontSize: 12 }} />}
                  label={subGroups.length}
                  sx={{
                    bgcolor: 'rgba(159,122,234,0.12)',
                    border: '1px solid rgba(159,122,234,0.25)',
                    height: 20, '& .MuiChip-icon': {},
                  }}
                />
              )}
            </Box>
          </Box>
        </TableCell>

        <TableCell className={classes.columnAction} padding="none">
          <CollectionActionsGroup
            itemId={item.id}
            editPath="/settings/group"
            endpoint="groups"
            setTimestamp={setTimestamp}
            customActions={limitCommands ? [actionConnections] : [actionConnections, actionCommand]}
            hasDevices={totalDeviceCount > 0}
            groups={allGroups}
          />
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ my: 1.5, ml: 5, mr: 2, pb: 2 }}>

              {/* Alt Gruplar */}
              {subGroups.length > 0 && (
                <Box mb={2}>
                  <Typography variant="overline" color="#35894d"
                    display="flex" alignItems="center" gap={0.75} sx={{ mb: 1, fontSize: '0.7rem' }}>
                    <AccountTreeIcon fontSize="small" /> Alt Gruplar
                  </Typography>
                  <List disablePadding sx={{
                    bgcolor: 'rgba(159,122,234,0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(159,122,234,0.2)',
                    overflow: 'hidden',
                  }}>
                    {subGroups.map((subGroup, index) => {
                      const subDevices = devices.filter((d) => d.groupId === subGroup.id);
                      const isExpanded = expandedSubGroup === subGroup.id;

                      return (
                        <Box key={subGroup.id}>
                          <ListItemButton
                            onClick={() => setExpandedSubGroup(isExpanded ? null : subGroup.id)}
                            sx={{ py: 0.75, '&:hover': { bgcolor: 'rgba(159,122,234,0.1)' } }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <AccountTreeIcon sx={{ fontSize: 16 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={600} >
                                  {subGroup.name}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption">
                                  {subDevices.length} araç
                                </Typography>
                              }
                            />
                            {subDevices.length > 0 && (
                              isExpanded
                                ? <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                                : <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                            )}
                          </ListItemButton>

                          {/* Alt grubun araçları */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <List disablePadding sx={{
                              ml: 4, mr: 1, mb: 0.5,
                              bgcolor: 'rgba(72,187,120,0.04)',
                              borderRadius: 2,
                              border: '1px solid rgba(72,187,120,0.12)',
                              overflow: 'hidden',
                            }}>
                              {subDevices.map((device, di) => (
                                <DeviceListItem
                                  key={device.id}
                                  device={device}
                                  isLast={di === subDevices.length - 1}
                                  manager={manager}
                                  onGroupChange={onGroupChange}
                                />
                              ))}
                            </List>
                          </Collapse>

                          {index < subGroups.length - 1 && (
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                          )}
                        </Box>
                      );
                    })}
                  </List>
                </Box>
              )}

              {/* Cihazlar */}
              {groupDevices.length > 0 && (
                <Box>
                  <Typography variant="overline" color="#009d3c"
                    display="flex" alignItems="center" gap={0.75} sx={{ mb: 1, fontSize: '0.7rem' }}>
                    <DirectionsCarIcon fontSize="small" /> Araçlar
                  </Typography>
                  <List disablePadding sx={{
                    bgcolor: 'rgba(72,187,120,0.04)',
                    borderRadius: 2,
                    border: '1px solid rgba(72,187,120,0.15)',
                    overflow: 'hidden',
                  }}>
                    {groupDevices.map((device, index) => (
                      <DeviceListItem
                        key={device.id}
                        device={device}
                        isLast={index === groupDevices.length - 1}
                        manager={manager}
                        onGroupChange={onGroupChange}
                      />
                    ))}
                  </List>
                </Box>
              )}

              {subGroups.length === 0 && groupDevices.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                  Bu gruba bağlı cihaz veya alt grup bulunmamaktadır.
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
const GroupsPage = () => {
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const admin = useAdministrator();
  const manager = useManager();
  const limitCommands = useRestriction('limitCommands');

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [devices, setDevices] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'diagram'

  // Grup değiştirme dialog state'i
  const [groupChangeDevice, setGroupChangeDevice] = useState(null);
  const [groupChangeOpen, setGroupChangeOpen] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const [groupsResponse, devicesResponse] = await Promise.all([
        fetchOrThrow('/api/groups'),
        fetchOrThrow('/api/devices'),
      ]);
      const groups = await groupsResponse.json();
      const allDevices = await devicesResponse.json();

      const sortedGroups = groups.sort((a, b) => {
        const countA = allDevices.filter((d) => d.groupId === a.id).length;
        const countB = allDevices.filter((d) => d.groupId === b.id).length;
        return countB - countA;
      });

      setItems(sortedGroups);
      setDevices(allDevices);
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const handleGroupChangeOpen = useCallback((device) => {
    setGroupChangeDevice(device);
    setGroupChangeOpen(true);
  }, []);

  const handleGroupChangeSuccess = useCallback(() => {
    setTimestamp(Date.now()); // Listeyi yenile
  }, []);

  const actionCommand = {
    key: 'command',
    title: t('deviceCommand'),
    icon: <PublishIcon fontSize="small" />,
    handler: (groupId) => navigate(`/settings/group/${groupId}/command`),
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (groupId) => navigate(`/settings/group/${groupId}/connections`),
  };

  const filteredItems = items.filter(filterByKeyword(searchKeyword));

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsGroups']}>

      {/* Üst bar: Arama + Görünüm Seçici */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 2 }}>
        <Box sx={{ flex: 1 }}>
          <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              color: '#718096',
              border: 'none',
              px: 1.5,
              '&.Mui-selected': {
                color: '#63b3ed',
                bgcolor: 'rgba(99,179,237,0.15)',
              },
            },
          }}
        >
          <ToggleButton value="list">
            <Tooltip title="Liste Görünümü">
              <TableRowsIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="diagram">
            <Tooltip title="Diagram Görünümü">
              <SchemaIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* İçerik */}
      {viewMode === 'list' ? (
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell sx={{ color: '#90cdf4', fontWeight: 700 }}>{t('sharedName')}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              filteredItems.map((item) => (
                <GroupRow
                  key={item.id}
                  item={item}
                  allGroups={items}
                  devices={devices}
                  admin={admin}
                  navigate={navigate}
                  classes={classes}
                  actionConnections={actionConnections}
                  actionCommand={actionCommand}
                  limitCommands={limitCommands}
                  setTimestamp={setTimestamp}
                  manager={manager}
                  onGroupChange={handleGroupChangeOpen}
                />
              ))
            ) : (
              <TableShimmer columns={3} endAction />
            )}
          </TableBody>
        </Table>
      ) : (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#63b3ed' }} />
          </Box>
        ) : (
          <DiagramView
            groups={filteredItems}
            devices={devices}
            manager={manager}
            onGroupChange={handleGroupChangeOpen}
          />
        )
      )}

      {/* Grup Değiştirme Dialogu */}
      <ChangeGroupDialog
        open={groupChangeOpen}
        onClose={() => setGroupChangeOpen(false)}
        device={groupChangeDevice}
        groups={items}
        onSuccess={handleGroupChangeSuccess}
      />

      {admin && <CollectionFab editPath="/settings/group" />}
      {manager && !admin && (
        <GroupsManagerFab
          groups={items}
          onSuccess={handleGroupChangeSuccess}
        />
      )}
    </PageLayout>
  );
};

export default GroupsPage;