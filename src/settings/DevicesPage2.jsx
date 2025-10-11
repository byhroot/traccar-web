import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Autocomplete,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Button,
  TableSortLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import SpeedIcon from '@mui/icons-material/Speed';
import LinkIcon from '@mui/icons-material/Link';
import PaymentIcon from '@mui/icons-material/Payment';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import DeviceUsersValue from './components/DeviceUsersValue';
import { useAdministrator, useManager, useDeviceReadonly } from '../common/util/permissions';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import {
  Pets as PetsIcon,
  DirectionsBike as DirectionsBikeIcon,
  DirectionsBoat as DirectionsBoatIcon,
  DirectionsBus as DirectionsBusIcon,
  DirectionsCar as DirectionsCarIcon,
  RvHookup as RvHookupIcon,
  Construction as ConstructionIcon,
  HelpOutline as HelpOutlineIcon,
  Flight as FlightIcon,
  TwoWheeler as TwoWheelerIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  AirplanemodeActive as AirplanemodeActiveIcon,
  Moped as MopedIcon,
  Agriculture as AgricultureIcon,
  Train as TrainIcon,
  Tram as TramIcon,
  DirectionsTransitFilled as DirectionsTransitFilledIcon,
  AirportShuttle as AirportShuttleIcon,
} from '@mui/icons-material';
import { useTranslation } from '../common/components/LocalizationProvider';

const categoryIcons = {
  animal: <PetsIcon color="primary" />,
  bicycle: <DirectionsBikeIcon color="primary" />,
  boat: <DirectionsBoatIcon color="primary" />,
  bus: <DirectionsBusIcon color="primary" />,
  car: <DirectionsCarIcon color="primary" />,
  camper: <RvHookupIcon color="primary" />,
  crane: <ConstructionIcon color="primary" />,
  default: <HelpOutlineIcon color="disabled" />,
  helicopter: <FlightIcon color="primary" />,
  motorcycle: <TwoWheelerIcon color="primary" />,
  offroad: <DirectionsCarIcon color="primary" />,
  person: <PersonIcon color="primary" />,
  pickup: <LocalShippingIcon color="primary" />,
  plane: <AirplanemodeActiveIcon color="primary" />,
  scooter: <MopedIcon color="primary" />,
  ship: <DirectionsBoatIcon color="primary" />,
  tractor: <AgricultureIcon color="primary" />,
  train: <TrainIcon color="primary" />,
  tram: <TramIcon color="primary" />,
  trolleybus: <DirectionsTransitFilledIcon color="primary" />,
  truck: <LocalShippingIcon color="primary" />,
  van: <AirportShuttleIcon color="primary" />,
};

const DevicesPage = () => {
  const navigate = useNavigate();
  const groups = useSelector((state) => state.groups.items);
  const admin = useAdministrator();
  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showList, setShowList] = useState(false);
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [orderBy, setOrderBy] = useState('name'); // varsayılan sütun
  const [order, setOrder] = useState('asc');      // asc veya desc

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/devices');
        if (res.ok) setItems(await res.json());
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const formatSpeed = (speed) => (speed ? Math.floor(speed) : 0);
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'Yok');

  // --- Filtreleme ---
  const filteredItems = items.filter((item) => {
    const matchSearch = filterByKeyword(searchKeyword)(item);
    const matchGroup = !selectedGroup || item.groupId === selectedGroup.id;
    return matchSearch && matchGroup;
  });

  // --- Sıralama ---
  const sortedItems = filteredItems.slice().sort((a, b) => {
    let aValue, bValue;

    switch(orderBy) {
      case 'insurance':
        aValue = a.attributes?.insuranceExpiration || '';
        bValue = b.attributes?.insuranceExpiration || '';
        break;
      case 'packageEnd':
        aValue = a.expirationTime || '';
        bValue = b.expirationTime || '';
        break;
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'id':
        aValue = a.id || '';
        bValue = b.id || '';
        break;
      default:
        aValue = '';
        bValue = '';
    }

    // Tarih alanı mı kontrol et
    if (orderBy === 'insurance' || orderBy === 'packageEnd') {
      aValue = aValue ? new Date(aValue) : new Date(0);
      bValue = bValue ? new Date(bValue) : new Date(0);
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceTitle']}>
<Box display="flex" flexDirection={desktop ? 'row' : 'column'} alignItems="center" justifyContent="space-between" gap={0} width="100%">

{/* Arama kutusu */}
<Box flex={desktop ? 1 : 'unset'} width={desktop ? 'auto' : '100%'} justifyContent={desktop ? 'flex-start' : 'center'}>
  <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} style={{ width: desktop ? 300 : '100%' }} />
</Box>

{/* Grup filtresi ve Liste switchi */}
<Box display="flex" flexDirection="row" alignItems="center" gap={1} width={desktop ? 'auto' : '100%'} justifyContent={desktop ? 'flex-end' : 'center'}>
  <Autocomplete
    options={Object.values(groups)}
    getOptionLabel={(opt) => opt.name || ''}
    value={selectedGroup}
    onChange={(e, newValue) => setSelectedGroup(newValue)}
    renderInput={(params) => <TextField {...params} placeholder={t("settingsGroups")} size="small" />}
    sx={{ width: desktop ? 250 : '70%' }}
  />

  <FormControlLabel
    control={<Switch checked={showList} onChange={(e) => setShowList(e.target.checked)} />}
    label="Liste"
    labelPlacement="start"
    sx={{ ml: desktop ? 1 : 0 }}
  />
</Box>

</Box>




      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : showList ? (
        <Table>
          <TableHead>
            <TableRow>
              {admin && (
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
              )}
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  {t("deviceTitle")}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'insurance'}
                  direction={orderBy === 'insurance' ? order : 'asc'}
                  onClick={() => handleSort('insurance')}
                >
                  {t("sigortaTarih")}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'packageEnd'}
                  direction={orderBy === 'packageEnd' ? order : 'asc'}
                  onClick={() => handleSort('packageEnd')}
                >
                  Paket {t("userExpirationTime")}
                </TableSortLabel>
              </TableCell>
              {admin && <TableCell>{t("settingsUsers")}</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedItems.map((item) => (
              <TableRow 
                key={item.id}
                sx={{
                  backgroundColor: item.expirationTime && new Date(item.expirationTime) < new Date()
                    ? theme.palette.error.light
                    : 'inherit',
                }}
                onClick={() => navigate(`/settings/device/${item.id}/commandnew`)}
              >
                {admin && <TableCell>{item.id}</TableCell>}
                <TableCell>{item.name}</TableCell>
                <TableCell>{formatDate(item.attributes?.insuranceExpiration)}</TableCell>
                <TableCell>{formatDate(item.expirationTime)}</TableCell>
                {admin && <TableCell><DeviceUsersValue deviceId={item.id} /></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // === Kart Görünümü ===
        <Grid container spacing={1} sx={{ p: 2 }}>
          {filteredItems.map((device) => {
            const now = new Date();
            const packageEndDate = device.expirationTime ? new Date(device.expirationTime) : null;
            const showPaymentButton =
              packageEndDate &&
              (packageEndDate < now || (packageEndDate - now) / (1000 * 60 * 60 * 24) <= 30);

            return (
              <Grid item xs={6} sm={4} md={3} key={device.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `5px solid ${device.status === 'online' ? 'green' : 'red'}`,
                  }}
                >
                  <CardContent>
                    <Box onClick={() => navigate(`/settings/device/${device.id}/commandnew`)} display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        {categoryIcons[device.category] || categoryIcons.default}
                        <Typography variant="h7">{device.name}</Typography>
                      </Box>
                      <OnlinePredictionIcon sx={{ color: device.status === 'online' ? 'green' : 'gray' }} />
                    </Box>

                    <Box display="flex" alignItems="center" mt={1}>
                      <SpeedIcon fontSize="small" />{' '}
                      <Typography variant="body2">{` ${t("attributeSpeedLimit")} : ${formatSpeed(device.attributes?.speedLimit * 1.87)} km/h`}</Typography>
                    </Box>

                    {device.attributes?.alarmVibration && (
                      <Chip
                        label={` ${t("commandAlarmVibrationon")} (${device.attributes?.alarmSensorlevel || '-'})`}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}

                    <Box display="flex" gap={1} mt={1}>
                      <Typography variant="body2">{t("sigortaTarih")} {t("date")} : {formatDate(device.attributes?.insuranceExpiration)}</Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" mt={1}>
                      {showPaymentButton ?
                        <Typography
                          onClick={() => navigate('/settings/paymentpage')}
                          sx={{
                            color: 'error.dark',
                            '&:hover': { backgroundColor: 'primary.light' },
                          }}
                          variant="title3"
                        >
                          Paket  : {formatDate(device.expirationTime)}
                        </Typography>
                        :
                        <Typography variant="body2">Paket Bitiş: {formatDate(device.expirationTime)}</Typography>
                      }
                      {showPaymentButton && (
                        <Button
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => navigate('/settings/paymentpage')}
                          sx={{
                            backgroundColor: 'primary.dark',
                            color: '#fff',
                            '&:hover': { backgroundColor: 'primary.dark' },
                          }}
                        >
                          {t("positionCard")}
                        </Button>
                      )}
                    </Box>
                    <Box mt={1} display="flex" alignItems="center" gap={1}>

                    {admin && <Box mt={1}><DeviceUsersValue deviceId={device.id} /></Box>}
                    <IconButton onClick={() => navigate(`/settings/device/${device.id}/connections`)}>
                    <LinkIcon />
                      </IconButton>
                    </Box>

                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {admin && <CollectionFab editPath="/settings/device" />}
    </PageLayout>
  );
};

export default DevicesPage;
