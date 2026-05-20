import { useState } from 'react';
import { IconButton, Menu, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { makeStyles } from 'tss-react/mui';
import RemoveDialog from '../../common/components/RemoveDialog';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useManager } from '../../common/util/permissions';
import GroupsManagerFab from '../GroupsManagerFab';

const useStyles = makeStyles()(() => ({
  row: {
    display: 'flex',
  },
}));

const CollectionActionsGroup = ({
  itemId,
  editPath,
  endpoint,
  setTimestamp,
  customActions,
  readonly,
  hasDevices = false,  // ← yeni prop
  groups = [],        // ← yeni prop
}) => {
  const theme = useTheme();
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const admin = useAdministrator();
  const manager = useManager();

  const phone = useMediaQuery(theme.breakpoints.down('sm'));

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);  // ← wizard state

  const handleEdit = () => {
    if (itemId && !admin) {
      setEditOpen(true);
    } else {
      navigate(`${editPath}/${itemId}`);
    }

    setMenuAnchorEl(null);
  };

  const handleRemove = () => {
    setRemoving(true);
    setMenuAnchorEl(null);
  };

  const handleCustom = (action) => {
    action.handler(itemId);
    setMenuAnchorEl(null);
  };

  const handleRemoveResult = (removed) => {
    setRemoving(false);
    if (removed) {
      setTimestamp(Date.now());
    }
  };

  return (
    <>
      {phone ? (
        <>
          <IconButton size="small" onClick={(event) => setMenuAnchorEl(event.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu open={!!menuAnchorEl} anchorEl={menuAnchorEl} onClose={() => setMenuAnchorEl(null)}>
            {customActions &&
              customActions.map((action) => (
                <MenuItem onClick={() => handleCustom(action)} key={action.key}>
                  {action.title}
                </MenuItem>
              ))}
            {!readonly && manager && editPath && (
              <MenuItem onClick={handleEdit}>
                {t('sharedEdit')}
              </MenuItem>
            )}

            {!readonly && manager && (
              <MenuItem
                onClick={handleRemove}
                disabled={hasDevices}
              >
                {hasDevices ? 'Araçları taşıyın (silinemez)' : t('sharedRemove')}
              </MenuItem>
            )}
          </Menu>
        </>
      ) : (
        <div className={classes.row}>
          {customActions &&
            customActions.map((action) => (
              <Tooltip title={action.title} key={action.key}>
                <IconButton size="small" onClick={() => handleCustom(action)}>
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          {!readonly && manager && (
            <>
              {editPath && (
                <Tooltip title={t('sharedEdit')}>
                  <IconButton size="small" onClick={handleEdit}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {manager &&
                // Silme butonunda:
                <Tooltip title={hasDevices ? 'Önce araçları grupsuz bırakın' : t('sharedRemove')}>
                  <span>  {/* disabled IconButton için span wrapper gerekli */}
                    <IconButton
                      size="small"
                      onClick={handleRemove}
                      disabled={hasDevices}
                      sx={{ '&.Mui-disabled': { opacity: 0.35 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              }
            </>

          )}
        </div>
      )}
      <RemoveDialog
        style={{ transform: 'none' }}
        open={removing}
        endpoint={endpoint}
        itemId={itemId}
        onResult={handleRemoveResult}
      />
      {/* Edit wizard — sadece manager için açılır */}
      {manager && !admin && (
        <GroupsManagerFab
          groups={groups}
          editGroupId={itemId}
          editOpen={editOpen}
          onEditClose={() => setEditOpen(false)}
          onSuccess={() => setTimestamp(Date.now())}
        />
      )}
    </>
  );
};

export default CollectionActionsGroup;
