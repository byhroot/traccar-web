import React, { useState, useEffect } from 'react';
import {
  Box, Typography, IconButton, Chip, useTheme, useMediaQuery,
  Dialog, DialogContent, Paper, Stack, Divider, Button, CircularProgress, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import SmsIcon from '@mui/icons-material/Sms';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { CheckCircle } from '@mui/icons-material';

// ─── Dönen mesajlar — düşük limit (< 50)
const LOW_MESSAGES = [
  { icon: <PhoneInTalkIcon sx={{ fontSize: 18 }} />, text: 'Telefon sessizde mi? AI asistan kritik alarmlar için sizi <strong>bizzat arar.</strong>', accent: '#ff6b35' },
  { icon: <VolumeOffIcon sx={{ fontSize: 18 }} />, text: 'Bildirimleri kaçırıyor musunuz? Pro paket ile <strong>sesli AI araması</strong> devreye girer.', accent: '#7c3aed' },
  { icon: <BatteryAlertIcon sx={{ fontSize: 18 }} />, text: 'Telefonunuz Güç tasarrufu modundayken bildirimler geç ulaşabilir — <strong>Pro\'da SMS & Arama gecikme yaşamaz.</strong>', accent: '#059669' },
  { icon: <SmsIcon sx={{ fontSize: 18 }} />, text: 'Pro Paket ile <strong>+3000 SMS</strong> veya <strong>+750 AI sesli arama</strong> hakkı kazanın.', accent: '#0ea5e9' },
  { icon: <NotificationsOffIcon sx={{ fontSize: 18 }} />, text: 'Uygulamayı kaldırsanız bile <strong>AI asistan telefonunuzu arar.</strong> Önemli olayları kaçırmayın!', accent: '#e11d48' },
  { icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} />, text: 'Yapay Zeka Çağrı Merkezi ile <strong>Pro Paket</strong> — bildirim hiç kaçırmayın.', accent: '#f59e0b' },
];

