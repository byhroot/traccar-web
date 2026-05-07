import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  IconButton, Collapse, Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import PublishIcon from '@mui/icons-material/Publish';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import CollectionActionsGroup from './components/CollectionActionsGroup';

// Her bir grup satırını ve altındaki akordiyonu yöneten alt bileşen
const GroupRow = ({ item, allGroups, devices, admin, navigate, classes, actionConnections, actionCommand, limitCommands, setTimestamp }) => {
  const [open, setOpen] = useState(false);
  const t = useTranslation();

  // Bu gruba ait olan cihazlar ve alt gruplar (groupId değeri bu grubun id'sine eşit olanlar)
  const groupDevices = devices.filter((d) => d.groupId === item.id);
  const subGroups = allGroups.filter((g) => g.groupId === item.id);

  const handleDeviceClick = (deviceId) => {
    if (admin) {
      navigate(`/settings/device/${deviceId}`);
    } else {
      navigate(`/settings/device/${deviceId}/details`);
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>

            {/* İkonlar ve Sayılar (Rozetler) */}
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box display="flex" alignItems="center" gap={0.5} title="Cihaz Sayısı">
                <DirectionsCarIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  ({groupDevices.length})
                </Typography>
              </Box>

              {subGroups.length > 0 && (
                <Box display="flex" alignItems="center" gap={0.5} title="Alt Grup Sayısı">
                  <AccountTreeIcon fontSize="small" color="secondary" />
                  <Typography variant="body2" fontWeight="bold" color="text.secondary">
                    ({subGroups.length})
                  </Typography>
                </Box>
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
            customActions={
              limitCommands ? [actionConnections] : [actionConnections, actionCommand]
            }
          />
        </TableCell>
      </TableRow>

      {/* Akordiyon Kısım (Alt Gruplar ve Cihazlar Listesi) */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, paddingLeft: 6, paddingRight: 2, paddingBottom: 2 }}>

              {/* Alt Gruplar Listesi */}
              {subGroups.length > 0 && (
                <Box mb={2}>
                  <Typography variant="overline" gutterBottom display="flex" alignItems="center" gap={1} color="text.secondary">
                    <AccountTreeIcon fontSize="small" /> Alt Gruplar
                  </Typography>
                  <List disablePadding sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    {subGroups.map((subGroup, index) => (
                      <Box key={subGroup.id}>
                        <ListItemButton sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <AccountTreeIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText primary={subGroup.name} />
                        </ListItemButton>
                        {index < subGroups.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Box>
              )}

              {/* Cihazlar Listesi */}
              {groupDevices.length > 0 && (
                <Box>
                  <Typography variant="overline" gutterBottom display="flex" alignItems="center" gap={1} color="text.secondary">
                    <DirectionsCarIcon fontSize="small" /> {t('devices')}
                  </Typography>
                  <List disablePadding sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    {groupDevices.map((device, index) => (
                      <Box key={device.id}>
                        <ListItemButton onClick={() => handleDeviceClick(device.id)} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <DirectionsCarIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={device.name}
                            secondary={device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                            secondaryTypographyProps={{
                              color: device.status === 'online' ? 'success.main' : 'text.secondary',
                              fontWeight: 500
                            }}
                          />
                        </ListItemButton>
                        {index < groupDevices.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Box>
              )}

              {/* Boş Durum (Ne cihaz ne alt grup varsa) */}
              {subGroups.length === 0 && groupDevices.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', py: 1 }}>
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

const GroupsPage = () => {
  const { classes } = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const admin = useAdministrator();
  const limitCommands = useRestriction('limitCommands');

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [devices, setDevices] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const [groupsResponse, devicesResponse] = await Promise.all([
        fetchOrThrow('/api/groups'),
        fetchOrThrow('/api/devices')

      ]);
      const groups = await groupsResponse.json();
      const allDevices = await devicesResponse.json();

      // SIRALAMA MANTIĞI BURADA:
      const sortedGroups = groups.sort((a, b) => {
        const countA = allDevices.filter(d => d.groupId === a.id).length;
        const countB = allDevices.filter(d => d.groupId === b.id).length;

        return countB - countA; // Çoktan aza sıralama
        // return countA - countB; // Azdan çoğa sıralama istiyorsan bunu kullan
      });

      setItems(sortedGroups);
      setDevices(allDevices);
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

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

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsGroups']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>{t('sharedName')}</TableCell>
            <TableCell className={classes.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items.filter(filterByKeyword(searchKeyword)).map((item) => (
              <GroupRow
                key={item.id}
                item={item}
                allGroups={items} // Alt grupları bulabilmek için tüm listeyi gönderiyoruz
                devices={devices}
                admin={admin}
                navigate={navigate}
                classes={classes}
                actionConnections={actionConnections}
                actionCommand={actionCommand}
                limitCommands={limitCommands}
                setTimestamp={setTimestamp}
              />
            ))
          ) : (
            <TableShimmer columns={3} endAction />
          )}
        </TableBody>
      </Table>
      {admin && <CollectionFab editPath="/settings/group" />}
    </PageLayout>
  );
};

export default GroupsPage;