import React, { useState, useEffect } from 'react';

import {
  Table, TableRow, TableCell, TableHead, TableBody, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from '../settings/components/SearchHeader';

const columnsArray = [
  ['action', 'sharedLogs'],
  ['timestamp', 'positionServerTime'],
  ['userId', 'ID'],

];
const columnsMap = new Map(columnsArray);

const UserlogsPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();

  const [columns, setColumns] = usePersistedState('userlogsColumns', ['userId', 'action', 'timestamp']);
  const [items, setItems] = useState([]);
  const [userNames, setUserNames] = useState({}); // Kullanıcı adları için state
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]); // Kullanıcı listesi
  const [selectedUserId, setSelectedUserId] = useState(''); // Seçili kullanıcı ID'si
  const [searchKeyword, setSearchKeyword] = useState(''); // Arama kelimesi için durum

  useEffect(() => {
    // Kullanıcı listesini API'den alıyoruz
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          const userNamesMap = data.reduce((acc, user) => {
            acc[user.id] = user.name; // Kullanıcı ID'sine göre adları eşleştiriyoruz
            return acc;
          }, {});
          setUserNames(userNamesMap); // Kullanıcı adlarını state'e kaydediyoruz
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ from, to, userId: selectedUserId });
      const response = await fetch(`/api/userlogs?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();

        // Verileri tarihe göre yeniye doğru sıralıyoruz
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setItems(sortedData); // Sıralı veriyi state'e kaydediyoruz
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'statisticsTitle']}>
        <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
        <ReportFilter handleSubmit={handleSubmit} showOnly ignoreDevice loading={loading}>
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
          <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
        </ReportFilter>
      <Table className={classes.table}>
        <TableHead>
          <TableRow  padding="none">
            {columns.map((key) => (<TableCell key={key}>{t(columnsMap.get(key))}</TableCell>))}
            {columns.includes('userId') && <TableCell>{t('sharedName')}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? items.filter(filterByKeyword(searchKeyword)).map((item) => (
            <TableRow key={item.id}>
              {columns.map((key) => (
                <TableCell key={key}>
                  {key === 'timestamp' ? formatTime(item[key], 'HH:mm') : item[key]} {/* Zaman formatı saat:dakika */}
                </TableCell >
              ))}
              {columns.includes('userId') && (
                <TableCell className={classes.columnAction}>
                  {userNames[item.userId] || t('loading')}
                </TableCell>
              )}
            </TableRow>
          )) : (<TableShimmer columns={columns.length} />)}
        </TableBody>
      </Table>
    </PageLayout>
  );
};

export default UserlogsPage;
