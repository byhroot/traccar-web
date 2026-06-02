import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Typography, Paper, Button, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Stack, Divider, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Avatar, Tooltip, Alert, Snackbar, InputAdornment,
  Grid, Card, CardContent, useTheme, useMediaQuery, Collapse,
} from "@mui/material";
import {
  Refresh, ContentCopy, CheckCircle, HourglassEmpty, Search,
  OpenInNew, AttachMoney, ReceiptLong, PendingActions, FilterList,
  Close, DirectionsCar, CalendarToday, TuneRounded,
} from "@mui/icons-material";

// ─── yardımcı ────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function avatarColor(name = "") {
  const colors = ["#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#c62828", "#00838f", "#558b2f", "#6d4c41"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

function formatAmount(amount) {
  return (amount ?? 0).toLocaleString("tr-TR") + " ₺";
}

function resolveDevices(devicesStr, devicesMap) {
  if (!devicesStr) return "—";
  const ids = devicesStr.replace(/[{}\s]/g, "").split(",").filter(Boolean);
  if (ids.length === 0) return "—";
  return ids.map((id) => devicesMap[id]?.name ?? `#${id}`).join(", ");
}

function toIsoDate(val) { return val || ""; }

// ─── StatusChip ───────────────────────────────────────────────────────────────

const StatusChip = ({ status }) => {
  const isPaid = status === "PAID";
  const isCreated = status === "CREATED";
  let color = "warning";
  let icon = <HourglassEmpty sx={{ fontSize: 13 }} />;
  let label = status ?? "BEKLEMEDE";
  if (isPaid) { color = "success"; icon = <CheckCircle sx={{ fontSize: 13 }} />; label = "ÖDENDİ"; }
  if (isCreated) { color = "info"; icon = <PendingActions sx={{ fontSize: 13 }} />; label = "OLUŞTURULDU"; }
  return (
    <Chip icon={icon} label={label} size="small" color={color} variant="outlined"
      sx={{
        fontWeight: 700, fontSize: "0.62rem", height: 20, borderRadius: "5px",
        "& .MuiChip-icon": { fontSize: 13 }
      }} />
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color = "primary.main" }) => (
  <Card variant="outlined" sx={{ borderRadius: "12px", flex: 1, minWidth: 0 }}>
    <CardContent sx={{ p: "12px 14px !important" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color, display: "flex", flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2} noWrap>{label}</Typography>
          <Typography variant="subtitle2" fontWeight={800} color={color} lineHeight={1.3} noWrap>{value}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ─── MobileCard — mobilde tablo yerine kart ───────────────────────────────────

const MobilePaymentCard = ({ link, user, deviceNames, isQuerying, onQuery, onCopy, onDetail }) => {
  const uName = user?.name ?? user?.email ?? `Kullanıcı #${link.userid}`;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "12px", cursor: "pointer" }} onClick={() => onDetail(link)}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1, mr: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: "0.65rem", fontWeight: 700, bgcolor: avatarColor(uName), flexShrink: 0 }}>
            {getInitials(uName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{uName}</Typography>
            <Typography variant="caption" color="text.disabled" fontFamily="monospace">#{link.id}</Typography>
          </Box>
        </Stack>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Typography variant="subtitle2" fontWeight={900} color="primary.main">{formatAmount(link.totalAmount)}</Typography>
          <StatusChip status={link.status} />
        </Box>
      </Stack>

      {deviceNames !== "—" && (
        <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
          <DirectionsCar sx={{ fontSize: 13, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: "100%" }}>{deviceNames}</Typography>
        </Stack>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography variant="caption" color="text.disabled">{formatDateShort(link.createdAt)}</Typography>
        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
          {link.status !== "PAID" && (
            <Button size="small" variant="outlined" disabled={isQuerying}
              onClick={(e) => { e.stopPropagation(); onQuery(link); }}
              sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 700, fontSize: "0.68rem", py: 0.2, px: 1, minWidth: 0 }}
              startIcon={isQuerying ? <CircularProgress size={11} /> : <Refresh sx={{ fontSize: "12px !important" }} />}>
              Sorgula
            </Button>
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onCopy(link.paylink); }}>
            <ContentCopy sx={{ fontSize: 15 }} />
          </IconButton>
          {link.paylink && (
            <IconButton size="small" component="a" href={link.paylink} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}>
              <OpenInNew sx={{ fontSize: 15 }} />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

const AdminPaylinksPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [links, setLinks] = useState([]);
  const [users, setUsers] = useState({});
  const [devicesMap, setDevicesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [queryingIds, setQueryingIds] = useState(new Set());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [detailDialog, setDetailDialog] = useState(null);

  // ── veri yükleme ─────────────────────────────────────────────────────────

  const fetchLinks = useCallback(async (userMap, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? "?" + params.toString() : "";
    try {
      const res = await fetch("/api/paylinks/admin/all" + qs);
      if (res.ok) return await res.json();
    } catch (_) { }
    const results = await Promise.all(
      Object.keys(userMap).map((uid) =>
        fetch(`/api/paylinks?userId=${uid}`).then((r) => (r.ok ? r.json() : [])).catch(() => [])
      )
    );
    let all = results.flat();
    if (from) all = all.filter((l) => l.createdAt && new Date(l.createdAt) >= new Date(from));
    if (to) all = all.filter((l) => l.createdAt && new Date(l.createdAt) <= new Date(to + "T23:59:59"));
    return all;
  }, []);

  const loadData = useCallback(async (from = dateFrom, to = dateTo) => {
    setLoading(true);
    try {
      const [usersRes, devicesRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/devices?all=true"),
      ]);
      const userMap = {};
      if (usersRes.ok) { const arr = await usersRes.json(); arr.forEach((u) => { userMap[u.id] = u; }); }
      setUsers(userMap);
      const devMap = {};
      if (devicesRes.ok) { const arr = await devicesRes.json(); arr.forEach((d) => { devMap[d.id] = d; }); }
      setDevicesMap(devMap);
      const allLinks = await fetchLinks(userMap, toIsoDate(from), toIsoDate(to));
      setLinks(allLinks);
      setPage(0);
    } catch (e) {
      showSnackbar("Veri yüklenemedi: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [fetchLinks, dateFrom, dateTo]);

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  const handleDateFilter = useCallback(() => { loadData(dateFrom, dateTo); }, [loadData, dateFrom, dateTo]);
  const handleClearAll = useCallback(() => {
    setSearch(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(0);
    loadData("", "");
  }, [loadData]);

  // ── snackbar ──────────────────────────────────────────────────────────────

  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  // ── durum sorgulama ───────────────────────────────────────────────────────

  const handleQueryStatus = useCallback(async (link) => {
    if (queryingIds.has(link.id)) return;
    setQueryingIds((prev) => new Set(prev).add(link.id));
    try {
      const res = await fetch(`/api/paylinks/${link.id}/status`, { method: "PUT" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
      if (detailDialog?.id === link.id) setDetailDialog(updated);
      showSnackbar(updated.status === "PAID" ? "✓ Ödeme onaylandı, cihazlar güncellendi." : "Ödeme henüz onaylanmadı.");
    } catch (e) {
      showSnackbar("Sorgulama hatası: " + e.message, "error");
    } finally {
      setQueryingIds((prev) => { const n = new Set(prev); n.delete(link.id); return n; });
    }
  }, [queryingIds, detailDialog]);

  const handleCopyLink = useCallback((url) => {
    navigator.clipboard.writeText(url).then(() => showSnackbar("Link kopyalandı."));
  }, []);

  // ── filtre ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = links.filter((l) => {
      const user = users[l.userid];
      const uName = (user?.name ?? "").toLowerCase();
      const uEmail = (user?.email ?? "").toLowerCase();
      const devStr = resolveDevices(l.devices, devicesMap).toLowerCase();
      const matchQ = !q || String(l.id).includes(q) || uName.includes(q) || uEmail.includes(q) || devStr.includes(q);
      const matchS = !statusFilter || l.status === statusFilter;
      return matchQ && matchS;
    });
    if (sortBy === "date-desc") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "date-asc") result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "amount-desc") result.sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0));
    if (sortBy === "amount-asc") result.sort((a, b) => (a.totalAmount ?? 0) - (b.totalAmount ?? 0));
    return result;
  }, [links, users, devicesMap, search, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const paid = filtered.filter((l) => l.status === "PAID");
    const pending = filtered.filter((l) => l.status !== "PAID");
    const revenue = paid.reduce((s, l) => s + (l.totalAmount ?? 0), 0);
    return { total: filtered.length, paid: paid.length, pending: pending.length, revenue };
  }, [filtered]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const hasActiveFilters = search || statusFilter || dateFrom || dateTo;
  const activeFilterCount = [search, statusFilter, dateFrom || dateTo].filter(Boolean).length;

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1200, mx: "auto" }}>

      {/* Başlık */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2} gap={1}>
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={900}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptLong color="primary" />
            Ödeme Linkleri
          </Typography>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary">Tüm kullanıcıların ödeme linkleri — admin görünümü</Typography>
          )}
        </Box>
        <Button variant="outlined" size={isMobile ? "small" : "medium"}
          startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
          onClick={() => loadData(dateFrom, dateTo)} disabled={loading}
          sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none", flexShrink: 0 }}>
          Yenile
        </Button>
      </Stack>

      {/* İstatistik kartları */}
      <Stack direction="row" spacing={1} mb={2} sx={{ "& > *": { flex: 1, minWidth: 0 } }}>
        <StatCard icon={<ReceiptLong fontSize="small" />} label="Toplam" value={stats.total} />
        <StatCard icon={<CheckCircle fontSize="small" />} label="Ödenen" value={stats.paid} color="success.main" />
        <StatCard icon={<HourglassEmpty fontSize="small" />} label="Bekleyen" value={stats.pending} color="warning.main" />
        <StatCard icon={<AttachMoney fontSize="small" />} label="Ciro" value={isMobile ? formatAmount(stats.revenue).replace(" ₺", "₺") : formatAmount(stats.revenue)} color="primary.main" />
      </Stack>

      {/* Filtre paneli */}
      <Paper variant="outlined" sx={{ mb: 2, borderRadius: "12px", overflow: "hidden" }}>

        {/* Filtre başlık satırı — her zaman görünür */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5 }}>
          <TextField
            size="small" fullWidth
            placeholder={isMobile ? "Ara..." : "Kullanıcı, ID veya cihaz ara..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <Tooltip title="Gelişmiş filtreler">
            <Button size="small" variant={filtersOpen ? "contained" : "outlined"}
              onClick={() => setFiltersOpen((v) => !v)}
              sx={{
                borderRadius: "8px", textTransform: "none", fontWeight: 700,
                flexShrink: 0, minWidth: 0, px: 1.5, position: "relative"
              }}>
              <TuneRounded fontSize="small" />
              {activeFilterCount > 0 && !filtersOpen && (
                <Box sx={{
                  position: "absolute", top: -4, right: -4, width: 16, height: 16,
                  bgcolor: "error.main", borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#fff", fontWeight: 900, lineHeight: 1 }}>
                    {activeFilterCount}
                  </Typography>
                </Box>
              )}
            </Button>
          </Tooltip>
          {hasActiveFilters && (
            <Tooltip title="Tüm filtreleri temizle">
              <IconButton size="small" onClick={handleClearAll} sx={{ flexShrink: 0 }}>
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Genişleyen filtre alanı */}
        <Collapse in={filtersOpen}>
          <Divider />
          <Box sx={{ p: 1.5, pt: 1 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select value={statusFilter} label="Durum"
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    sx={{ borderRadius: "8px" }}>
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="PAID">Ödendi</MenuItem>
                    <MenuItem value="CREATED">Oluşturuldu</MenuItem>
                    <MenuItem value="PENDING">Beklemede</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Sıralama</InputLabel>
                  <Select value={sortBy} label="Sıralama" onChange={(e) => setSortBy(e.target.value)}
                    sx={{ borderRadius: "8px" }}>
                    <MenuItem value="date-desc">En yeni önce</MenuItem>
                    <MenuItem value="date-asc">En eski önce</MenuItem>
                    <MenuItem value="amount-desc">Tutar (yüksek)</MenuItem>
                    <MenuItem value="amount-asc">Tutar (düşük)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField size="small" fullWidth label="Başlangıç" type="date"
                  value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField size="small" fullWidth label="Bitiş" type="date"
                  value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: dateFrom || undefined }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
              </Grid>
            </Grid>
            {(dateFrom || dateTo) && (
              <Box mt={1.5}>
                <Button size="small" variant="contained"
                  disabled={loading} onClick={handleDateFilter}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, mr: 1 }}>
                  Tarihe Göre Filtrele
                </Button>
                <Button size="small" onClick={() => { setDateFrom(""); setDateTo(""); loadData("", ""); }}
                  sx={{ textTransform: "none", color: "text.secondary" }}>
                  Tarihi Temizle
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* İçerik */}
      {loading ? (
        <Box textAlign="center" py={8}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" mt={2}>Veriler yükleniyor...</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box textAlign="center" py={8}>
          <FilterList sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {hasActiveFilters ? "Filtreye uyan kayıt bulunamadı." : "Henüz kayıt yok."}
          </Typography>
        </Box>
      ) : isMobile ? (
        /* ── Mobil: kart listesi ── */
        <Box>
          <Stack spacing={1.5} mb={1}>
            {paginated.map((link) => (
              <MobilePaymentCard
                key={link.id}
                link={link}
                user={users[link.userid]}
                deviceNames={resolveDevices(link.devices, devicesMap)}
                isQuerying={queryingIds.has(link.id)}
                onQuery={handleQueryStatus}
                onCopy={handleCopyLink}
                onDetail={setDetailDialog}
              />
            ))}
          </Stack>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 15, 25]}
            labelRowsPerPage=""
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        </Box>
      ) : (
        /* ── Desktop: tablo ── */
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                {["ID", "KULLANICI", "TUTAR", "DURUM", "CİHAZLAR", "TARİH"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.72rem", color: "text.secondary", whiteSpace: "nowrap" }}>{h}</TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", color: "text.secondary" }} align="right">İŞLEMLER</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((link) => {
                const user = users[link.userid];
                const uName = user?.name ?? user?.email ?? `Kullanıcı #${link.userid}`;
                const deviceNames = resolveDevices(link.devices, devicesMap);
                const isQuerying = queryingIds.has(link.id);
                return (
                  <TableRow key={link.id} hover sx={{ cursor: "pointer" }} onClick={() => setDetailDialog(link)}>
                    <TableCell>
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace">#{link.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 30, height: 30, fontSize: "0.65rem", fontWeight: 700, bgcolor: avatarColor(uName) }}>
                          {getInitials(uName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>{uName}</Typography>
                          {user?.email && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: "block" }}>
                              {user.email}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="primary.main" noWrap>{formatAmount(link.totalAmount)}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={link.status} /></TableCell>
                    <TableCell>
                      <Tooltip title={deviceNames}>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: "block" }}>
                          {deviceNames}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>{formatDate(link.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {link.status !== "PAID" && (
                          <Tooltip title="Ödeme durumunu sorgula">
                            <span>
                              <Button size="small" variant="outlined" disabled={isQuerying}
                                onClick={(e) => { e.stopPropagation(); handleQueryStatus(link); }}
                                sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 700, fontSize: "0.7rem", minWidth: 80, py: 0.3 }}
                                startIcon={isQuerying ? <CircularProgress size={12} /> : <Refresh sx={{ fontSize: "14px !important" }} />}>
                                Sorgula
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Linki kopyala">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCopyLink(link.paylink); }}>
                            <ContentCopy sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {link.paylink && (
                          <Tooltip title="Linki aç">
                            <IconButton size="small" component="a" href={link.paylink} target="_blank"
                              rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <OpenInNew sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 15, 25, 50]}
            labelRowsPerPage="Sayfa başına:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        </TableContainer>
      )}

      {/* Detay dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : "16px" } }}>
        {detailDialog && (() => {
          const link = detailDialog;
          const user = users[link.userid];
          const uName = user?.name ?? user?.email ?? `Kullanıcı #${link.userid}`;
          const deviceNames = resolveDevices(link.devices, devicesMap);
          const isQuerying = queryingIds.has(link.id);
          return (
            <>
              <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={800}>Detay #{link.id}</Typography>
                  <IconButton size="small" onClick={() => setDetailDialog(null)}><Close /></IconButton>
                </Stack>
              </DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>KULLANICI</Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: avatarColor(uName), width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700 }}>
                        {getInitials(uName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{uName}</Typography>
                        {user?.email && <Typography variant="caption" color="text.secondary">{user.email}</Typography>}
                        {user?.phone && <Typography variant="caption" color="text.secondary" display="block">{user.phone}</Typography>}
                      </Box>
                    </Stack>
                  </Box>
                  <Divider />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>TUTAR</Typography>
                      <Typography variant="h5" fontWeight={900} color="primary.main">{formatAmount(link.totalAmount)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>DURUM</Typography>
                      <StatusChip status={link.status} />
                      {link.processed && (
                        <Typography variant="caption" color="success.main" display="block" mt={0.5} fontWeight={700}>✓ İşleme alındı</Typography>
                      )}
                    </Grid>
                  </Grid>
                  <Divider />

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                      <DirectionsCar sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }} />CİHAZLAR
                    </Typography>
                    <Typography variant="body2">{deviceNames}</Typography>
                  </Box>

                  {link.packageName && link.packageName !== "{}" && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>PAKET</Typography>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">{link.packageName}</Typography>
                    </Box>
                  )}
                  <Divider />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.3}>
                        <CalendarToday sx={{ fontSize: 12, verticalAlign: "middle", mr: 0.5 }} />OLUŞTURULMA
                      </Typography>
                      <Typography variant="caption">{formatDate(link.createdAt)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.3}>SON GÜNCELLEME</Typography>
                      <Typography variant="caption">{formatDate(link.updatedAt)}</Typography>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.3}>WİX PAYLINK ID</Typography>
                    <Typography variant="caption" fontFamily="monospace" color="text.secondary">{link.paylinkId ?? "—"}</Typography>
                  </Box>

                  {link.paylink && (
                    <Box sx={{
                      bgcolor: "action.hover", borderRadius: "8px", p: 1.5,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1
                    }}>
                      <Typography variant="caption" fontFamily="monospace" noWrap sx={{ flex: 1, color: "primary.main" }}>
                        {link.paylink}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleCopyLink(link.paylink)}>
                          <ContentCopy sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton size="small" component="a" href={link.paylink} target="_blank" rel="noopener noreferrer">
                          <OpenInNew sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                {link.status !== "PAID" && (
                  <Button variant="contained" disabled={isQuerying} onClick={() => handleQueryStatus(link)}
                    startIcon={isQuerying ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                    sx={{ borderRadius: "9px", textTransform: "none", fontWeight: 700 }}>
                    Durumu Sorgula
                  </Button>
                )}
                <Button variant="outlined" onClick={() => setDetailDialog(null)}
                  sx={{ borderRadius: "9px", textTransform: "none", fontWeight: 700 }}>
                  Kapat
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity} variant="filled"
          sx={{ borderRadius: "10px", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPaylinksPage;