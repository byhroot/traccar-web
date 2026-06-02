import { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogContent, DialogActions, Button,
    Typography, TextField, Box, Stack, Chip, InputAdornment, IconButton,
    FormControlLabel, Checkbox, Switch, Avatar, Divider, Alert, AlertTitle,
    CircularProgress, Paper, Fade, LinearProgress, Snackbar,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FolderIcon from '@mui/icons-material/Folder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedIcon from '@mui/icons-material/Verified';
import GavelIcon from '@mui/icons-material/Gavel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import fetchOrThrow from '../../common/util/fetchOrThrow';

// ─── Styled ──────────────────────────────────────────────────────────────────

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: theme.spacing(3),
        overflow: 'hidden',
        maxHeight: '92vh',
    },
}));

const StepHeader = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    padding: theme.spacing(3, 4, 2.5),
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        right: -40,
        top: -40,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: alpha('#fff', 0.06),
    },
}));

const SelectableChip = styled(Chip)(({ theme, selected }) => ({
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    ...(selected && {
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
        '& .MuiChip-deleteIcon': { color: alpha('#fff', 0.7) },
    }),
}));

const SummaryRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.2, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { borderBottom: 'none' },
}));

// ─── Sabitler ────────────────────────────────────────────────────────────────

const USER_RESTRICTIONS = [
    { key: 'readonly', label: 'Hesap Salt Okunur — Hesap ayarlarını değiştiremez. Sadece Araçları Görüntüleyebilir. (Bildirim,Bölge,vb. oluşturamaz)', color: 'warning' },
    { key: 'deviceReadonly', label: 'Araç Salt Okunur -  Araç ayarlarını düzenleyemez, değiştiremez — Araç Ayarları, Araç Notları, Hatırlatmalar, vb.', color: 'warning' },
    { key: 'limitCommands', label: 'Komut Gönderimi Kısıtlı — Araçlara komut gönderemez(Blokaj veya Alarm Hassasiyeti Ayarlama vb.)', color: 'warning' },
    { key: 'disableReports', label: 'Raporları Kısıtla — Geçmiş izleme, raporlar, olaylar', color: 'default' },
];

const UI_RESTRICTIONS = [
    { key: 'ui.disableDrivers', label: 'Sürücüler Menüsü gizlensin' },
    { key: 'ui.disableMaintenance', label: 'Bakım menüsü gizlensin' },
    { key: 'ui.disableGroups', label: 'Gruplar Menüsü gizlensin' },
    { key: 'ui.disableCalendars', label: 'Takvimler & Zaman Dilimleri gizlensin' },

];

const defaultUserData = {
    name: '', email: '', password: '', phone: '',
    disabled: false, readonly: false, deviceReadonly: false,
    limitCommands: false, disableReports: false,
    //fixedEmail: true,
    attributes: {
        'ui.disableCalendars': false,
        'ui.disableDrivers': false,
        'ui.disableMaintenance': false,
        'ui.disableEvents': false,
        'ui.disableGroups': false,
    },
};

// ─── Permissions sync yardımcısı ─────────────────────────────────────────────

async function syncPermissions(userId, type, oldIds, newIds) {
    const toDelete = oldIds.filter((id) => !newIds.includes(id));
    const toAdd = newIds.filter((id) => !oldIds.includes(id));

    const keyMap = { devices: 'deviceId', groups: 'groupId', geofences: 'geofenceId' };
    const key = keyMap[type];

    await Promise.all([
        ...toDelete.map((id) =>
            fetchOrThrow('/api/permissions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, [key]: id }),
            })
        ),
        ...toAdd.map((id) =>
            fetchOrThrow('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, [key]: id }),
            })
        ),
    ]);
}

// ─── Step bileşenleri (aynı, değişmedi) ──────────────────────────────────────

const StepBasicInfo = ({ data, onChange, isEdit }) => {
    const [showPass, setShowPass] = useState(false);
    return (
        <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
                label="Ad Soyad" value={data.name || ''} fullWidth required
                onChange={(e) => onChange('name', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" fontSize="small" /></InputAdornment> }}
            />
            <TextField
                label="E-posta" type="email" value={data.email || ''} fullWidth required
                onChange={(e) => onChange('email', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" fontSize="small" /></InputAdornment> }}
            />
            <TextField
                label={isEdit ? 'Yeni Şifre (değiştirmek için doldurun)' : 'Şifre'}
                type={showPass ? 'text' : 'password'}
                value={data.password || ''} fullWidth required={!isEdit}
                onChange={(e) => onChange('password', e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" fontSize="small" /></InputAdornment>,
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <TextField
                label="Telefon" value={data.phone || ''} fullWidth
                onChange={(e) => onChange('phone', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon color="action" fontSize="small" /></InputAdornment> }}
            />
        </Stack>
    );
};

const StepPermissions = ({ data, onChangeField, onChangeAttr }) => (
    <Stack spacing={2.5} sx={{ pt: 1 }}>

        <Divider><Typography variant="caption" color="text.secondary">Hesap Kısıtlamaları</Typography></Divider>
        <Stack spacing={0.5}>
            {USER_RESTRICTIONS.map(({ key, label, color }) => (
                <Paper key={key} variant="outlined" sx={{
                    px: 2, py: 0.8, borderRadius: 2,
                    borderColor: data[key] ? (color === 'error' ? 'error.light' : color === 'warning' ? 'warning.light' : 'divider') : 'divider',
                    bgcolor: data[key] ? (color === 'error' ? alpha('#f44336', 0.05) : color === 'warning' ? alpha('#ff9800', 0.05) : 'transparent') : 'transparent',
                    transition: 'all 0.15s',
                }}>
                    <FormControlLabel
                        control={<Switch checked={!!data[key]} onChange={(e) => onChangeField(key, e.target.checked)} size="small" color={color === 'default' ? 'primary' : color} />}
                        label={<Typography variant="body2">{label}</Typography>}
                        sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                    />
                </Paper>
            ))}
        </Stack>
        <Divider><Typography variant="caption" color="text.secondary"> Ana Menü Görünümü</Typography></Divider>
        <Stack spacing={0.5}>
            {UI_RESTRICTIONS.map(({ key, label }) => {
                const val = !!data.attributes?.[key];
                return (
                    <Paper key={key} variant="outlined" sx={{ px: 2, py: 0.8, borderRadius: 2, bgcolor: val ? alpha('#000', 0.03) : 'transparent', transition: 'all 0.15s' }}>
                        <FormControlLabel
                            control={<Switch checked={val} onChange={(e) => onChangeAttr(key, e.target.checked)} size="small" color="primary" />}
                            label={<Typography variant="body2">{label}</Typography>}
                            sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                        />
                    </Paper>
                );
            })}
        </Stack>
    </Stack>
);

const AssignSection = ({ title, icon, items, selected, onToggle, searchPlaceholder, getId, getLabel }) => {
    const [search, setSearch] = useState('');
    const filtered = items.filter((i) => getLabel(i).toLowerCase().includes(search.toLowerCase()));
    return (
        <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                {icon}
                <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                {selected.length > 0 && <Chip label={selected.length} size="small" color="primary" sx={{ height: 18, fontSize: 11 }} />}
            </Stack>

            <TextField size="small" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} fullWidth sx={{ mb: 1.5 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="disabled" /></InputAdornment> }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, maxHeight: 120, overflowY: 'auto', pr: 0.5 }}>
                {filtered.length === 0 && <Typography variant="caption" color="text.disabled">Sonuç bulunamadı</Typography>}
                {filtered.map((item) => {
                    const id = getId(item);
                    const isSelected = selected.includes(id);
                    return (
                        <SelectableChip key={id} label={getLabel(item)} size="small" selected={isSelected ? 1 : 0}
                            onClick={() => onToggle(id)} onDelete={isSelected ? () => onToggle(id) : undefined}
                            variant={isSelected ? 'filled' : 'outlined'} />
                    );
                })}
            </Box>
        </Box>
    );
};

const StepAssignments = ({ assignments, onAssignChange, allDevices, allGroups, allGeofences, loadingResources }) => {
    if (loadingResources) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={2}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">Kaynaklar yükleniyor…</Typography>
            </Box>
        );
    }
    const toggle = (type, id) => {
        const current = assignments[type] || [];
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        onAssignChange(type, next);
    };
    return (
        <Stack spacing={3} sx={{ pt: 1 }}>
            <AssignSection title="Cihazlar" icon={<DirectionsCarIcon color="primary" fontSize="small" />}
                items={allDevices} selected={assignments.devices || []} onToggle={(id) => toggle('devices', id)}
                searchPlaceholder="Cihaz ara…" getId={(d) => d.id} getLabel={(d) => d.name} />
            <Divider />
            {/* Gruplar bölümünün hemen altına */}
            <Alert severity="info" icon={<InfoIcon fontSize="small" />} sx={{ borderRadius: 1, py: 0 }}>
                <AlertTitle sx={{ fontWeight: 600, fontSize: 13, mb: 0.3 }}>
                    Grup seçimi yaparsanız, Yukarıdan tek tek araç eklemenize gerek yoktur!
                </AlertTitle>
                <Typography variant="caption" sx={{ lineHeight: 1.5 }}>
                    Seçilen grubun altındaki <b>tüm araçlar</b> otomatik olarak kullanıcıya yetkilendirilir.
                </Typography>
            </Alert>
            <AssignSection title="Gruplar" icon={<FolderIcon color="warning" fontSize="small" />}
                items={allGroups} selected={assignments.groups || []} onToggle={(id) => toggle('groups', id)}
                searchPlaceholder="Grup ara…" getId={(g) => g.id} getLabel={(g) => g.name} />
            <Divider />
            <AssignSection title="Bölgeler (Geofence)" icon={<LocationOnIcon color="error" fontSize="small" />}
                items={allGeofences} selected={assignments.geofences || []} onToggle={(id) => toggle('geofences', id)}
                searchPlaceholder="Bölge ara…" getId={(g) => g.id} getLabel={(g) => g.name} />
        </Stack>
    );
};

const StepSummary = ({ userData, assignments, allDevices, allGroups, allGeofences, confirmed, onConfirm }) => {
    const deviceNames = (assignments.devices || []).map((id) => allDevices.find((d) => d.id === id)?.name).filter(Boolean);
    const groupNames = (assignments.groups || []).map((id) => allGroups.find((g) => g.id === id)?.name).filter(Boolean);
    const geofenceNames = (assignments.geofences || []).map((id) => allGeofences.find((g) => g.id === id)?.name).filter(Boolean);
    const activeRestrictions = USER_RESTRICTIONS.filter(({ key }) => !!userData[key]).map(({ label }) => label.split(' — ')[0]);
    const activeUiRestrictions = UI_RESTRICTIONS.filter(({ key }) => !!userData.attributes?.[key]).map(({ label }) => label);

    return (
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 700 }}>
                        {userData.name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                        <Typography fontWeight={700}>{userData.name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{userData.email}</Typography>
                    </Box>
                </Stack>
                <SummaryRow>
                    <PhoneIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                    <Typography variant="body2">{userData.phone || <em style={{ opacity: 0.5 }}>Telefon girilmedi</em>}</Typography>
                </SummaryRow>
                {activeRestrictions.length > 0 && (
                    <SummaryRow>
                        <ShieldIcon fontSize="small" color="warning" sx={{ mt: 0.2 }} />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {activeRestrictions.map((r) => <Chip key={r} label={r} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: 11 }} />)}
                        </Box>
                    </SummaryRow>
                )}
                {activeUiRestrictions.length > 0 && (
                    <SummaryRow>
                        <ShieldIcon fontSize="small" color="info" sx={{ mt: 0.2 }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.3}>Gizlenen Menüler</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {activeUiRestrictions.map((r) => <Chip key={r} label={r} size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: 11 }} />)}
                            </Box>
                        </Box>
                    </SummaryRow>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                    Kullanıcının Yetkilendirildiği; Cihazlar , Gruplar ve Bölgeler
                </Typography>
                {[
                    { label: 'Cihazlar', names: deviceNames, icon: <DirectionsCarIcon fontSize="small" color="primary" /> },
                    { label: 'Gruplar', names: groupNames, icon: <FolderIcon fontSize="small" color="warning" /> },
                    { label: 'Bölgeler (Dikkat! Kullanıcı "Salt Okunur" olarak kısıtlanmadıysa, atanan bölgeler üzerinde değişiklik yapabilir veya silebilir.)', names: geofenceNames, icon: <LocationOnIcon fontSize="small" color="error" /> },
                ].map(({ label, names, icon }) => (
                    <SummaryRow key={label}>
                        {icon}
                        <Box>
                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.3 }}>
                                {names.length === 0
                                    ? <Typography variant="body2" sx={{ opacity: 0.4 }}>Atanmadı</Typography>
                                    : names.map((n) => <Chip key={n} label={n} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />)}
                            </Box>
                        </Box>
                    </SummaryRow>
                ))}
            </Paper>

            <Alert severity={confirmed ? 'success' : 'warning'} icon={confirmed ? <VerifiedIcon /> : <GavelIcon />} sx={{ borderRadius: 2, alignItems: 'flex-start' }}>
                <AlertTitle sx={{ fontWeight: 700 }}>{confirmed ? 'Onaylandı' : 'Yasal Onay Gerekiyor'}</AlertTitle>
                <Typography variant="body2" gutterBottom>Bilgilerin doğruluğundan emin misiniz?</Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Kullanıcı işlemleri <b>5651 sayılı kanun ve ilgili mevzuat</b> gereği log kaydı altına alınmaktadır.
                    Kişinin görüntüleyeceği bilgilerin kuruma özel gizli veya kişisel veri niteliğinde olabileceği hakkında
                    <b> yazılı & sözlü olarak bilgilendirildi mi?</b>
                </Typography>
                <FormControlLabel
                    control={<Checkbox checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} size="small" color="success" />}
                    label={<Typography variant="body2" fontWeight={600}>Evet, tüm hususlarda bilgilendirme yapıldı ve bilgiler doğrudur.</Typography>}
                    sx={{ mt: 0.5, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0 } }}
                />
            </Alert>
        </Stack>
    );
};

// ─── Ana Dialog ───────────────────────────────────────────────────────────────

const STEPS = ['Temel Bilgiler', 'İzinler', 'Atamalar', 'Özet & Onay'];
const STEP_ICONS = [PersonIcon, ShieldIcon, DirectionsCarIcon, CheckCircleIcon];

/**
 * UserWizardDialog
 *
 * Props:
 *   open         boolean
 *   onClose      () => void
 *   id           number | null | undefined  ← varsa edit, yoksa create
 *   onSaved      (user) => void
 */
const UserWizardDialog = ({ open, onClose, id, onSaved }) => {
    // id prop'una göre mod belirleniyor — editUser objesine gerek yok
    const isEdit = Boolean(id);

    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const [userData, setUserData] = useState(defaultUserData);
    const [assignments, setAssignments] = useState({ devices: [], groups: [], geofences: [] });
    // Edit modunda mevcut atamaları tutuyoruz (diff için)
    const [originalAssignments, setOriginalAssignments] = useState({ devices: [], groups: [], geofences: [] });

    const [allDevices, setAllDevices] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [allGeofences, setAllGeofences] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);

    // ─── Dialog açıldığında veri yükle ─────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setActiveStep(0);
        setError(null);
        setConfirmed(false);
        setSuccessMsg('');
        setAllDevices([]);   // kaynak listesini sıfırla — step 2'de yeniden yüklensin
        setAllGroups([]);
        setAllGeofences([]);

        if (isEdit && id) {
            // Mevcut kullanıcıyı çek — EditItemView mantığı
            fetchOrThrow(`/api/users/${id}`)
                .then((r) => r.json())
                .then((user) => {
                    setUserData({
                        ...defaultUserData,
                        ...user,
                        attributes: { ...defaultUserData.attributes, ...(user.attributes || {}) },
                        password: '', // şifreyi asla doldurma
                    });
                })
                .catch((e) => setError(e.message));

            // Mevcut atamaları çek
            Promise.all([
                fetchOrThrow(`/api/devices?userId=${id}&excludeAttributes=true`).then((r) => r.json()),
                fetchOrThrow(`/api/groups?userId=${id}`).then((r) => r.json()),
                fetchOrThrow(`/api/geofences?userId=${id}`).then((r) => r.json()),
            ]).then(([devices, groups, geofences]) => {
                const current = {
                    devices: devices.map((d) => d.id),
                    groups: groups.map((g) => g.id),
                    geofences: geofences.map((g) => g.id),
                };
                setAssignments(current);
                setOriginalAssignments(current); // diff için sakla
            }).catch(() => { });
        } else {
            setUserData(defaultUserData);
            setAssignments({ devices: [], groups: [], geofences: [] });
            setOriginalAssignments({ devices: [], groups: [], geofences: [] });
        }
    }, [open, id]);

    // ─── Step 2'ye geçince kaynakları yükle ────────────────────────────────────
    useEffect(() => {
        if (activeStep !== 2 || allDevices.length > 0) return;
        setLoadingResources(true);
        Promise.all([
            fetchOrThrow('/api/devices?excludeAttributes=true').then((r) => r.json()),
            fetchOrThrow('/api/groups').then((r) => r.json()),
            fetchOrThrow('/api/geofences').then((r) => r.json()),
        ]).then(([devices, groups, geofences]) => {
            setAllDevices(devices);
            setAllGroups(groups);
            setAllGeofences(geofences);
        }).catch((e) => setError(e.message))
            .finally(() => setLoadingResources(false));
    }, [activeStep]);

    const handleChangeField = useCallback((key, value) => {
        setUserData((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleChangeAttr = useCallback((key, value) => {
        setUserData((prev) => ({ ...prev, attributes: { ...prev.attributes, [key]: value } }));
    }, []);

    const handleAssignChange = useCallback((type, ids) => {
        setAssignments((prev) => ({ ...prev, [type]: ids }));
    }, []);

    const canNext = () => {
        if (activeStep === 0) return userData.name && userData.email && (isEdit || userData.password);
        if (activeStep === 3) return confirmed;
        return true;
    };

    // ─── Kaydet — EditItemView.handleSave + permissions sync ───────────────────
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // 1. Kullanıcıyı kaydet (POST veya PUT)
            const payload = { ...userData };
            if (isEdit && !payload.password) delete payload.password; // boş şifre gönderme

            const url = isEdit ? `/api/users/${id}` : '/api/users';
            const response = await fetchOrThrow(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const savedUser = await response.json();
            const userId = savedUser.id;

            // 2. Permissions sync
            if (isEdit) {
                // Diff — sadece değişenleri gönder
                await Promise.all([
                    syncPermissions(userId, 'devices', originalAssignments.devices, assignments.devices),
                    syncPermissions(userId, 'groups', originalAssignments.groups, assignments.groups),
                    syncPermissions(userId, 'geofences', originalAssignments.geofences, assignments.geofences),
                ]);
            } else {
                // Yeni kullanıcı — hepsini ekle
                await Promise.all([
                    ...assignments.devices.map((did) =>
                        fetchOrThrow('/api/permissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, deviceId: did }),
                        })
                    ),
                    ...assignments.groups.map((gid) =>
                        fetchOrThrow('/api/permissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, groupId: gid }),
                        })
                    ),
                    ...assignments.geofences.map((fid) =>
                        fetchOrThrow('/api/permissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, geofenceId: fid }),
                        })
                    ),
                ]);
            }

            // 3. Başarı
            setSuccessMsg(isEdit ? `"${savedUser.name}" güncellendi.` : `"${savedUser.name}" oluşturuldu.`);
            onSaved?.(savedUser);

            // Kısa bir gecikme ile dialog'u kapat (kullanıcı mesajı görsün)
            setTimeout(onClose, 1200);
        } catch (e) {
            setError(e.message || 'Kayıt sırasında bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const StepIcon = STEP_ICONS[activeStep];

    return (
        <>
            <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <StepHeader>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 38, height: 38 }}>
                                <StepIcon fontSize="small" sx={{ color: '#fff' }} />
                            </Avatar>
                            <Box>
                                <Typography variant="overline" sx={{ opacity: 0.75, lineHeight: 1, display: 'block', fontSize: 11 }}>
                                    {isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                                </Typography>
                                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                    {STEPS[activeStep]}
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton size="small" onClick={onClose} sx={{ color: alpha('#fff', 0.8) }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Box sx={{ mt: 2.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={(activeStep / (STEPS.length - 1)) * 100}
                            sx={{
                                height: 4, borderRadius: 2,
                                bgcolor: alpha('#fff', 0.2),
                                '& .MuiLinearProgress-bar': { bgcolor: '#fff', borderRadius: 2 },
                            }}
                        />
                        <Stack direction="row" justifyContent="space-between" mt={0.8}>
                            {STEPS.map((s, i) => (
                                <Typography
                                    key={s} variant="caption"
                                    sx={{
                                        opacity: i === activeStep ? 1 : 0.5,
                                        fontWeight: i === activeStep ? 700 : 400,
                                        fontSize: 10,
                                        cursor: i < activeStep ? 'pointer' : 'default',
                                    }}
                                    onClick={() => i < activeStep && setActiveStep(i)}
                                >
                                    {i + 1}. {s}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>
                </StepHeader>

                <DialogContent sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    {successMsg && (
                        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                            {successMsg}
                        </Alert>
                    )}
                    <Fade in key={activeStep} timeout={200}>
                        <Box>
                            {activeStep === 0 && <StepBasicInfo data={userData} onChange={handleChangeField} isEdit={isEdit} />}
                            {activeStep === 1 && <StepPermissions data={userData} onChangeField={handleChangeField} onChangeAttr={handleChangeAttr} />}
                            {activeStep === 2 && (
                                <StepAssignments
                                    assignments={assignments} onAssignChange={handleAssignChange}
                                    allDevices={allDevices} allGroups={allGroups} allGeofences={allGeofences}
                                    loadingResources={loadingResources}
                                />
                            )}
                            {activeStep === 3 && (
                                <StepSummary
                                    userData={userData} assignments={assignments}
                                    allDevices={allDevices} allGroups={allGroups} allGeofences={allGeofences}
                                    confirmed={confirmed} onConfirm={setConfirmed}
                                />
                            )}
                        </Box>
                    </Fade>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button variant="outlined" onClick={activeStep === 0 ? onClose : () => setActiveStep((s) => s - 1)} disabled={saving}>
                        {activeStep === 0 ? 'İptal' : 'Geri'}
                    </Button>
                    <Box flex={1} />
                    {activeStep < STEPS.length - 1 ? (
                        <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)} disabled={!canNext()}>
                            İleri
                        </Button>
                    ) : (
                        <Button
                            variant="contained" color="success" onClick={handleSave}
                            disabled={!canNext() || saving}
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        >
                            {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Kullanıcı Oluştur'}
                        </Button>
                    )}
                </DialogActions>
            </StyledDialog>

            {/* Başarı toast — dialog kapandıktan sonra da görünür */}
            <Snackbar
                open={Boolean(successMsg)}
                autoHideDuration={3000}
                onClose={() => setSuccessMsg('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
                    {successMsg}
                </Alert>
            </Snackbar>
        </>
    );
};

export default UserWizardDialog;