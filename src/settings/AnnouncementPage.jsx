import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CampaignIcon from '@mui/icons-material/Campaign';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PaymentsIcon from '@mui/icons-material/Payments';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatchCallback } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import SelectField from '../common/components/SelectField';
import { prefixString } from '../common/util/stringUtils';
import fetchOrThrow from '../common/util/fetchOrThrow';

const AnnouncementPage = () => {
  const navigate = useNavigate();
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const [users, setUsers] = useState([]);
  const [notificator, setNotificator] = useState();
  const [message, setMessage] = useState({});
  const [successOpen, setSuccessOpen] = useState(false);
  const quickMessages = useMemo(() => ([
    {
      icon: '🎉',
      title: 'Hoş Geldiniz',
      subject: 'TakipOn’a Hoş Geldiniz 🎉',
      body: 'Güvenli sürüşler dileriz!',
    },
    {
      icon: '✅',
      title: 'İşlem Tamamlandı',
      subject: 'İşlem Tamamlandı ✅',
      body: 'İşleminiz başarıyla tamamlandı.',
    },
    {
      icon: '🚚',
      title: 'Aktarım Başarılı',
      subject: 'Aktarım Başarılı 🚚',
      body: 'Veri/Cihaz aktarımı başarıyla tamamlandı.',
    },

    {
      icon: '🚚',
      title: 'Sipariş Oluşturuldu',
      subject: 'Sipariş Oluşturuldu 🚚',
      body: 'Aktivasyon için Ruhsat&belge yükleyiniz. https://takipon.com/account/belgeler',
    },
    {
      icon: '💳',
      title: 'Ödeme Bekleniyor',
      subject: 'Ödeme Bekleniyor 💳',
      body: 'Siparisiniz icin guvenli odeme gerceklestirebilirsiniz. Odeme Linki:  - Odeme linki gecerlilik suresi 7 gundur. Guvenli gunler dileriz.',
    },
    {
      icon: '💳',
      title: 'Ödeme Bekleniyor',
      subject: 'Ödeme Bekleniyor 💳',
      body: 'Ödemeniz bekleniyor. Lütfen kontrol ediniz.',
    },

    {
      icon: '🔔',
      title: 'Hatırlatma',
      subject: 'Hatırlatma 🔔',
      body: 'Bekleyen işleminizi kontrol etmeyi unutmayın.',
    },
    {
      icon: '🚘',
      title: 'Araç Tanımlandı',
      subject: 'Araç Tanımlandı 🚘',
      body: 'Yeni aracınız başarıyla sisteme tanımlandı.',
    },
    {
      icon: '📍',
      title: 'Cihaz Aktif',
      subject: 'Cihaz Aktif 📍',
      body: 'Takip cihazınız başarıyla bağlantı kurdu.',
    },
    {
      icon: '⚠️',
      title: 'Bağlantı Sorunu',
      subject: 'Bağlantı Uyarısı ⚠️',
      body: 'Cihaz bağlantısında kısa süreli sorun algılandı.',
    },
    {
      icon: '📢',
      title: ' Duyuru',
      subject: '📢 Planlı Bakım',
      body: 'Kısa süreli kesintiler olabilir.',
    },
  ]), []);

  const applyQuickMessage = (template) => {
    setMessage({
      subject: template.subject,
      body: template.body,
    });
  };

  const handleSend = useCatchCallback(async () => {
    const query = new URLSearchParams();

    users.forEach((userId) => query.append('userId', userId));

    await fetchOrThrow(`/api/notifications/send/${notificator}?${query.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    setSuccessOpen(true);
  }, [users, notificator, message]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['serverAnnouncement']}>
      <Container maxWidth="md" className={classes.container}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) => theme.palette.background.paper,
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CampaignIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Yönetici Duyuru Merkezi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kullanıcılara hızlı bildirim ve bilgilendirme gönderin
              </Typography>
            </Box>
          </Box>

          <Accordion defaultExpanded elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('sharedRequired')}
              </Typography>
            </AccordionSummary>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Kullanıcı Seçimi
              </Typography>

              <Stack direction="row" spacing={1}>
                <Chip
                  label="Tümünü Seç"
                  color="primary"
                  size="small"
                  clickable
                  onClick={async () => {
                    const response = await fetch('/api/users');
                    const data = await response.json();
                    setUsers(data.map((item) => item.id));
                  }}
                />

                <Chip
                  label="Temizle"
                  size="small"
                  clickable
                  onClick={() => setUsers([])}
                />
              </Stack>
            </Box>
            <AccordionDetails className={classes.details}>

              <SelectField
                multiple
                value={users}
                onChange={(e) => setUsers(e.target.value)}
                endpoint="/api/users"
                label={t('settingsUsers')}
              />

              <SelectField
                value={notificator}
                onChange={(e) => setNotificator(e.target.value)}
                endpoint="/api/notifications/notificators?announcement=true"
                keyGetter={(it) => it.type}
                titleGetter={(it) => t(prefixString('notificator', it.type))}
                label={t('notificationNotificators')}
              />

              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1.5,
                    fontWeight: 700,
                  }}
                >
                  Hazır Mesajlar
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {quickMessages.map((item) => (
                    <Chip
                      key={item.title}
                      clickable
                      color="primary"
                      variant="outlined"
                      icon={
                        item.title.includes('Tamamlandı') ? (
                          <DoneAllIcon />
                        ) : item.title.includes('Ödeme') ? (
                          <PaymentsIcon />
                        ) : item.title.includes('Aktarım') ? (
                          <SyncAltIcon />
                        ) : item.title.includes('Araç') ? (
                          <DirectionsCarIcon />
                        ) : (
                          <NotificationsActiveIcon />
                        )
                      }
                      label={`${item.icon} ${item.title}`}
                      onClick={() => applyQuickMessage(item)}
                      sx={{
                        borderRadius: 3,
                        height: 38,
                        fontWeight: 600,
                        px: 0.5,
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TextField
                value={message.subject || ''}
                onChange={(e) => setMessage({
                  ...message,
                  subject: e.target.value,
                })}
                label={t('sharedSubject')}
                fullWidth
              />

              <TextField
                value={message.body || ''}
                onChange={(e) => setMessage({
                  ...message,
                  body: e.target.value,
                })}
                label={t('commandMessage')}
                multiline
                rows={10}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    alignItems: 'flex-start',
                    borderRadius: 3,
                  },
                }}
                placeholder="Mesaj içeriğini buraya yazın..."
              />
            </AccordionDetails>
          </Accordion>
        </Paper>

        <div className={classes.buttons}>
          <Button
            type="button"
            color="primary"
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 3,
              px: 3,
            }}
          >
            {t('sharedCancel')}
          </Button>

          <Button
            type="button"
            color="primary"
            variant="contained"
            onClick={handleSend}
            disabled={!notificator || !message.subject || !message.body}
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: 700,
            }}
          >
            {t('commandSend')}
          </Button>
        </div>
      </Container>
      <Dialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Bildirim Gönderildi 🎉
        </DialogTitle>

        <DialogContent>
          <Alert severity="success" sx={{ mt: 1 }}>
            Duyuru başarıyla kullanıcılara gönderildi.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSuccessOpen(false)}
            variant="contained"
            sx={{ borderRadius: 3 }}
          >
            Tamam
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default AnnouncementPage;