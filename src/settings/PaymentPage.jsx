import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  CardContent,
  Card,
  Grid,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
  TextField,
  FormControlLabel,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { CircularProgress } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import Cancel from "@mui/icons-material/Cancel";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import MopedIcon from "@mui/icons-material/Moped";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import TrainIcon from "@mui/icons-material/Train";
import TramIcon from "@mui/icons-material/Tram";
import DirectionsTransitFilledIcon from "@mui/icons-material/DirectionsTransitFilled"; // trolleybus
import { Add, Remove, CheckCircle, TimeToLeave } from "@mui/icons-material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PageLayout from "../common/components/PageLayout";
import { useManager } from "../common/util/permissions";
import PaymentStatusCard from "./PaymentStatusCard";
import PaymentPricesCard from "./PaymentPricesCard";


const PaymentPage = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));

  const [packageType, setPackageType] = useState("standard");
  const [proCount, setProCount] = useState(1);
  const [step, setStep] = useState(1);
  const [packagePrices, setPackagePrices] = useState({
    standard: 0,
    pro: 490,
    yillik: 1440,
  });
  const [resultDialog, setResultDialog] = useState({ open: false, success: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const manager = useManager();

  // fiyatları API'den al
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/paylinks/prices");
        if (res.ok) {
          const data = await res.json();
          setPackagePrices({
            standard: data.standard ?? 0,
            pro: data.proPrice ?? 0,
            yillik: data.yillikPrice ?? 0,

          });
        }
      } catch (err) {
        console.error("Fiyat bilgisi alınamadı:", err);
      }
    };
    fetchPrices();
  }, []);

  const categoryIcons = {
    animal: <PetsIcon color="primary" />,
    bicycle: <DirectionsBikeIcon color="primary" />,
    boat: <DirectionsBoatIcon color="primary" />,
    bus: <DirectionsBusIcon color="primary" />,
    car: <DirectionsCarIcon color="primary" />,
    camper: <RvHookupIcon color="primary" />,
    crane: <ConstructionIcon color="primary" />,
    default: <HelpOutlineIcon color="disabled" />,
    helicopter: <FlightIcon color="primary" />,
    motorcycle: <TwoWheelerIcon color="primary" />,
    offroad: <HikingIcon color="primary" />,
    person: <PersonIcon color="primary" />,
    pickup: <LocalShippingIcon color="primary" />,
    plane: <AirplanemodeActiveIcon color="primary" />,
    scooter: <MopedIcon color="primary" />,
    ship: <DirectionsBoatIcon color="primary" />,
    tractor: <AgricultureIcon color="primary" />,
    train: <TrainIcon color="primary" />,
    tram: <TramIcon color="primary" />,
    trolleybus: <DirectionsTransitFilledIcon color="primary" />,
    truck: <TimeToLeave color="primary" />,
    van: <AirportShuttleIcon color="primary" />,
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("/api/devices");
        if (response.ok) {
          const data = await response.json();
          const now = new Date();
          const thirtyDaysLater = new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000
          );
          const filtered = data.filter((device) => {
            if (!device.expirationTime) return false;
            const exp = new Date(device.expirationTime);
            return exp < thirtyDaysLater;
          });
          setDevices(filtered);
        }
      } catch (error) {
        console.error("Cihazlar alınamadı", error);
      }
    };
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectDevice = (id) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleOpenDialog = () => {
    if (selectedDevices.length === 0) {
      alert("Lütfen en az bir araç seçiniz.");
      return;
    }
    setStep(1);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmPayment = async () => {

    const payload = {
      deviceIds: selectedDevices,
      paket: {
        standard: packageType === "standard" ? 1 : 0,
        pro: packageType === "pro" ? proCount : 0,
      },
    };
    setLoading(true); // ✅ Yükleniyor başlasın

    try {
      const response = await fetch("/api/paylinks/create", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setResultDialog({ open: true, success: true });
        setRefreshKey(prev => prev + 1);   // ✅ burası önemli
        setLoading(false);

      } else {
        setResultDialog({ open: true, success: false });
        setLoading(false);
      }
    } catch (err) {
      console.error("API isteği hatası:", err);
      setResultDialog({ open: true, success: false });
      setLoading(false);
    }
    setOpenDialog(false);
  };
  

  return (
    <PageLayout breadcrumbs={["sharedSettings", "records"]}>
      <Grid item xs={12} sm={10} md={10} lg={10} xl={8}>
        <PaymentPricesCard />
        
        <PaymentStatusCard devices={devices} refreshKey={refreshKey} />

        {/* Arama ve Tümünü Seç */}
        <Box
          display="flex"
          flexDirection={desktop ? "row" : "column"}
          alignItems={desktop ? "center" : "stretch"}
          justifyContent="space-between"
          mb={2}
          gap={2}
          px={1}
        >
          <TextField
            label="Araç Ara"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  filteredDevices.length > 0 &&
                  selectedDevices.length === filteredDevices.length
                }
                indeterminate={
                  selectedDevices.length > 0 &&
                  selectedDevices.length < filteredDevices.length
                }
                onChange={(e) => handleToggleAll(e.target.checked)}
              />
            }
            label="Tümünü Seç"
          />
        </Box>

        {/* Araç Kartları */}
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "1fr 1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
            lg: "1fr 1fr 1fr 1fr",
          }}
          gap={2}
          pb={desktop ? 12 : 8}
          px={1}
        >
          {filteredDevices.map((device) => (
            <Card
              key={device.id}
              elevation={3}
              sx={{
                borderRadius: 3,
                transition: "0.3s",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {categoryIcons[device.category] || categoryIcons.default}

                  <Typography variant="h6" fontWeight="600">
                    {device.name}
                  </Typography>
                  <Checkbox
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => handleSelectDevice(device.id)}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Bitiş Tarihi:{" "}
                  {new Date(device.expirationTime).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* FAB ile Ödeme Linki */}
        <Fab
          color="primary"
          variant="extended"
          onClick={handleOpenDialog}
          disabled={selectedDevices.length === 0}
          sx={{
            position: "fixed",
            bottom: 75,
            left: desktop ? "64%" : "50%",
            transform:  desktop ?  "translateX(-45%)" : "translateX(-50%)",
            zIndex: 1000,
            px: 3,
          }}
        >
          <ShoppingCartIcon sx={{ mr: 1 }} />
          Sepete Git
        </Fab>

        {/* Paket Seçim / Ödeme Özeti Diyaloğu */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          {step === 1 && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                  <ShoppingCartIcon color="primary" />
                  <Typography variant="h6">Paket Seçimi</Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom>
                  Hesap Paketinizi Seçiniz:
                </Typography>

                <ToggleButtonGroup
                  value={packageType}
                  exclusive
                  onChange={(e, value) => value && setPackageType(value)}
                  sx={{ my: 2 }}
                >
                  <ToggleButton value="standard">
                    Standart Paket ({packagePrices.standard}₺)
                  </ToggleButton>
                  <ToggleButton value="pro">
                    Pro Paket + ({packagePrices.pro}₺)
                  </ToggleButton>
                </ToggleButtonGroup>

                {packageType === "pro" && manager && (
                  <Box display="flex" alignItems="center" mt={2}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Hesap Sayısı:
                    </Typography>
                    <IconButton
                      onClick={() => setProCount(Math.max(1, proCount - 1))}
                    >
                      <Remove />
                    </IconButton>
                    <Typography>{proCount}</Typography>
                    <IconButton onClick={() => setProCount(proCount + 1)}>
                      <Add />
                    </IconButton>
                  </Box>
                )}

                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    {packageType === "standard" ? "Paket Özellikleri" : "Ek Olarak;"}
                  </Typography>

                  <Box
                    display="grid"
                    gridTemplateColumns={desktop ? "1fr 1fr" : "1fr"}
                    gap={2}
                  >
                    {packageType === "standard" && (
                      <>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2, display: "flex", gap: 1 }}
                        >
                          <CheckCircle color="success" />
                          <Typography>Uygulamalar: Ücretsiz</Typography>
                        </Paper>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2, display: "flex", gap: 1 }}
                        >
                          <CheckCircle color="success" />
                          <Typography>Bildirimler: Uygulama, Eposta</Typography>
                        </Paper>
                      </>
                    )}

                    {packageType === "pro" && (
                      <>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2, display: "flex", gap: 1 }}
                        >
                          <CheckCircle color="success" />
                          <Typography>SMS Bildirimleri (3000 Ad.)</Typography>
                        </Paper>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2, display: "flex", gap: 1 }}
                        >
                          <CheckCircle color="success" />
                          <Typography>Çağrı Bildirimleri (750 Arama)</Typography>
                        </Paper>
                      </>
                    )}
                  </Box>
                </Box>
              </DialogContent>

              <DialogActions>
                <Button onClick={handleCloseDialog}>İptal</Button>
                <Button onClick={() => setStep(2)} variant="contained" color="primary">
                  Devam
                </Button>
              </DialogActions>
            </>
          )}

          {step === 2 && (
            <>
              <DialogTitle>Ödeme Özeti</DialogTitle>
              <DialogContent dividers>
              <Typography>
                      Cihaz Yıllık Yenileme: {packagePrices.yillik} ₺
                </Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Araç Sayısı: ({selectedDevices.length}) __ {" "}
                      {selectedDevices.length * packagePrices.yillik}₺
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedDevices.map((id) => {
                      const device = devices.find((d) => d.id === id);
                      return <Typography key={id}>• {device?.name}</Typography>;
                    })}
                  </AccordionDetails>
                </Accordion>

                <Box mt={2}>
                  <Typography>
                    Hesap Paketi: {packageType} ({proCount}) : + {packagePrices[packageType] * proCount}₺
                  </Typography>
                </Box>

                <Box mt={2} p={2} borderRadius={2}>
                  <Typography variant="h6">
                    Toplam: {(selectedDevices.length * packagePrices.yillik) + (packagePrices[packageType] * proCount)}₺
                  </Typography>
                </Box>

                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Not: Ödeme linki sistemde kayıtlı E-posta
                    adresinize ve telefonunuza SMS ile gönderilecektir. Gelen linke tıklayarak ödeme işlemini gerçekleştirebilirsiniz. Sipariş sonrası aktivasyonlar 24 saat içerisinde otomatik gerçekleştirilecektir. 
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setStep(1)}>Geri</Button>
                <Button variant="contained" onClick={handleConfirmPayment}>
                  Link Oluştur
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        <Dialog open={resultDialog.open} onClose={() => setResultDialog({ ...resultDialog, open: false })}>
          <DialogTitle>{resultDialog.success ? "İşlem Başarılı" : "İşlem Başarısız"}</DialogTitle>
          
          <DialogContent>
            {resultDialog.success ? (
                  <CheckCircle color="success" fontSize="large" />
                ) : (
                  <Cancel color="error" fontSize="large" />
                )}
            <Typography>
              {resultDialog.success
                ? "Ödeme linkiniz oluşturuldu. Lütfen e-posta ve SMS kutunuzu kontrol ediniz."
                : "İşlem başarısız oldu. Lütfen birkaç dakika sonra tekrar deneyiniz."}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setResultDialog({ ...resultDialog, open: false })}>
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={loading}>
          <Box display="flex" flexDirection="column" alignItems="center" p={4}>
            <CircularProgress />
            <Typography mt={2}>İşleminiz gerçekleştiriliyor...</Typography>
          </Box>
        </Dialog>


      </Grid>
    </PageLayout>
  );
};

export default PaymentPage;
