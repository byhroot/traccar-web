/**
 * ReportEmptyState
 *
 * Path'e göre otomatik içerik üreten, animasyonlu boş durum komponenti.
 * Her rapor sayfasına import edip <ReportEmptyState /> yaz, gerisini halleder.
 *
 * Kullanım:
 *   import ReportEmptyState from '../components/ReportEmptyState';
 *   // Sayfa boşken:
 *   {!hasItems && !loading && <ReportEmptyState />}
 *
 * Yerleştirme: src/reports/components/ReportEmptyState.jsx
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import {
    RouteRounded,
    SpeedRounded,
    EventRounded,
    LocalGasStationRounded,
    PauseCircleRounded,
    WarningAmberRounded,
    BuildRounded,
    SummarizeRounded,
    TrackChangesRounded,
    LayersRounded,
    PlayArrowRounded,
    TuneRounded,
    AssessmentRounded,
    DirectionsCarRounded,
    MapRounded,
    BoltRounded,
    TimelapseRounded,
    SignalCellularAltRounded,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';

/* ─── Renk paleti (rotayla tutarlı) ─── */
const PALETTE = [
    '#4F8EF7', '#F7774F', '#4FC78E', '#C74FD4',
    '#D4A74F', '#4FC7C7', '#F74F8E', '#7B4FF7',
];

/* ══════════════════════════════════════════════════════
   Araç animasyon varyantları
══════════════════════════════════════════════════════ */

/** Birden fazla araç sırayla belirir, yol boyunca akış var */
function MultiVehicleAnimation({ count, accent }) {
    const colors = PALETTE.slice(0, count);
    return (
        <Box sx={{ position: 'relative', width: count * 44 + 16, height: 80, mx: 'auto' }}>
            {colors.map((color, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: `${i * 44}px`,
                        transform: 'translateY(-50%)',
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: color, opacity: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: `vPop 2s ease-out ${i * 0.25}s infinite`,
                        '@keyframes vPop': {
                            '0%': { opacity: 0, transform: 'translateY(-50%) scale(0.4)' },
                            '25%': { opacity: 1, transform: 'translateY(-50%) scale(1.05)' },
                            '60%': { opacity: 1, transform: 'translateY(-50%) scale(1)' },
                            '100%': { opacity: 0, transform: 'translateY(-50%) scale(0.4)' },
                        },
                        boxShadow: `0 0 0 0 ${color}`,
                    }}
                >
                    <DirectionsCarRounded sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
            ))}
            {/* Yol */}
            <Box sx={{
                position: 'absolute', bottom: 8, left: 0, right: 0, height: 2,
                bgcolor: 'divider', borderRadius: 1, overflow: 'hidden',
                '&::after': {
                    content: '""', display: 'block', height: '100%', width: '35%',
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    animation: 'road 1.8s linear infinite',
                },
                '@keyframes road': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(350%)' },
                },
            }} />
        </Box>
    );
}

/** Tek araç sağa doğru ilerler, iz bırakır */
function SingleMoveAnimation({ accent }) {
    return (
        <Box sx={{ position: 'relative', width: 200, height: 64, mx: 'auto' }}>
            {/* İz çizgisi */}
            <Box sx={{
                position: 'absolute', top: '50%', left: 16, right: 48,
                height: 3, borderRadius: 2,
                background: `linear-gradient(90deg, ${accent}00, ${accent}80)`,
                transform: 'translateY(-50%)',
                animation: 'trailGrow 2s ease-in-out infinite',
                '@keyframes trailGrow': {
                    '0%': { opacity: 0, scaleX: 0 },
                    '40%': { opacity: 1 },
                    '80%': { opacity: 1 },
                    '100%': { opacity: 0 },
                },
                transformOrigin: 'left',
            }} />
            {/* Araç */}
            <Box sx={{
                position: 'absolute', top: '50%', right: 24,
                transform: 'translateY(-50%)',
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'carMove 2s ease-in-out infinite',
                '@keyframes carMove': {
                    '0%': { right: '80%', opacity: 0 },
                    '15%': { opacity: 1 },
                    '80%': { right: '8%', opacity: 1 },
                    '100%': { right: '8%', opacity: 0 },
                },
                boxShadow: `0 4px 16px ${accent}60`,
            }}>
                <DirectionsCarRounded sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            {/* Yol */}
            <Box sx={{
                position: 'absolute', bottom: 4, left: 0, right: 0, height: 2,
                bgcolor: 'divider', borderRadius: 1,
            }} />
        </Box>
    );
}

/** Araçlar pulse atar, statik ama canlı */
function PulseAnimation({ count, accent }) {
    const colors = PALETTE.slice(0, Math.min(count, 3));
    return (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', height: 64 }}>
            {colors.map((color, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                    {/* Ripple */}
                    <Box sx={{
                        position: 'absolute', inset: -8, borderRadius: '50%',
                        border: `2px solid ${color}`,
                        animation: `ripple 2s ease-out ${i * 0.4}s infinite`,
                        '@keyframes ripple': {
                            '0%': { transform: 'scale(0.8)', opacity: 0.8 },
                            '100%': { transform: 'scale(1.8)', opacity: 0 },
                        },
                    }} />
                    <Box sx={{
                        width: 40, height: 40, borderRadius: '50%', bgcolor: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: `pulseBeat 2s ease-in-out ${i * 0.4}s infinite`,
                        '@keyframes pulseBeat': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.08)' },
                        },
                    }}>
                        <DirectionsCarRounded sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

/** Alarm efekti — kırmızı flash */
function AlarmAnimation({ accent }) {
    return (
        <Box sx={{ position: 'relative', width: 120, height: 64, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
                <Box key={i} sx={{
                    position: 'absolute',
                    width: 48 + i * 20, height: 48 + i * 20, borderRadius: '50%',
                    border: `2px solid ${accent}`,
                    animation: `alarmRing 1.5s ease-out ${i * 0.3}s infinite`,
                    '@keyframes alarmRing': {
                        '0%': { transform: 'scale(0.6)', opacity: 1 },
                        '100%': { transform: 'scale(1.4)', opacity: 0 },
                    },
                }} />
            ))}
            <Box sx={{
                width: 44, height: 44, borderRadius: '50%',
                bgcolor: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'alarmFlash 1.5s ease-in-out infinite',
                '@keyframes alarmFlash': {
                    '0%, 100%': { boxShadow: `0 0 0 0 ${accent}00` },
                    '50%': { boxShadow: `0 0 0 12px ${accent}30` },
                },
                zIndex: 1,
            }}>
                <WarningAmberRounded sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
        </Box>
    );
}

/** Dur animasyonu */
function StopAnimation({ accent }) {
    return (
        <Box sx={{ position: 'relative', width: 120, height: 64, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
                width: 44, height: 44, borderRadius: '50%', bgcolor: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'stopBlink 2s ease-in-out infinite',
                '@keyframes stopBlink': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.5, transform: 'scale(0.92)' },
                },
            }}>
                <PauseCircleRounded sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
                <Box key={deg} sx={{
                    position: 'absolute', width: 2, height: 8, bgcolor: `${accent}50`, borderRadius: 1,
                    transform: `rotate(${deg}deg) translateY(-28px)`,
                    transformOrigin: '50% 32px',
                }} />
            ))}
        </Box>
    );
}

/** Yakıt animasyonu */
function FuelAnimation({ accent }) {
    return (
        <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
                width: 52, height: 64, border: `2px solid ${accent}50`, borderRadius: 2,
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end',
            }}>
                <Box sx={{
                    width: '100%', bgcolor: accent, borderRadius: '0 0 6px 6px',
                    animation: 'fuelFill 2.5s ease-in-out infinite',
                    '@keyframes fuelFill': {
                        '0%': { height: '10%', opacity: 0.5 },
                        '60%': { height: '75%', opacity: 1 },
                        '80%': { height: '75%' },
                        '100%': { height: '10%', opacity: 0.5 },
                    },
                }} />
            </Box>
            <LocalGasStationRounded sx={{
                position: 'absolute', color: '#fff', fontSize: 22,
                animation: 'iconFloat 2.5s ease-in-out infinite',
                '@keyframes iconFloat': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-3px)' },
                },
            }} />
        </Box>
    );
}

