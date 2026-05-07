import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, IconButton, Paper, Button, useMediaQuery, useTheme,
  CircularProgress, Dialog, DialogTitle, DialogContent, Accordion,
  AccordionSummary, AccordionDetails, Badge, Stack, Divider, Chip,
} from "@mui/material";
import {
  ExpandMore, ContentCopy, CheckCircle, ErrorOutline, DirectionsCar, ReceiptLong,
} from "@mui/icons-material";

const PaymentStatusCard = ({ refreshKey }) => {
  const [paylinks, setPaylinks] = useState([]);
  const [devices, setDevices] = useState([]); // Zaten burada cihazlar tutuluyor
  const [loadingIds, setLoadingIds] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, payRes] = await Promise.all([
          fetch("/api/devices"),
          fetch("/api/paylinks"),
        ]);
        if (devRes.ok) setDevices(await devRes.json());
        if (payRes.ok) setPaylinks(await payRes.json());
      } catch (err) {
        console.error("Veri çekme hatası:", err);
      }
    };
    fetchData();
  }, [refreshKey]);

  // ID'leri isimlerle eşleştiren fonksiyon
  const renderDeviceNames = (deviceIdsString) => {
    if (!deviceIdsString) return "Cihaz bilgisi yok";

    // Örn: "{1,2,3}" -> ["1", "2", "3"]
    const ids = deviceIdsString.replace(/[{}]/g, "").split(",").map(id => id.trim());

    const names = ids.map(id => {
      // Yukarıdaki 'devices' state'inden eşleşen cihazı bul
      const found = devices.find(d => String(d.id) === String(id));
      return found ? found.name : `#${id}`; // İsim yoksa ID'yi göster
    });

    return names.join(", ");
  };

  const hasUnpaidLink = useMemo(() => {
    return paylinks.some((p) => p.status !== "PAID");
  }, [paylinks]);

  const handleCheckStatus = async (e, link) => {
    e.stopPropagation();
    if (loadingIds.includes(link.id)) return;

    setLoadingIds((prev) => [...prev, link.id]);
    try {
      const res = await fetch(`/api/paylinks/${link.id}/status`, { method: "PUT" });
      const updated = await res.json();

      if (updated.status === "PAID") {
        setStatusMessage(updated.processed
          ? "Ödemeniz başarılı! Cihazlarınız güncellendi."
          : "Ödemeniz başarılı! İşleminiz tamamlanıyor...");
      } else {
        setStatusMessage("Ödeme henüz onaylanmadı. Lütfen biraz bekleyip tekrar deneyin.");
      }
      setStatusDialogOpen(true);
      setPaylinks((prev) => prev.map((p) => (p.id === link.id ? updated : p)));
    } catch (err) {
      setStatusMessage("Bağlantı hatası oluştu.");
      setStatusDialogOpen(true);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== link.id));
    }
  };

  const getStatusChip = (status) => {
    const isPaid = status === "PAID";
    return (
      <Chip
        icon={isPaid ? <CheckCircle /> : <ErrorOutline />}
        label={isPaid ? "ÖDENDİ" : "BEKLEMEDE"}
        size="small"
        color={isPaid ? "success" : "warning"}
        variant="filled"
        sx={{ fontWeight: "bold", borderRadius: "6px" }}
      />
    );
  };

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Badge
        color="error"
        variant="dot"
        invisible={!hasUnpaidLink}
        sx={{ width: "100%", "& .MuiBadge-badge": { right: 14, top: 14 } }}
      >
        <Accordion
          elevation={3}
          sx={{
            width: "100%",
            borderRadius: "16px !important",
            border: `1px solid ${theme.palette.divider}`,
            "&:before": { display: "none" }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ReceiptLong color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight="800">
                  Ödeme Kayıtları & Linkler
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {paylinks.length} kayıt bulundu
                </Typography>
              </Box>
            </Stack>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 1.5, bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#fafafa" }}>
            {paylinks.length > 0 ? (
              <Stack spacing={2}>
                {paylinks.map((link) => (
                  <Paper
                    key={link.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: "12px", border: link.status === "PAID" ? "1px solid #e0e0e0" : `1px solid ${theme.palette.warning.light}` }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Box>
                        {getStatusChip(link.status)}
                        <Typography variant="h6" sx={{ mt: 1, fontWeight: "900", color: "primary.main" }}>
                          {link.totalAmount} ₺
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={loadingIds.includes(link.id)}
                          onClick={(e) => handleCheckStatus(e, link)}
                          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: "bold" }}
                        >
                          {loadingIds.includes(link.id) ? <CircularProgress size={20} color="inherit" /> : "Sorgula"}
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => navigator.clipboard.writeText(link.paylink)}
                          sx={{ border: `1px solid ${theme.palette.divider}` }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1, borderStyle: "dashed", opacity: 0.6 }} />

                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <DirectionsCar sx={{ fontSize: 18, mt: 0.2, color: "text.secondary" }} />
                        <Typography variant="caption" fontWeight="700" color="text.primary">
                          {/* Burada state içindeki devices ile ID eşleşmesi yapılıyor */}
                          {renderDeviceNames(link.devices)}
                        </Typography>
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ bgcolor: "action.hover", px: 1, borderRadius: 1, fontWeight: "bold", fontSize: "0.65rem" }}>
                          İŞLEM ID: #{link.id}
                        </Typography>
                        {link.status !== "PAID" && (
                          <Button
                            variant="text"
                            size="small"
                            component="a"
                            href={link.paylink}
                            target="_blank"
                            sx={{ color: "info.main", fontWeight: "900", fontSize: "0.7rem", p: 0 }}
                          >
                            ÖDEME YAP →
                          </Button>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">İşlem geçmişiniz temiz.</Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Badge>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>Bilgilendirme</DialogTitle>
        <DialogContent sx={{ pb: 3, textAlign: "center" }}>
          <Typography>{statusMessage}</Typography>
          <Button fullWidth variant="contained" onClick={() => setStatusDialogOpen(false)} sx={{ mt: 3, borderRadius: "10px", fontWeight: "bold" }}>
            Kapat
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentStatusCard;