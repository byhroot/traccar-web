import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  TextField,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  FormControl
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';

import EditItemView from './components/EditItemView';
import SettingsMenu from './components/SettingsMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import useSettingsStyles from './common/useSettingsStyles';

const DriverPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => item && item.name && item.uniqueId;

  useEffect(() => {
    if (id) {
      const fetchItem = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/drivers/${id}`);
          if (!res.ok) throw new Error('Failed to fetch driver');
          const data = await res.json();
          setItem(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    } else {
      setItem({ name: '', uniqueId: '', attributes: {} });
    }
  }, [id]);

  if (loading || !item) {
    return (
      <Typography sx={{ textAlign: 'center', mt: 4 }}>
        {t('sharedLoading')} ⏳
      </Typography>
    );
  }

  return (
    <EditItemView
      endpoint="drivers"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDriver']}
    >
      <Container maxWidth="xs" className={classes.container}>
        {/* Temel Bilgiler Accordion */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <AccountCircleIcon sx={{ mr: 1, color: 'orange' }} /> {t('sharedDriver')} 🙂
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                label={t('sharedName') + ' 🙂'}
                value={item.name || ''}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                placeholder="Ad Soyad"
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 1 }}>
              <TextField
                label={t('deviceIdentifier') + ' 🆔'}
                value={item.uniqueId || ''}
                onChange={(e) => setItem({ ...item, uniqueId: e.target.value })}
                placeholder="TC veya Sürücü Numarası"
              />
              <FormHelperText sx={{ mt: 1 }}>
                {t('driverIdentifierInfo') || 'Kimlik Numarasının doğru olması önemlidir. Sürücüyü hesabınızdan silseniz dahi, İlgili Araç Geçmişinde kimlik numarası kayıtlı kalır. 🛡️'}
              </FormHelperText>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Detaylar / Attributes Accordion */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <BadgeIcon sx={{ mr: 1, color: 'primary.main' }} /> {t('sharedAttributes')} ✨
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                label={t("positionDriverUniqueId")}
                value={item.attributes.license || ''}
                onChange={(e) =>
                  setItem({ ...item, attributes: { ...item.attributes, license: e.target.value } })
                }
                placeholder="Ehliyet Sınıfı"
                InputProps={{
                  startAdornment: <BadgeIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <TextField
                label={t("sharedPhone")}
                value={item.attributes.tel || ''}
                onChange={(e) =>
                  setItem({ ...item, attributes: { ...item.attributes, tel: e.target.value } })
                }
                placeholder="05xx xxx xx xx"
                InputProps={{
                  startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </FormControl>

            <FormControl fullWidth>
              <TextField
                multiline
                rows={3}
                label={t("notes") + ' 📝'}
                value={item.attributes.notes || ''}
                onChange={(e) =>
                  setItem({ ...item, attributes: { ...item.attributes, notes: e.target.value } })
                }
                InputProps={{
                  startAdornment: <NotesIcon fontSize="small" sx={{ mr: 1, mt: -5, color: 'action.active' }} />,
                }}
              />
            </FormControl>
          </AccordionDetails>
        </Accordion>
      </Container>
    </EditItemView>
  );
};

export default DriverPage;