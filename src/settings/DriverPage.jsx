import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Grid, TextField, Typography, Box,FormHelperText
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';
import EditItemView from './components/EditItemView';
import { useTranslation } from '../common/components/LocalizationProvider';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';
import { useAdministrator } from '../common/util/permissions';
import { useParams } from 'react-router-dom';

const DriverPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();
  const admin = useAdministrator();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => item && item.name && item.uniqueId;

  // ⚡ Edit modunda item verisini çek
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
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Loading...</Typography>;
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
      <Grid container spacing={2}>
        {/* Temel Bilgiler Kartı */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AccountCircleIcon sx={{ mr: 1, color: 'orange' }} /> {t('sharedDriver')} 🙂
              </Typography>
              <Box mb={2}>
                <TextField
                  fullWidth
                  value={item.name}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                  label={t('sharedName') + ' 🙂'}
                  placeholder="Ad Soyad"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  value={item.uniqueId}
                  onChange={(e) => setItem({ ...item, uniqueId: e.target.value })}
                  label={t('deviceIdentifier') + ' 🆔'}
                  placeholder="TC veya Sürücü Numarası"
                />
              <FormHelperText sx={{     fontSize: { xs: '0.6rem', sm: '0.75rem' }, color: 'text.secondary' }}>
                Kimlik Numarasının doğru olması önemlidir. Sürücüyü hesabınızdan silseniz dahi, İlgili Araç Geçmişinde kimlik numarası kayıtlı kalır.
              </FormHelperText>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Attributes Kartı */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Box mb={2}>
                <TextField
                  fullWidth
                  value={item.attributes.license || ''}
                  onChange={(e) =>
                    setItem({ ...item, attributes: { ...item.attributes, license: e.target.value } })
                  }
                  label={<><BadgeIcon sx={{ mr: 1 }} />  {t("positionDriverUniqueId")} </>}
                  placeholder="A2, B, ..."
                />
              </Box>

              <Box mb={2}>
                <TextField
                  fullWidth
                  value={item.attributes.tel || ''}
                  onChange={(e) =>
                    setItem({ ...item, attributes: { ...item.attributes, tel: e.target.value } })
                  }
                  label={<><PhoneIcon sx={{ mr: 1 }} /> {t("sharedPhone")}</>}
                  placeholder="05551234567"
                />
              </Box>

              <Box mb={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={item.attributes.notes || ''}
                  onChange={(e) =>
                    setItem({ ...item, attributes: { ...item.attributes, notes: e.target.value } })
                  }
                  label={<><NotesIcon sx={{ mr: 1 }} /> {t("notes")} </>}
                  placeholder={t("notes")}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </EditItemView>
  );
};

export default DriverPage;