// ─── Özellik satırı (dialog içi)
const FeatureRow = ({ icon, label, color }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${color}18`, color, flexShrink: 0 }}>
      {React.cloneElement(icon, { sx: { fontSize: 17 } })}
    </Box>
    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>{label}</Typography>
  </Stack>
);

// ─── Kredi bilgi satırı (dialog içi — yüksek limit)
const CreditInfoRow = ({ icon, label, cost, sublabel, color }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{
    py: 1.2, px: 1.5, borderRadius: 2,
    bgcolor: `${color}0e`,
    border: `1px solid ${color}22`,
  }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color, display: 'flex' }}>{React.cloneElement(icon, { sx: { fontSize: 20 } })}</Box>
      <Box>
        <Typography variant="body2" fontWeight={700}>{label}</Typography>
        {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
      </Box>
    </Stack>
    <Chip
      label={cost}
      size="small"
      sx={{ bgcolor: `${color}18`, color, border: `1px solid ${color}40`, fontWeight: 800, fontSize: '0.7rem' }}
    />
  </Stack>
);

// ─── Ana komponent
const NotificationsPageNewProAlertCard = ({ smsLimit, forceOpen = false, onForceClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const [dismissed, setDismissed] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [proPrice, setProPrice] = useState(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [success, setSuccess] = useState(false);

  const limitLoaded = smsLimit != null;
  const isLow = limitLoaded && smsLimit < 50;       // < 50 → satış odaklı
  const isHigh = limitLoaded && smsLimit >= 50;      // >= 50 → kredi bilgisi

  // SMS hakkını aramaya çevir: 4 kredi / arama (cevaplanan), ama istatistiksel ortalama ~1.5 kredi/arama
  const smsCount = limitLoaded ? smsLimit : 0;
  const callCount = limitLoaded ? Math.floor(smsLimit / 4) : 0;       // cevaplananlar için

  const dialogOpen = forceOpen || internalOpen;

  useEffect(() => {
    if (!limitLoaded) return;
    fetch('/api/paylinks/prices')
      .then(r => r.ok ? r.json() : null)
      .then(data => setProPrice(data?.proPrice ?? 490))
      .catch(() => setProPrice(490));
  }, [limitLoaded]);

  // Mesaj döngüsü — sadece düşük limitte
  useEffect(() => {
    if (!isLow || dismissed) return;
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setMsgIndex(p => (p + 1) % LOW_MESSAGES.length); setFade(true); }, 350);
    }, 8000);
    return () => clearInterval(iv);
  }, [isLow, dismissed]);

  const handleClose = () => {
    setInternalOpen(false);
    if (onForceClose) onForceClose();
    setTimeout(() => setSuccess(false), 400);
  };

  const handleCreateLink = async () => {
    setLoadingLink(true);
    try {
      const res = await fetch('/api/paylinks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds: [], paket: { standard: 0, pro: 1 } }),
      });
      if (res.ok) setSuccess(true);
    } catch { /* sessiz */ } finally {
      setLoadingLink(false);
    }
  };

  // Limit yüklenmediyse ya da kapatıldıysa banner gösterme
  if (!limitLoaded || dismissed) return null;

  const current = LOW_MESSAGES[msgIndex];
  const lowAccent = current.accent;
  const highAccent = '#0ea5e9'; // sabit mavi — yüksek limit banner

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          BANNER
          ════════════════════════════════════════════════════════════════════ */}
      <Box
        onClick={() => setInternalOpen(true)}
        sx={{
          position: 'relative', width: '100%', cursor: 'pointer', mb: 2,
          borderRadius: 3, overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          border: `1px solid ${isLow ? lowAccent : highAccent}40`,
          boxShadow: `0 4px 24px ${isLow ? lowAccent : highAccent}20`,
          transition: 'box-shadow 0.3s ease, transform 0.15s ease',
          '&:hover': { boxShadow: `0 6px 32px ${isLow ? lowAccent : highAccent}40`, transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${isLow ? lowAccent : highAccent}, transparent)`,
            animation: 'shimmer 2.5s ease-in-out infinite',
          },
          '@keyframes shimmer': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        }}
      >
        {/* Dekor ışık */}
        <Box sx={{
          position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${isLow ? lowAccent : highAccent}20 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, px: { xs: 2, md: 3 }, py: { xs: 1.2, md: 1.4 }, position: 'relative' }}>

          {/* ── DÜŞÜK LİMİT: Pulse ikon + dönen mesaj ── */}
          {isLow && (
            <>
              <Box sx={{
                flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${lowAccent}20`, border: `1.5px solid ${lowAccent}60`, color: lowAccent,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': { '0%, 100%': { boxShadow: `0 0 0 0 ${lowAccent}40` }, '50%': { boxShadow: `0 0 0 6px transparent` } },
              }}>
                {current.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#e2e8f0', fontSize: { xs: '0.78rem', md: '0.85rem' }, lineHeight: 1.4, fontWeight: 500, '& strong': { color: lowAccent, fontWeight: 800 } }}
                  dangerouslySetInnerHTML={{ __html: current.text }}
                />
              </Box>
            </>
          )}

          {/* ── YÜKSEK LİMİT: Mevcut kredi özeti ── */}
          {isHigh && (
            <>
              <Box sx={{
                flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: '#0ea5e920', border: '1.5px solid #0ea5e960', color: '#0ea5e9',
                animation: 'pulse 3s ease-in-out infinite',
                '@keyframes pulse': { '0%, 100%': { boxShadow: '0 0 0 0 #0ea5e940' }, '50%': { boxShadow: '0 0 0 6px transparent' } },
              }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                  Pro Paket · Mevcut Krediniz
                </Typography>
                <Stack direction="row" spacing={{ xs: 1.5, md: 3 }} alignItems="center" flexWrap="wrap">
                  {/* SMS */}
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <SmsIcon sx={{ fontSize: 15, color: '#0ea5e9' }} />
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: { xs: '0.78rem', md: '0.85rem' } }}>
                      <strong style={{ color: '#38bdf8' }}>{smsCount.toLocaleString()}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}> SMS</span>
                    </Typography>
                  </Stack>

                  <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>veya</Typography>

                  {/* Arama */}
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <PhoneInTalkIcon sx={{ fontSize: 15, color: '#a78bfa' }} />
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: { xs: '0.78rem', md: '0.85rem' } }}>
                      <strong style={{ color: '#c4b5fd' }}>{callCount.toLocaleString()}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}> AI Arama</span>
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </>
          )}

          {/* Sağ: ok */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5, color: isLow ? lowAccent : highAccent }}>
            {!isMobile && (
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                {isLow ? 'PRO AL' : 'DETAY'}
              </Typography>
            )}
            <ArrowForwardIosIcon sx={{ fontSize: isMobile ? 14 : 12 }} />
          </Box>

          {/* Kapat */}
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            sx={{ flexShrink: 0, ml: 0.5, color: 'rgba(255,255,255,0.35)', p: 0.4, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        {/* Alt progress bar — sadece düşük limitte */}
        {isLow && (
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, height: '2px', bgcolor: `${lowAccent}30`, width: '100%' }}>
            <Box sx={{ height: '100%', bgcolor: lowAccent, width: `${((msgIndex + 1) / LOW_MESSAGES.length) * 100}%`, transition: 'width 0.4s ease' }} />
          </Box>
        )}
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          DIALOG
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 5,
            background: isDark ? 'linear-gradient(160deg, #0f0e17 0%, #1a1a2e 100%)' : 'linear-gradient(160deg, #ffffff 0%, #f8f6ff 100%)',
            overflow: 'hidden',
          }
        }}
      >
        <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, color: 'text.secondary', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
          <CloseIcon />
        </IconButton>

        <DialogContent sx={{ p: 0 }}>

          {/* ── DÜŞÜK LİMİT DIALOG: Satış odaklı ── */}
          {isLow && !success && (
            <Box>
              <Box sx={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)', px: { xs: 3, md: 4 }, pt: 5, pb: 4, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, #7c3aed30 0%, transparent 70%)' }} />
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: '#7c3aed20', border: '1.5px solid #7c3aed60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AutoAwesomeIcon sx={{ color: '#a78bfa', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: '#a78bfa', fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1, display: 'block' }}>PRO PLUS PAKET</Typography>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1.1 }}>Sipariş Özeti</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h3" sx={{ color: '#a78bfa', fontWeight: 900 }}>
                    {proPrice != null ? `${proPrice}₺` : <CircularProgress size={24} sx={{ color: '#a78bfa' }} />}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>/ yıllık</Typography>
                </Stack>
              </Box>

              <Box sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 2 }}>
                  Pakete dahil olanlar
                </Typography>
                <Stack spacing={1.8} mb={3}>
                  <FeatureRow icon={<SmsIcon />} label="+3.000 Adet SMS Bildirimi veya," color="#0ea5e9" />
                  <FeatureRow icon={<PhoneInTalkIcon />} label="+750 Yapay Zeka Sesli Arama" color="#7c3aed" />
                  <FeatureRow icon={<VolumeOffIcon />} label="Telefon sessizde bile AI sizi arar" color="#e11d48" />
                  <FeatureRow icon={<BatteryAlertIcon />} label="Güç tasarrufu modunda gecikme yaşamazsınız" color="#059669" />
                  <FeatureRow icon={<NotificationsOffIcon />} label="Uygulama kapalıyken de bildirim alırsınız" color="#f59e0b" />
                  <FeatureRow icon={<AutoAwesomeIcon />} label="Bildirim zamanlaması ve özelleştirme" color="#a78bfa" />
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 3, background: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Pro Plus Paket</Typography>
                      <Typography variant="caption" color="text.secondary">1 Hesap — Yıllık</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={900} color="#7c3aed">{proPrice != null ? `${proPrice} ₺` : '—'}</Typography>
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={900}>Genel Toplam</Typography>
                    <Typography variant="h5" fontWeight={900}>{proPrice != null ? `${proPrice} ₺` : '—'}</Typography>
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 3, bgcolor: 'action.hover', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}` }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <ReceiptLongIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      Sistemde kayıtlı <strong>GSM numaranıza SMS</strong> ve <strong>e-posta adresinize</strong> ödeme linki gönderilecektir. Ödeme sonrası aktivasyon <strong>24 saat içinde</strong> tamamlanır.
                    </Typography>
                  </Stack>
                </Paper>

                <Button
                  variant="contained" fullWidth size="large"
                  disabled={loadingLink || proPrice == null}
                  onClick={handleCreateLink}
                  sx={{ borderRadius: 3, fontWeight: 900, fontSize: '1rem', py: 1.5, background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)', '&:hover': { background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)' }, '&:disabled': { opacity: 0.6 } }}
                >
                  {loadingLink ? <><CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />Link Oluşturuluyor...</> : '🔐 Güvenli Ödeme Linki Oluştur'}
                </Button>
              </Box>
            </Box>
          )}

          {/* ── YÜKSEK LİMİT DIALOG: Kredi bilgisi + istatistik ── */}
          {isHigh && (
            <Box>
              {/* Header */}
              <Box sx={{ background: 'linear-gradient(135deg, #0c1a3a 0%, #0f2d5e 60%, #0a1f3f 100%)', px: { xs: 3, md: 4 }, pt: 5, pb: 4, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, #0ea5e930 0%, transparent 70%)' }} />
                <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: '#0ea5e920', border: '1.5px solid #0ea5e960', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AutoAwesomeIcon sx={{ color: '#38bdf8', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: '#38bdf8', fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1, display: 'block' }}>PRO PLUS PAKET</Typography>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1.1 }}>Kredi Bilgileriniz</Typography>
                  </Box>
                </Stack>

                {/* Kredi özet kartları */}
                <Stack direction="row" spacing={2}>
                  <Paper elevation={0} sx={{ flex: 1, p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <SmsIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>SMS Kredisi</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ color: '#38bdf8', fontWeight: 900, lineHeight: 1 }}>{smsCount.toLocaleString()}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>adet</Typography>
                  </Paper>
                  <Paper elevation={0} sx={{ flex: 1, p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <PhoneInTalkIcon sx={{ fontSize: 16, color: '#c4b5fd' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>AI Arama</Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ color: '#c4b5fd', fontWeight: 900, lineHeight: 1 }}>{callCount.toLocaleString()}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>arama (cevaplanan)</Typography>
                  </Paper>
                </Stack>
              </Box>

              <Box sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
                {/* Kredi maliyeti tablosu */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                  Kredi Tarifesi
                </Typography>
                <Stack spacing={1.2} mb={3}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <SmsIcon sx={{ fontSize: 18, color: '#0ea5e9' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>SMS Bildirimi</Typography>
                        </Box>
                      </Stack>
                      <Chip label="1 kredi" size="small" sx={{ bgcolor: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.35)', fontWeight: 800, fontSize: '0.7rem' }} />
                    </Stack>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <PhoneInTalkIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>AI Sesli Arama — Cevaplanırsa</Typography>
                        </Box>
                      </Stack>
                      <Chip label="4 kredi" size="small" sx={{ bgcolor: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)', fontWeight: 800, fontSize: '0.7rem' }} />
                    </Stack>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <PhoneInTalkIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>AI Sesli Arama — Meşgul / Cevapsız</Typography>
                        </Box>
                      </Stack>
                      <Chip label="1 kredi" size="small" sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', fontWeight: 800, fontSize: '0.7rem' }} />
                    </Stack>
                  </Paper>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* İstatistik bilgisi */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 2, bgcolor: isDark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.25)' }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ color: '#059669', mt: 0.2, flexShrink: 0 }}>
                      <InfoOutlinedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={800} color="#059669" mb={0.5}>İstatistiklere göre</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: 'block' }}>
                        1000 kredi, <strong>1 araç için yaklaşık 1 yıl</strong> yetecek düzeydedir. Bu süre zarfında ortalama 1.500 SMS bildirimi veya 375 AI arama hakkı sunar. Kullanım yoğunluğunuza bağlı olarak bu süre değişebilir, Pro Plus paketinizin avantajlarından uzun süre faydalanabilir, krediniz tükendiğinde TakipOn size sektörün en uygun fiyatlarıyla paket yenileme imkanı sunar.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Button
                  variant="outlined" fullWidth size="large"
                  onClick={handleClose}
                  sx={{ borderRadius: 3, fontWeight: 800, py: 1.3, borderColor: 'rgba(14,165,233,0.4)', color: '#0ea5e9', '&:hover': { borderColor: '#0ea5e9', bgcolor: 'rgba(14,165,233,0.06)' } }}
                >
                  Tamam
                </Button>
              </Box>
            </Box>
          )}

          {/* ── BAŞARI EKRANI (sadece düşük limitten sonra) ── */}
          {isLow && success && (
            <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 6, md: 7 }, textAlign: 'center' }}>
              <Box sx={{
                width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 16px 48px rgba(5,150,105,0.4)',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                '@keyframes popIn': { '0%': { transform: 'scale(0)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
              }}>
                <CheckCircle sx={{ fontSize: 54, color: '#fff' }} />
              </Box>
              <Typography variant="h5" fontWeight={900} mb={1} sx={{ animation: 'fadeUp 0.5s ease 0.2s both', '@keyframes fadeUp': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } } }}>
                İşlem Başarılı! 🎉
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={4} sx={{ animation: 'fadeUp 0.5s ease 0.3s both', lineHeight: 1.6 }}>Ödeme linkiniz hazırlandı ve iletildi.</Typography>
              <Stack spacing={2} mb={4} sx={{ animation: 'fadeUp 0.5s ease 0.4s both' }}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: isDark ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.25)' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LocalPhoneIcon sx={{ color: '#059669', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={700} textAlign="left">Cep telefonunuza SMS gönderildi</Typography>
                  </Stack>
                </Paper>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: isDark ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.25)' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <EmailIcon sx={{ color: '#0ea5e9', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={700} textAlign="left">E-posta adresinize ödeme linki gönderildi</Typography>
                  </Stack>
                </Paper>
              </Stack>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 4, bgcolor: 'action.hover', border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`, animation: 'fadeUp 0.5s ease 0.5s both' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                  <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Ödeme sonrası aktivasyon <strong>24 saat içinde</strong> gerçekleşecektir.
                  </Typography>
                </Stack>
              </Paper>
              <Button
                variant="contained" fullWidth size="large" onClick={handleClose}
                sx={{ borderRadius: 3, fontWeight: 900, py: 1.4, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', boxShadow: '0 8px 24px rgba(5,150,105,0.35)', animation: 'fadeUp 0.5s ease 0.6s both', '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' } }}
              >
                Anladım
              </Button>
            </Box>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationsPageNewProAlertCard;