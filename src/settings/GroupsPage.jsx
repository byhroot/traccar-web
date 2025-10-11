import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import PublishIcon from '@mui/icons-material/Publish';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActionsGroup from './components/CollectionActionsGroup';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';

const GroupsPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const admin = useAdministrator();
  const limitCommands = useRestriction('limitCommands');

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsGroups']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} mt={1}>
          {items.filter(filterByKeyword(searchKeyword)).map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
<Card elevation={3} sx={{ position: 'relative' }}>
  <CardContent onClick={() => navigate('/settings/devicesuser')}>
    <Typography variant="h6" gutterBottom>
      {item.name}
    </Typography>
  </CardContent>

                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <CollectionActionsGroup
                      itemId={item.id}
                      editPath="/settings/group"
                      endpoint="groups"
                      setTimestamp={setTimestamp}
                      customActions={
                        limitCommands
                          ? [{ key: 'connections', title: t('sharedConnections'), icon: <LinkIcon fontSize="small" />, handler: (groupId) => navigate(`/settings/group/${groupId}/connections`) }]
                          : [
                              { key: 'connections', title: t('sharedConnections'), icon: <LinkIcon fontSize="small" />, handler: (groupId) => navigate(`/settings/group/${groupId}/connections`) },
                              { key: 'command', title: t('deviceCommand'), icon: <PublishIcon fontSize="small" />, handler: (groupId) => navigate(`/settings/group/${groupId}/command`) },
                            ]
                      }
                    />
                  </Box>
              </Card>
            </Grid>
          ))}

          {items.filter(filterByKeyword(searchKeyword)).length === 0 && (
            <Grid item xs={12}>
              <Typography textAlign="center" mt={4} color="textSecondary">
                {t('sharedNoItems')}
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {admin && <CollectionFab editPath="/settings/group" />}
    </PageLayout>
  );
};

export default GroupsPage;
