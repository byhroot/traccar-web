import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Divider,
  Avatar,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
} from '@mui/material';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync } from '../reactHelper';
import { formatTime } from '../common/util/formatter';
import useSettingsStyles from '../settings/common/useSettingsStyles';

const statusColor = (status) => {
  switch (status) {
    case 'PAID': return 'success';
    case 'FULFILLED': return 'info';
    case 'PARTIALLY_REFUNDED':
    case 'REFUNDED': return 'warning';
    case 'CANCELED': return 'error';
    default: return 'default';
  }
};

// --- ORTAK DETAY BİLEŞENİ (Hem Tablo Hem Kart İçeriği İçin) ---
const OrderExpandedDetails = ({ order }) => (
  <Grid container spacing={3} sx={{ width: '100%', margin: 0 }}>
    {/* SOL KOLON: Ürün Detayları ve Geçmiş */}
    <Grid item xs={12} md={7} sx={{ p: '0px !important' }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1} display="block" sx={{ mb: 1 }}>
            Ürün Listesi
          </Typography>
          <Stack spacing={1}>
            {order.lineItems?.map((item) => (
              <Card key={item.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar variant="rounded" src={item.image?.url} sx={{ width: 48, height: 48, borderRadius: 1 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} variant="body2" noWrap>
                        {item.productName?.original}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Adet: {item.quantity}
                      </Typography>
                      {item.descriptionLines?.map((desc, index) => (
                        <Typography key={index} variant="caption" color="text.secondary" display="block">
                          {desc.name?.original}: {desc.plainText?.original}
                        </Typography>
                      ))}
                      <Typography fontWeight={700} variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
                        {item.lineItemPrice?.formattedAmount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1} display="block" sx={{ mb: 1 }}>
            Sipariş Geçmişi
          </Typography>
          <Stack spacing={1.5}>
            {order.activities?.map((activity) => (
              <Box key={activity.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 16, mt: 0.3 }} />
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.2 }}>
                    {activity.activityType}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(activity.createdDate, 'datetime')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Grid>

    {/* SAĞ KOLON: Fiyat Özeti ve Adresler */}
    <Grid item xs={12} md={5} sx={{ p: { xs: '24px 0px 0px 0px !important', md: '0px 0px 0px 24px !important' } }}>
      <Stack spacing={2}>
        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1} display="block">
              Sipariş Özeti
            </Typography>
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Ara Toplam</Typography>
                <Typography variant="body2" fontWeight={500}>{order.priceSummary?.subtotal?.formattedAmount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">İndirim</Typography>
                <Typography variant="body2" color="success.main" fontWeight={500}>-{order.priceSummary?.discount?.formattedAmount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">KDV</Typography>
                <Typography variant="body2" fontWeight={500}>{order.priceSummary?.tax?.formattedAmount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Kargo</Typography>
                <Typography variant="body2" fontWeight={500}>{order.priceSummary?.shipping?.formattedAmount}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700}>Toplam</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">{order.priceSummary?.total?.formattedAmount}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.5}>
          <Card variant="outlined" sx={{ borderRadius: 2, flex: 1, bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1} display="block">
                Teslimat Bilgisi
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {order.recipientInfo?.contactDetails?.firstName} {order.recipientInfo?.contactDetails?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {order.recipientInfo?.address?.city} / {order.recipientInfo?.address?.country}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2, flex: 1, bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={1} display="block">
                Fatura Bilgileri
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {order.billingInfo?.contactDetails?.company && (
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {order.billingInfo?.contactDetails?.company}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {order.billingInfo?.contactDetails?.firstName} {order.billingInfo?.contactDetails?.lastName}
                </Typography>
                {order.customFields?.map((field, index) => (
                  <Typography key={index} variant="caption" color="text.secondary" display="block">
                    {field.title}: {field.value}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Grid>
  </Grid>
);

// --- MASAÜSTÜ İÇİN TABLO SATIRI ---
const OrderTableRow = ({ order }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, '&:hover': { bgcolor: 'action.hover' } }}>
        <TableCell width={50}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 700 }}>#{order.number}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
            <Avatar variant="rounded" src={order.lineItems?.[0]?.image?.url} sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: 'action.selected' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500} noWrap>{order.lineItems?.[0]?.productName?.original}</Typography>
              {order.lineItems?.length > 1 && (
                <Typography variant="caption" color="text.secondary" display="block">+{order.lineItems.length - 1} ürün daha</Typography>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTime(order.createdDate, 'date')}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5}>
            <Chip size="small" label={order.paymentStatus} color={statusColor(order.paymentStatus)} sx={{ fontSize: '10px', fontWeight: 700 }} />
            <Chip size="small" label={order.fulfillmentStatus} color={order.fulfillmentStatus === 'FULFILLED' ? 'success' : 'default'} sx={{ fontSize: '10px', fontWeight: 700 }} />
          </Stack>
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>{order.priceSummary?.total?.formattedAmount}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <OrderExpandedDetails order={order} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// --- MOBİL İÇİN KART TASARIMI ---
const OrderMobileCard = ({ order }) => {
  const [open, setOpen] = useState(false);

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>

        {/* Üst Kısım: Sipariş No, Tarih ve Aç kapa butonu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>#{order.number}</Typography>
            <Typography variant="caption" color="text.secondary">{formatTime(order.createdDate, 'date')}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen(!open)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Orta Kısım: Ürün Resmi ve İsmi */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
          <Avatar variant="rounded" src={order.lineItems?.[0]?.image?.url} sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'action.selected' }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={500} noWrap>{order.lineItems?.[0]?.productName?.original}</Typography>
            {order.lineItems?.length > 1 && (
              <Typography variant="caption" color="text.secondary" display="block">+{order.lineItems.length - 1} ürün daha</Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

        {/* Alt Kısım: Rozetler ve Fiyat */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={0.5}>
            <Chip size="small" label={order.paymentStatus} color={statusColor(order.paymentStatus)} sx={{ fontSize: '9px', fontWeight: 700, height: 18 }} />
            <Chip size="small" label={order.fulfillmentStatus} color={order.fulfillmentStatus === 'FULFILLED' ? 'success' : 'default'} sx={{ fontSize: '9px', fontWeight: 700, height: 18 }} />
          </Stack>
          <Typography variant="body1" fontWeight={700} color="primary.main">
            {order.priceSummary?.total?.formattedAmount}
          </Typography>
        </Box>

        {/* Tıklanınca Açılan Detay Alanı (Mobil Uyumlu) */}
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', mx: -2, px: 2, mb: -2, pb: 2 }}>
            <OrderExpandedDetails order={order} />
          </Box>
        </Collapse>

      </CardContent>
    </Card>
  );
};

// --- ANA SAYFA BİLEŞENİ ---
const OrdersPage = () => {
  const { classes } = useSettingsStyles();
  const user = useSelector((state) => state.session.user);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffectAsync(async () => {
    setLoading(true);
    const response = await fetch('/api/paylinks/orders');
    if (response.ok) {
      const data = await response.json();
      setOrders(data.orders || []);
    }
    setLoading(false);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.lineItems?.[0]?.productName?.original?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${order.recipientInfo?.contactDetails?.firstName} ${order.recipientInfo?.contactDetails?.lastName}`
          .toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        order.paymentStatus === statusFilter ||
        order.fulfillmentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['sharedServiceName', 'commandIndex']}>
      <Box sx={{ width: '100%', px: { xs: 0.5, sm: 0 } }}>

        {/* Filtreleme ve Arama Kartı */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.01)', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Sipariş no, ürün adı veya müşteri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Durum Filtresi</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Durum Filtresi"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="ALL">Tümü</MenuItem>
                    <MenuItem value="PAID">Ödendi (PAID)</MenuItem>
                    <MenuItem value="FULFILLED">Tamamlandı (FULFILLED)</MenuItem>
                    <MenuItem value="FULLY_REFUNDED">İADE Edildi (REFUNDED)</MenuItem>
                    <MenuItem value="CANCELED">İptal Edildi (CANCELED)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Veri Listeleme Alanı */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
            <FilterListIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">Sipariş Bulunamadı</Typography>
            <Typography variant="body2" color="text.secondary">Arama kriterlerinize uygun herhangi bir veri eşleşmedi.</Typography>
          </Box>
        ) : (
          <>
            {/* 1. MOBİL GÖRÜNÜM: Sadece xs ekranlarda görünür, sm ve üzerinde tamamen gizlenir */}
            <Stack spacing={2} sx={{ display: { xs: 'flex', sm: 'none' } }}>
              {filteredOrders.map((order) => (
                <OrderMobileCard key={order.id} order={order} />
              ))}
            </Stack>

            {/* 2. MASAÜSTÜ GÖRÜNÜM: Mobilde tamamen gizlenir, sm ve üzeri ekranlarda şık bir tablo olur */}
            <TableContainer
              component={Card}
              sx={{
                display: { xs: 'none', sm: 'block' },
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(0,0,0,0.01)',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    {/* 👑 DÜZELTİLEN YER: TableRow yerine TableCell yazıldı */}
                    <TableCell width={50} />
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Sipariş No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Ürün</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Tarih</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Durum</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Tutar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <OrderTableRow key={order.id} order={order} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </PageLayout>
  );
};

export default OrdersPage;