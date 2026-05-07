import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Typography,
  Box, Paper, Collapse, Grid, Divider, IconButton, Avatar, Chip
} from '@mui/material';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import TodayIcon from '@mui/icons-material/Today';

import { useEffectAsync } from '../reactHelper';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { formatDistance, formatSpeed } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useAdministrator } from '../common/util/permissions';

// --- Alt Bileşen: Bakım Satırı ---
const MaintenanceRow = ({ item, classes, t, setTimestamp, convertAttribute, admin }) => {
  const [open, setOpen] = useState(false);

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
            <Avatar sx={{ bgcolor: 'info.main', mr: 2, width: 36, height: 36 }}>
              <BuildCircleIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.name}
            </Typography>
          </Box>
        </TableCell>

        {/* Mobilde gizle, geniş ekranda göster (opsiyonel) */}
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
          <Chip
            label={item.type}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 'bold', fontSize: '11px' }}
          />
        </TableCell>

        <TableCell>{convertAttribute(item.type, true, item.start)}</TableCell>
        <TableCell>{convertAttribute(item.type, false, item.period)}</TableCell>

        <TableCell className={classes.columnAction} padding="none" onClick={(e) => e.stopPropagation()}>
          <CollectionActions
            itemId={item.id}
            editPath="/settings/maintenance"
            endpoint="maintenance"
            setTimestamp={setTimestamp}
          />
        </TableCell>
      </TableRow>

      {/* Detay Paneli */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', color: 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildCircleIcon fontSize="small" /> {t('sharedDetails')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <TodayIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">{t('maintenanceStart')}</Typography>
                      <Typography variant="body2">{convertAttribute(item.type, true, item.start)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <EventRepeatIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">{t('maintenancePeriod')}</Typography>
                      <Typography variant="body2">{convertAttribute(item.type, false, item.period)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    {item.type.includes('distance') ? <SpeedIcon color="action" fontSize="small" /> : <TimerIcon color="action" fontSize="small" />}
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">{t('sharedType')}</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{item.type}</Typography>
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
const MaintenacesPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();
  const positionAttributes = usePositionAttributes(t);
  const admin = useAdministrator();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/maintenance');
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const convertAttribute = (key, start, value) => {
    const attribute = positionAttributes[key];
    if (key.endsWith('Time')) {
      if (start) {
        return dayjs(value).locale('tr').format('DD.MM.YYYY');
      }
      return `${value / 86400000} ${t('sharedDays')}`;
    }
    if (attribute && attribute.dataType) {
      switch (attribute.dataType) {
        case 'speed':
          return formatSpeed(value, speedUnit, t);
        case 'distance':
          return formatDistance(value, distanceUnit, t);
        case 'hours':
          return `${value / 3600000} ${t('sharedHours')}`;
        default:
          return value;
      }
    }
    return value;
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedMaintenance']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          mx: { xs: 1, md: 2 },
          my: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Table className={classes.table} size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('sharedName')} 🛠️</TableCell>
              <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>{t('sharedType')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('maintenanceStart')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('maintenancePeriod')}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              items.filter(filterByKeyword(searchKeyword)).map((item) => (
                <MaintenanceRow
                  key={item.id}
                  item={item}
                  classes={classes}
                  t={t}
                  setTimestamp={setTimestamp}
                  convertAttribute={convertAttribute}
                  admin={admin}
                />
              ))
            ) : (
              <TableShimmer columns={admin ? 5 : 4} endAction />
            )}
          </TableBody>
        </Table>

        {!loading && items.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Henüz bir bakım planı oluşturulmamış. 🔧
            </Typography>
          </Box>
        )}
      </Paper>

      <CollectionFab editPath="/settings/maintenance" />
    </PageLayout>
  );
};

export default MaintenacesPage;