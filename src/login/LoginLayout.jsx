import { useMemo, useState } from 'react';
import { useMediaQuery, Typography } from '@mui/material';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { keyframes } from '@emotion/react';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TimelineIcon from '@mui/icons-material/Timeline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LogoImage from './LogoImage';
import { useTranslation } from '../common/components/LocalizationProvider';

// Modu sabitlemek için: 'light' veya 'dark'. null ise uygulamanın temasını (açık/koyu) izler.
const FORCE_MODE = null;

const FONT = '"Space Grotesk", "Inter", "Roboto", "Helvetica", "Arial", sans-serif';

// Rota: arka plandaki dekoratif çizgi
const ROUTE = 'M-40 760C220 700 300 520 520 560S820 760 980 520S1240 260 1500 180';

const TOKENS = {
  dark: {
    mode: 'dark',
    bg: '#05070f',
    paper: '#0b1020',
    text: '#e8ecf8',
    textSecondary: 'rgba(232, 236, 248, 0.64)',
    accent: '#22d3ee',
    accent2: '#60a5fa',
    violet: '#8b5cf6',
    error: '#fb7185',
    online: '#34d399',
    fieldBg: 'rgba(255, 255, 255, 0.04)',
    fieldBorder: 'rgba(255, 255, 255, 0.12)',
    fieldHover: 'rgba(34, 211, 238, 0.45)',
    focusRing: '0 0 0 3px rgba(34, 211, 238, 0.16), 0 0 28px rgba(34, 211, 238, 0.14)',
    autofillBg: '#0f1730',
    buttonText: '#031018',
    buttonGradient: 'linear-gradient(90deg, #22d3ee 0%, #60a5fa 100%)',
    buttonShadow: '0 8px 28px rgba(34, 211, 238, 0.28)',
    buttonShadowHover: '0 10px 36px rgba(96, 165, 250, 0.4)',
    disabledBg: 'rgba(255, 255, 255, 0.06)',
    disabledText: 'rgba(255, 255, 255, 0.3)',
    outlinedBorder: 'rgba(255, 255, 255, 0.18)',
    outlinedHoverBg: 'rgba(34, 211, 238, 0.06)',
    dialogBorder: 'rgba(255, 255, 255, 0.08)',
    blobA: 'rgba(34, 211, 238, 0.24)',
    blobB: 'rgba(139, 92, 246, 0.3)',
    grid: 'rgba(255, 255, 255, 0.045)',
    radarLine: 'rgba(34, 211, 238, 0.14)',
    radarRing: 'rgba(34, 211, 238, 0.16)',
    radarBorder: 'rgba(34, 211, 238, 0.2)',
    radarSweep: 'rgba(34, 211, 238, 0.3)',
    cardBg: 'rgba(10, 15, 32, 0.62)',
    cardBgFallback: 'rgba(10, 15, 32, 0.94)',
    cardShadow: '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    cardBorder:
      'linear-gradient(140deg, rgba(34, 211, 238, 0.7) 0%, rgba(139, 92, 246, 0.25) 35%, rgba(255, 255, 255, 0.05) 60%, rgba(139, 92, 246, 0.45) 100%)',
    headline: 'linear-gradient(90deg, #ffffff 0%, #a5f3fc 55%, #c4b5fd 100%)',
    chipBorder: 'rgba(255, 255, 255, 0.1)',
    chipBg: 'rgba(255, 255, 255, 0.04)',
    // Koyu zeminde logo beyaz siluet olur. Renkli logo isterseniz iki filtreyi de 'none' yapın.
    logoFilterDesktop: 'brightness(0) invert(1) drop-shadow(0 0 16px rgba(34, 211, 238, 0.35))',
    logoFilterMobile: 'brightness(0) invert(1) drop-shadow(0 0 16px rgba(34, 211, 238, 0.35))',
    logoColor: '#ffffff',
  },
  light: {
    mode: 'light',
    bg: '#eef3f9',
    paper: '#ffffff',
    text: '#0b1220',
    textSecondary: 'rgba(11, 18, 32, 0.62)',
    accent: '#0891b2',
    accent2: '#2563eb',
    violet: '#5eed3a',
    error: '#e11d48',
    online: '#10b981',
    fieldBg: 'rgba(15, 23, 42, 0.03)',
    fieldBorder: 'rgba(15, 23, 42, 0.16)',
    fieldHover: 'rgba(8, 145, 178, 0.55)',
    focusRing: '0 0 0 3px rgba(8, 145, 178, 0.16), 0 0 24px rgba(8, 145, 178, 0.12)',
    autofillBg: '#e8f1f8',
    buttonText: '#ffffff',
    buttonGradient: 'linear-gradient(90deg, #0891b2 0%, #2563eb 100%)',
    buttonShadow: '0 8px 24px rgba(8, 145, 178, 0.3)',
    buttonShadowHover: '0 10px 30px rgba(37, 99, 235, 0.35)',
    disabledBg: 'rgba(15, 23, 42, 0.06)',
    disabledText: 'rgba(15, 23, 42, 0.32)',
    outlinedBorder: 'rgba(15, 23, 42, 0.2)',
    outlinedHoverBg: 'rgba(8, 145, 178, 0.06)',
    dialogBorder: 'rgba(15, 23, 42, 0.08)',
    blobA: 'rgba(34, 211, 238, 0.28)',
    blobB: 'rgba(139, 92, 246, 0.2)',
    grid: 'rgba(15, 23, 42, 0.06)',
    radarLine: 'rgba(8, 145, 178, 0.16)',
    radarRing: 'rgba(8, 145, 178, 0.18)',
    radarBorder: 'rgba(8, 145, 178, 0.25)',
    radarSweep: 'rgba(8, 145, 178, 0.28)',
    cardBg: 'rgba(255, 255, 255, 0.72)',
    cardBgFallback: 'rgba(255, 255, 255, 0.96)',
    cardShadow: '0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    cardBorder:
      'linear-gradient(140deg, rgba(8, 145, 178, 0.55) 0%, rgba(124, 58, 237, 0.2) 35%, rgba(15, 23, 42, 0.06) 60%, rgba(124, 58, 237, 0.35) 100%)',
    headline: 'linear-gradient(90deg, #0b1220 0%, #0e7490 55%, #6d28d9 100%)',
    chipBorder: 'rgba(15, 23, 42, 0.1)',
    chipBg: 'rgba(255, 255, 255, 0.6)',
    // Masaüstünde sunucudan gelen "inverted" (beyaz) logo açık zeminde görünmez, o yüzden koyu siluet.
    // Mobilde normal logo olduğu gibi gösterilir. Renkli logo isterseniz desktop değerini 'none' yapın.
    logoFilterDesktop: 'none',
    logoFilterMobile: 'none',
    logoColor: null, // null ise uygulamanın primary rengi kullanılır
  },
};

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

