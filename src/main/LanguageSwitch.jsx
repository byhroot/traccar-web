import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import ReactCountryFlag from 'react-country-flag';
import { sessionActions } from '../store';
import { useTranslation } from '../common/components/LocalizationProvider';

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', country: 'TR' },
  { code: 'en', name: 'English', country: 'GB' },
  { code: 'de', name: 'Deutsch', country: 'DE' },
];

const LanguageSwitch = () => {
  const user = useSelector((state) => state.session.user);
  const dispatch = useDispatch();
  const t = useTranslation();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const currentLang = LANGUAGES.find(l => l.code === (user?.attributes?.language || 'tr')) || LANGUAGES[0];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSave = async (newLang) => {
    handleClose();
    if (newLang === currentLang.code) return;

    try {
      const updatedAttributes = { ...user.attributes, language: newLang };
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, attributes: updatedAttributes }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(sessionActions.updateUser(updatedUser));
      }
    } catch (error) {
      console.error('Dil güncellenirken hata oluştu:', error);
    }
  };

  return (
    <Box>
      <Tooltip title={t("loginLanguage")}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
            width: 40,
            height: 40
          }}
        >
          <ReactCountryFlag
            countryCode={currentLang.country}
            svg
            style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
          />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 3,
            minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
          {t("loginLanguage")}
        </Typography>
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleSave(lang.code)}
            selected={lang.code === currentLang.code}
            sx={{ gap: 1.5, py: 1 }}
          >
            <ReactCountryFlag countryCode={lang.country} svg style={{ width: '18px', height: '18px', borderRadius: '2px' }} />
            <Typography variant="body2" fontWeight={lang.code === currentLang.code ? 'bold' : 'normal'}>
              {lang.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitch;