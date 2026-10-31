import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, TextField, FormControlLabel, Checkbox,
  Container, Button, Box, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Autocomplete,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import PageLayout from '../common/components/PageLayout';
import FinansMenu from './FinansMenu';
import { useEffectAsync, useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import useSettingsStyles from '../settings/common/useSettingsStyles';

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

const AdminCenterPage = () => {
  const { classes } = useSettingsStyles();
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [linkedUsers, setLinkedUsers] = useState([]);
  const [userSuccess, setUserSuccess] = useState('');
  const [userError, setUserError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const loadData = async () => {
    if (id) {
      const [centerRes, usersRes] = await Promise.all([
        fetch(`/api/service-centers/${id}`),
        fetch('/api/users?excludeAttributes=false'),
      ]);
      if (centerRes.ok) setItem(await centerRes.json());
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.filter((u) => !u.administrator));
        setLinkedUsers(data.filter((u) => {
          const attrs = u.attributes || {};
          return String(attrs.service_center_id) === String(id);
        }));
      }
    } else {
      setItem({ name: '', city: '', district: '', phone: '', address: '', latitude: 0, longitude: 0, active: true, serviceUserIds: null });
    }
  };

  useEffectAsync(async () => { await loadData(); }, [id]);

  const handleSave = useCatch(async () => {
    const url = id ? `/api/service-centers/${id}` : '/api/service-centers';
    await fetchOrThrow(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    navigate('/finans/admin/centers');
  });

  // Kullanıcı ekle — backend'e userIds listesi gönder + user attributes güncelle
  const handleAddUser = useCatch(async () => {
    if (!selectedUser) return;
    setUserError('');
    const newIds = [...linkedUsers.map((u) => u.id), selectedUser.id];
    await fetchOrThrow(`/api/service-centers/${id}/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: newIds }),
    });
    setLinkedUsers((prev) => [...prev, selectedUser]);
    setItem((prev) => ({ ...prev, serviceUserIds: newIds.join(',') })); // ← ekle
    setSelectedUser(null);
    setUserSuccess(`${selectedUser.name} bu merkeze eklendi`);
    setTimeout(() => setUserSuccess(''), 3000);
  });

  const handleRemoveUser = useCatch(async (userId) => {
    setUserError('');
    const newIds = linkedUsers.filter((u) => u.id !== userId).map((u) => u.id);
    await fetchOrThrow(`/api/service-centers/${id}/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: newIds }),
    });
    setLinkedUsers((prev) => prev.filter((u) => u.id !== userId));
    setItem((prev) => ({ ...prev, serviceUserIds: newIds.length ? newIds.join(',') : null })); // ← ekle
  });

  const handleClearAll = useCatch(async () => {
    if (!window.confirm('Tüm servis kullanıcıları kaldırılsın mı?')) return;
    await fetchOrThrow(`/api/service-centers/${id}/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [] }),
    });
    setLinkedUsers([]);
    setItem((prev) => ({ ...prev, serviceUserIds: null })); // ← ekle
    setUserSuccess('Tüm kullanıcılar kaldırıldı');
    setTimeout(() => setUserSuccess(''), 3000);
  });

  const validate = () => item && item.name && item.city;
  const availableUsers = allUsers.filter((u) => !linkedUsers.find((l) => l.id === u.id));

  return (
    <PageLayout menu={<FinansMenu />} breadcrumbs={['finansTitle', id ? 'Servis Güncelle' : 'Yeni Servis']}>
      <Container maxWidth="xs" className={classes.container}>
        {item && (
          <>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Servis Merkezi Bilgileri</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <TextField fullWidth label="Ad" value={item.name || ''} onChange={(e) => setItem({ ...item, name: e.target.value })} />
                <Autocomplete
                  options={ILLER}
                  value={item.city || null}
                  onChange={(_, val) => setItem({ ...item, city: val || '' })}
                  renderInput={(params) => <TextField {...params} fullWidth label="İl" />}
                />                <TextField fullWidth label="İlçe" value={item.district || ''} onChange={(e) => setItem({ ...item, district: e.target.value })} />
                <TextField fullWidth label="Telefon" value={item.phone || ''} onChange={(e) => setItem({ ...item, phone: e.target.value })} />
                <TextField fullWidth label="Adres" multiline rows={2} value={item.address || ''} onChange={(e) => setItem({ ...item, address: e.target.value })} />
                <TextField fullWidth label="Enlem" type="number" value={item.latitude || ''} onChange={(e) => setItem({ ...item, latitude: parseFloat(e.target.value) })} />
                <TextField fullWidth label="Boylam" type="number" value={item.longitude || ''} onChange={(e) => setItem({ ...item, longitude: parseFloat(e.target.value) })} />
                <FormControlLabel
                  control={<Checkbox checked={!!item.active} onChange={(e) => setItem({ ...item, active: e.target.checked })} />}
                  label="Aktif"
                />
              </AccordionDetails>
            </Accordion>

            {id && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Servis Kullanıcıları
                    {linkedUsers.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({linkedUsers.length} kişi)
                      </Typography>
                    )}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {userSuccess && <Alert severity="success" sx={{ mb: 1 }}>{userSuccess}</Alert>}
                  {userError && <Alert severity="error" sx={{ mb: 1 }}>{userError}</Alert>}

                  {linkedUsers.length > 0 ? (
                    <>
                      <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                        {linkedUsers.map((u) => (
                          <ListItem key={u.id} divider>
                            <ListItemText
                              primary={u.name}
                              secondary={
                                <span>
                                  {u.email}
                                  {u.attributes?.iban && (
                                    <span style={{ marginLeft: 8, fontSize: 11, color: 'gray' }}>
                                      IBAN: {u.attributes.iban}
                                    </span>
                                  )}
                                </span>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveUser(u.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Button size="small" color="error" fullWidth variant="outlined" sx={{ mb: 2 }} onClick={handleClearAll}>
                        Tüm Kullanıcıları Kaldır
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Bu merkeze henüz servis kullanıcısı eklenmedi
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Autocomplete
                      sx={{ flex: 1 }}
                      options={availableUsers}
                      getOptionLabel={(u) => `${u.name} (${u.email})`}
                      value={selectedUser}
                      onChange={(_, val) => setSelectedUser(val)}
                      renderInput={(params) => (
                        <TextField {...params} size="small" label="Kullanıcı seç" />
                      )}
                    />
                    <Button variant="contained" disabled={!selectedUser} onClick={handleAddUser} sx={{ whiteSpace: 'nowrap' }}>
                      Ekle
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Eklenen kullanıcının hesabına otomatik servis yetkisi ve merkez bilgisi atanır.
                    Kaldırıldığında bu bilgiler temizlenir.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}

        <Box className={classes.buttons}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/finans/admin/centers')}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={!validate()}>Kaydet</Button>
        </Box>
      </Container>
    </PageLayout>
  );
};

export default AdminCenterPage;