import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Stack, Button, alpha, useTheme, LinearProgress, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const AI_API_URL = 'https://giris.takipon.com/api/ai';

const calculateDateRange = (rangeType = 'today') => {
  const today = new Date();
  let start = new Date();
  let end = new Date();
  if (rangeType === 'yesterday') {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  }
  return {
    start: start.toISOString().split('T')[0] + 'T00:00:00Z',
    end: end.toISOString().split('T')[0] + 'T23:59:59Z',
  };
};

const minimizeEventsForAI = (events = []) =>
  events.map(e => ({
    deviceId: e.deviceId,
    type: e.type,
    time: e.eventTime,
    attr: e.attributes?.alarm || e.attributes?.status || '',
    ...(e.type === 'deviceOverspeed' && e.attributes?.speed != null && {
      speed: Math.round(e.attributes.speed * 1.852),
      limit: Math.round(e.attributes.speedLimit * 1.852),
    }),
  })).slice(0, 50);

// minimizeTripsForAI → minimizeSummaryForAI olarak değiştir
const minimizeSummaryForAI = (summaries = [], devices = []) =>
  summaries.map(s => {
    const dev = devices.find(d => String(d.id) === String(s.deviceId));
    return {
      deviceId: s.deviceId,
      category: dev?.category || 'car',
      dist_km: Math.round((s.distance || 0) / 1000),
      avg_kmh: Math.round((s.averageSpeed || 0) * 1.852),
      max_kmh: Math.round((s.maxSpeed || 0) * 1.852),
      startTime: s.startTime,
      endTime: s.endTime,
    };
  }).slice(0, 50);

const STATUS = {
  idle: 'idle',
  loading: 'loading',
  done: 'done',
  error: 'error',
};

