import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Button,
  TableFooter, FormControlLabel, Switch, Collapse, IconButton,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActionsDevices from './components/CollectionActionsDevices';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { formatTime } from '../common/util/formatter';
import { useAdministrator, useDeviceReadonly, useManager } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';

const DevicesPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);
  const manager = useManager();
  const admin = useAdministrator();
  const deviceReadonly = useDeviceReadonly();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [groupMap, setGroupMap] = useState({});
  const [groupUsersMap, setGroupUsersMap] = useState({});
  const [openRows, setOpenRows] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const groupsRes = await fetch('/api/groups');
      const groupsData = await groupsRes.json();
      const map = {};
      groupsData.forEach(group => {
        map[group.id] = group;
      });
      setGroupMap(map);

      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();

      const groupUsersTemp = {};
      for (const user of users) {
        const groupUserRes = await fetch(`/api/groups?userId=${user.id}`);
        if (groupUserRes.ok) {
          const userGroups = await groupUserRes.json();
          userGroups.forEach(group => {
            if (!groupUsersTemp[group.id]) {
              groupUsersTemp[group.id] = [];
            }
            groupUsersTemp[group.id].push({ name: user.name, id: user.id });
          });
        }
      }

      setGroupUsersMap(groupUsersTemp);
    };

    fetchData();
  }, []);

  const getGroupChain = (groupId) => {
    if (!groupId) return [];
    const chain = [];
    let currentId = groupId;
    while (currentId && groupMap[currentId]) {
      const group = groupMap[currentId];
      const users = groupUsersMap[group.id] || [];
      chain.push({
        id: group.id,
        name: group.name || `Grup ${group.id}`,
        users,
      });
      currentId = group.groupId;
    }
    return chain;
  };

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ all: showAll ? 'true' : 'false' });
      const response = await fetch(`/api/devices?${query.toString()}`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp, showAll]);

  const handleExport = () => {
    window.location.assign('/api/reports/devices/xlsx');
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  const toggleRow = (id) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceTitle']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            {admin && <TableCell>ID</TableCell>}
            <TableCell>{t('sharedName')}</TableCell>
            {admin && <TableCell>{t('deviceIdentifier')}</TableCell>}
            {admin && <TableCell>{t('groupParent')}</TableCell>}
            {admin && <TableCell>{t('sharedPhone')}</TableCell>}
            {admin && <TableCell>{t('deviceModel')}</TableCell>}
            {(desktop || admin) && <TableCell>{`${t('sigortaTarih')} ${t('userExpirationTime')}`}</TableCell>}
            {admin && <TableCell>{t('deviceContact')}</TableCell>}
            <TableCell>{`Paket ${t('userExpirationTime')}`}</TableCell>
            {admin && <TableCell>{t('settingsUsers')}</TableCell>}
            <TableCell className={classes.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? items.filter(filterByKeyword(searchKeyword)).map((item) => {
            const groupChain = getGroupChain(item.groupId);
            return (
              <React.Fragment key={item.id}>
                <TableRow onClick={() => toggleRow(item.id)}    sx={{
                    cursor: 'pointer',
                    backgroundColor:
                    item.expirationTime && new Date(item.expirationTime) < new Date()
                      ? theme.palette.error.light
                      : theme.palette.secondary.contrastText, // normal durum // veya custom bir renk
                    
                  }}>
                  {}
                  {admin && <TableCell> <OnlinePredictionIcon sx={{ color: item.status === "online" ? "green" : "red"}}/> {item.id}</TableCell>}
                  <TableCell>{item.name} </TableCell>
                  {admin && <TableCell>{item.uniqueId}</TableCell>}
                  {admin && <TableCell>{item.groupId ? groups[item.groupId]?.name : null}</TableCell>}
                  {admin && <TableCell>{item.phone}</TableCell>}
                  {admin && <TableCell>{item.model}</TableCell>}
                  {(desktop || admin) && <TableCell>{item.attributes?.insuranceExpiration || 'Yok'}</TableCell>}
                  {admin && <TableCell>{item.contact}</TableCell>}
                  <TableCell>{formatTime(item.expirationTime, 'date')}</TableCell>
                  <TableCell> {admin && <DeviceUsersValue deviceId={item.id} /> }
                    
                    <IconButton size="small" >
                      {openRows[item.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                    
                     </TableCell>
                  <TableCell className={classes.columnAction} padding="none">
                    {!deviceReadonly && 
                    <CollectionActionsDevices
                      itemId={item.id}
                      editPath="/settings/device"
                      endpoint="devices"
                      setTimestamp={setTimestamp}
                      customActions={[actionConnections]}
                      readonly={deviceReadonly}
                    />
                  }
                  </TableCell>
                </TableRow>
                
                <TableRow sx={{
                    backgroundColor: theme.palette.action.selected
                  }}>
                  <TableCell colSpan={12} style={{  paddingBottom: 0, paddingTop: 0 }}>
                    <Collapse in={openRows[item.id]} timeout="auto" unmountOnExit>
                    <TableCell> 
                      {t("sigortaTarih")}  {t("userExpirationTime")} : {item.attributes?.insuranceExpiration || 'Yok'}   
                    </TableCell>
                    <TableCell style={{  fontSize: 12 }}> 
                      {t("alarmVibration")} : {item.attributes?.alarmVibration === true ? t("alarmPowerOn") : t("alarmPowerOff")|| 'Yok'} - {t("commandAlarmVibrationlevel")} : {item.attributes?.alarmSensorlevel || ''}   
                    </TableCell>
                    {manager && 
                      <div style={{ padding: 16, background: 'primary' }}>
                        <strong>{t('groupParent')} Zinciri:</strong>
                        <ul>
                          {groupChain.map((group, index) => (
                            <li key={index}>
                              <a
                                onClick={() => { if (admin)
                                    navigate(`/settings/group/${group.id}`);
                                }}
                                style={{ cursor: 'pointer' , color: admin ? '#1976d2' : 'gray' }}
                              >
                                {group.name}
                              </a>
                              {' (Grup Kullanıcıları/ Düzenlemek için İsme Tıklayın: '}
                              {group.users.map((user, i) => (
                                <React.Fragment key={i}>
                                  <a onClick={() => navigate(`/settings/user/${user.id}`)} style={{ cursor: 'pointer' , color: manager ? '#1976d2' : 'gray' }}>{user.name}</a>
                                  {i < group.users.length - 1 && ' , '}
                                </React.Fragment>
                              ))}
                              {')'}
                            </li>
                          ))}
                        </ul>
                      </div>
                      }
                    </Collapse>
                  </TableCell>
                </TableRow>
                
              </React.Fragment>
            );
          }) : (
            <TableShimmer columns={admin ? 11 : 10} endAction />
          )}
        </TableBody>
        <TableFooter>
          {manager && (
            <TableRow>
              <TableCell colSpan={12}>
                <Button onClick={handleExport} variant="text">{t('reportExport')}</Button>
                <FormControlLabel
                  control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} size="small" />}
                  label={t('notificationAlways')}
                  labelPlacement="start"
                  style={{ float: 'right' }}
                />
              </TableCell>
            </TableRow>
          )}
        </TableFooter>
      </Table>
      {admin && <CollectionFab editPath="/settings/device" />}
    </PageLayout>
  );
};

export default DevicesPage;