// Radar taraması sadece cihaz yeterliyse ve kullanıcı hareketi kısmamışsa döner.
// Eski/zayıf cihaz, veri tasarrufu veya "hareketi azalt" ayarı varsa sabit kalır.
const canAnimate = () => {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    if (navigator.connection && navigator.connection.saveData) {
      return false;
    }
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return false;
    }
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Çeviri anahtarı yoksa fallback metni kullan
const translate = (t, key, fallback) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

// Layout kendi içinde bir MUI teması kurar; içindeki tüm bileşenler (input, dialog, menü...) bunu miras alır.
const buildTheme = (outer, tk) => createTheme({
  direction: outer.direction,
  dimensions: outer.dimensions,
  login: { ...tk, logoColor: tk.logoColor || outer.palette.primary.main },
  palette: {
    mode: tk.mode,
    primary: { main: tk.accent },
    secondary: { main: tk.accent2 },
    error: { main: tk.error },
    background: { default: tk.bg, paper: tk.paper },
    text: { primary: tk.text, secondary: tk.textSecondary },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: FONT,
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    button: { fontWeight: 600, letterSpacing: '0.08em' },
  },
  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { border: `1px solid ${tk.dialogBorder}`, borderRadius: 20 },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tk.fieldBg,
          transition: 'box-shadow 0.2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: tk.fieldBorder,
            transition: 'border-color 0.2s ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tk.fieldHover,
          },
          '&.Mui-focused': {
            boxShadow: tk.focusRing,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tk.accent,
            borderWidth: 1,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: tk.error,
          },
        },
        input: {
          padding: '12px 14px',   // varsayılan 16.5px 14px → alan ~56px'ten ~49px'e iner

          '&:-webkit-autofill': {
            WebkitBoxShadow: `0 0 0 100px ${tk.autofillBg} inset`,
            WebkitTextFillColor: tk.text,
            caretColor: tk.text,
            borderRadius: 'inherit',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14 },
        sizeMedium: { minHeight: 48 },
        sizeLarge: { minHeight: 52 },
        containedSecondary: {
          position: 'relative',
          overflow: 'hidden',
          color: tk.buttonText,
          background: tk.buttonGradient,
          boxShadow: tk.buttonShadow,
          transition: 'transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease',
          '&:hover': {
            background: tk.buttonGradient,
            filter: 'brightness(1.08)',
            boxShadow: tk.buttonShadowHover,
          },
          '&:active': { transform: 'translateY(1px)' },
          '&.Mui-disabled': {
            background: tk.disabledBg,
            color: tk.disabledText,
            boxShadow: 'none',
          },
          // üzerinden geçen ışık efekti
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-60%',
            width: '40%',
            height: '100%',
            background: 'linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            transform: 'skewX(-20deg)',
            transition: 'left 0.6s ease',
            pointerEvents: 'none',
          },
          '&:hover::after': { left: '130%' },
        },
        outlined: {
          borderColor: tk.outlinedBorder,
          '&:hover': {
            borderColor: tk.accent,
            backgroundColor: tk.outlinedHoverBg,
          },
        },
      },
    },
  },
});

