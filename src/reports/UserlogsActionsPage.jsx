import React, { useState, useEffect } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent,
  Typography, IconButton, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from '../settings/components/SearchHeader';
import UserLogsActionPageCard from './UserLogsActionPageCard';

const ActionsPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();

  const [items, setItems] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [deviceNames, setDeviceNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState(null);

  // Kullanıcı listesini çek
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          const userMap = data.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
          }, {});
          setUserNames(userMap);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Cihaz isimlerini çek
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/devices');
        if (response.ok) {
          const data = await response.json();
          const deviceMap = data.reduce((acc, device) => {
            acc[device.id] = device.name;
            return acc;
          }, {});
          setDeviceNames(deviceMap);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };
    fetchDevices();
  }, []);

  // Rapor sorgusu
  const handleSubmit = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (from) query.append('from', from);
      if (to) query.append('to', to);
      if (selectedUserId) query.append('userId', selectedUserId);
      if (selectedActionType) query.append('actionType', selectedActionType);

      const response = await fetch(`/api/actions?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime));
        setItems(sorted);
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  const filteredItems = items
    .filter((item) => filterByKeyword(searchKeyword)(item))
    .filter((item) => !selectedActionType || item.actionType === selectedActionType);

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'actionsTitle']}>
      {items.length > 0 && (
        <UserLogsActionPageCard
          items={items}
          users={users}
          userNames={userNames}
          deviceNames={deviceNames}
        />
      )}

      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <ReportFilter handleSubmit={handleSubmit} showOnly ignoreDevice loading={loading}>
        {/* Kullanıcı Seçimi */}
        <FormControl variant="outlined" style={{ minWidth: 200, marginRight: '1rem' }}>
          <InputLabel id="user-select-label">{t('sharedName')}</InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            label={t('Select User')}
          >
            <MenuItem value="">
              <em>{t('All Users')}</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ActionType Filtresi */}
        <FormControl variant="outlined" style={{ minWidth: 200, marginRight: '1rem' }}>
          <InputLabel id="actiontype-select-label">{t('Action Type')}</InputLabel>
          <Select
            labelId="actiontype-select-label"
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            label={t('Action Type')}
          >
            <MenuItem value="">
              <em>{t('All Types')}</em>
            </MenuItem>
            {[...new Set(items.map((i) => i.actionType))].map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ReportFilter>

      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>{t('Date/Time')}</TableCell>
            <TableCell>{t('IP Address')}</TableCell>
            <TableCell>{t('User')}</TableCell>
            <TableCell>{t('Action Type')}</TableCell>
            <TableCell>{t('Object Type')}</TableCell>
            <TableCell>{t('Object')}</TableCell>
            <TableCell align="center">Detaylar</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {!loading ? filteredItems.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                {item.actionTime ? formatTime(item.actionTime, 'DD.MM.YYYY HH:mm:ss') : '-'}
              </TableCell>
              <TableCell>{item.address || '-'}</TableCell>
              <TableCell>{userNames[item.userId] || item.userId}</TableCell>
              <TableCell>{item.actionType}</TableCell>
              <TableCell>{item.objectType}</TableCell>
              <TableCell>
                {item.objectType === 'device'
                  ? (deviceNames[item.objectId] || item.objectId)
                  : item.objectType === 'user'
                    ? (users.find((u) => u.id === item.objectId)?.name || item.objectId)
                    : item.objectId}
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedAttributes(item.attributes);
                    setOpenDialog(true);
                  }}
                >
                  {t('reportShow')}
                </Button>
              </TableCell>
            </TableRow>
          )) : (<TableShimmer columns={7} />)}
        </TableBody>
      </Table>

      {/* Attributes Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('Attributes')}
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAttributes ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(selectedAttributes, null, 2)}
            </pre>
          ) : (
            <Typography>{t('No Data')}</Typography>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default ActionsPage;
