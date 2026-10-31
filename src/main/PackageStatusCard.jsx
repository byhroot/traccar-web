import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import CallIcon from '@mui/icons-material/Call';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import { useEffectAsync } from '../reactHelper';
import { useAdministrator } from '../common/util/permissions';
import { useTranslation } from '../common/components/LocalizationProvider';
import NotificationsPageNewProAlertCard from '../settings/NotificationsPageNewProAlertCard';

// Tek bir kota satırı: ikon + başlık + değer, altında ilerleme çubuğu
const UsageMeter = ({ icon, color, label, limitLabel, limit, percentage }) => (
  <Box
    sx={(theme) => ({
      p: 2,
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      bgcolor: alpha(theme.palette[color].main, 0.05),
    })}
  >
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
      <Box
        sx={(theme) => ({
          width: 32,
          height: 32,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 1.5,
          color: theme.palette[color].main,
          bgcolor: alpha(theme.palette[color].main, 0.14),
        })}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ flexGrow: 1 }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1 }}>
        {limit}
      </Typography>
    </Stack>
    <Tooltip title={`${percentage.toFixed(1)}%`} placement="top">
      <LinearProgress
        variant="determinate"
        color={color}
        value={percentage}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Tooltip>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
      {limitLabel}
    </Typography>
  </Box>
);

const PackageStatusCard = () => {
  const user = useSelector((state) => state.session.user);
  const { id } = useParams();
  const admin = useAdministrator();
  const t = useTranslation();

  const isOwnProfile = !id || id === user?.id?.toString();

  const [item, setItem] = useState(isOwnProfile ? user : null);

  useEffectAsync(async () => {
    if (!isOwnProfile && !item && id) {
      const response = await fetch(`/api/users/${id}`);
      if (response.ok) {
        setItem(await response.json());
      } else {
        throw Error(await response.text());
      }
    }
  }, [id, item, isOwnProfile]);

  const smsLimit = item?.attributes?.smsLimit || 0;
  const statuscarddisabled = item?.attributes?.statuscarddisabled === true;

  const callLimit = Math.floor(smsLimit / 4);
  const smsPercentage = Math.min((smsLimit / 3000) * 100, 100);
  const callPercentage = Math.min((callLimit / 750) * 100, 100);

  const isPro = smsLimit > 10;
  const paketInfo = isPro
    ? { type: t('paketProfesyonel'), color: 'success' }
    : { type: t('paketStandart'), color: 'info', extra: t('paketStandartAciklama') };

  const smsWarning =
    smsLimit > 0 &&
    (smsLimit < 1 ? t('paketStandartAciklama2') : smsLimit < 500 ? t('paketProfesyonelUyari') : null);

  const roleLabel =
    isOwnProfile && admin
      ? 'Administrator'
      : isOwnProfile && item && item.userLimit > 0
        ? t('userAdmin')
        : null;

  return (
    <Stack spacing={2}>
      {/* Paket başlığı */}
      <Box
        sx={(theme) => ({
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette[paketInfo.color].main, 0.4)}`,
          bgcolor: alpha(theme.palette[paketInfo.color].main, 0.08),
        })}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <WorkspacePremiumOutlinedIcon color={paketInfo.color} sx={{ fontSize: 32 }} />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} color={`${paketInfo.color}.main`}>
              {paketInfo.type}
            </Typography>
            {paketInfo.extra && !statuscarddisabled && (
              <Typography variant="body2" color="text.secondary">
                {paketInfo.extra}
              </Typography>

            )}
          </Box>

          {roleLabel && <Chip size="small" variant="outlined" label={roleLabel} />}
        </Stack>

      </Box>
      {paketInfo.extra && !statuscarddisabled && (

        <NotificationsPageNewProAlertCard />
      )}
      {/* Uyarı */}
      {smsWarning && !statuscarddisabled && (
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
          {smsWarning}
        </Alert>

      )}
      {smsWarning && !statuscarddisabled && (

        <NotificationsPageNewProAlertCard smsLimit={smsLimit} />
      )}

      {/* Kotalar */}
      {isPro && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <UsageMeter
            icon={<SmsIcon fontSize="small" />}
            color="primary"
            label={t('notificatorSms')}
            limitLabel={t('userUserLimit')}
            limit={smsLimit}
            percentage={smsPercentage}
          />
          <UsageMeter
            icon={<CallIcon fontSize="small" />}
            color="secondary"
            label={t('notificatorPushover')}
            limitLabel={t('userUserLimit')}
            limit={callLimit}
            percentage={callPercentage}
          />
        </Box>
      )}
    </Stack>
  );
};

export default PackageStatusCard;