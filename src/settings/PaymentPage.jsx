import React, { useState, useEffect } from "react";
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Typography, Paper, useMediaQuery, useTheme, TextField,
  InputAdornment, Accordion, AccordionSummary, AccordionDetails,
  Badge, Stack, Divider, Slide, Zoom, Card, CardContent, CircularProgress,
  Collapse,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import { Add, Remove, CheckCircle, TimeToLeave, Cancel, InfoOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import StarIcon from "@mui/icons-material/Star";

import PetsIcon from "@mui/icons-material/Pets";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RvHookupIcon from "@mui/icons-material/RvHookup";
import AirportShuttleIcon from "@mui/icons-material/AirportShuttle";
import ConstructionIcon from "@mui/icons-material/Construction";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FlightIcon from "@mui/icons-material/Flight";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import HikingIcon from "@mui/icons-material/Hiking";
import PersonIcon from "@mui/icons-material/Person";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import MopedIcon from "@mui/icons-material/Moped";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import TrainIcon from "@mui/icons-material/Train";
import TramIcon from "@mui/icons-material/Tram";
import DirectionsTransitFilledIcon from "@mui/icons-material/DirectionsTransitFilled";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PageLayout from "../common/components/PageLayout";
import { useManager } from "../common/util/permissions";
import PaymentStatusCard from "./PaymentStatusCard";
import PaymentPricesCard from "./PaymentPricesCard";
import { useAdministrator } from "../common/util/permissions";
import PaymentStatusAdminCard from "./PaymentStatusAdminCard";
import FinansMenu from "../finans/FinansMenu";

const PaymentPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [showDeviceList, setShowDeviceList] = useState(false);
  const theme = useTheme();
  const admin = useAdministrator();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [packageType, setPackageType] = useState("standard");
  const [proCount, setProCount] = useState(1);
  const [step, setStep] = useState(1);
  const [packagePrices, setPackagePrices] = useState({ standard: 0, pro: 490, yillik: 1440 });
  const [resultDialog, setResultDialog] = useState({ open: false, success: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loyalty, setLoyalty] = useState({ points: 0, discountTL: 0 });

  const manager = useManager();

  const categoryIcons = {
    animal: <PetsIcon />, bicycle: <DirectionsBikeIcon />, boat: <DirectionsBoatIcon />,
    bus: <DirectionsBusIcon />, car: <DirectionsCarIcon />, camper: <RvHookupIcon />,
    crane: <ConstructionIcon />, default: <HelpOutlineIcon />, helicopter: <FlightIcon />,
    motorcycle: <TwoWheelerIcon />, offroad: <HikingIcon />, person: <PersonIcon />,
    pickup: <LocalShippingIcon />, plane: <AirplanemodeActiveIcon />, scooter: <MopedIcon />,
    ship: <DirectionsBoatIcon />, tractor: <AgricultureIcon />, train: <TrainIcon />,
    tram: <TramIcon />, trolleybus: <DirectionsTransitFilledIcon />, truck: <TimeToLeave />,
    van: <AirportShuttleIcon />,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pricesRes = await fetch("/api/paylinks/prices");
        if (pricesRes.ok) {
          const data = await pricesRes.json();
          setPackagePrices({ standard: data.standard ?? 0, pro: data.proPrice ?? 490, yillik: data.yillikPrice ?? 1440 });
        }
      } catch (err) {
        console.error("Fiyat hatası:", err);
      }

      try {
        const loyaltyRes = await fetch("/api/paylinks/loyalty");
        if (loyaltyRes.ok) {
          const lData = await loyaltyRes.json();
          setLoyalty({ points: lData.points ?? 0, discountTL: lData.discountTL ?? 0 });
        }
      } catch (err) {
        console.error("Loyalty hatası:", err);
        setLoyalty({ points: 0, discountTL: 0 });
      }
    };
    fetchData();
  }, [refreshKey]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("/api/devices");
        if (response.ok) {
          const data = await response.json();
          const thirtyDaysLater = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
          setDevices(data.filter(device => device.expirationTime && new Date(device.expirationTime) < thirtyDaysLater));
        }
      } catch (error) { console.error("Cihaz hatası", error); }
    };
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelectDevice = (id) => {
    setSelectedDevices((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  const handleToggleAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    const payload = {
      deviceIds: selectedDevices,
      paket: { standard: packageType === "standard" ? 1 : 0, pro: packageType === "pro" ? proCount : 0 },
    };
    try {
      const response = await fetch("/api/paylinks/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      setResultDialog({ open: true, success: response.ok });
      if (response.ok) setRefreshKey(prev => prev + 1);
    } catch (err) {
      setResultDialog({ open: true, success: false });
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  const totalPrice = (selectedDevices.length * packagePrices.yillik) + (packageType === "pro" ? packagePrices.pro * proCount : 0);
  const discountedPrice = Math.max(0, totalPrice - loyalty.discountTL);
  const [couponDismissed, setCouponDismissed] = useState(false);
  // --- Paket Kartı ---
  const PackageOption = ({ type, title, price, features, icon: Icon, isPro, badge }) => {
    const selected = packageType === type;
    const color = isPro ? theme.palette.warning.main : theme.palette.primary.main;
    return (
      <Paper
        onClick={() => setPackageType(type)}
        sx={{
          p: 2.5, borderRadius: 4, cursor: "pointer", flex: 1, position: "relative",
          border: `2.5px solid ${selected ? color : theme.palette.divider}`,
          bgcolor: selected ? (theme.palette.mode === "dark" ? `${color}15` : `${color}05`) : "background.paper",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: selected ? "scale(1.02)" : "scale(1)",
          "&:hover": { borderColor: color },
        }}
      >
        {badge && (
          <Box sx={{
            position: "absolute", top: -12, right: 20, bgcolor: color, color: "#fff",
            px: 1.5, py: 0.5, borderRadius: 2, fontSize: "0.65rem", fontWeight: "900", boxShadow: 3,
          }}>
            {badge}
          </Box>
        )}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}20`, display: "flex" }}>
            <Icon sx={{ color: color, fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="900" sx={{ opacity: 0.8 }}>{title}</Typography>
            <Typography variant="h5" fontWeight="900" color={color}>
              {type === "pro" ? `+${price}₺` : `${price}₺`}
              <Typography component="span" variant="caption" color="text.secondary">
                {" / "}{isPro ? "hesap · yıllık" : "araç · yıllık"}
              </Typography>
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1.2}>
          {features.map((f, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
              <CheckCircle sx={{ fontSize: 16, color: color, mt: 0.2 }} />
              <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ lineHeight: 1.2 }}>{f}</Typography>
            </Stack>
          ))}
        </Stack>

        {/* Pro "hesap başına" vurgusu */}
        {isPro && (
          <Box sx={{
            mt: 2, p: 1.2, borderRadius: 2,
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,183,77,0.12)" : "#FFF8E1",
            border: `1px dashed ${theme.palette.success.main}`,
            display: "flex", gap: 1, alignItems: "flex-start",
          }}>
            <InfoOutlined sx={{ fontSize: 14, color: "success.dark", mt: 0.2, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 600, lineHeight: 1.4 }}>
              Kaç aracınız olursa olsun, Pro paket ücreti hesabınız için <strong>yalnızca 1 kez</strong> ücretlendirilir.
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // --- Sticky Bar fiyat breakdown metni ---
  const barBreakdown = [
    `${selectedDevices.length} araç × ${packagePrices.yillik.toLocaleString("tr-TR")} ₺`,
    packageType === "pro" ? `Pro: ${(packagePrices.pro * proCount).toLocaleString("tr-TR")} ₺` : null,
    loyalty.discountTL > 0 ? `-${loyalty.discountTL.toLocaleString("tr-TR")} ₺ puan` : null,
  ].filter(Boolean).join(" · ");

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['sharedServiceName', 'userBilling']}>
      {/* pb: 10 → sticky bar yüksekliği kadar boşluk bırakır */}
      <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 1.5, md: 3 }, pb: 14, overflowX: "hidden" }}>
        <PaymentPricesCard refreshKey={refreshKey} />
        {loyalty.discountTL > 0 && !couponDismissed && (
          <Zoom in>
            <Box
              sx={{
                position: "fixed",
                bottom: { xs: 72, md: 90 },
                right: { xs: 12, md: 24 },
                zIndex: 1300,
                cursor: "pointer",
              }}
              onClick={() => setCouponDismissed(true)}            >
              <Paper
                elevation={6}
                sx={{
                  position: "relative",
                  px: 2,
                  py: 1.2,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  border: "1.5px solid #34d39950",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  // Shimmer
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #a7f3d0, transparent)",
                    animation: "shimmerCoupon 2.5s ease-in-out infinite",
                  },
                  "@keyframes shimmerCoupon": {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(100%)" },
                  },
                }}
              >
                {/* Pulse ikon */}
                <Box sx={{
                  width: 30, height: 30, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.15)",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  color: "#fff",
                  animation: "pulseCoupon 2s ease-in-out infinite",
                  "@keyframes pulseCoupon": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0.4)" },
                    "50%": { boxShadow: "0 0 0 5px transparent" },
                  },
                  flexShrink: 0,
                }}>
                  <LocalOfferIcon sx={{ fontSize: 15 }} />
                </Box>

                <Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.65rem", fontWeight: 700, lineHeight: 1 }}>
                    İNDİRİM KUPONUNUZ VAR
                  </Typography>
                  <Typography sx={{ color: "#fff", fontSize: "0.95rem", fontWeight: 900, lineHeight: 1.3 }}>
                    {loyalty.discountTL.toLocaleString("tr-TR")} ₺ indirim
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem", fontWeight: 500 }}>
                    {loyalty.points} puan · ödemede otomatik uygulanır
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Zoom>
        )}
        <PaymentStatusCard devices={devices} refreshKey={refreshKey} />
        {admin && <PaymentStatusAdminCard />}
        {/* Arama + Tümünü Seç */}
        <Paper elevation={0} sx={{
          p: 2, borderRadius: 4, mb: 3,
          border: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper",
        }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <TextField
              placeholder="Araç veya Plaka Ara..."
              variant="outlined" size="small" fullWidth
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            />
            <Button
              variant={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0 ? "contained" : "outlined"}
              startIcon={<SelectAllIcon />}
              onClick={handleToggleAll}
              sx={{ borderRadius: 3, whiteSpace: "nowrap", minWidth: { sm: 180 }, fontWeight: "bold" }}
            >
              {selectedDevices.length === filteredDevices.length && filteredDevices.length > 0
                ? "Seçimi Temizle"
                : "Tümünü Seç"}
            </Button>
          </Stack>
        </Paper>

        {/* Araç Kartları Grid */}
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "repeat(4, 1fr)" }}
          gap={2}
        >
          {filteredDevices.map((device) => {
            const isSelected = selectedDevices.includes(device.id);
            return (
              <Card
                key={device.id}
                onClick={() => handleSelectDevice(device.id)}
                sx={{
                  borderRadius: 4, cursor: "pointer", transition: "0.2s",
                  border: `2px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
                  bgcolor: isSelected
                    ? (theme.palette.mode === "dark" ? "rgba(0,149,158,0.1)" : "rgba(0,149,158,0.05)")
                    : "background.paper",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{
                      width: 44, height: 44, borderRadius: 2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      bgcolor: isSelected ? "primary.main" : "action.hover",
                      color: isSelected ? "#fff" : "primary.main",
                    }}>
                      {React.cloneElement(categoryIcons[device.category] || categoryIcons.default, { sx: { fontSize: 24 } })}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight="800" noWrap>{device.name}</Typography>
                      <Typography variant="caption" color={isSelected ? "primary.main" : "text.secondary"} fontWeight="600">
                        Bitiş: {new Date(device.expirationTime).toLocaleDateString("tr-TR")}
                      </Typography>
                    </Box>
                    <Checkbox checked={isSelected} sx={{ p: 0 }} />
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
        {/* Boş durum */}
        {filteredDevices.length === 0 && (
          <Zoom in timeout={400}>
            <Box
              sx={{
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 72, height: 72, borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'floatIcon 3s ease-in-out infinite',
                  '@keyframes floatIcon': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                  },
                }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 36, color: 'success.main' }} />
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {search ? 'Araç bulunamadı' : 'Tüm araçlarınız güncel'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                  {search
                    ? `"${search}" ile eşleşen araç yok.`
                    : 'Paket yenileyebileceğiniz süresi yaklaşan cihazınız bulunmuyor. Paket yenileme işlemleri son 30 gün içinde yapılabilir.'}
                </Typography>
              </Box>
            </Box>
          </Zoom>
        )}
      </Box>

      {/* ── STICKY BAR ── */}
      <Slide direction="up" in={selectedDevices.length > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            borderRadius: 0,
            borderTop: `1px solid ${theme.palette.divider}`,
            px: { xs: 2, md: 4 },
            py: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>

            {/* Sol — araç sayısı + paket */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: "50%",
                bgcolor: "primary.main", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <DirectionsCarIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight="700" noWrap>
                  {selectedDevices.length} araç seçildi
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {packageType === "pro" ? `Standart + Pro ×${proCount}` : "Standart paket"}
                </Typography>
              </Box>

              {!isMobile && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    {loyalty.discountTL > 0 && (
                      <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.disabled", display: "block", lineHeight: 1 }}>
                        {totalPrice.toLocaleString("tr-TR")} ₺
                      </Typography>
                    )}
                    <Typography variant="h6" fontWeight="900" color="primary.main" sx={{ lineHeight: 1.2 }}>
                      {discountedPrice.toLocaleString("tr-TR")} ₺
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {barBreakdown}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>

            {/* Mobilde fiyat ortada */}
            {isMobile && (
              <Box sx={{ textAlign: "center" }}>
                {loyalty.discountTL > 0 && (
                  <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.disabled", display: "block", lineHeight: 1 }}>
                    {totalPrice.toLocaleString("tr-TR")} ₺
                  </Typography>
                )}
                <Typography variant="subtitle1" fontWeight="900" color="primary.main" sx={{ lineHeight: 1.2 }}>
                  {discountedPrice.toLocaleString("tr-TR")} ₺
                </Typography>
              </Box>
            )}

            {/* Buton */}
            <Button
              variant="contained"
              size="large"
              onClick={() => { setStep(1); setOpenDialog(true); }}
              startIcon={<ShoppingCartCheckoutIcon />}
              sx={{ borderRadius: 3, fontWeight: "900", px: { xs: 2, md: 4 }, flexShrink: 0 }}
            >
              {isMobile ? "Devam" : "Ödeme Linkini Oluştur"}
            </Button>

          </Stack>
        </Paper>
      </Slide>

      {/* ── CHECKOUT DIALOG ── */}
      <Dialog
        open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 5, mx: 1 } }}
      >
        {step === 1 ? (
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
              <StarIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="900">Hesabınızı Güçlendirin</Typography>
              <Typography variant="caption" color="text.secondary">
                Tüm araçlarınız için geçerli ek avantajları keşfedin (Opsiyonel)
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 2, md: 4 } }}>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <PackageOption
                  type="standard" title="STANDART PAKET" price={packagePrices.yillik}
                  icon={DirectionsCarIcon} isPro={false}
                  features={["Sınırsız Mobil & Web Takip", "Uygulama Anlık Bildirimler", "E-Posta Bildirimleri", "Tüm Sistem Özellikleri"]}
                />

                <PackageOption
                  type="pro" title="PRO PLUS PAKET" price={packagePrices.pro}
                  icon={AutoAwesomeIcon} isPro={true} badge="EN POPÜLER"
                  features={["+3000 Adet SMS Bildirimi", "+750 Yapay Zeka Sesli Arama", "Bildirimleri ayarlardan özelleştirebilirsiniz", "Belirli saatlerde / günlerde zamanlayabilirsiniz", "Hiçbir önemli olayı kaçırmayın"]}
                />

                {/* Pro adet seçici — sadece manager'a göster */}
                <Collapse in={packageType === "pro" && manager}>
                  <Paper sx={{
                    mt: 1, p: 2, borderRadius: 3,
                    bgcolor: "warning.light", color: "warning.contrastText",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <InfoOutlined fontSize="small" />
                      <Typography sx={{ fontSize: 13 }} fontWeight="bold">
                        Alt kullanıcılarınız için de Pro Paket satın alabilirsiniz.
                      </Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" sx={{ bgcolor: "background.paper", borderRadius: 2, p: 0.5 }}>
                      <IconButton size="small" onClick={() => setProCount(Math.max(1, proCount - 1))}><Remove /></IconButton>
                      <Typography sx={{ px: 2, fontWeight: "900", color: "text.primary" }}>{proCount}</Typography>
                      <IconButton size="small" onClick={() => setProCount(proCount + 1)}><Add /></IconButton>
                    </Stack>
                  </Paper>
                </Collapse>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 0 }}>
              <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: "bold" }}>Vazgeç</Button>
              <Button variant="contained" size="large" fullWidth sx={{ borderRadius: 3, fontWeight: "900" }} onClick={() => setStep(2)}>
                Özete Devam Et
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
              <ReceiptLongIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" fontWeight="900">Sipariş Özeti</Typography>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 2, md: 5 } }}>
              <Paper variant="outlined" sx={{
                p: 3, borderRadius: 4,
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#fcfcfc",
              }}>
                <Stack spacing={2}>
                  {/* Araçlar */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="800">
                        Araç Yıllık Paket Yenileme (×{selectedDevices.length})
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="900">
                        {(selectedDevices.length * packagePrices.yillik).toLocaleString("tr-TR")} ₺
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={showDeviceList ? <VisibilityOff /> : <Visibility />}
                      onClick={() => setShowDeviceList(!showDeviceList)}
                      sx={{ textTransform: "none", mt: 0.5, fontWeight: "bold" }}
                    >
                      {showDeviceList ? "Araçları Gizle" : "Seçilen Araçları Gör"}
                    </Button>
                    <Collapse in={showDeviceList}>
                      <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: "action.hover", maxHeight: 150, overflowY: "auto" }}>
                        {selectedDevices.map(id => (
                          <Typography key={id} variant="caption" sx={{ display: "block", py: 0.2, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            • {devices.find(d => d.id === id)?.name}
                          </Typography>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>

                  <Divider />

                  {/* Paket */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight="800">
                        Paket: {packageType === "pro" ? "Pro Plus (Yıllık)" : "Standart (Ek Ücret Yok)"}
                      </Typography>
                      {packageType === "pro" && (
                        <Typography variant="caption" color="text.secondary">
                          {proCount} hesap için · araç sayısından bağımsız
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="subtitle1" fontWeight="900">
                      {packageType === "pro"
                        ? `${(packagePrices.pro * proCount).toLocaleString("tr-TR")} ₺`
                        : "0 ₺"}
                    </Typography>
                  </Box>

                  {/* Toplam */}
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "primary.main", color: "#fff", mt: 1 }}>
                    {loyalty.discountTL > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight="700">
                          🎉 {loyalty.points} Puan İndirimi
                        </Typography>
                        <Typography variant="caption" fontWeight="700">
                          -{loyalty.discountTL.toLocaleString("tr-TR")} ₺
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight="900">Genel Toplam</Typography>
                      <Stack alignItems="flex-end">
                        {loyalty.discountTL > 0 && (
                          <Typography variant="caption" sx={{ textDecoration: "line-through", fontSize: "0.85rem" }}>
                            {totalPrice.toLocaleString("tr-TR")} ₺
                          </Typography>
                        )}
                        <Typography variant="h5" fontWeight="900">
                          {discountedPrice.toLocaleString("tr-TR")} ₺
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1} sx={{ mt: 3, p: 1.5, borderRadius: 2, border: "1px dashed #ccc" }}>
                <InfoOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                  Sistemde kayıtlı GSM numaranıza SMS olarak veya e-posta adresinize ödeme linki gönderilecektir.
                  Ödeme sonrası 24 saat içinde aktivasyon tamamlanır.
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 2 }}>
              <Button onClick={() => setStep(1)} sx={{ fontWeight: "bold" }}>Paket Değiştir</Button>
              <Button
                variant="contained" size="large" fullWidth
                sx={{ borderRadius: 3, fontWeight: "900" }}
                onClick={handleConfirmPayment}
              >
                Güvenli Ödeme Linki Oluştur
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Sonuç Modalı */}
      <Dialog
        open={resultDialog.open}
        onClose={() => setResultDialog({ ...resultDialog, open: false })}
        PaperProps={{ sx: { borderRadius: 5 } }}
      >
        <Box sx={{ p: 5, textAlign: "center" }}>
          {resultDialog.success
            ? <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            : <Cancel color="error" sx={{ fontSize: 80, mb: 2 }} />}
          <Typography variant="h5" fontWeight="900">
            {resultDialog.success ? "İşlem Başarılı!" : "Bir Sorun Oluştu"}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            {resultDialog.success
              ? "Ödeme linkiniz hazır! Lütfen cep telefonunuzu ve e-posta adresinizi kontrol edin."
              : "Sipariş oluşturulurken bir hata meydana geldi. Lütfen destek ekibiyle iletişime geçin."}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setResultDialog({ ...resultDialog, open: false });

              // Sadece başarılıysa seçimleri temizle
              if (resultDialog.success) {
                setSelectedDevices([]);
                setPackageType("standard");
                setProCount(1);
                setStep(1);
                setShowDeviceList(false);
                setSearch("");
              }
            }}
            sx={{ borderRadius: 3, px: 6 }}
          >
            Anladım
          </Button>
        </Box>
      </Dialog>

      {/* Loading */}
      <Dialog open={loading} PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}>
        <Box sx={{ p: 5, bgcolor: "background.paper", borderRadius: 4, textAlign: "center" }}>
          <CircularProgress color="primary" size={60} thickness={4} />
          <Typography sx={{ mt: 2, fontWeight: "bold" }}>İşleminiz Yapılıyor...</Typography>
        </Box>
      </Dialog>

    </PageLayout>
  );
};

export default PaymentPage;