/* ══════════════════════════════════════════════════════
   Ana bileşen
══════════════════════════════════════════════════════ */
function ReportPageAnime({ overrideMeta }) {
    const t = useTranslation();
    const location = useLocation();

    /* ══════════════════════════════════════════════════════
       Rapor metadata kataloğu — path pattern → içerik
       t() bağımlılığı nedeniyle bileşen içinde tanımlandı
    ══════════════════════════════════════════════════════ */
    const REPORT_META = useMemo(() => ({
        '/reports/combined': {
            title: t('reportEmptyCombinedTitle'),
            subtitle: t('reportEmptyCombinedSubtitle'),
            accent: PALETTE[0],
            icon: <LayersRounded />,
            features: [
                { icon: <RouteRounded />, label: t('reportFeatureRouteVisualization'), color: PALETTE[0] },
                { icon: <TuneRounded />, label: t('reportFeatureTripSegments'), color: PALETTE[1] },
                { icon: <AssessmentRounded />, label: t('reportFeatureSpeedDistanceAnalysis'), color: PALETTE[2] },
                { icon: <PlayArrowRounded />, label: t('reportFeatureReplayNavigation'), color: PALETTE[3] },
            ],
            vehicles: 4,
            motionVariant: 'multi',
        },

        '/reports/route': {
            title: t('reportEmptyRouteTitle'),
            subtitle: t('reportEmptyRouteSubtitle'),
            accent: PALETTE[0],
            icon: <RouteRounded />,
            features: [
                { icon: <MapRounded />, label: t('reportFeatureMapView'), color: PALETTE[0] },
                { icon: <SpeedRounded />, label: t('reportFeatureSpeedData'), color: PALETTE[2] },
                { icon: <TimelapseRounded />, label: t('reportFeatureTimeAnalysis'), color: PALETTE[4] },
                { icon: <PlayArrowRounded />, label: t('reportFeatureReplaySupport'), color: PALETTE[3] },
            ],
            vehicles: 1,
            motionVariant: 'single-move',
        },

        '/reports/trips': {
            title: t('reportEmptyTripsTitle'),
            subtitle: t('reportEmptyTripsSubtitle'),
            accent: PALETTE[1],
            icon: <TrackChangesRounded />,
            features: [
                { icon: <RouteRounded />, label: t('reportFeatureTripList'), color: PALETTE[1] },
                { icon: <TimelapseRounded />, label: t('reportFeatureDurationDistance'), color: PALETTE[0] },
                { icon: <SpeedRounded />, label: t('reportFeatureAvgSpeed'), color: PALETTE[2] },
                { icon: <PlayArrowRounded />, label: t('reportFeatureReplay'), color: PALETTE[3] },
            ],
            vehicles: 1,
            motionVariant: 'single-move',
        },

        '/replay': {
            title: t('reportFeatureReplay'),
            accent: PALETTE[1],
            icon: <TrackChangesRounded />,
            features: [
                { icon: <RouteRounded />, label: t('reportEvents'), color: PALETTE[1] },
                { icon: <AssessmentRounded />, label: t('sharedAlarms'), color: PALETTE[0] },
                { icon: <SpeedRounded />, label: t('reportFeatureSpeedData'), color: PALETTE[2] },
                { icon: <PlayArrowRounded />, label: t('reportFeatureReplay'), color: PALETTE[3] },
            ],
            vehicles: 1,
            motionVariant: 'single-move',
        },

        '/reports/summary': {
            title: t('reportEmptySummaryTitle'),
            subtitle: t('reportEmptySummarySubtitle'),
            accent: PALETTE[2],
            icon: <SummarizeRounded />,
            features: [
                { icon: <AssessmentRounded />, label: t('reportFeaturePeriodStats'), color: PALETTE[2] },
                { icon: <RouteRounded />, label: t('reportFeatureTotalDistance'), color: PALETTE[0] },
                { icon: <SpeedRounded />, label: t('reportFeatureSpeedAverages'), color: PALETTE[1] },
                { icon: <TimelapseRounded />, label: t('reportFeatureWorkingHours'), color: PALETTE[4] },
            ],
            vehicles: 3,
            motionVariant: 'pulse',
        },

        '/reports/events': {
            title: t('reportEmptyEventsTitle'),
            subtitle: t('reportEmptyEventsSubtitle'),
            accent: PALETTE[3],
            icon: <EventRounded />,
            features: [
                { icon: <WarningAmberRounded />, label: t('reportFeatureAlarmEvents'), color: PALETTE[1] },
                { icon: <BoltRounded />, label: t('reportFeatureIgnitionTracking'), color: PALETTE[3] },
                { icon: <TrackChangesRounded />, label: t('reportFeatureZoneTransitions'), color: PALETTE[0] },
                { icon: <SignalCellularAltRounded />, label: t('reportFeatureConnectionStatus'), color: PALETTE[2] },
            ],
            vehicles: 2,
            motionVariant: 'alarm',
        },

        '/reports/stops': {
            title: t('reportEmptyStopsTitle'),
            subtitle: t('reportEmptyStopsSubtitle'),
            accent: PALETTE[4],
            icon: <PauseCircleRounded />,
            features: [
                { icon: <PauseCircleRounded />, label: t('reportFeatureStopPoints'), color: PALETTE[4] },
                { icon: <TimelapseRounded />, label: t('reportFeatureStopDurations'), color: PALETTE[1] },
                { icon: <MapRounded />, label: t('reportFeatureMapLocations'), color: PALETTE[0] },
                { icon: <AssessmentRounded />, label: t('reportFeatureStatsSummary'), color: PALETTE[2] },
            ],
            vehicles: 1,
            motionVariant: 'stop',
        },

        '/reports/fuel': {
            title: t('reportEmptyFuelTitle'),
            subtitle: t('reportEmptyFuelSubtitle'),
            accent: '#F7774F',
            icon: <LocalGasStationRounded />,
            features: [
                { icon: <LocalGasStationRounded />, label: t('reportFeatureConsumptionAnalysis'), color: '#F7774F' },
                { icon: <AssessmentRounded />, label: t('reportFeatureRefuelHistory'), color: PALETTE[2] },
                { icon: <WarningAmberRounded />, label: t('reportFeatureAnomalyDetection'), color: PALETTE[1] },
                { icon: <RouteRounded />, label: t('reportFeatureKmConsumption'), color: PALETTE[0] },
            ],
            vehicles: 2,
            motionVariant: 'fuel',
        },

        '/reports/maintenance': {
            title: t('reportEmptyMaintenanceTitle'),
            subtitle: t('reportEmptyMaintenanceSubtitle'),
            accent: PALETTE[6],
            icon: <BuildRounded />,
            features: [
                { icon: <BuildRounded />, label: t('reportFeatureMaintenancePlan'), color: PALETTE[6] },
                { icon: <TimelapseRounded />, label: t('reportFeatureKmHourTracking'), color: PALETTE[0] },
                { icon: <WarningAmberRounded />, label: t('reportFeatureUpcomingWarnings'), color: PALETTE[1] },
                { icon: <AssessmentRounded />, label: t('reportFeatureMaintenanceHistory'), color: PALETTE[2] },
            ],
            vehicles: 1,
            motionVariant: 'pulse',
        },
    }), [t]);

    /* Fallback */
    const DEFAULT_META = useMemo(() => ({
        title: t('reportEmptyDefaultTitle'),
        subtitle: t('reportEmptyDefaultSubtitle'),
        accent: PALETTE[0],
        icon: <AssessmentRounded />,
        features: [
            { icon: <DirectionsCarRounded />, label: t('reportFeatureSelectVehicle'), color: PALETTE[0] },
            { icon: <TimelapseRounded />, label: t('reportFeatureEnterDateRange'), color: PALETTE[1] },
            { icon: <AssessmentRounded />, label: t('reportFeatureViewReport'), color: PALETTE[2] },
            { icon: <PlayArrowRounded />, label: t('reportFeatureAnalyze'), color: PALETTE[3] },
        ],
        vehicles: 2,
        motionVariant: 'pulse',
    }), [t]);

    const meta = useMemo(() => {
        if (overrideMeta) return { ...DEFAULT_META, ...overrideMeta };
        const match = Object.entries(REPORT_META).find(([pattern]) =>
            location.pathname.startsWith(pattern),
        );
        return match ? match[1] : DEFAULT_META;
    }, [location.pathname, overrideMeta, REPORT_META, DEFAULT_META]);

    /* Animasyon seçimi */
    const Animation = useMemo(() => {
        switch (meta.motionVariant) {
            case 'multi': return <MultiVehicleAnimation count={meta.vehicles} accent={meta.accent} />;
            case 'single-move': return <SingleMoveAnimation accent={meta.accent} />;
            case 'alarm': return <AlarmAnimation accent={meta.accent} />;
            case 'stop': return <StopAnimation accent={meta.accent} />;
            case 'fuel': return <FuelAnimation accent={meta.accent} />;
            case 'pulse':
            default: return <PulseAnimation count={meta.vehicles} accent={meta.accent} />;
        }
    }, [meta]);

    return (
        <Box
            sx={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 },
                gap: { xs: 2.5, md: 3 },
                textAlign: 'center',
                userSelect: 'none',
            }}
        >
            {/* Animasyon */}
            <Box sx={{ mb: 0.5 }}>{Animation}</Box>

            {/* Başlık & alt başlık */}
            <Box>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    gutterBottom
                    sx={{ color: 'text.primary', letterSpacing: '-0.3px' }}
                >
                    {meta.title}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 340, lineHeight: 1.6 }}
                >
                    {meta.subtitle}
                </Typography>
            </Box>

            {/* Özellik etiketleri */}
            <Box
                sx={{
                    display: 'flex', gap: 1, flexWrap: 'wrap',
                    justifyContent: 'center', maxWidth: 420,
                }}
            >
                {meta.features.map(({ icon, label, color }) => (
                    <Box
                        key={label}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.6,
                            px: 1.25, py: 0.6,
                            bgcolor: `${color}12`,
                            border: `1px solid ${color}38`,
                            borderRadius: 2,
                            color,
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${color}25`,
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', fontSize: 15 }}>{icon}</Box>
                        <Typography variant="caption" fontWeight={600} color="inherit" sx={{ fontSize: 11 }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default ReportPageAnime;