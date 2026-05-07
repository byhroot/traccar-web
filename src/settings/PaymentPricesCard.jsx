import React, { useState, useEffect } from "react";
import {
  Box, Typography, CircularProgress, useTheme,
  Stack, Divider, Chip, Paper, useMediaQuery
} from "@mui/material";
import {
  DirectionsCar,
  StarBorder,
  CheckCircle,
  SupportAgent,
  SmartToy,
  Sms
} from "@mui/icons-material";
const PackagePricesCards = ({ refreshKey }) => {
  const [prices, setPrices] = useState({ yillikPrice: 0, proPrice: 0 });
  const [loyalty, setLoyalty] = useState({ points: 0, discountTL: 0 });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  useEffect(() => {
    const fetchData = async () => {
      try {
        // İki isteği aynı anda başlatıyoruz
        const [pricesResult, loyaltyResult] = await Promise.allSettled([
          fetch("/api/paylinks/prices").then(res => res.json()),
          fetch("/api/paylinks/loyalty").then(res => res.json()),
        ]);

        // Prices kontrolü
        if (pricesResult.status === "fulfilled") {
          const data = pricesResult.value;
          setPrices({ yillikPrice: data.yillikPrice ?? 0, proPrice: data.proPrice ?? 0 });
        } else {
          console.error("Prices yüklenirken hata oluştu:", pricesResult.reason);
        }

        // Loyalty kontrolü
        if (loyaltyResult.status === "fulfilled") {
          const data = loyaltyResult.value;
          setLoyalty({ points: data.points ?? 0, discountTL: data.discountTL ?? 0 });
        } else {
          console.error("Loyalty yüklenirken hata oluştu:", loyaltyResult.reason);
        }

      } catch (err) {
        // Beklenmedik kritik hatalar için
        console.error("Genel hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const PriceCard = ({ title, price, icon: Icon, color, subtitle, features, isPro, unit }) => (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1.5 : 2.5,
        borderRadius: "16px",
        flex: "1 1 0px", // Mobilde yan yana gelmeyi zorlar
        minWidth: isMobile ? "160px" : "280px",
        background: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        border: `2px solid ${isPro ? theme.palette.divider : color}`,
        position: "relative",
        display: 'flex',
        flexDirection: 'column',
        transition: "0.3s",
        "&:hover": { transform: "translateY(-5px)", boxShadow: theme.shadows[4] }
      }}
    >
      {isPro && (
        <Chip
          label="OPSİYONEL"
          size="small"
          sx={{
            position: 'absolute', top: 8, right: 8, height: 16,
            fontSize: '8px', fontWeight: '900', bgcolor: 'grey.500', color: '#fff'
          }}
        />
      )}

      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems="center">
          <Box sx={{
            p: 1, borderRadius: '10px', bgcolor: `${color}15`, color: color,
            display: 'flex', alignItems: 'center'
          }}>
            <Icon sx={{ fontSize: isMobile ? 24 : 30 }} />
          </Box>
          <Box textAlign={isMobile ? "center" : "left"}>
            <Typography variant={isMobile ? "caption" : "subtitle1"} fontWeight="800" sx={{ lineHeight: 1 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px', display: 'block' }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        <Box textAlign="center">
          <Typography variant={isMobile ? "h6" : "h4"} fontWeight="900" color={color}>
            {price}₺
            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.7rem' }}>
              /{unit}
            </Typography>
          </Typography>
        </Box>

        <Stack spacing={0.8} sx={{ flexGrow: 1 }}>
          {features.map((f, i) => (
            <Stack key={i} direction="row" spacing={0.5} alignItems="flex-start">
              <CheckCircle sx={{ fontSize: 12, color: color, mt: 0.3 }} />
              <Typography sx={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500, lineHeight: 1.2 }}>
                {f}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress size={30} /></Box>;

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      {loyalty.discountTL > 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 2, p: isMobile ? 1.2 : 1.5,
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: isMobile ? '18px' : '22px' }}>🎉</Typography>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? '12px' : '14px', lineHeight: 1.2 }}>
                {loyalty.points} puanınız var!
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '10px' : '11px' }}>
                Ödeme oluşturulurken otomatik olarak uygulanır.
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={`${loyalty.discountTL} ₺ İndirim`}
            sx={{
              bgcolor: '#fff', fontWeight: 900,
              color: theme.palette.success.dark,
              fontSize: isMobile ? '11px' : '13px',
            }}
          />
        </Paper>
      )}
      <Box
        display="flex"
        gap={isMobile ? 1 : 2}
        justifyContent="center"
        sx={{ overflowX: 'auto', pb: 1 }} // Taşma olursa kaydırılabilir (güvenlik için)
      >

        <PriceCard
          title="Araç Standart"
          subtitle="Araç Adet/1 Yıl"
          price={prices.yillikPrice}
          unit="araç"
          icon={DirectionsCar}
          color={theme.palette.primary.main}
          features={["Mobil Uygulama & App Bildirimleri", "Eposta Bildirimleri", "Canlı Destek ", "Tüm Sistem Özellikleri"]}
        />

        <PriceCard
          title="Pro Paket"
          subtitle="Kullanıcı Hesabı/ 1 Yıl"
          price={prices.proPrice}
          unit="hesap"
          icon={StarBorder}
          color={theme.palette.warning.main}
          isPro={true}
          features={["Yapay Zeka Araması Bildirim Sistemi", "Önemli Alarmlarda Sistem Tarafından Otomatik Aranırsınız", "Tercihlerinizi Bildirim Ayarlarından ayarlayabilirsiniz.", "Böylece hiçbir önemli bildirimi kaçırmamış olursunuz.", "3000 SMS & 750 Arama(Yıllık)", "Ek Paket Satın alınabilir."]}
        />
      </Box>
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, opacity: 0.6, fontSize: '9px' }}>
        * Pro paket opsiyoneldir. Standart pakette tüm uygulama özellikleri aktiftir.
      </Typography>
    </Box>
  );
};

export default PackagePricesCards;