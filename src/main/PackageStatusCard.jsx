import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Tooltip } from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import CallIcon from '@mui/icons-material/Call';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useEffectAsync } from '../reactHelper';
import { useAdministrator, useManager } from '../common/util/permissions';
import { useTranslation } from '../common/components/LocalizationProvider';

const SmsLimitStatusCard = () => {

  const user = useSelector((state) => state.session.user);
  const { id } = useParams();
  const admin = useAdministrator();
  const manager = useManager();
  const t = useTranslation();

  const isOwnProfile = !id || id === user?.id?.toString();

  const [item, setItem] = useState(isOwnProfile ? user : null);

  useEffectAsync(async () => {
    if (!isOwnProfile && !item) {
      if (id) {
        const response = await fetch(`/api/users/${id}`);
        if (response.ok) {
          setItem(await response.json());
        } else {
          throw Error(await response.text());
        }
      } else {
        setItem(defaultItem || {});
      }
    }
  }, [id, item, isOwnProfile]);

  const smsLimit = item?.attributes?.smsLimit || 0;

  const statuscarddisabled = item?.attributes?.statuscarddisabled === true;

  
  const callLimit = Math.floor(smsLimit / 4);
  const smsPercentage = Math.min((smsLimit / 3000) * 100, 100); // varsayılan max 1000
  const callPercentage = Math.min((callLimit / 750) * 100, 100); // varsayılan max 250

  const paketInfo =
    smsLimit > 10
      ? { type: t("paketProfesyonel"), color: 'success.main' }
      : {
          type: t("paketStandart"),
          color: 'info.main',
          extra: t("paketStandartAciklama"),
        };

  const smsWarning = smsLimit > 0 && (smsLimit < 1 ? t("paketStandartAciklama2") : smsLimit < 500 ? t("paketProfesyonelUyari")  : null ) ;



  return (
    <Box sx={{ mt: 2 }}>
      <Card sx={{ mb: 2, borderLeft: 4, borderColor: paketInfo.color, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
          {t("settingsUser")} {isOwnProfile && admin ? "- Administrator" : isOwnProfile && item && item.userLimit > 0 ? "- " + t("userAdmin") : "" }
          </Typography>
          <Typography variant="subtitle1" sx={{ color: paketInfo.color }}>
            {paketInfo.type}
          </Typography>
          {paketInfo.extra && !statuscarddisabled && (
            <Typography variant="body2" color="text.secondary">
              {paketInfo.extra}
            </Typography>
          )}
        </CardContent>
      </Card>

      {smsWarning && !statuscarddisabled && (
        <Box display="flex" alignItems="center" mb={2}>
          <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="body2" color="warning.main">
            {smsWarning}
          </Typography>
        </Box>
      )}
      {smsLimit > 10 && 
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SmsIcon color="primary" sx={{ mr: 1 }} />
                <Typography sx={{ fontSize:16 }}  variant="h6">SMS Bildirim Limiti</Typography>
              </Box>
              <Typography variant="body2" gutterBottom>
                Kalan: {smsLimit} SMS
              </Typography>
              <Tooltip title={`${smsPercentage.toFixed(1)}%`}>
                <LinearProgress
                  variant="determinate"
                  value={smsPercentage}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Tooltip>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CallIcon color="secondary" sx={{ mr: 1 }} />
                <Typography sx={{ fontSize:16 }} variant="h6">Arama Bildirim Limiti</Typography>
              </Box>
              <Typography variant="body2" gutterBottom>
                Kalan: {callLimit} Arama
              </Typography>
              <Tooltip title={`${callPercentage.toFixed(1)}%`}>
                <LinearProgress
                  variant="determinate"
                  value={callPercentage}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#f3e5f5',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#9c27b0' },
                  }}
                />
              </Tooltip>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      }
    </Box>
  );
};

export default SmsLimitStatusCard;
