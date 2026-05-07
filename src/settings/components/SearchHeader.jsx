import React, { useEffect, useRef } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useLocation } from 'react-router-dom';

export const filterByKeyword = (keyword) => (item) =>
  !keyword || JSON.stringify(item).toLowerCase().includes(keyword.toLowerCase());

// 🔹 GLOBAL MEMORY STORE (route bazlı)
const routeSearchStore = new Map();

const useStyles = makeStyles()((theme) => ({
  header: {
    position: 'sticky',
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: theme.spacing(3, 2, 2),
  },
}));

const SearchHeader = ({ keyword, setKeyword }) => {
  const theme = useTheme();
  const { classes } = useStyles();
  const t = useTranslation();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));

  const location = useLocation();
  const routeKey = location.pathname; // 🔥 /devices /settings/users vs.

  const initialized = useRef(false);

  // 🔹 İlk yükleme: route store'dan çek
  useEffect(() => {
    if (!initialized.current) {
      const stored = routeSearchStore.get(routeKey);
      if (stored && !keyword) {
        setKeyword(stored);
      }
      initialized.current = true;
    }
  }, [routeKey, keyword, setKeyword]);

  // 🔹 keyword değişince store’a yaz
  useEffect(() => {
    if (initialized.current) {
      if (keyword) {
        routeSearchStore.set(routeKey, keyword);
      } else {
        routeSearchStore.delete(routeKey);
      }
    }
  }, [keyword, routeKey]);

  // 🔹 highlight (memory'den geldiyse)
  const storedValue = routeSearchStore.get(routeKey);
  const isFromMemory =
    storedValue && storedValue === keyword && keyword !== '';

  return (
    <div className={classes.header}>
      <TextField
        variant="outlined"
        size={phone ? 'small' : 'medium'}
        placeholder={t('sharedSearch')}
        value={keyword || ''}
        onChange={(e) => setKeyword(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: isFromMemory
              ? 'rgb(251, 113, 0)'
              : 'inherit',
          },
        }}
        InputProps={{
          endAdornment: keyword ? (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setKeyword('')}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </div>
  );
};

export default SearchHeader;