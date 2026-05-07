import { useState } from 'react';
import { Fab } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import UserWizardDialog from '../components/UserWizardDialog'; // büyük U — import düzeltildi

const useStyles = makeStyles()((theme) => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      bottom: `calc(${theme.dimensions.bottomBarHeight}px + ${theme.spacing(2)})`,
    },
  },
}));

const CollectionFab = ({ editPath, disabled, onUserSaved }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const readonly = useRestriction('readonly');
  const admin = useAdministrator();

  const [wizardOpen, setWizardOpen] = useState(false);

  if (readonly || disabled) return '';

  const handleClick = () => {
    if (editPath === '/settings/user' && !admin) {
      setWizardOpen(true);
    } else {
      navigate(editPath);
    }
  };

  return (
    <div className={classes.fab}>
      <Fab size="medium" color="primary" onClick={handleClick}>
        <AddIcon />
      </Fab>

      {editPath === '/settings/user' && (
        <UserWizardDialog
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSaved={(user) => {
            setWizardOpen(false);
            onUserSaved?.(user);
          }}
        />
      )}
    </div>
  );
};

export default CollectionFab;