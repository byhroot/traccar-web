import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Card, CardContent, CircularProgress, useTheme } from "@mui/material";
import { DirectionsCar, AccountCircle } from "@mui/icons-material";

const PackagePricesCards = () => {
  const [prices, setPrices] = useState({ yillikPrice: 0, proPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/paylinks/prices");
        if (!res.ok) throw new Error("Fiyat bilgisi alınamadı");
        const data = await res.json();
        setPrices({
          yillikPrice: data.yillikPrice ?? 0,
          proPrice: data.proPrice ?? 0,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">Hata: {error}</Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, margin: "0 auto", borderRadius: 0, p: 0.5, mt: 0 }}>
      <CardContent>
        <Typography variant="h5" fontWeight="600" mb={1} textAlign="center">
          Güncel Fiyatlar
        </Typography>

        <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
          {/* Araç Yenileme Kartı */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              flex: "1 1 45%",
              maxWidth: 400,
              textAlign: "center",
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.05)" },
            }}
            elevation={4}
          >
            <DirectionsCar sx={{ fontSize: 40, mb: 0 }} />
            <Typography variant="subtitle1" gutterBottom>
              Yıllık Yenileme
            </Typography>
            <Typography variant="h6" fontWeight="700">
              {prices.yillikPrice} ₺
            </Typography>
            <Typography variant="body2" mt={0.5}>
              (Araç Başı)
            </Typography>
          </Paper>

          {/* Pro Paket Kartı */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              flex: "1 1 45%",
              maxWidth: 300,
              textAlign: "center",
              bgcolor: theme.palette.success.light,
              color: theme.palette.success.contrastText,
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.05)" },
            }}
            elevation={4}
          >
            <AccountCircle sx={{ fontSize: 40, mb: 0 }} />
            <Typography variant="subtitle1" gutterBottom>
              Pro Paket Yıllık
            </Typography>
            <Typography variant="h6" fontWeight="700">
              +{prices.proPrice} ₺
            </Typography>
            <Typography variant="body2" mt={0.5}>
              (Hesap Düzeyinde)
            </Typography>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PackagePricesCards;
