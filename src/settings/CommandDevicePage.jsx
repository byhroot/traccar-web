import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useRestriction } from '../common/util/permissions';
import { useEffectAsync } from '../reactHelper';
import BaseCommandView from './components/BaseCommandView';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { prefixString } from '../common/util/stringUtils';

const COMMAND_HISTORY_ATTRIBUTE = 'commandHistory';

const fetchDeviceAttributes = async (deviceId) => {
  const response = await fetchOrThrow(`/api/devices/${deviceId}`);
  const device = await response.json();
  return { attributes: device.attributes || {}, device };
};

const saveCommandHistory = async (deviceId, commandType, sentAttributes, cachedDevice) => {
  const device = cachedDevice;
  const existingAttributes = device.attributes || {};
  const existingHistory = existingAttributes[COMMAND_HISTORY_ATTRIBUTE] || {};

  const updatedHistory = {
    ...existingHistory,
    [commandType]: {
      attributes: sentAttributes || {},
      sentAt: new Date().toISOString(),
    },
  };

  await fetchOrThrow(`/api/devices/${deviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...device,
      attributes: {
        ...existingAttributes,
        [COMMAND_HISTORY_ATTRIBUTE]: updatedHistory,
      },
    }),
  });
};

const formatAttributeValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
};

// Last sent settings panel shown inside dialog
const LastSentSettingsTable = ({ commandType, commandHistory, t }) => {
  const entry = commandHistory?.[commandType];
  if (!entry) return null;

  const attrs = entry.attributes || {};
  const attrEntries = Object.entries(attrs);

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <HistoryIcon fontSize="small" color="action" />
        <Typography variant="overline" color="text.secondary">
          {t('commandLastSentSettings')}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
          {formatDate(entry.sentAt)}
        </Typography>
      </Box>

      {attrEntries.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
          <Typography variant="caption">{t('commandNoAttributes')}</Typography>
        </Alert>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 1.5, maxHeight: 180, overflow: 'auto' }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    bgcolor: 'action.hover',
                    py: 0.75,
                  }}
                >
                  {t('sharedAttribute')}
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    bgcolor: 'action.hover',
                    py: 0.75,
                  }}
                >
                  {t('sharedValue')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attrEntries.map(([key, value]) => (
                <TableRow key={key} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      py: 0.5,
                    }}
                  >
                    {key}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      py: 0.5,
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatAttributeValue(value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

const CommandDevicePage = () => {
  const navigate = useNavigate();
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const limitCommands = useRestriction('limitCommands');

  const { id } = useParams();

  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savedId, setSavedId] = useState(0);
  const [item, setItem] = useState({});
  const [commandHistory, setCommandHistory] = useState({});
  const [cachedDevice, setCachedDevice] = useState(null);

  useEffectAsync(async () => {
    const { attributes, device } = await fetchDeviceAttributes(id);
    setCommandHistory(attributes[COMMAND_HISTORY_ATTRIBUTE] || {});
    setCachedDevice(device);

    let combined = [];

    if (!limitCommands) {
      const typesResponse = await fetchOrThrow(
        `/api/commands/types?${new URLSearchParams({ deviceId: id }).toString()}`,
      );
      const types = await typesResponse.json();
      combined = types.map((it) => ({ ...it, optionType: 'type', key: `type-${it.type}` }));
    }

    const savedResponse = await fetchOrThrow(`/api/commands/send?deviceId=${id}`);
    const saved = await savedResponse.json();
    combined = combined.concat(
      saved.map((it) => ({
        ...it,
        optionType: 'saved',
        key: `saved-${it.id}`,
      })),
    );

    setOptions(combined);
  }, [id, limitCommands]);

  const handleCardClick = (option) => {
    if (option.optionType === 'saved') {
      setSavedId(option.id);
      setItem({});
    } else {
      setSavedId(0);
      setItem({ type: option.type, attributes: {} });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogExited = () => {
    setSavedId(0);
    setItem({});
  };

  const handleSend = useCatch(async () => {
    let command;
    if (savedId) {
      const response = await fetchOrThrow(`/api/commands/${savedId}`);
      command = await response.json();
    } else {
      command = item;
    }

    command.deviceId = parseInt(id, 10);

    await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });

    const commandType = command.type;
    const sentAttributes = command.attributes || {};
    await saveCommandHistory(id, commandType, sentAttributes, cachedDevice);

    setCommandHistory((prev) => ({
      ...prev,
      [commandType]: {
        attributes: sentAttributes,
        sentAt: new Date().toISOString(),
      },
    }));

    handleDialogClose();
  });

  const validate = () => savedId || (item && item.type);

  const lowerSearch = search.toLowerCase();
  const filteredOptions = options.filter((opt) => {
    const label =
      opt.optionType === 'saved'
        ? opt.description || opt.type || opt.key
        : t(prefixString('command', opt.type)) || opt.type || opt.key;
    return String(label).toLowerCase().includes(lowerSearch);
  });

  const typeOptions = filteredOptions
    .filter((o) => o.optionType === 'type')
    .sort((a, b) => {
      if (a.type === 'custom') return -1;
      if (b.type === 'custom') return 1;

      const labelA = t(prefixString('command', a.type)) || a.type;
      const labelB = t(prefixString('command', b.type)) || b.type;

      return labelA.localeCompare(labelB);
    });
  const savedOptions = filteredOptions.filter((o) => o.optionType === 'saved');

  const selectedLabel = savedId
    ? options.find((o) => o.optionType === 'saved' && o.id === savedId)?.description
    : item?.type
      ? t(prefixString('command', item.type))
      : '';

  const dialogCommandType = savedId
    ? options.find((o) => o.optionType === 'saved' && o.id === savedId)?.type
    : item?.type;

  // Shared table head columns
  const CommandTableHead = ({ showDescription }) => (
    <TableHead>
      <TableRow>
        <TableCell
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            bgcolor: 'action.hover',
            py: 0.75,
            width: showDescription ? '35%' : '55%',
          }}
        >
          {t('sharedName')}
        </TableCell>
        <TableCell
          sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            bgcolor: 'action.hover',
            py: 0.75,
            width: '25%',
          }}
        >
          {t('commandLastSentSettings')}
        </TableCell>
        <TableCell
          sx={{
            bgcolor: 'action.hover',
            py: 0.75,
            width: 56,
            textAlign: 'center',
          }}
        />
      </TableRow>
    </TableHead>
  );

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Box sx={{ maxWidth: 900, p: { xs: 1, sm: 3 } }}>
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder={t('sharedSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2.5 }}
        />

        {/* Type Commands Table */}
        {typeOptions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              {t('sharedType')}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table
                size="small"
                sx={{
                  tableLayout: 'fixed',
                  width: '100%',
                }}
              >
                <CommandTableHead showDescription={false} />
                <TableBody>
                  {typeOptions.map((opt) => {
                    const label = t(prefixString('command', opt.type)) || opt.type;
                    const history = commandHistory?.[opt.type];
                    const sentAt = history?.sentAt;
                    return (
                      <TableRow
                        key={opt.key}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
                        {/* Name */}
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {label}
                          </Typography>
                        </TableCell>

                        {/* Last sent */}
                        <TableCell sx={{ py: 1 }}>
                          {sentAt ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <HistoryIcon sx={{ fontSize: 14 }} color="primary" />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(sentAt)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              {t('commandNeverSent')}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell sx={{ py: 1, textAlign: 'center' }}>
                          <Tooltip title={t('commandSend')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleCardClick(opt)}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Table
          size="small"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '55%' }}>
                Name
              </TableCell>
              <TableCell sx={{ width: '35%' }}>
                Last Sent
              </TableCell>
              <TableCell sx={{ width: '10%' }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {savedOptions.map((opt) => {
              const typeLabel = t(prefixString('command', opt.type)) || opt.type;
              const history = commandHistory?.[opt.type];
              const sentAt = history?.sentAt;

              return (
                <TableRow key={opt.key} hover>
                  <TableCell sx={{ width: '55%', minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                      <BookmarkIcon sx={{ fontSize: 14 }} color="primary" />

                      <Typography sx={{ wordBreak: 'break-word' }}>
                        {opt.description || typeLabel}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ width: '35%' }}>
                    {sentAt ? (
                      <Typography variant="caption">
                        {formatDate(sentAt)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        {t('commandNeverSent')}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ width: '10%', textAlign: 'center' }}>
                    <IconButton size="small" onClick={() => handleCardClick(opt)}>
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredOptions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">{t('sharedNoData')}</Typography>
          </Box>
        )}
      </Box>

      {/* Send Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2 } }}
        TransitionProps={{ onExited: handleDialogExited }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={500}>
              {selectedLabel || t('deviceCommand')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {savedId ? t('sharedSavedCommands') : t('sharedType')}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDialogClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <BaseCommandView
            deviceId={id}
            item={item}
            setItem={setItem}
            includeSaved
            savedId={savedId}
            setSavedId={setSavedId}
          />

          {dialogCommandType && (
            <LastSentSettingsTable
              commandType={dialogCommandType}
              commandHistory={commandHistory}
              t={t}
            />
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={handleDialogClose}>
            {t('sharedCancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!validate()}
            startIcon={<SendIcon />}
          >
            {t('commandSend')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default CommandDevicePage;