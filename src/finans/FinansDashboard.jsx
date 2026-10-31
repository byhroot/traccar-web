import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, CardActionArea, Typography,
  Avatar, Chip, Divider, CircularProgress, Grid,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StoreIcon from '@mui/icons-material/Store';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync } from '../reactHelper';
import { useAdministrator } from '../common/util/permissions';

// ── Stat kartı ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon, onClick, badge }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
    <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.12), width: 48, height: 48, flexShrink: 0 }}>
          <Icon sx={{ color, fontSize: 24 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} lineHeight={1.2}>{value ?? <CircularProgress size={20} />}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.2 }}>
            {label}
          </Typography>
        </Box>
        {badge && <Chip size="small" label={badge} color="error" />}
      </CardContent>
    </CardActionArea>
  </Card>
);

// ── Menü kartı (büyük) ────────────────────────────────────────────────────
const MenuCard = ({ title, description, icon: Icon, color, onClick, disabled, isServis }) => (
  <Card elevation={0} sx={{
    border: '1px solid', borderColor: 'divider', borderRadius: 2,
    opacity: disabled ? 0.5 : 1,
  }}>
    <CardActionArea onClick={disabled ? undefined : onClick} sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.12), width: 52, height: 52, flexShrink: 0, mt: 0.5 }}>
          <Icon sx={{ color, fontSize: 26 }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4, mt: 0.5 }}>
            {description}
          </Typography>
          {disabled && <Chip size="small" label={isServis ? "Servis Kullanıcısı" : "Yakında"} sx={{ mt: 1 }} />}
        </Box>
      </Box>
    </CardActionArea>
  </Card>
);

// ── Son talepler mini liste ───────────────────────────────────────────────
const statusColor = (s) => ({ PENDING: 'warning', PENDING_OWNER_REG: 'warning', APPROVED: 'info', IN_PROGRESS: 'info', COMPLETED: 'success', ADMIN_REVIEW: 'secondary', CLOSED: 'default', CANCELLED: 'error' }[s] || 'default');
const statusLabel = (s) => ({ PENDING: 'Bekliyor', PENDING_OWNER_REG: 'Sahip Bekleniyor', APPROVED: 'Onaylandı', IN_PROGRESS: 'İşlemde', COMPLETED: 'Tamamlandı', ADMIN_REVIEW: 'Onay Bekliyor', CLOSED: 'Kapalı', CANCELLED: 'İptal' }[s] || s);
const typeLabel = (t) => ({ MONTAJ: 'Yeni Montaj', DEMONTAJ: 'Demontaj', DEVIR: 'Devir', DIGER: 'Diğer Talepler' }[t] || t);

