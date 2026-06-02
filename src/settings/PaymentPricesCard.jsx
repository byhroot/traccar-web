import React, { useState, useEffect } from "react";
import {
  Box, Typography, Dialog, DialogContent, DialogTitle,
  IconButton, Paper, Stack, Divider, useTheme, useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";
import SmsIcon from "@mui/icons-material/Sms";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import BoltIcon from "@mui/icons-material/Bolt";

const MESSAGES = [
  {
    icon: <DirectionsCarFilledIcon sx={{ fontSize: 18 }} />,
    text: 'Araçlarınızın aboneliğini yenilemek için <strong>aşağıdan araç seçin.</strong>',
    accent: "#38bdf8",
  },
  {
    icon: <BoltIcon sx={{ fontSize: 18 }} />,
    text: 'Standart paket tüm sistem özelliklerini kapsar — <strong>ek ücret yok.</strong>',
    accent: "#a78bfa",
  },
  {
    icon: <PhoneInTalkIcon sx={{ fontSize: 18 }} />,
    text: 'Pro paket ile yapay zeka sizi bizzat arar, <strong>hiçbir alarmı kaçırmazsınız.</strong>',
    accent: "#ff6b35",
  },
  {
    icon: <SmsIcon sx={{ fontSize: 18 }} />,
    text: 'Pro paket hesabınız için geçerlidir — <strong>kaç araç seçerseniz seçin, 1 kez ödenir.</strong>',
    accent: "#0ea5e9",
  },
  {
    icon: <VolumeOffIcon sx={{ fontSize: 18 }} />,
    text: 'Telefon sessizde bile <strong>SMS ve AI araması</strong> ile sizi buluruz.',
    accent: "#e11d48",
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 18 }} />,
    text: 'Araç seçin, ödeme linkini oluşturun — aktivasyon <strong>24 saat içinde tamamlanır.</strong>',
    accent: "#f59e0b",
  },
];

const STD_FEATURES = [
  "1 Yıllık Cihaz Abonelik Uzatma & SIM Data dahil",
  "Anlık uygulama bildirimleri",
  "E-posta bildirimleri",
  "Hafta İçi Canlı destek",
  "SMS ve Çağrı Merkezi bildirimleri haricinde; Tüm sistem özellikleri dahildir.",
];

const PRO_FEATURES = [
  "+3.000 Pro Bildirim Kredisi (yıllık)",
  " 3000 SMS veya 750-3000 yapay zeka sesli araması,",
  "Sesli Arama Cevaplandığında 4 kredi, Cevaplanmadığında 1 kredi harcanır.",
  "Arama Bildirimlerini Zamana göre Ayarlayabilirsiniz.",
  "Özelleştirilebilir & Modüler bildirim sistemi",
  "Telefonunuz Güç Tasarrufundayken Uygulama Bildirimleri gecikebilir ancak, Çağrı bildirimleri anında sizi arar!",
];

