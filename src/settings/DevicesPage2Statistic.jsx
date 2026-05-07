import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, Button, Typography,
  Grid, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, useTheme, CircularProgress,
  Avatar, TextField, useMediaQuery, LinearProgress, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FolderIcon from '@mui/icons-material/Folder';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

// MUI X-Charts
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

const AdminFinanceDialog = ({ open, onClose, devices = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';
  const groups = useSelector((state) => state.groups.items) || {};

  const [prices, setPrices] = useState({ proPrice: 390, yillikPrice: 1790 });
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('upcoming');
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const d = new Date(); return d.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (open) {
      const fetchPrices = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/paylinks/prices');
          if (res.ok) setPrices(await res.json());
        } catch (error) {
          console.error('Fiyatlar çekilemedi.');
        } finally {
          setLoading(false);
        }
      };
      fetchPrices();
    }
  }, [open]);

  // --- Veri Hesaplamaları ---
  const annualPrice = prices.yillikPrice || 1790;
  const now = new Date();
  const startD = new Date(filterStartDate);
  const endD = new Date(filterEndDate);

  const allExpiringDevices = devices.filter(d => d.expirationTime);
  const totalAnnualRevenue = allExpiringDevices.length * annualPrice;
  const onlineDevices = allExpiringDevices.filter(d => d.status === 'online').length;

  const expiredDevices = allExpiringDevices.filter(d => new Date(d.expirationTime) < now);
  const lostRevenue = expiredDevices.length * annualPrice;

  const upcomingDevices = allExpiringDevices.filter(d => {
    const expDate = new Date(d.expirationTime);
    return expDate >= now && expDate >= startD && expDate <= endD;
  });
  const expectedRevenue = upcomingDevices.length * annualPrice;

  const handleQuickFilter = (months) => {
    const start = new Date();
    const end = new Date();
    if (months === 'expired') {
      start.setFullYear(start.getFullYear() - 1);
      setFilterStartDate(start.toISOString().split('T')[0]);
      setFilterEndDate(new Date().toISOString().split('T')[0]);
      setSelectedView('expired');
    } else {
      end.setMonth(end.getMonth() + months);
      setFilterStartDate(new Date().toISOString().split('T')[0]);
      setFilterEndDate(end.toISOString().split('T')[0]);
      setSelectedView('upcoming');
    }
  };

  const listToShow = useMemo(() => {
    let baseList = [];
    if (selectedView === 'expired') baseList = expiredDevices;
    else if (selectedView === 'upcoming') baseList = upcomingDevices;
    else baseList = allExpiringDevices;
    return [...baseList].sort((a, b) => new Date(a.expirationTime) - new Date(b.expirationTime));
  }, [selectedView, expiredDevices, upcomingDevices, allExpiringDevices]);

  const groupedList = useMemo(() => {
    const grouped = {};
    listToShow.forEach(device => {
      const groupName = groups[device.groupId]?.name || 'Grup Yok';
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(device);
    });
    return grouped;
  }, [listToShow, groups]);

  const barChartData = useMemo(() => {
    const months = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
    }
    allExpiringDevices.forEach(d => {
      if (new Date(d.expirationTime) < now) return;
      const dDate = new Date(d.expirationTime);
      const key = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) months[key] += 1;
    });
    return {
      xAxis: Object.keys(months).map(k => {
        const [y, m] = k.split('-');
        return new Date(y, m - 1).toLocaleString('tr-TR', { month: 'short', year: '2-digit' });
      }),
      series: Object.values(months).map(count => count * annualPrice)
    };
  }, [allExpiringDevices, now, annualPrice]);

  const formatCur = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  // İlerleme çubuğu rengi ve yüzdesi hesaplama
  const getExpirationDetails = (expirationTime) => {
    const expDate = new Date(expirationTime);
    const totalDays = 365; // Yıllık paket varsayımı
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { percent: 100, color: 'error', text: `${Math.abs(daysLeft)} gün gecikti` };
    if (daysLeft < 30) return { percent: 100 - (daysLeft / 365) * 100, color: 'warning', text: `${daysLeft} gün kaldı` };
    return { percent: Math.max(0, 100 - (daysLeft / 365) * 100), color: 'success', text: `${daysLeft} gün kaldı` };
  };

  const GroupRow = ({ groupName, items }) => {
    const [openGroup, setOpenGroup] = useState(true);
    return (
      <>
        <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }} onClick={() => setOpenGroup(!openGroup)}>
          <TableCell colSpan={7} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>{openGroup ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
              <FolderIcon color="primary" />
              <Typography variant="body1" fontWeight="700">{groupName}</Typography>
              <Chip label={`${items.length} Araç`} size="small" variant="outlined" color="primary" sx={{ fontWeight: 'bold' }} />
            </Box>
          </TableCell>
        </TableRow>
        {openGroup && items.map(device => {
          const isExpired = new Date(device.expirationTime) < now;
          const { percent, color, text } = getExpirationDetails(device.expirationTime);
          return (
            <TableRow key={device.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
              <TableCell sx={{ pl: isMobile ? 2 : 6, color: 'text.secondary', fontWeight: 'bold' }}>#{device.id}</TableCell>
              <TableCell fontWeight="600">{device.name}</TableCell>
              <TableCell>
                <Tooltip title={device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: device.status === 'online' ? 'success.main' : 'text.disabled', boxShadow: device.status === 'online' ? `0 0 8px ${theme.palette.success.main}` : 'none' }} />
                </Tooltip>
              </TableCell>
              <TableCell sx={{ color: isExpired ? 'error.main' : 'text.primary', fontWeight: isExpired ? 'bold' : 'normal' }}>
                {formatDate(device.expirationTime)}
              </TableCell>
              <TableCell sx={{ minWidth: 120, display: { xs: 'none', sm: 'table-cell' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">{text}</Typography>
                  <LinearProgress variant="determinate" value={percent} color={color} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Tooltip title="Hatırlatma Gönder">
                    <IconButton size="small" color="primary" sx={{ bgcolor: isDark ? 'rgba(25, 118, 210, 0.1)' : 'primary.50' }}><NotificationsActiveIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Müşteriye WhatsApp'tan Ulaş">
                    <IconButton size="small" color="success" sx={{ bgcolor: isDark ? 'rgba(46, 125, 50, 0.1)' : 'success.50' }}><WhatsAppIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  };

  // Kart Stilleri
  const cardStyle = (isSelected, activeColor) => ({
    p: 3,
    borderRadius: '24px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: isSelected ? activeColor : 'divider',
    bgcolor: 'background.paper',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isSelected
      ? `0 8px 32px ${isDark ? theme.palette[activeColor.split('.')[0]].dark + '80' : theme.palette[activeColor.split('.')[0]].light + '60'}`
      : 'none',
    transform: isSelected ? 'translateY(-4px)' : 'none',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px rgba(0,0,0,${isDark ? 0.4 : 0.08})` }
  });

  return (
    <Dialog open={open} onClose={onClose} fullScreen={isMobile} maxWidth="xl" fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '28px',
          bgcolor: isDark ? '#0b0f19' : '#f8fafc',
          backgroundImage: 'none'
        }
      }}>

      {/* HEADER */}
      <DialogTitle sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(10px)', bgcolor: isDark ? 'rgba(11, 15, 25, 0.8)' : 'rgba(248, 250, 252, 0.8)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            <SpeedIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
            Finansal Zeka & Projeksiyon Merkezi
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 5.5 }}>Gerçek zamanlı tahsilat ve filo sağlık durumu</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ bgcolor: 'action.hover' }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><CircularProgress size={60} thickness={4} /></Box>
        ) : (
          <Grid container spacing={3}>

            {/* KONTROL PANELİ */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '20px', border: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField label="Başlangıç" type="date" size="small" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 140 }} />
                    <Typography color="text.secondary">-</Typography>
                    <TextField label="Bitiş" type="date" size="small" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 140 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, borderLeft: { sm: '1px solid' }, borderColor: 'divider', pl: { sm: 2 } }}>
                    {[
                      { label: 'Gecikmiş', val: 'expired', color: 'error' },
                      { label: 'Bu Ay', val: 1, color: 'primary' },
                      { label: '1 Çeyrek', val: 3, color: 'primary' },
                      { label: 'Yarım Yıl', val: 6, color: 'primary' },
                    ].map((btn) => (
                      <Button key={btn.label} size="small" variant={selectedView === btn.val || (btn.val === 'expired' && selectedView === 'expired') ? 'contained' : 'outlined'} color={btn.color} onClick={() => handleQuickFilter(btn.val)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 'bold' }}>
                        {btn.label}
                      </Button>
                    ))}
                  </Box>
                </Box>

                {/* Ana Sistem Sağlığı Özeti */}
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">SİSTEM SAĞLIĞI (ONLINE)</Typography>
                    <Typography variant="subtitle1" fontWeight="900" color="success.main">{Math.round((onlineDevices / allExpiringDevices.length) * 100 || 0)}%</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', borderLeft: '1px solid', borderColor: 'divider', pl: 3 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">YILLIK POTANSİYEL HACİM</Typography>
                    <Typography variant="h6" fontWeight="900" color="text.primary">{formatCur(totalAnnualRevenue)}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* METRİK KARTLARI */}
            <Grid item xs={12} md={4}>
              <Paper onClick={() => setSelectedView('upcoming')} sx={cardStyle(selectedView === 'upcoming', 'success.main')}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9', color: '#2e7d32', width: 48, height: 48 }}><TrendingUpIcon /></Avatar>
                  <Chip label="Seçili Dönem" size="small" color="success" variant="outlined" />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight="800" letterSpacing={1}>BEKLENEN NAKİT AKIŞI</Typography>
                <Typography variant="h3" fontWeight="900" sx={{ my: 1 }}>{formatCur(expectedRevenue)}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">
                  <strong style={{ color: theme.palette.success.main }}>{upcomingDevices.length}</strong> araç ödeme bekliyor.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper onClick={() => setSelectedView('expired')} sx={cardStyle(selectedView === 'expired', 'error.main')}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee', color: '#d32f2f', width: 48, height: 48 }}><TrendingDownIcon /></Avatar>
                  <Chip label="Acil Eylem" size="small" color="error" />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight="800" letterSpacing={1}>RİSKLİ / GECİKMİŞ TUTAR</Typography>
                <Typography variant="h3" fontWeight="900" sx={{ my: 1 }}>{formatCur(lostRevenue)}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">
                  <strong style={{ color: theme.palette.error.main }}>{expiredDevices.length}</strong> araç süresi dolmuş.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper onClick={() => setSelectedView('total')} sx={cardStyle(selectedView === 'total', 'primary.main')}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: isDark ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd', color: '#1976d2', width: 48, height: 48 }}><AccountBalanceWalletIcon /></Avatar>
                  <Chip label="Tümü" size="small" color="primary" variant="outlined" />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight="800" letterSpacing={1}>AKTİF PORTFÖY BÜYÜKLÜĞÜ</Typography>
                <Typography variant="h3" fontWeight="900" sx={{ my: 1 }}>{allExpiringDevices.length} <span style={{ fontSize: '1.2rem', fontWeight: '500', color: theme.palette.text.secondary }}>Cihaz</span></Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">
                  Toplam <strong style={{ color: theme.palette.primary.main }}>{Object.keys(groups).length}</strong> farklı grup altında.
                </Typography>
              </Paper>
            </Grid>

            {/* GRAFİKLER */}
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: '1px solid', borderColor: 'divider', height: 340, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="800">Gelecek 6 Aylık Ciro Projeksiyonu</Typography>
                  <Chip icon={<CheckCircleIcon />} label="Düzenli Artış" size="small" color="info" variant="outlined" sx={{ border: 'none' }} />
                </Box>
                <Box sx={{ width: '100%', height: 260 }}>
                  <BarChart
                    xAxis={[{ scaleType: 'band', data: barChartData.xAxis }]}
                    series={[{ data: barChartData.series, color: theme.palette.primary.main, valueFormatter: (v) => formatCur(v) }]}
                    margin={{ top: 10, bottom: 30, left: 70, right: 10 }}
                    borderRadius={8}
                    slotProps={{ bar: { rx: 5 } }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: '1px solid', borderColor: 'divider', height: 340, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2 }}>Vade Durumu Analizi</Typography>
                <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <PieChart
                    series={[{
                      data: [
                        { id: 0, value: expiredDevices.length, label: 'Gecikmiş', color: theme.palette.error.main },
                        { id: 1, value: upcomingDevices.length, label: 'Yaklaşan', color: theme.palette.warning.main },
                        { id: 2, value: allExpiringDevices.length - expiredDevices.length - upcomingDevices.length, label: 'Güvende', color: theme.palette.success.main },
                      ],
                      // Halka boyutlarını burada küçülttük:
                      innerRadius: 45, // Eski değer 60'tı
                      outerRadius: 80, // Eski değer 100'dü
                      paddingAngle: 4,
                      cornerRadius: 8,
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      // Faded (Soluklaşma) animasyonu boyutlarını da yeni çapa uydurduk:
                      faded: { innerRadius: 25, additionalRadius: -20, color: 'gray' },
                    }]}
                    margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                    slotProps={{ legend: { hidden: true } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Box textAlign="center"><Typography variant="h6" color="error.main" fontWeight="bold">{expiredDevices.length}</Typography><Typography variant="caption" color="text.secondary">Gecikmiş</Typography></Box>
                  <Box textAlign="center"><Typography variant="h6" color="warning.main" fontWeight="bold">{upcomingDevices.length}</Typography><Typography variant="caption" color="text.secondary">Yaklaşan</Typography></Box>
                  <Box textAlign="center"><Typography variant="h6" color="success.main" fontWeight="bold">{allExpiringDevices.length - expiredDevices.length - upcomingDevices.length}</Typography><Typography variant="caption" color="text.secondary">Güvende</Typography></Box>
                </Box>
              </Paper>
            </Grid>

            {/* TABLO BÖLÜMÜ */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 2.5, px: 3, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="900">
                      {selectedView === 'expired' ? '🔴 Acil Müdahale Bekleyenler' : selectedView === 'upcoming' ? '🟢 Yakın Dönem Tahsilat Listesi' : '📋 Tüm Cihaz Portföyü'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Listelenen: {listToShow.length} araç | En yakın vadeli en üstte sıralıdır.</Typography>
                  </Box>
                </Box>
                <TableContainer sx={{ maxHeight: 500, '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 } }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Araç / Plaka</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Bağlantı</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Bitiş Tarihi</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper', display: { xs: 'none', sm: 'table-cell' } }}>Kalan Süre</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(groupedList).length > 0 ? (
                        Object.entries(groupedList).map(([groupName, items]) => (
                          <GroupRow key={groupName} groupName={groupName} items={items} />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <WarningAmberIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">Filtreye uygun araç bulunamadı.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminFinanceDialog;