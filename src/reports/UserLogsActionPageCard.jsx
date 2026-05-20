import React, { useMemo, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, IconButton, Dialog, DialogTitle, DialogContent, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, Box, Button, Tooltip, useTheme, useMediaQuery, TableContainer
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
// Icons
import LoginIcon from '@mui/icons-material/Login';
import CableIcon from '@mui/icons-material/Cable';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TerminalIcon from '@mui/icons-material/Terminal';
import ReportIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';

const COLORS = {
  login: '#2e7d32',
  socketlogin: '#1565c0',
  logout: '#546e7a',
  edit: '#f9a825',
  remove: '#e53935',
  create: '#43a047',
  notification: '#c62828',
  command: '#6a1b9a',
  report: '#0288d1',
  reportScheduled: '#00897b',
  other: '#757575'
};

const formatDate = (ts) => dayjs(ts).format('DD.MM.YYYY HH:mm:ss');

const isPrivateIp = (ip) => {
  if (!ip) return true;
  const pure = String(ip).split('/')[0];
  const parts = pure.split('.');
  if (parts.length !== 4) return true;
  const [a, b] = parts.map(Number);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
};

// CSV (dialog içeriği)
const toCSV = (rows, headers) => {
  const head = headers.join(',');
  const body = rows.map(r =>
    headers.map(h => {
      const v = r[h] ?? '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')
  ).join('\n');
  return `${head}\n${body}`;
};

const downloadCSV = (filename, csv) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// OTP telefon bilgisi parse
const parsePhoneFromAttributes = (attributes) => {
  const takeDigits = (s) => (s || '').replace(/[^\d+]/g, '');
  const d1 = attributes?.desc1 || '';
  const d2 = attributes?.desc2 || '';
  // "Phone:05..." veya "Name:... Phone:05..." gibi varyasyonlara bak
  const re = /Phone\s*:?\s*([+]?[\d\s\-()]+)/i;
  const m1 = d1.match(re);
  const m2 = d2.match(re);
  const raw = m1?.[1] || m2?.[1] || d1 || d2;
  const digits = takeDigits(raw);
  // Türkiye format normalize: başında 0 yoksa eklemeyelim, sadece çıplaklaştırıyoruz
  return digits.startsWith('90') ? digits : digits;
};

const UserLogsActionPageCard = ({
  items,
  users,
  userNames,
  deviceNames,
  actionButton,
}) => {
  const usersById = useMemo(() => {
    const m = {};
    (users || []).forEach(u => { m[u.id] = u; });
    return m;
  }, [users]);

  // Özetler
  const allTypesSummary = useMemo(() => {
    const counts = {};
    items.forEach(i => {
      const t = i.actionType || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [items]);

  const scheduledReports = useMemo(() => {
    return items.filter(i => i.actionType === 'report' && i.attributes && i.attributes.scheduled === true);
  }, [items]);

  // Multi-series trend
  // -- GÜNCELLE: Çoklu trend (socketlogin -> login + boş günler 0)
  // 🔹 Günlük işlem trafiği
  // 1) Günlük istatistik (tarihe göre sıralı)
  const dailyStats = useMemo(() => {
    const map = {};
    items.forEach(i => {
      const day = new Date(i.actionTime).toLocaleDateString('tr-TR'); // "DD.MM.YYYY"
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) =>
        a.date.split('.').reverse().join('-')
          .localeCompare(b.date.split('.').reverse().join('-'))
      );
  }, [items]);

  // Top giriş yapanlar
  const topLoginUsers = useMemo(() => {
    const map = {};
    items.filter(i => ['login', 'socketlogin'].includes(i.actionType)).forEach(i => {
      map[i.userId] = (map[i.userId] || 0) + 1;
    });
    return Object.entries(map)
      .map(([userId, count]) => ({ name: userNames[userId] || `#${userId}`, count, userId: Number(userId) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items, userNames]);

  // En çok komut gönderilen cihazlar
  const topCommandDevices = useMemo(() => {
    const map = {};
    items.filter(i => i.actionType === 'command').forEach(i => {
      map[i.objectId] = (map[i.objectId] || 0) + 1;
    });
    return Object.entries(map)
      .map(([deviceId, count]) => ({ name: deviceNames[deviceId] || `Device ${deviceId}`, count, deviceId }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items, deviceNames]);

  // En çok düzenlenen objeler
  const topEditedObjects = useMemo(() => {
    const map = {};
    items.filter(i => i.actionType === 'edit').forEach(i => {
      const key = `${i.objectType || 'unknown'}:${i.objectId}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([key, count]) => ({ name: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items]);

  // 🔁 Değişiklik: En çok ekleyen/silen **kullanıcılar**
  const topCreatorUsers = useMemo(() => {
    const map = {};
    items.filter(i => i.actionType === 'create').forEach(i => {
      const uid = i.userId;
      if (uid === 0) return; // self-signup’ları buradan hariç tutuyoruz
      map[uid] = (map[uid] || 0) + 1;
    });
    return Object.entries(map)
      .map(([uid, count]) => ({ name: userNames[uid] || `#${uid}`, count, userId: Number(uid) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items, userNames]);

  const topRemoverUsers = useMemo(() => {
    const map = {};
    items.filter(i => i.actionType === 'remove').forEach(i => {
      const uid = i.userId;
      if (uid === 0) return;
      map[uid] = (map[uid] || 0) + 1;
    });
    return Object.entries(map)
      .map(([uid, count]) => ({ name: userNames[uid] || `#${uid}`, count, userId: Number(uid) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items, userNames]);

  // 🔔 Yeni kayıtlar: create user by userId==0
  const newRegistrations = useMemo(() => {
    return items
      .filter(i => i.actionType === 'create' && i.objectType === 'user' && i.userId === 0)
      .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime));
  }, [items]);

  // Dialog / IP Info
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogCols, setDialogCols] = useState(['Tarih', 'IP', 'Kullanıcı', 'İşlem', 'Nesne Türü', 'Nesne']);
  const [dialogRows, setDialogRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);

  const openRowsDialog = (title, rows, colsOverride) => {
    setDialogTitle(title);
    setDialogCols(colsOverride || ['Tarih', 'IP', 'Kullanıcı', 'İşlem', 'Nesne Türü', 'Nesne']);
    setDialogRows(rows);
    setOpenDialog(true);
  };

  const buildRowCommon = (i) => ({
    'Tarih': formatDate(i.actionTime),
    'IP': i.address || '-',
    'Kullanıcı': userNames[i.userId] || i.userId,
    'İşlem': i.actionType,
    'Nesne Türü': i.objectType || '-',
    'Nesne':
      i.objectType === 'device'
        ? (deviceNames[i.objectId] || i.objectId)
        : i.objectType === 'user'
          ? (userNames[i.objectId] || i.objectId)
          : (i.objectId || '-'),
  });

  const openByType = (type, titleLabel) => {
    const rows = items
      .filter(i => i.actionType === type)
      .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
      .map(buildRowCommon);
    openRowsDialog(`${titleLabel || type.toUpperCase()} Detayları`, rows);
  };

  // CSV (dialog)
  const exportDialogCSV = () => {
    const csv = toCSV(dialogRows, dialogCols);
    downloadCSV(`actions_dialog_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, csv);
  };

  // IP who.is dialog (mevcut)
  const [ipDialogOpen, setIpDialogOpen] = useState(false);
  const [ipDialogIp, setIpDialogIp] = useState(null);
  const [ipDialogData, setIpDialogData] = useState(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState('');
  const [ipCache] = useState(() => new Map());

  const handleIpClick = async (ipRaw) => {
    const ip = String(ipRaw || '').split('/')[0];
    if (!ip || ip === '-' || isPrivateIp(ip)) return;
    setIpDialogOpen(true);
    setIpDialogIp(ip);
    setIpError('');
    if (ipCache.has(ip)) {
      setIpDialogData(ipCache.get(ip));
      return;
    }
    try {
      setIpLoading(true);

      const providers = [
        async () => {
          const res = await fetch(
            `https://ipapi.co/${encodeURIComponent(ip)}/json/`
          );

          const json = await res.json();

          return {
            success: !json.error,
            provider: 'ipapi',
            data: {
              ip,
              country: json.country_name,
              country_code: json.country_code,
              city: json.city,
              region: json.region,
              postal: json.postal,
              latitude: json.latitude,
              longitude: json.longitude,
              isp: json.org,
              timezone: json.timezone,
            },
          };
        },

        async () => {
          const res = await fetch(
            `https://freeipapi.com/api/json/${encodeURIComponent(ip)}`
          );

          const json = await res.json();

          return {
            success: true,
            provider: 'freeipapi',
            data: {
              ip,
              country: json.countryName,
              country_code: json.countryCode,
              city: json.cityName,
              region: json.regionName,
              postal: json.zipCode,
              latitude: json.latitude,
              longitude: json.longitude,
              isp: json.isp,
              timezone: json.timeZone,
            },
          };
        },

        async () => {
          const res = await fetch(
            `https://ipwhois.app/json/${encodeURIComponent(ip)}`
          );

          const json = await res.json();

          return {
            success: json.success !== false,
            provider: 'ipwhois',
            data: {
              ip,
              country: json.country,
              country_code: json.country_code,
              city: json.city,
              region: json.region,
              postal: json.postal,
              latitude: json.latitude,
              longitude: json.longitude,
              isp: json.isp,
              timezone: json.timezone?.id,
            },
          };
        },
      ];

      let successData = null;

      for (const provider of providers) {
        try {
          const result = await provider();

          if (result?.success) {
            successData = result.data;

            console.log(
              `IP provider success: ${result.provider}`
            );

            break;
          }
        } catch (err) {
          console.warn('Provider failed:', err);
        }
      }

      if (!successData) {
        throw new Error('All IP providers failed');
      }

      setIpDialogData(successData);
      ipCache.set(ip, successData);

    } catch (e) {
      setIpError('IP sorgusunda sorun oluştu.');
      setIpDialogData(null);
    } finally {
      setIpLoading(false);
    }
  };

  // Yeni kayıtlar detay dialogu (OTP eşleşmeleri ile)
  const openNewRegistrationsDialog = () => {
    const rows = newRegistrations.map((i) => {
      const newUserId = i.objectId; // oluşturulan kullanıcı
      const newUser = usersById[newUserId];
      const ip = i.address || '-';

      // Bu IP'den gelen OTP SMS loglarını topla
      const otpLogs = items.filter(x =>
        x.actionType === 'sms' &&
        x.objectType === 'OTP' &&
        (x.address || '-') === ip
      ).sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime));

      const otpPhones = otpLogs
        .map(x => parsePhoneFromAttributes(x.attributes))
        .filter(p => p);

      const userPhone = (newUser?.phone || '').replace(/[^\d+]/g, '');
      const mismatch = otpPhones.length > 0 && userPhone && otpPhones.some(p => p && p !== userPhone);

      return {
        'Tarih': formatDate(i.actionTime),
        'IP': ip,
        'Yeni Kullanıcı': newUser?.name || `#${newUserId}`,
        'Kullanıcı ID': newUserId,
        'Doğrulanan Telefon': userPhone || '-',
        'OTP Telefonları': otpPhones.join(' | ') || '-',
        'OTP Log Sayısı': otpLogs.length,
        'Eşleşme Durumu': mismatch ? 'UYUŞMUYOR' : 'OK'
      };
    });

    openRowsDialog('Yeni Kayıtlar (Self-Signup)', rows, [
      'Tarih', 'IP', 'Yeni Kullanıcı', 'Kullanıcı ID', 'Doğrulanan Telefon', 'OTP Telefonları', 'OTP Log Sayısı', 'Eşleşme Durumu'
    ]);
  };

  // Grafik / KPI ikonları
  const getIcon = (type) => {
    switch (type) {
      case 'login': return <LoginIcon fontSize="large" />;
      case 'socketlogin': return <CableIcon fontSize="large" />;
      case 'logout': return <LogoutIcon fontSize="large" />;
      case 'edit': return <EditIcon fontSize="large" />;
      case 'remove': return <DeleteIcon fontSize="large" />;
      case 'create': return <AddCircleIcon fontSize="large" />;
      case 'notification': return <NotificationsActiveIcon fontSize="large" />;
      case 'command': return <TerminalIcon fontSize="large" />;
      case 'report': return <ReportIcon fontSize="large" />;
      case 'reportScheduled': return <ScheduleIcon fontSize="large" />;
      default: return <EditIcon fontSize="large" />;
    }
  };
  const RankedListCard = ({
    title,
    icon,
    color,
    items,
    onItemClick,
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mb={2}
        >
          <Box sx={{ color }}>
            {icon}
          </Box>

          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={1}>
          {items.map((item, index) => (
            <Box
              key={item.name}
              onClick={() => onItemClick(item)}
              sx={{
                p: 1.2,
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: '0.2s',
                '&:hover': {
                  bgcolor: `${color}15`,
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.2}
                  minWidth={0}
                >
                  <Typography
                    sx={{
                      minWidth: 24,
                      color,
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    #{index + 1}
                  </Typography>

                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 600 }}
                  >
                    {item.name}
                  </Typography>
                </Box>

                <Chip
                  label={item.count}
                  size="small"
                  sx={{
                    bgcolor: `${color}20`,
                    color,
                    fontWeight: 700,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
  const kpiCards = useMemo(() => {
    const types = Object.keys(allTypesSummary).sort();
    const base = types.map(t => ({
      key: t,
      label: t.toUpperCase(),
      count: allTypesSummary[t],
      color: COLORS[t] || COLORS.other,
      icon: getIcon(t),
      onClick: () => openByType(t)
    }));

    if (scheduledReports.length > 0) {
      base.unshift({
        key: 'reportScheduled',
        label: 'ZAMANLANMIŞ RAPORLAR',
        count: scheduledReports.length,
        color: COLORS.reportScheduled,
        icon: getIcon('reportScheduled'),
        onClick: () => {
          const rows = scheduledReports
            .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
            .map(i => ({
              'Tarih': formatDate(i.actionTime),
              'Kullanıcı': userNames[i.userId] || i.userId,
              'Tip': i.attributes?.type || '-',
              'From': i.attributes?.from || '-',
              'To': i.attributes?.to || '-',
              'Devices': i.attributes?.devices || '-',
              'Groups': i.attributes?.groups || '-'
            }));
          openRowsDialog('Zamanlanmış Raporlar', rows, ['Tarih', 'Kullanıcı', 'Tip', 'From', 'To', 'Devices', 'Groups']);
        }
      });
    }

    // Yeni Kayıtlar kartını da ekle (varsa)
    if (newRegistrations.length > 0) {
      base.unshift({
        key: 'newRegs',
        label: 'YENİ KAYITLAR',
        count: newRegistrations.length,
        color: '#1e88e5',
        icon: <PersonAddAltIcon fontSize="large" />,
        onClick: openNewRegistrationsDialog
      });
    }

    return base;
  }, [allTypesSummary, scheduledReports, userNames, newRegistrations]);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <>
      {/* Çoklu Trend */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          Kullanıcı Logları
        </Typography>

        {actionButton}
      </Box>
      {/* KPI */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {kpiCards.map((c) => (
          <Grid key={c.key} size={{ xs: 3, sm: 3, md: 2, lg: 2 }}>
            <Card onClick={c.onClick} sx={{ cursor: 'pointer', transition: '0.2s', borderRadius: 2, '&:hover': { transform: 'translateY(-2px)', boxShadow: 6, backgroundColor: `${c.color}18` } }}>
              <CardContent sx={{ textAlign: 'center', py: { xs: 0.5, sm: 0.75, md: 1 }, px: { xs: 0.5, sm: 0.75, md: 1 }, '&:last-child': { pb: { xs: 0.5, sm: 0.75, md: 1 } } }}>
                <IconButton size="small" sx={{ color: c.color, '& svg': { fontSize: { xs: 16, sm: 18, md: 22 } }, mb: { xs: 0.1, sm: 0.25 }, p: { xs: 0.25, sm: 0.5 } }}>{c.icon}</IconButton>
                <Typography variant="caption" sx={{ letterSpacing: 0.1, lineHeight: 1.1, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: { xs: 10, sm: 11, md: 12 } }} title={c.label}>{c.label}</Typography>
                <Typography sx={{ color: c.color, fontWeight: 700, lineHeight: 1.1, mt: { xs: 0.1, sm: 0.25 }, fontSize: { xs: 14, sm: 16, md: 18 } }}>{c.count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Günlük İşlem Grafiği */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>📊 Günlük İşlem Sayısı</Typography>

            {/* Yükseklik garantisi */}
            <Box sx={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyStats}
                  onClick={(e) => {
                    const day = e?.activeLabel;
                    if (!day) return;

                    // Gün içindeki tüm olayları topla -> rows
                    const rows = items
                      .filter(it => new Date(it.actionTime).toLocaleDateString('tr-TR') === day)
                      .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
                      .map(buildRowCommon);

                    openRowsDialog(`${day} Günündeki Tüm Olaylar`, rows);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ReTooltip />
                  <Line type="monotone" dataKey="count" stroke="#1565c0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid container spacing={2}>

        <Grid size={{ xs: 12, md: 6 }}>
          <RankedListCard
            title="En Çok Giriş Yapan Kullanıcılar"
            icon={<LoginIcon />}
            color={COLORS.login}
            items={topLoginUsers}
            onItemClick={(item) => {
              const rows = items
                .filter(it =>
                  ['login', 'socketlogin'].includes(it.actionType)
                  && it.userId === item.userId
                )
                .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
                .map(buildRowCommon);

              openRowsDialog(`${item.name} — Giriş Olayları`, rows);
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <RankedListCard
            title="En Çok Komut Gönderilen Cihazlar"
            icon={<TerminalIcon />}
            color={COLORS.command}
            items={topCommandDevices}
            onItemClick={(item) => {
              const rows = items
                .filter(it =>
                  it.actionType === 'command'
                  && String(it.objectId) === String(item.deviceId)
                )
                .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
                .map(buildRowCommon);

              openRowsDialog(`${item.name} — Komut Geçmişi`, rows);
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <RankedListCard
            title="En Çok Düzenlenen Objeler"
            icon={<EditIcon />}
            color={COLORS.edit}
            items={topEditedObjects}
            onItemClick={(item) => {
              const rows = items
                .filter(it =>
                  it.actionType === 'edit'
                  && `${it.objectType}:${it.objectId}` === item.name
                )
                .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
                .map(buildRowCommon);

              openRowsDialog(`${item.name} — Edit Geçmişi`, rows);
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <RankedListCard
            title="En Çok Ekleyen Kullanıcılar"
            icon={<AddCircleIcon />}
            color={COLORS.create}
            items={topCreatorUsers}
            onItemClick={(item) => {
              const rows = items
                .filter(it =>
                  it.actionType === 'create'
                  && it.userId === item.userId
                )
                .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
                .map(buildRowCommon);

              openRowsDialog(`${item.name} — Create Olayları`, rows);
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <RankedListCard
            title="En Çok Silen Kullanıcılar"
            icon={<DeleteIcon />}
            color={COLORS.remove}
            items={topRemoverUsers}
            onItemClick={(item) => {
              const rows = items
                .filter(it =>
                  it.actionType === 'remove'
                  && it.userId === item.userId
                )
                .sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime))
                .map(buildRowCommon);

              openRowsDialog(`${item.name} — Remove Olayları`, rows);
            }}
          />
        </Grid>

      </Grid>
      {/* Detay Dialog */}
      {/* Detay Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        // Mobilde tam ekran, daha büyük ekranlarda klasik dialog
        fullScreen={isXs}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            // Tam ekran değilse kenarlardan nefes aldır
            ...(isXs ? {} : { mx: 1.5 }),
            borderRadius: isXs ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: isXs ? 1 : 2,
            py: isXs ? 1 : 1.5,
            typography: isXs ? 'subtitle1' : 'h6',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {dialogTitle}
          {/* Sağ üstte kapatma */}
          <IconButton
            aria-label="Kapat"
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size={isXs ? 'small' : 'medium'}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: isXs ? 1 : 2,
            // İçerik çok uzarsa dikey kaydırma
            maxHeight: isXs ? 'none' : '70vh',
          }}
        >
          {/* CSV butonu: mobilde sadece ikon */}
          <Box
            sx={{
              mb: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
            }}
          >
            <Button
              size={isXs ? 'small' : 'medium'}
              variant="outlined"
              startIcon={isXs ? null : <FileDownloadIcon />}
              onClick={() => {
                const csv = toCSV(dialogRows, dialogCols);
                downloadCSV(`actions_dialog_${dayjs().format('YYYYMMDD_HHmmss')}.csv`, csv);
              }}
            >
              {isXs ? <DownloadIcon /> : 'CSV — Bu Tablo'}
            </Button>
          </Box>

          {/* Tabloda yatay scroll + sticky header */}
          <TableContainer
            sx={{
              maxHeight: isXs ? 'unset' : '60vh',
              overflowX: 'auto',
              // min-width: mobilde kolonların üst üste binmesini engeller
              // ihtiyaca göre artırabilirsiniz.
              minWidth: 640,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {dialogCols.map((c) => (
                    <TableCell
                      key={c}
                      sx={{
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        bgcolor: 'background.paper',
                      }}
                    >
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {dialogRows.map((r, idx) => (
                  <TableRow key={idx} hover>
                    {dialogCols.map((c) => {
                      if (c === 'IP') {
                        const ip = r[c];
                        const isPriv = isPrivateIp(ip);
                        return (
                          <TableCell
                            key={c}
                            sx={{ whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            <Button
                              size="small"
                              onClick={() => handleIpClick(ip)}
                              disabled={!ip || ip === '-' || isPriv}
                              startIcon={<LocationOnIcon />}
                            >
                              {ip || '-'}
                            </Button>
                            {isPriv && (
                              <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                                (private)
                              </Typography>
                            )}
                          </TableCell>
                        );
                      }

                      if (c === 'Eşleşme Durumu') {
                        const ok = r[c] === 'OK';
                        return (
                          <TableCell key={c} sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title={ok ? 'OTP telefonları kullanıcı telefonu ile uyumlu' : 'OTP telefonları farklı görünüyor'}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: ok ? '#e8f5e9' : '#ffebee',
                                  color: ok ? '#2e7d32' : '#c62828',
                                  fontWeight: 600,
                                }}
                              >
                                {r[c]}
                              </span>
                            </Tooltip>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={c}
                          sx={{
                            // Uzun metinleri tek satırda taşırma/ellipsis
                            whiteSpace: 'nowrap',
                            maxWidth: isXs ? 200 : 320,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={r[c] ?? '-'}
                        >
                          {r[c] ?? '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {dialogRows.length === 0 && (
            <Typography align="center" sx={{ mt: 2, color: 'text.secondary' }}>
              Kayıt bulunamadı.
            </Typography>
          )}
        </DialogContent>
      </Dialog>


    </>
  );
}
export default UserLogsActionPageCard;
