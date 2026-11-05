import { useEffect, useState } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  Button,
  TextField,
  Link,
  Snackbar,
  IconButton,
  Tooltip,
  Box,
  InputAdornment,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import ReactCountryFlag from 'react-country-flag';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import LoginLayout from './LoginLayout';
import usePersistedState from '../common/util/usePersistedState';
import {
  generateLoginToken,
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from '../common/components/NativeInterface';
import { useCatch } from '../reactHelper';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  options: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  select: {
    borderRadius: theme.spacing(1.5),
    fontSize: theme.typography.pxToRem(14),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  overline: {
    fontWeight: 600,
    letterSpacing: '0.24em',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  extraContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(1, 4),
    marginTop: theme.spacing(0.5),
  },
  link: {
    cursor: 'pointer',
    fontWeight: 600,
  },
}));

// Çeviri anahtarı yoksa fallback metni kullan
const translate = (t, key, fallback) => {
  const value = t(key);
  return value && value !== key ? value : fallback;
};

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const { languages, language, setLocalLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({
    code: values[0],
    country: values[1].country,
    name: values[1].name,
  }));

  const [failed, setFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerTooltip, setShowServerTooltip] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const languageEnabled = useSelector((state) => {
    const attributes = state.session.server.attributes;
    return !attributes.language && !attributes['ui.disableLoginLanguage'];
  });
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector(
    (state) => state.session.server.openIdEnabled && state.session.server.openIdForce,
  );
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector((state) => state.session.server.announcement);

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setFailed(false);
    setSubmitting(true);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem('postLogin') || '/';
        window.sessionStorage.removeItem('postLogin');
        navigate(target, { replace: true });
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetchOrThrow(`/api/session?token=${encodeURIComponent(token)}`);
    const user = await response.json();
    dispatch(sessionActions.updateUser(user));
    navigate('/');
  });

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLogin(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('hostname') !== window.location.hostname) {
      window.localStorage.setItem('hostname', window.location.hostname);
      setShowServerTooltip(true);
    }
  }, []);

  return (
    <LoginLayout>
      <div className={classes.container}>
        <div className={classes.options}>
          {nativeEnvironment && changeEnabled && (
            <IconButton color="primary" onClick={() => navigate('/change-server')}>
              <Tooltip
                title={`${t('settingsServer')}: ${window.location.hostname}`}
                open={showServerTooltip}
                arrow
              >
                <VpnLockIcon />
              </Tooltip>
            </IconButton>
          )}
          {!nativeEnvironment && (
            <IconButton color="primary" onClick={() => setShowQr(true)}>
              <QrCode2Icon />
            </IconButton>
          )}
          {languageEnabled && (
            <FormControl size="small">
              <Select
                className={classes.select}
                value={language}
                onChange={(e) => setLocalLanguage(e.target.value)}
                renderValue={(value) => {
                  const current = languageList.find((it) => it.code === value);
                  if (!current) {
                    return value;
                  }
                  return (
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                      <ReactCountryFlag
                        countryCode={current.country}
                        svg
                        style={{ fontSize: '1.25em' }}
                      />
                      <Box component="span" sx={{ ml: 1, display: { xs: 'none', sm: 'inline' } }}>
                        {current.name}
                      </Box>
                    </Box>
                  );
                }}
              >
                {languageList.map((it) => (
                  <MenuItem key={it.code} value={it.code}>
                    <Box component="span" sx={{ mr: 1 }}>
                      <ReactCountryFlag countryCode={it.country} svg />
                    </Box>
                    {it.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
        {!openIdForced && (
          <>
            <div className={classes.heading}>

              <Typography variant="h5" component="h1">
                {t('loginLogin')}
              </Typography>
            </div>
            <div className={classes.fields}>
              {failed && (
                <Alert severity="error" variant="outlined">
                  {translate(t, 'loginFailed', 'Invalid username or password')}
                </Alert>
              )}
              <TextField
                required
                error={failed}
                label={t('userEmail')}
                name="email"
                value={email}
                autoComplete="email"
                autoFocus={!email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{
                  htmlInput: {
                    autoCapitalize: 'none',
                    autoCorrect: 'off',
                    spellCheck: false,
                  },
                }}
              />
              <TextField
                required
                error={failed}
                label={t('userPassword')}
                name="password"
                value={password}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                autoFocus={!!email}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {codeEnabled && (
                <TextField
                  required
                  error={failed}
                  label={t('loginTotpCode')}
                  name="code"
                  value={code}
                  type="number"
                  onChange={(e) => setCode(e.target.value)}
                  slotProps={{
                    htmlInput: {
                      inputMode: 'numeric',
                      autoComplete: 'one-time-code',
                    },
                  }}
                />
              )}
            </div>
            <Button
              onClick={handlePasswordLogin}
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              disabled={submitting || !email || !password || (codeEnabled && !code)}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : t('loginLogin')}
            </Button>
          </>
        )}
        {openIdEnabled && (
          <Button
            onClick={() => handleOpenIdLogin()}
            variant={openIdForced ? 'contained' : 'outlined'}
            color={openIdForced ? 'secondary' : 'primary'}
            size="large"
          >
            {t('loginOpenId')}
          </Button>
        )}
        {!openIdForced && (
          <div className={classes.extraContainer}>
            {registrationEnabled && (
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/register')}
                className={classes.link}
                underline="hover"
                variant="body2"
              >
                {t('loginRegister')}
              </Link>
            )}
            {emailEnabled && (
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/reset-password')}
                className={classes.link}
                underline="hover"
                variant="body2"
              >
                {t('loginReset')}
              </Link>
            )}
          </div>
        )}
      </div>
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </LoginLayout>
  );
};

export default LoginPage;