const ReportsMenuNewAICard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [status, setStatus] = useState(STATUS.idle);
  const [summary, setSummary] = useState('');
  const [insightCount, setInsightCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const cacheTime = localStorage.getItem('aiAnalysisCacheTime');

  useEffect(() => {
    const cached = localStorage.getItem('aiAnalysisCache');
    const cacheTime = localStorage.getItem('aiAnalysisCacheTime');
    const CACHE_HOUR = 1000 * 60 * 60 * 24; // 24 saat

    if (cached && cacheTime && Date.now() - Number(cacheTime) < CACHE_HOUR) {
      const parsed = JSON.parse(cached);
      setSummary(localStorage.getItem('aiAnalysisSummary') || 'Analiz hazır.');
      setInsightCount(parsed.length);
      setErrorCount(parsed.filter(i => i.color === 'error').length);
      setStatus(STATUS.done);
      return;
    }

    runBackgroundAnalysis();
  }, []);

  const runBackgroundAnalysis = async () => {
    setStatus(STATUS.loading);
    try {
      const [devRes, grpRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/groups'),
      ]);
      const devices = await devRes.json();
      if (!devices.length) { setStatus(STATUS.idle); return; }

      const dates = calculateDateRange('today');
      const deviceIdsList = devices.map(d => d.id);
      const eventQuery = deviceIdsList.map(id => `deviceId=${id}`).join('&');

      const [eventRes, tripRes] = await Promise.allSettled([
        fetch(`/api/reports/events?from=${dates.start}&to=${dates.end}&${eventQuery}`),
        fetch(`/api/reports/summary?from=${dates.start}&to=${dates.end}&${eventQuery}&daily=true`, {
          headers: { Accept: 'application/json' },
        }),
      ]);

      const rawEvents = eventRes.status === 'fulfilled' ? await eventRes.value.json() : [];
      const rawSummary = tripRes.status === 'fulfilled' ? await tripRes.value.json() : [];

      const payload = {
        model: 'gpt-4.1-mini',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Sen bir araç ve motosiklet filo takip uzmanısın. Türkçe yanıt ver. Ham veriler GMT+0 'a göredir. Sen yanıt üretirken türkiye zaman dilimine (GMT+3) göre yanıt ver.
trips içindeki her kayıtta category alanı vardır, bu araç tipini gösterir (örneğin "car" veya "motorcycle")
Events listesinde eğer Alarm varsa attribute alarnlarındaki;
-'powerCut' olan olay varsa Cihaz Akü Bağlantısı Sökülmüştür, Olası müdahale veya yetkisiz kullanım olabilir(Kritik).
-'lowPower' olayları aracın Akü sağlığı ile ilgili olabilir(uyarı).
-'vibration' olayları motosiklet gibi araçlarda gündüz saatlerinde  olağan karşılanabilir.
Titreşim alarmları genellikle aracın park halindeyken sarsıntı tespit ettiği durumları gösterir. Bu durum sabit bir nesneye çarpma, rüzgar etkisi veya başka bir dış faktörden kaynaklanıyor olabilir.
Birden fazla araç varsa, mümkünse her araç için en az 1 insight üret.
Summary Türkçe ve kısa olsun. olumlama yap genel olarak
Veriler:
Trips: dist(km), avg(km/h), max(km/h bu hız limiti değil), tripTime(DAKİKA), startTime, endTime
Events: type, time, attr (alarm veya status bilgisi), overspeed ise speed ve limit bilgisi
Mesafe, Avg, yolculukta ulaşılan max hız, yolculuk süresi ve araç tipine göre anlaşılır verimlilik yorumları yapabilirsin.
Her insight'a 'deviceId' ekle.
SADECE JSON: {"insights":[{"deviceId":"89","title":"BAŞLIK","value":"DEĞER","desc":"AÇIKLAMA","color":"success|warning|error"}],"summary":"Genel özet"}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              events: minimizeEventsForAI(rawEvents),
              trips: minimizeSummaryForAI(rawSummary, devices),
            }),
          },
        ],
        response_format: { type: 'json_object' },
      };

      const aiRes = await fetch(AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const aiData = await aiRes.json();
      const content = aiData.choices[0].message.content;
      const result = JSON.parse(content.match(/\{[\s\S]*\}/)[0]);

      const mappedInsights = result.insights.map(insight => {
        const device = devices.find(d => String(d.id) === String(insight.deviceId || insight.deviceIds));
        return {
          ...insight,
          title: device
            ? `${device.name}: ${insight.title}`
            : `Cihaz ${insight.deviceId}: ${insight.title}`,
        };
      });

      localStorage.setItem('aiAnalysisCache', JSON.stringify(mappedInsights));
      localStorage.setItem('aiAnalysisCacheTime', String(Date.now()));
      localStorage.setItem('aiAnalysisSummary', result.summary || '');
      localStorage.setItem('rawEventsCache', JSON.stringify(rawEvents)); // ← ekle
      localStorage.setItem('rawSummaryCache', JSON.stringify(rawSummary)); // ← ekle

      setSummary(result.summary || 'Analiz tamamlandı.');
      setInsightCount(mappedInsights.length);
      setErrorCount(mappedInsights.filter(i => i.color === 'error').length);
      setStatus(STATUS.done);
    } catch (e) {
      console.error('Arka plan analiz hatası:', e);
      setStatus(STATUS.error);
    }
  };

  const isDone = status === STATUS.done;
  const isLoading = status === STATUS.loading;
  const isError = status === STATUS.error;

  return (
    <Box
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 4,
        border: '1px solid',
        borderColor: isDone && errorCount > 0
          ? alpha(theme.palette.error.main, 0.25)
          : alpha(theme.palette.primary.main, 0.2),
        background: isDone && errorCount > 0
          ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.03)}, ${alpha(theme.palette.error.main, 0.08)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.primary.main, 0.1)})`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Progress bar while loading */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            borderRadius: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
          }}
        />
      )}

      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* Icon */}
        <Box
          sx={{
            bgcolor: isDone && errorCount > 0 ? 'error.main' : 'primary.main',
            p: 1.25,
            borderRadius: 2.5,
            display: 'flex',
            flexShrink: 0,
            mt: 0.25,
            boxShadow: `0 4px 12px ${alpha(
              isDone && errorCount > 0 ? theme.palette.error.main : theme.palette.primary.main,
              0.3
            )}`,
            animation: isLoading ? 'aiPulse 2s ease-in-out infinite' : 'none',
            '@keyframes aiPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.6 },
            },
          }}
        >
          <AutoAwesomeIcon sx={{ color: 'white', fontSize: 18 }} />
        </Box>

        {/* Text content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.25}>
            <Typography variant="subtitle2" fontWeight={700} color="primary.main" noWrap>
              TakipOn AI Analist
            </Typography>
            <Chip
              label="Beta"
              size="small"
              sx={{
                height: 16,
                fontSize: 10,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                fontWeight: 600,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Stack>

          {/* Status line */}
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
            {isDone && errorCount === 0 && (
              <CheckCircleOutlineIcon sx={{ fontSize: 13, color: 'success.main' }} />
            )}
            {isDone && errorCount > 0 && (
              <ErrorOutlineIcon sx={{ fontSize: 13, color: 'error.main' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {isLoading && 'Filo verileri analiz ediliyor...'}
              {isError && 'Analiz için veri bulunamadı.'}
              {isDone && `${insightCount} içgörü · ${Math.floor((Date.now() - Number(cacheTime)) / (1000 * 60 * 60 * 24)) > 0
                ? `${Math.floor((Date.now() - Number(cacheTime)) / (1000 * 60 * 60 * 24))} gün önce analiz edildi`
                : `${Math.floor((Date.now() - Number(cacheTime)) / (1000 * 60 * 60))} saat önce analiz edildi`
                }${errorCount > 0 ? ` · ${errorCount} kritik uyarı` : ' · Filo durumu normal'}`}              {status === STATUS.idle && 'Analiz için araç seçin.'}
            </Typography>
          </Stack>

          {/* Summary */}
          {isDone && summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.25,
                fontSize: 12,
                lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {summary}
            </Typography>
          )}

          {isLoading && (
            <Typography variant="body2" color="text.disabled" sx={{ mb: 1.25, fontSize: 12, fontStyle: 'italic' }}>
              Tamamlandığında hazır rapor görüntülenecek...
            </Typography>
          )}

          {/* CTA Button */}
          <Button
            variant={isDone ? 'contained' : 'outlined'}
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/reports/ai-details')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
              py: 0.5,
              px: 1.5,
              ...(isDone && errorCount > 0 && {
                bgcolor: 'error.main',
                '&:hover': { bgcolor: 'error.dark' },
              }),
            }}
          >
            {isLoading ? 'Sayfaya Git' : isDone ? 'Detaylı Raporu Gör' : 'Analiz Başlat'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ReportsMenuNewAICard;