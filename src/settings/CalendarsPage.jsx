import React, { useState } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Typography,
  Box, Paper, Collapse, Grid, Divider, IconButton, Avatar
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoIcon from '@mui/icons-material/Info';

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

// --- Alt Bileşen: Takvim Satırı ---
const CalendarRow = ({ item, classes, t, setTimestamp }) => {
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
            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 36, height: 36 }}>
              <CalendarMonthIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.name}
            </Typography>
          </Box>
        </TableCell>
        <TableCell className={classes.columnAction} padding="none" onClick={(e) => e.stopPropagation()}>
          <CollectionActions
            itemId={item.id}
            editPath="/settings/calendar"
            endpoint="calendars"
            setTimestamp={setTimestamp}
          />
        </TableCell>
      </TableRow>

      {/* Detay Paneli */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                {t('sharedDetails')} 📅
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <InfoIcon color="action" fontSize="small" />
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block">
                        {t('sharedName')}
                      </Typography>
                      <Typography variant="body2">
                        {item.name} - {t('sharedNoData')}
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
const CalendarsPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/calendars');
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedCalendars']}>
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
              <TableCell sx={{ fontWeight: 'bold' }}>{t('sharedName')} 📅</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              items.filter(filterByKeyword(searchKeyword)).map((item) => (
                <CalendarRow
                  key={item.id}
                  item={item}
                  classes={classes}
                  t={t}
                  setTimestamp={setTimestamp}
                />
              ))
            ) : (
              <TableShimmer columns={2} endAction />
            )}
          </TableBody>
        </Table>

        {!loading && items.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Henüz takvim tanımlanmamış. ✨
            </Typography>
          </Box>
        )}
      </Paper>

      <CollectionFab editPath="/settings/calendar" />
    </PageLayout>
  );
};

export default CalendarsPage;