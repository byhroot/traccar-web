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
  })).slice(0, 50);

const minimizeTripsForAI = (trips = [], devices = []) =>
  trips.map(t => {
    const dev = devices.find(d => String(d.id) === String(t.deviceId));
    return {
      deviceId: t.deviceId,
      category: dev?.category || 'car',
      dist: Math.round(t.distance / 1000),
      avg: Math.round(t.averageSpeed * 1.852),
      max: Math.round(t.maxSpeed * 1.852),
      tripTime: Math.floor(t.duration / 60000),
      startTime: t.startTime,
      endTime: t.endTime,
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

  useEffect(() => {
    const cached = localStorage.getItem('aiAnalysisCache');
    const cacheTime = localStorage.getItem('aiAnalysisCacheTime');
    const ONE_HOUR = 1000 * 60 * 60;

    if (cached && cacheTime && Date.now() - Number(cacheTime) < ONE_HOUR) {
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
        fetch(`/api/reports/trips?from=${dates.start}&to=${dates.end}&${eventQuery}`, {
          headers: { Accept: 'application/json' },
        }),
      ]);

      const rawEvents = eventRes.status === 'fulfilled' ? await eventRes.value.json() : [];
      const rawTrips = tripRes.status === 'fulfilled' ? await tripRes.value.json() : [];

      const payload = {
        model: 'gpt-4.1-mini',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Sen bir araç ve motosiklet filo takip uzmanısın. Türkçe yanıt ver. GMT+0 → GMT+3 çevir.
trips içindeki her kayıtta category alanı vardır, hız eşiklerini buna göre belirle:

- motorcycle&scooter: max>120→uyarı, max>140→kritik
- truck/bus: max>100→uyarı, max>120→kritik  
- car/unknown: max>120→uyarı, max>140→kritik
Veriler:
Trips: dist(km), avg(km/h), max(km/h), tripTime(DAKİKA), startTime, endTime
Avg, yolculuk süresi, mesafe ve araç tipine göre verimlilik analizi yapabilirsin.
Her insight'a 'deviceId' ekle.
SADECE JSON: {"insights":[{"deviceId":"89","title":"BAŞLIK","value":"DEĞER","desc":"AÇIKLAMA","color":"success|warning|error"}],"summary":"Genel özet"}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              events: minimizeEventsForAI(rawEvents),
              trips: minimizeTripsForAI(rawTrips, devices),
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
      localStorage.setItem('rawTripsCache', JSON.stringify(rawTrips));   // ← ekle
      localStorage.setItem('rawEventsCache', JSON.stringify(rawEvents)); // ← ekle

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
              {isDone && `${insightCount} içgörü (bugün)${errorCount > 0 ? ` · ${errorCount} kritik uyarı` : ' · Filo durumu normal'}`}
              {status === STATUS.idle && 'Analiz için araç seçin.'}
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