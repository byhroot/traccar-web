import { Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { geofencesActions } from '../store';
import CollectionActions from '../settings/components/CollectionActions';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  list: {
    flexGrow: 1,
    overflow: 'auto',
    padding: 0,
  },

  item: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 'auto',
    transition: 'background 0.15s ease',

    '&:hover': {
      background: theme.palette.action.hover,
    },
  },

  primary: {
    fontSize: '0.85rem',
    fontWeight: 500,
    lineHeight: 1.2,
  },

  secondary: {
    fontSize: '0.7rem',
    color: theme.palette.text.secondary,
  },

  divider: {
    opacity: 0.25,
    marginLeft: 12,
    marginRight: 12,
  },
}));

const GeofencesList = ({ onGeofenceSelected }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const items = useSelector((state) => state.geofences.items);

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  return (
    <List className={classes.list}>
      {Object.values(items).map((item, index, list) => (
        <Fragment key={item.id}>
          <ListItemButton
            className={classes.item}
            onClick={() => onGeofenceSelected(item.id)}
          >
            <ListItemText
              disableTypography
              primary={
                <Typography className={classes.primary}>
                  {item.name}
                </Typography>
              }
              secondary={
                <Typography className={classes.secondary}>
                  ID: {item.id}
                </Typography>
              }
            />

            <CollectionActions
              itemId={item.id}
              editPath="/settings/geofence"
              endpoint="geofences"
              setTimestamp={refreshGeofences}
            />
          </ListItemButton>

          {index < list.length - 1 && (
            <Divider className={classes.divider} />
          )}
        </Fragment>
      ))}
    </List>
  );
};

export default GeofencesList;