const useStyles = makeStyles()((theme) => {
  const tk = theme.login;
  return {
    root: {
      position: 'relative',
      height: '100%',
      overflowY: 'auto',
      background: tk.bg,
      color: tk.text,
      fontFamily: FONT,
    },

    /* ---------- Arka plan katmanları ---------- */
    bg: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'none',
    },
    blob: {
      position: 'absolute',
      borderRadius: '50%',
    },
    blobA: {
      width: '70vmax',
      height: '70vmax',
      top: '-28vmax',
      left: '-22vmax',
      background: `radial-gradient(circle, ${tk.blobA} 0%, transparent 62%)`,
    },
    blobB: {
      width: '62vmax',
      height: '62vmax',
      bottom: '-26vmax',
      right: '-16vmax',
      background: `radial-gradient(circle, ${tk.blobB} 0%, transparent 62%)`,
    },
    grid: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `linear-gradient(${tk.grid} 1px, transparent 1px), linear-gradient(90deg, ${tk.grid} 1px, transparent 1px)`,
      backgroundSize: '56px 56px',
      WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 15%, transparent 75%)',
      maskImage: 'radial-gradient(ellipse at 50% 40%, #000 15%, transparent 75%)',
    },
    route: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0.7,
    },
    radar: {
      position: 'absolute',
      top: -120,
      right: -150,
      width: 440,
      height: 440,
      borderRadius: '50%',
      border: `1px solid ${tk.radarBorder}`,
      background: [
        `linear-gradient(to right, transparent 49.9%, ${tk.radarLine} 50%, transparent 50.1%)`,
        `linear-gradient(to bottom, transparent 49.9%, ${tk.radarLine} 50%, transparent 50.1%)`,
        `repeating-radial-gradient(circle, transparent 0, transparent 54px, ${tk.radarRing} 55px)`,
      ].join(', '),
      [theme.breakpoints.up('lg')]: {
        top: 'auto',
        right: 'auto',
        left: -170,
        bottom: -250,
        width: 780,
        height: 780,
      },
    },
    radarSweep: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, ${tk.radarSweep} 359deg, transparent 360deg)`,
    },
    radarSweepActive: {
      willChange: 'transform',
      animation: `${spin} 16s linear infinite`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    },
    blip: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: tk.accent,
      boxShadow: `0 0 12px ${tk.accent}`,
      '&::after': {
        content: '""',
        position: 'absolute',
        top: -1,
        left: -1,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: `1px solid ${tk.accent}`,
        opacity: 0.4,
        transform: 'scale(2.2)',
      },
    },
    blipA: { top: '27%', left: '63%' },
    blipB: { top: '64%', left: '31%' },
    blipC: { top: '71%', left: '74%' },

    /* ---------- İçerik ---------- */
    content: {
      position: 'relative',
      zIndex: 1,
      boxSizing: 'border-box',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(3, 2),
      paddingBottom: [theme.spacing(10), `calc(${theme.spacing(10)} + env(safe-area-inset-bottom, 0px))`],
      [theme.breakpoints.up('lg')]: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing(8),
        padding: theme.spacing(6, 10),
      },
    },
    hero: {
      display: 'none',
      [theme.breakpoints.up('lg')]: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        flex: '1 1 0%',
        minWidth: 0,
      },
    },
    logoBox: {
      display: 'flex',
      justifyContent: 'flex-start',
      '& img, & svg': {
        filter: tk.logoFilterDesktop,
      },
    },
    logoMobile: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: theme.spacing(3),
      '& img, & svg': {
        filter: tk.logoFilterMobile,
      },
      [theme.breakpoints.up('lg')]: {
        display: 'none',
      },
    },
    headline: {
      fontSize: 'clamp(2.25rem, 3.6vw, 3.5rem)',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      marginBottom: theme.spacing(2),
      maxWidth: theme.spacing(70),
      background: tk.headline,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    },
    sub: {
      color: tk.textSecondary,
      maxWidth: theme.spacing(60),
      marginBottom: theme.spacing(4),
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
    },
    chip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(1, 2),
      borderRadius: 999,
      border: `1px solid ${tk.chipBorder}`,
      background: tk.chipBg,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      color: tk.textSecondary,
      fontSize: theme.typography.pxToRem(13),
      fontWeight: 500,
      '& svg': { color: tk.accent, fontSize: 18 },
    },
    status: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.25),
      fontSize: theme.typography.pxToRem(11),
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: tk.textSecondary,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: tk.online,
      boxShadow: `0 0 12px ${tk.online}`,
      animation: `${blink} 2.4s ease-in-out infinite`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    },

    /* ---------- Cam kart ---------- */
    cardWrap: {
      width: '100%',
      maxWidth: theme.spacing(58),
      [theme.breakpoints.up('lg')]: {
        flex: '0 0 auto',
        width: theme.spacing(58),
        marginBottom: theme.spacing(10),
      },
    },
    card: {
      position: 'relative',
      borderRadius: theme.spacing(3),
      background: tk.cardBg,
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      boxShadow: tk.cardShadow,
      '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
        background: tk.cardBgFallback,
      },
      // degrade kenarlık
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: 'inherit',
        padding: 1,
        background: tk.cardBorder,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
      },
    },
    form: {
      padding: theme.spacing(4, 3.5),
      [theme.breakpoints.up('lg')]: {
        padding: theme.spacing(5),
      },
      '& input[type=number]': { MozAppearance: 'textfield' },
      '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
    },
  };
});

const RouteArt = ({ classes, tk }) => (
  <svg
    className={classes.route}
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="loginRouteGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={tk.accent} stopOpacity="0" />
        <stop offset="0.5" stopColor={tk.accent} />
        <stop offset="1" stopColor={tk.violet} />
      </linearGradient>
    </defs>
    <path d={ROUTE} fill="none" stroke="url(#loginRouteGradient)" strokeWidth="2" strokeOpacity="0.25" />
    <path
      d={ROUTE}
      fill="none"
      stroke="url(#loginRouteGradient)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="2 16"
    />
  </svg>
);

const LoginShell = ({ children }) => {
  const { classes, cx } = useStyles();
  const t = useTranslation();
  const theme = useTheme();
  const tk = theme.login;
  const desktop = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [animate] = useState(canAnimate);

  return (
    <main className={classes.root}>
      <div className={classes.bg} aria-hidden="true">
        <div className={cx(classes.blob, classes.blobA)} />
        <div className={cx(classes.blob, classes.blobB)} />
        <div className={classes.grid} />
        <RouteArt classes={classes} tk={tk} />
        <div className={classes.radar}>
          <div className={cx(classes.radarSweep, animate && classes.radarSweepActive)} />
          <span className={cx(classes.blip, classes.blipA)} />
          <span className={cx(classes.blip, classes.blipB)} />
          <span className={cx(classes.blip, classes.blipC)} />
        </div>
      </div>
      <div className={classes.content}>
        <section className={classes.hero}>
          <div className={classes.logoBox}>
            {desktop && <LogoImage color={tk.logoColor} />}
          </div>
          <div>
            <Typography variant="h2" component="p" className={classes.headline}>
              {translate(t, 'loginTagline', 'TakipOn\'da Kontrol Sende!')}
            </Typography>
            <Typography variant="h6" component="p" className={classes.sub} sx={{ fontWeight: 400 }}>
              {translate(
                t,
                'loginTaglineSub',
                'Canlı konum, geçmiş rotalar ve anlık bildirimler tek ekranda.',
              )}
            </Typography>
            <div className={classes.chips}>
              <span className={classes.chip}>
                <GpsFixedIcon />
                {translate(t, 'loginFeatureLive', 'Canlı takip')}
              </span>
              <span className={classes.chip}>
                <TimelineIcon />
                {translate(t, 'loginFeatureRoutes', 'Rota geçmişi')}
              </span>
              <span className={classes.chip}>
                <NotificationsActiveIcon />
                {translate(t, 'loginFeatureAlerts', 'Anlık alarm')}
              </span>
            </div>
          </div>
          <div className={classes.status}>
            <span className={classes.statusDot} />
            {translate(t, 'loginStatusOnline', 'Sistem çevrimiçi')}
          </div>
        </section>
        <div className={classes.cardWrap}>
          <div className={classes.logoMobile}>
            {!desktop && <LogoImage color={tk.logoColor} />}
          </div>
          <div className={classes.card}>
            <form className={classes.form}>{children}</form>
          </div>
        </div>
      </div>
    </main>
  );
};

const LoginLayout = ({ children }) => {
  const outer = useTheme();
  const mode = FORCE_MODE || (outer.palette.mode === 'dark' ? 'dark' : 'light');
  const loginTheme = useMemo(
    () => buildTheme(outer, TOKENS[mode]),
    [outer.direction, outer.dimensions, outer.palette.primary.main, mode],
  );

  return (
    <ThemeProvider theme={loginTheme}>
      <LoginShell>{children}</LoginShell>
    </ThemeProvider>
  );
};

export default LoginLayout;