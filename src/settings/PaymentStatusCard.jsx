import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Collapse,
  Paper,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { ExpandMore, ExpandLess, ContentCopy } from "@mui/icons-material";

const PaymentStatusCard = ({ refreshKey }) => {
  const [paylinks, setPaylinks] = useState([]);
  const [devices, setDevices] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [filter, setFilter] = useState(null);
  const [uniqueStatuses, setUniqueStatuses] = useState(["Hepsi"]);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Sayfa açılır açılmaz devices ve paylinks verilerini çek
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch("/api/devices");
        if (!res.ok) throw new Error("Cihazlar alınamadı");
        const data = await res.json();
        setDevices(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchPaylinks = async () => {
      try {
        const res = await fetch("/api/paylinks");
        if (!res.ok) throw new Error("Paylinkler alınamadı");
        const data = await res.json();
        setPaylinks(data);

        const statuses = Array.from(new Set(data.map((p) => p.status)));
        setUniqueStatuses(["Hepsi", ...statuses]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDevices();
    fetchPaylinks();
  }, [refreshKey]);

  const handleToggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleCheckStatus = async (link) => {
    if (loadingIds.includes(link.id)) return;

    setLoadingIds((prev) => [...prev, link.id]);

    const timeout = setTimeout(() => {
      setLoadingIds((prev) => prev.filter((lid) => lid !== link.id));
    }, 30000);

    try {
      const res = await fetch(`/api/paylinks/${link.id}/status`, { method: "PUT" });
      if (!res.ok) throw new Error("Durum alınamadı");
      const updated = await res.json();

      // Dialog mesajını ayarla
      if (updated.status === "PAID") {
        if (updated.processed) {
          setStatusMessage("Ödemeniz başarılı! Araçlarınız güncellenmiş durumda.");
        } else {
          setStatusMessage("Ödemeniz başarılı! Araçlarınız yakında otomatik olarak güncellenecek.");
        }
      } else {
        setStatusMessage(
          "Ödeme tespit edilemedi. Ödediyseniz birkaç dakika sonra tekrar kontrol edin."
        );
      }

      setStatusDialogOpen(true);

      // Paylink durumunu güncelle
      setPaylinks((prev) =>
        prev.map((p) =>
          p.id === link.id
            ? { ...p, status: updated.status, processed: updated.processed }
            : p
        )
      );
    } catch (err) {
      setStatusMessage("Durum kontrolü sırasında bir hata oluştu.");
      setStatusDialogOpen(true);
      console.error(err);
    } finally {
      clearTimeout(timeout);
      setLoadingIds((prev) => prev.filter((lid) => lid !== link.id));
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => alert("Paylink kopyalandı!"));
  };

  const filteredLinks =
    !filter || filter === "Hepsi"
      ? filter === "Hepsi"
        ? paylinks
        : []
      : paylinks.filter((p) => p.status === filter);

  return (
    <>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Typography variant="h6" mb={2}>
          Mevcut Ödeme Linkleriniz
        </Typography>

        <Box mb={2} display="flex" gap={1} flexWrap="wrap">
          {uniqueStatuses.map((status) => (
            <Button
              key={status}
              variant={filter === status ? "contained" : "outlined"}
              onClick={() => setFilter(status)}
            >
              {status}
            </Button>
          ))}
        </Box>

        {filteredLinks.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                {!isMobile && <TableCell>Paylink</TableCell>}
                <TableCell>Duurm</TableCell>
                <TableCell>Toplam Tutar</TableCell>
                <TableCell>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLinks.map((link) => {
                const rowDevices =
                  link.devices
                    ?.replace(/[{}]/g, "")
                    .split(",")
                    .map((id) => {
                      const trimmed = id.trim();
                      return devices.find(
                        (d) => d.id.toString() === trimmed || d.name === trimmed
                      );
                    })
                    .filter(Boolean) || [];

                const devicesText =
                  rowDevices.length > 0
                    ? rowDevices.map((d) => d.name).join(", ")
                    : link.devices
                    ? `Cihaz ${link.devices.replace(/[{}]/g, "")}`
                    : "Bulunamadı";

                return (
                  <React.Fragment key={link.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleRow(link.id)}
                        >
                          {expandedRows.includes(link.id) ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )}
                        </IconButton>
                      </TableCell>
                      {!isMobile && <TableCell>{link.paylink}</TableCell>}
                      <TableCell>{link.status}</TableCell>
                      <TableCell>{link.totalAmount}₺</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCheckStatus(link)}
                          sx={{ mr: 1 }}
                          disabled={loadingIds.includes(link.id)}
                        >
                          {loadingIds.includes(link.id) ? (
                            <CircularProgress size={18} />
                          ) : (
                            "Kontrol"
                          )}
                        </Button>
                        {isMobile && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopy />}
                            onClick={() => handleCopyLink(link.paylink)}
                          >
                            Kopyala
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                        <Collapse
                          in={expandedRows.includes(link.id)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ p: 2, bgcolor: theme.palette.primary.dark }}>
                            <Typography variant="subtitle2">
                              Araçlar: {devicesText}
                            </Typography>
                            <Typography variant="subtitle2">
                              Hesap Paketi:{" "}
                              {(() => {
                                let paket = link.packageName
                                  ? JSON.parse(link.packageName)
                                  : {};
                                if (paket.pro && paket.pro > 0) {
                                  return paket.pro > 1
                                    ? `Pro x${paket.pro}`
                                    : "Pro";
                                } else {
                                  return "Standard";
                                }
                              })()}
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            mt={2}
          >
            Lütfen bir filtre seçin.
          </Typography>
        )}
      </Paper>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Ödeme Durumu</DialogTitle>
        <DialogContent>
          <Typography>{statusMessage}</Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentStatusCard;
