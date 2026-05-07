import React, { useState } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Typography,
  Avatar, Box, Paper, Collapse, Grid, Divider, IconButton
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import NotesIcon from '@mui/icons-material/Notes';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

// --- Alt Bileşen: Sürücü Satırı ---
const DriverRow = ({ item, classes, t, setTimestamp }) => {
  const [open, setOpen] = useState(false);
  const { attributes } = item;

  return (
    <>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          '& > *': { borderBottom: 'unset' },
          bgcolor: open ? 'action.hover' : 'inherit'
        }}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" sx={{ mr: 1 }}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
            <Avatar sx={{ bgcolor: 'orange', mr: 2, width: 36, height: 36 }}>
              <AccountCircleIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.name}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <FingerprintIcon fontSize="inherit" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">{item.uniqueId}</Typography>
          </Box>
        </TableCell>
        <TableCell className={classes.columnAction} padding="none" onClick={(e) => e.stopPropagation()}>
          <CollectionActions
            itemId={item.id}
            editPath="/settings/driver"
            endpoint="drivers"
            setTimestamp={setTimestamp}
          />
        </TableCell>
      </TableRow>

      {/* Detay Paneli (Accordion) */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {t('sharedDetails')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">{t('sharedPhone')}</Typography>
                      <Typography variant="body2">{attributes?.tel || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BadgeIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">{t('userLicense')}</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>{attributes?.license || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="start" gap={1}>
                    <NotesIcon color="action" fontSize="small" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">{t('sharedNotes')}</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {attributes?.notes || t('sharedNoData')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// --- Ana Sayfa Bileşeni ---
const DriversPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/drivers');
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedDrivers']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

      <Paper elevation={0} sx={{ borderRadius: 3, mx: { xs: 1, md: 2 }, my: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table className={classes.table} size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('sharedName')} 👤</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('deviceIdentifier')} 🆔</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              items.filter(filterByKeyword(searchKeyword)).map((item) => (
                <DriverRow
                  key={item.id}
                  item={item}
                  classes={classes}
                  t={t}
                  setTimestamp={setTimestamp}
                />
              ))
            ) : (
              <TableShimmer columns={3} endAction />
            )}
          </TableBody>
        </Table>

        {!loading && items.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Henüz sürücü eklenmemiş. ✨
            </Typography>
          </Box>
        )}
      </Paper>

      <CollectionFab editPath="/settings/driver" />
    </PageLayout>
  );
};

export default DriversPage;