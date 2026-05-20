import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import TerminalIcon from '@mui/icons-material/Terminal';
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

  useEffectAsync(async () => {
    // Custom (type) commands come first
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

    handleDialogClose();
    navigate(-1);
  });

  const validate = () => savedId || (item && item.type);

  const lowerSearch = search.toLowerCase();
  const filteredOptions = options.filter((opt) => {
    const label = (
      opt.optionType === 'saved'
        ? (opt.description || opt.type || opt.key)
        : (t(prefixString('command', opt.type)) || opt.type || opt.key)
    );

    return String(label).toLowerCase().includes(lowerSearch);
  });

  const typeOptions = filteredOptions.filter((o) => o.optionType === 'type');
  const savedOptions = filteredOptions.filter((o) => o.optionType === 'saved');

  const selectedLabel = savedId
    ? options.find((o) => o.optionType === 'saved' && o.id === savedId)?.description
    : item?.type
      ? t(prefixString('command', item.type))
      : '';

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 1.5, sm: 3 } }}>
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

        {typeOptions.length > 0 && (
          <>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              {t('sharedType')}
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2.5 }}>
              {typeOptions.map((opt) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={opt.key}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardActionArea
                      onClick={() => handleCardClick(opt)}
                      sx={{ height: '100%' }}
                    >
                      <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                          <TerminalIcon sx={{ fontSize: { xs: 14, sm: 16 } }} color="action" />
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}
                        >
                          {t(prefixString('command', opt.type))}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {savedOptions.length > 0 && (
          <>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              {t('sharedSavedCommands')}
            </Typography>
            <Grid container spacing={1}>
              {savedOptions.map((opt) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={opt.key}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardActionArea
                      onClick={() => handleCardClick(opt)}
                      sx={{ height: '100%' }}
                    >
                      <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <BookmarkIcon sx={{ fontSize: { xs: 14, sm: 16 } }} color="primary" />
                          <Chip
                            label={t('sharedSavedCommands')}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: 9, height: 18, display: { xs: 'none', sm: 'flex' } }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}
                        >
                          {opt.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          {t(prefixString('command', opt.type))}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {filteredOptions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">{t('sharedNoData')}</Typography>
          </Box>
        )}
      </Box>

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