const PaymentPricesCard = ({ refreshKey }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [prices, setPrices] = useState({ yillikPrice: 1440, proPrice: 490 });
  const [open, setOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/paylinks/prices");
        if (res.ok) {
          const data = await res.json();
          setPrices({
            yillikPrice: data.yillikPrice ?? 1440,
            proPrice: data.proPrice ?? 490,
          });
        }
      } catch (err) {
        console.error("Fiyat hatası:", err);
      }
    };
    fetchPrices();
  }, [refreshKey]);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        setFade(true);
      }, 350);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const current = MESSAGES[msgIndex];
  const accent = current.accent;

  return (
    <>
      {/* ── BANNER ── */}
      <Box
        onClick={() => setOpen(true)}
        sx={{
          position: "relative",
          mb: 2.5,
          borderRadius: 3,
          overflow: "hidden",
          cursor: "pointer",
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          border: `1px solid ${accent}40`,
          boxShadow: `0 4px 24px ${accent}20`,
          transition: "box-shadow 0.3s ease, transform 0.15s ease",
          "&:hover": {
            boxShadow: `0 6px 32px ${accent}40`,
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
          // shimmer çizgisi
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            animation: "shimmer 2.5s ease-in-out infinite",
          },
          "@keyframes shimmer": {
            "0%": { transform: "translateX(-100%)" },
            "100%": { transform: "translateX(100%)" },
          },
        }}
      >
        {/* Dekor ışık */}
        <Box sx={{
          position: "absolute", right: -40, top: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "background 0.4s ease",
        }} />

        <Box sx={{
          display: "flex", alignItems: "center",
          gap: { xs: 1.5, md: 2 },
          px: { xs: 2, md: 3 }, py: { xs: 1.4, md: 1.6 },
          position: "relative",
        }}>
          {/* Pulse ikon */}
          <Box sx={{
            flexShrink: 0,
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: `${accent}20`,
            border: `1.5px solid ${accent}60`,
            color: accent,
            transition: "all 0.4s ease",
            animation: "pulseBanner 2s ease-in-out infinite",
            "@keyframes pulseBanner": {
              "0%, 100%": { boxShadow: `0 0 0 0 ${accent}40` },
              "50%": { boxShadow: `0 0 0 6px transparent` },
            },
          }}>
            {current.icon}
          </Box>

          {/* Dönen metin */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#e2e8f0",
                fontSize: { xs: "0.78rem", md: "0.85rem" },
                fontWeight: 500,
                lineHeight: 1.4,
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(4px)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
                "& strong": { color: accent, fontWeight: 800 },
              }}
              dangerouslySetInnerHTML={{ __html: current.text }}
            />
          </Box>

          {/* Sağ: fiyat özeti + ok */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            {!isMobile && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 800, fontSize: "0.75rem" }}>
                  {prices.yillikPrice.toLocaleString("tr-TR")} ₺
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.2)" }}>·</Typography>
                <Typography variant="caption" sx={{ color: "#c4b5fd", fontWeight: 800, fontSize: "0.75rem" }}>
                  +{prices.proPrice.toLocaleString("tr-TR")} ₺ Pro
                </Typography>
              </Stack>
            )}
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: accent }}>
              {!isMobile && (
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: "0.05em", fontSize: "0.7rem" }}>
                  DETAY
                </Typography>
              )}
              <ArrowForwardIosIcon sx={{ fontSize: isMobile ? 14 : 12 }} />
            </Stack>
          </Stack>
        </Box>

        {/* Alt progress bar */}
        <Box sx={{ position: "absolute", bottom: 0, left: 0, height: "2px", bgcolor: `${accent}30`, width: "100%" }}>
          <Box sx={{
            height: "100%",
            bgcolor: accent,
            width: `${((msgIndex + 1) / MESSAGES.length) * 100}%`,
            transition: "width 0.4s ease",
          }} />
        </Box>
      </Box>

      {/* ── DIALOG ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 5,
            mx: 1,
            background: theme.palette.mode === "dark"
              ? "linear-gradient(160deg, #0f0e17 0%, #1a1a2e 100%)"
              : "linear-gradient(160deg, #ffffff 0%, #f8f6ff 100%)",
            overflow: "hidden",
          },
        }}
      >
        {/* Dialog header — koyu gradient */}
        <Box sx={{
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)",
          px: { xs: 3, md: 4 }, pt: 4, pb: 3,
          position: "relative", overflow: "hidden",
        }}>
          <Box sx={{
            position: "absolute", right: -30, top: -30,
            width: 180, height: 180, borderRadius: "50%",
            background: "radial-gradient(circle, #7c3aed30 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", top: 12, right: 12, color: "rgba(255,255,255,0.5)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="overline" sx={{ color: "#a78bfa", fontWeight: 900, letterSpacing: "0.12em", lineHeight: 1, display: "block", mb: 0.5 }}>
            Paket Fiyatları
          </Typography>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 900, lineHeight: 1.1 }}>
            Abonelik Seçenekleri
          </Typography>
        </Box>

        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
          <Stack spacing={2}>

            {/* Standart */}
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 4, border: `2px solid ${theme.palette.primary.main}` }}
            >
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "primary.main", display: "flex" }}>
                  <DirectionsCarIcon sx={{ color: "#fff", fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="900" color="text.secondary">
                    Standart Paket
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography variant="h5" fontWeight="900" color="primary.main">
                      {prices.yillikPrice.toLocaleString("tr-TR")} ₺
                    </Typography>
                    <Typography variant="caption" color="text.secondary">/ araç · yıllık</Typography>
                  </Stack>
                </Box>
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1}>
                {STD_FEATURES.map((f, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 15, color: "primary.main" }} />
                    <Typography variant="caption" fontWeight="600">{f}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            {/* Pro */}
            <Paper
              variant="outlined"
              sx={{ p: 2.5, borderRadius: 4, border: `2px solid ${theme.palette.warning.main}` }}
            >
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: "warning.main", display: "flex" }}>
                  <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2" fontWeight="900" color="text.secondary">
                      Pro Plus Paket
                    </Typography>
                    <Typography variant="caption" sx={{
                      bgcolor: "main.light", color: "warning.dark",
                      px: 1, py: 0.2, borderRadius: 1, fontWeight: 700,
                    }}>
                      Opsiyonel
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography variant="h5" fontWeight="900" color="warning.dark">
                      +{prices.proPrice.toLocaleString("tr-TR")} ₺
                    </Typography>
                    <Typography variant="caption" color="text.secondary">/ hesap · yıllık</Typography>
                  </Stack>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{
                mb: 1.5, p: 1.2, borderRadius: 2,
                bgcolor: "success.light",
                border: `1px dashed ${theme.palette.success.light}`,
              }}>
                <InfoOutlinedIcon sx={{ fontSize: 14, color: "success.light", mt: 0.2, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: "main.dark", fontWeight: 600, lineHeight: 1.4 }}>
                  Kaç aracınız olursa olsun, hesap bazında <strong>yalnızca 1 kez</strong> ücretlendirilir.
                </Typography>
              </Stack>

              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1}>
                {PRO_FEATURES.map((f, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 15, color: "warning.main" }} />
                    <Typography variant="caption" fontWeight="600">{f}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>

          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentPricesCard;