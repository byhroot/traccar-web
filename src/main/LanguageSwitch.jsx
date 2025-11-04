import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
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
  // Kullanıcının mevcut dilini attributes üzerinden al
  const [language, setLanguage] = useState(user?.attributes?.language || 'tr');

  const handleSave = async (newLang) => {
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
        setLanguage(newLang);
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error('Dil güncellenirken hata oluştu:', error);
    }
  };

  return (
    <FormControl
      size="small"
      variant="outlined"
      sx={{ minWidth: 150, ml: 1 }}
    >
      <InputLabel>{t("sharedNotification") + " " + t("loginLanguage") }</InputLabel>
      <Select
        value={language}
        label="Language"
        onChange={(e) => handleSave(e.target.value)}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReactCountryFlag countryCode={lang.country} svg />
              <Typography variant="body2">{lang.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitch;