const FinansDashboard = () => {
  const navigate = useNavigate();
  const admin = useAdministrator();
  const user = useSelector((state) => state.session.user);
  const isServis = user?.attributes?.servis === true || user?.attributes?.servis === 'true';

  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffectAsync(async () => {
    const res = await fetch('/api/service-requests');
    if (res.ok) {
      const data = await res.json();
      const pending = data.filter((r) => ['PENDING', 'PENDING_OWNER_REG'].includes(r.status)).length;
      const active = data.filter((r) => ['APPROVED', 'IN_PROGRESS'].includes(r.status)).length;
      const review = data.filter((r) => r.status === 'ADMIN_REVIEW').length;
      const completed = data.filter((r) => ['CLOSED', 'CANCELLED'].includes(r.status)).length;
      setStats({ pending, active, review, completed, total: data.length });
      // Son 5 talep
      setRecentRequests(data.slice(0, 5));
    }
  }, []);

  const theme = {
    blue: '#4dc7ff',
    orange: '#ed6c02',
    green: '#25ac2b',
    agreen: '#2ef33e',
    red: '#d32f2f',
    teal: '#00d3ba',
  };

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['sharedServiceName', 'mainpageTitle']}>
      <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>


        {/* Karşılama */}
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Finans & Servis Merkezi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Servis ve Müşteri Hizmetleri Talepleri
          </Typography>
        </Box>

        {/* Servis kullanıcısı için atanan işler */}
        {isServis && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Servis Paneli
            </Typography>
            <MenuCard
              title="Atanan İşler"
              description="Size atanan aktif ve tamamlanan servis işlerini görün"
              icon={BuildCircleIcon}
              color={theme.green}
              onClick={() => navigate('/finans/servis/jobs')}
            />
          </Box>
        )}
        {/* İstatistik kartları */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
          {!isServis &&
            <StatCard label="Bekleyen" value={stats?.pending} color={theme.orange} icon={HourglassBottomIcon} onClick={() => navigate(admin ? '/finans/admin/requests' : '/finans/requests')} badge={stats?.pending > 0 ? stats.pending : null} />
          }

          <StatCard label="Aktif" value={stats?.active} color={theme.blue} icon={BuildCircleIcon} onClick={() => navigate(isServis ? '/finans/servis/jobs' : admin ? '/finans/admin/requests' : '/finans/requests')} badge={stats?.active > 0 ? stats.active : null} />

          {!isServis && admin &&
            <StatCard label="Onay Bekliyor" value={stats?.review} color={theme.agreen} icon={WarningAmberIcon} onClick={() => navigate(admin ? '/finans/admin/review' : '/finans/requests')} badge={stats?.review > 0 ? stats.review : null} />
          }

          <StatCard label="Tamamlandı" value={stats?.completed} color={theme.green} icon={CheckCircleIcon} onClick={() => navigate(isServis ? '/finans/servis/jobs' : admin ? '/finans/admin/requests' : '/finans/requests')} />
        </Box>

        {/* Hızlı erişim menüsü */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Hızlı Erişim
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <MenuCard
              title="+ Yeni Talep Oluştur"
              description="Montaj, Demontaj, Devir, Plaka değişikliği ve Diğer taleplerinizi oluşturun"
              icon={BuildCircleIcon}
              color={theme.orange}
              onClick={() => navigate('/finans/requests/new')}
              disabled={isServis}
              isServis={isServis}

            />
            <MenuCard
              title="Yıllık Paket & Abonelik Yenileme"
              description="Yıllık Araç Data Paketi Yenileme İşlemleri"
              icon={StoreIcon}
              color={theme.agreen}
              onClick={() => navigate('/settings/paymentpage')}
              disabled={isServis}
              isServis={isServis}

            />
            <MenuCard
              title="Taleplerim"
              description="Mevcut ve geçmiş servis taleplerinizi takip edin"
              icon={PendingActionsIcon}
              color={theme.teal}
              onClick={() => navigate('/finans/requests')}
              disabled={isServis}
              isServis={isServis}

            />

            <MenuCard
              title="Sipariş Geçmişim"
              description="Verdiğiniz siparişleri görüntüleyin"
              icon={ReceiptLongIcon}
              color={theme.blue}
              onClick={() => navigate('/finans/orders')}
            />

            <MenuCard
              title="Mağaza"
              description="Yeni cihaz siparişi oluşturun, Yıllık paket , Hediye Kartı ve Yurt dışı paket işlemleri"
              icon={StoreIcon}
              color={theme.agreen}
              disabled
            />
          </Box>
        </Box>


        {/* Admin paneli */}
        {admin && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Admin Paneli
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <MenuCard
                title="Tüm Talepler"
                description="Tüm servis taleplerini yönetin, atama yapın"
                icon={PendingActionsIcon}
                color={theme.blue}
                onClick={() => navigate('/finans/admin/requests')}
              />
              <MenuCard
                title="Onay Kuyruğu"
                description="Cihaz işlemi bekleyen tamamlanmış talepleri onaylayın"
                icon={WarningAmberIcon}
                color={theme.agreen}
                onClick={() => navigate('/finans/admin/review')}
              />
              <MenuCard
                title="Servis Merkezleri"
                description="Yetkili servis merkezlerini yönetin"
                icon={StoreIcon}
                color={theme.teal}
                onClick={() => navigate('/finans/admin/centers')}
              />
              <MenuCard
                title="Devir Takibi"
                description="Araç devir taleplerini görüntüleyin ve onaylayın"
                icon={SwapHorizIcon}
                color={theme.orange}
                onClick={() => navigate('/finans/admin/requests')}
              />
            </Box>
          </Box>
        )}

        {/* Son talepler */}
        {!isServis && recentRequests.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Son Talepler
            </Typography>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              {recentRequests.map((r, i) => (
                <Box key={r.id}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => navigate(admin ? `/finans/admin/request/${r.id}` : `/finans/requests/${r.id}`)}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        #{r.id} — {typeLabel(r.type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.city}{r.district ? ` / ${r.district}` : ''}
                      </Typography>
                    </Box>
                    <Chip size="small" label={statusLabel(r.status)} color={statusColor(r.status)} />
                  </Box>
                  {i < recentRequests.length - 1 && <Divider />}
                </Box>
              ))}
            </Card>
          </Box>
        )}

      </Box>
    </PageLayout>
  );
};

export default FinansDashboard;
