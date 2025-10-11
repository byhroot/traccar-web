import React, { useState } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  Box, Grid, Card, CardContent, Typography, Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';

const DriversPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cardView, setCardView] = useState(true); // varsayılan kart görünümü

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/drivers');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const filteredItems = items.filter(filterByKeyword(searchKeyword));

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedDrivers']}>
{/* Arama ve Switch */}
<Box
  display="flex"
  flexDirection="row"
  justifyContent="center" //  'flex-start space-between' : 'center'
  alignItems="center"
  flexWrap="wrap"
  gap={1}
  mb={2}
  width={'100%'} 
>
  <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

  <FormControlLabel
    control={
      <Switch
        checked={!cardView} // Switch tabloya geçiş için ters
        onChange={(e) => setCardView(!e.target.checked)}
        color="primary"
      />
    }
    label="List"
    sx={{
      ml: 'auto',
      whiteSpace: 'nowrap', // taşma olmasın
    }}
  />
</Box>


      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : cardView ? (
        // Kart görünümü
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card elevation={3} sx={{ position: 'relative' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    😊 {item.name} {/* Smiley ekledik */}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t('deviceIdentifier')}: {item.uniqueId}
                  </Typography>
                  {item.attributes && (
                    <>
                      <Typography variant="body2" color="textSecondary">
                        📞 Tel: {item.attributes.tel || '-'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        🪪 License: {item.attributes.license || '-'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        📝 Notes: {item.attributes.notes || '-'}
                      </Typography>
                    </>
                  )}
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/driver"
                      endpoint="drivers"
                      setTimestamp={setTimestamp}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredItems.length === 0 && (
            <Grid item xs={12}>
              <Typography textAlign="center" mt={4} color="textSecondary">
                {t('sharedNoItems')}
              </Typography>
            </Grid>
          )}
        </Grid>
      ) : (
        // Tablo görünümü
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>{t('sharedName')}</TableCell>
              <TableCell>{t('deviceIdentifier')}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.uniqueId}</TableCell>
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions itemId={item.id} editPath="/settings/driver" endpoint="drivers" setTimestamp={setTimestamp} />
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  {t('sharedNoItems')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <CollectionFab editPath="/settings/driver" />
    </PageLayout>
  );
};

export default DriversPage;
