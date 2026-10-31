import { useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardActionArea, CardContent, Typography,
  Chip, Avatar, IconButton, Tooltip, Fab, TextField,
  InputAdornment, CircularProgress, Grid, Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import PeopleIcon from '@mui/icons-material/People';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync } from '../reactHelper';


const ILLER = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale',
  'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum',
  'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin',
  'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli',
  'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat',
  'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın',
  'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
];

const useStyles = makeStyles()((theme) => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(10), // bottom menu için yukarıda
    right: theme.spacing(2),
  },
}));

const AdminCentersPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  useEffectAsync(async () => {
    void reloadKey;
    setLoading(true);
    const res = await fetch('/api/service-centers');
    if (res.ok) setCenters(await res.json());
    setLoading(false);
  }, [reloadKey]);

  const parseUserCount = (serviceUserIds) => {
    if (!serviceUserIds) return 0;
    return serviceUserIds.split(',').filter(Boolean).length;
  };

  const filtered = centers.filter((c) => {
    const matchSearch = !search || (
      c.name?.toLowerCase().includes(search.toLowerCase())
      || c.city?.toLowerCase().includes(search.toLowerCase())
      || c.district?.toLowerCase().includes(search.toLowerCase())
    );
    const matchCity = !selectedCity || c.city === selectedCity;
    return matchSearch && matchCity;
  });

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', 'Servis Merkezleri']}>
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>

        {/* Arama + özet */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Servis ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 160 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Autocomplete
            options={ILLER}
            value={selectedCity}
            onChange={(_, val) => setSelectedCity(val)}
            size="small"
            sx={{ width: 160 }}
            renderInput={(params) => <TextField {...params} label="İl filtrele" />}
          />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Chip size="small" label={`${filtered.length} merkez`} />
            <Chip size="small" color="success"
              label={`${filtered.filter((c) => c.active).length} aktif`} />
          </Box>
        </Box>

        {/* Yükleniyor */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Kart grid */}
        {!loading && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 2,
            pb: 10, // bottom menu + FAB boşluğu
          }}>
            {filtered.length === 0 ? (
              <Box sx={{ gridColumn: '1/-1', py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">
                  {search ? 'Arama sonucu bulunamadı' : 'Henüz servis merkezi eklenmemiş'}
                </Typography>
              </Box>
            ) : filtered.map((c) => {
              const userCount = parseUserCount(c.serviceUserIds);
              return (
                <Card
                  key={c.id}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: c.active ? 'divider' : 'action.disabledBackground',
                    borderRadius: 2,
                    opacity: c.active ? 1 : 0.65,
                    transition: 'box-shadow 0.15s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <CardContent sx={{ pb: '12px !important' }}>
                    {/* Başlık satırı */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{c.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {c.city}{c.district ? ` / ${c.district}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                        <Chip
                          size="small"
                          label={c.active ? 'Aktif' : 'Pasif'}
                          color={c.active ? 'success' : 'default'}
                          sx={{ fontSize: 10 }}
                        />
                        <Tooltip title="Düzenle">
                          <IconButton size="small" onClick={() => navigate(`/finans/admin/center/${c.id}`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Detaylar */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {c.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                        </Box>
                      )}
                      {c.address && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {c.address}
                        </Typography>
                      )}
                    </Box>

                    {/* Kullanıcı sayısı */}
                    <Box sx={{
                      mt: 1.5, pt: 1.5,
                      borderTop: '1px solid', borderColor: 'divider',
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                      <Avatar sx={{
                        width: 28, height: 28,
                        bgcolor: alpha(userCount > 0 ? '#1976d2' : '#888', 0.1),
                      }}>
                        <PeopleIcon sx={{ fontSize: 15, color: userCount > 0 ? 'primary.main' : 'text.disabled' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700} lineHeight={1}>
                          {userCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                          {userCount === 1 ? 'servis teknisyeni' : 'servis teknisyeni'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <Fab
        size="medium"
        color="primary"
        className={classes.fab}
        onClick={() => navigate('/finans/admin/center')}
      >
        <AddIcon />
      </Fab>
    </PageLayout>
  );
};

export default AdminCentersPage;