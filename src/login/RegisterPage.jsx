import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button, TextField, Typography, Snackbar, IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  Box, Alert, Checkbox, FormControlLabel, Link
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch, useEffectAsync } from '../reactHelper';
import { sessionActions } from '../store';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.spacing(3),
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    textTransform: 'uppercase',
  },
}));

const RegisterPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const server = useSelector((state) => state.session.server);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [rawPhone, setRawPhone] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  // Yeni state'ler:
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const [checkedCheckbox, setChecked] = useState(false);

  const handleChangeCheckbox = (event) => {
    setChecked(event.target.checked);
  };


  const fullPhone = `+90 ${rawPhone}`;
  // Geri sayım başlat
  const startTimer = () => {
    if (verificationTimer > 0) return;
    setVerificationTimer(180); // 3 dakika
    const id = setInterval(() => {
      setVerificationTimer(prev => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };


  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const handlePhoneChange = (event) => {
    const input = event.target.value.replace(/\D/g, '').slice(0, 10);
    setRawPhone(input);
  };

  const handleVerifyClick = () => {
    setDialogOpen(true);
  };

  const [otpId, setOtpId] = useState(null);

  const handleSendCodeClick = async () => {
    if (isSendingCode) return;

    setIsSendingCode(true);

    try {
      const response = await fetch('/api/registerotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `0${rawPhone}`,
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!data.valid) {
        setAlertMessage(data.message || 'Kod gönderimi başarısız');
        setAlertSeverity('error');
        return;
      }

      setOtpId(data.id);
      setAlertMessage(data.message || 'Doğrulama kodu gönderildi');
      setAlertSeverity('success');
      startTimer();

    } catch (error) {
      setAlertMessage(t("commandSendSms") + " " + t("errorConnection") + ': ' + error.message);
      setAlertSeverity('error');
    } finally {
      setIsSendingCode(false);
    }
  };


  const handleCodeSubmit = async () => {
    if (!otpId || verificationCode.length !== 6) {
      setAlertMessage(t("commandSendSms") + "/ " + t("errorGeneral"));
      setAlertSeverity('warning');
      return;
    }

    try {
      const response = await fetch(`/api/registerotp/${otpId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsVerified(true);
        setAlertMessage(t("commandPhone") + " " + t("positionValid"));
        setAlertSeverity('success');
        setDialogOpen(false);
      } else {
        setAlertMessage(t("errorTitle") + " :" + data.message);
        setAlertSeverity('error');
      }
    } catch (error) {
      setAlertMessage(t("errorTitle") + " :" + error.message);
      setAlertSeverity('error');
    } finally {
      setIsVerifying(false);
    }
  };



  useEffectAsync(async () => {
    if (totpForce) {
      const response = await fetch('/api/users/totp', { method: 'POST' });
      if (response.ok) {
        setTotpKey(await response.text());
      } else {
        throw Error(await response.text());
      }
    }
  }, [totpForce, setTotpKey]);

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    const phoneFormatted = rawPhone ? `0${rawPhone}` : null;

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone: phoneFormatted, totpKey }),
    });
    if (response.ok) {
      setSnackbarOpen(true);
    } else {
      throw Error(await response.text());
    }
  });

  return (
    <LoginLayout>
      <div className={classes.container}>
        <div className={classes.header}>
          {!server.newServer && (
            <IconButton color="primary" onClick={() => navigate('/login')}>
              <BackIcon />
            </IconButton>
          )}
          <Typography className={classes.title} color="primary">
            {t('loginRegister')}
          </Typography>
        </div>
        <TextField
          required
          label={t('sharedName')}
          name="name"
          value={name}
          autoComplete="name"
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          required
          type="email"
          label={t('userEmail')}
          name="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          required
          label={t('userPassword')}
          name="password"
          value={password}
          type="password"
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />
        {totpForce && (
          <TextField
            required
            label={t('loginTotpKey')}
            name="totpKey"
            value={totpKey || ''}
            InputProps={{
              readOnly: true,
            }}
          />
        )}
        <TextField
          required
          label={t("sharedPhone")}
          name="phone"
          value={rawPhone}
          onChange={handlePhoneChange}
          InputProps={{
            startAdornment: <span style={{ marginRight: 8, color: '#888' }}>+90</span>,
            endAdornment: (
              <Button
                variant="outlined"
                size="small"
                onClick={handleVerifyClick}
                disabled={rawPhone.length !== 10 || isVerified || !rawPhone.startsWith('5')}
                style={{ marginLeft: 8 }}
              >
                {isVerified ? "✅" :
                  t("sharedAccept")}
              </Button>
            ),
          }}
          inputProps={{
            inputMode: 'numeric',
            pattern: '5[0-9]{9}', // 5 ile başlasın ve toplam 10 rakam olsun
            maxLength: 10,
            placeholder: '5xx xxx xx xx',
          }}
          fullWidth
        />

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{t("optBaslik")}</DialogTitle>
          <DialogContent>
            <Typography mb={2}>
              {fullPhone}  {t("optAciklama")}
            </Typography>

            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="contained"
                onClick={handleSendCodeClick}
                disabled={verificationTimer > 0 || isSendingCode}
              >
                {isSendingCode
                  ? 'Gönderiliyor...'
                  : verificationTimer > 0
                    ? `${t("commandSendSms")} (${Math.floor(verificationTimer / 60)}:${(verificationTimer % 60).toString().padStart(2, '0')})`
                    : t("commandSendSms")}
              </Button>

              <TextField
                label="Kod"
                value={verificationCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(val);
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 6,
                }}
                placeholder="6 haneli kod"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t("sharedCancel")}</Button>
            <Button
              variant="contained"
              disabled={verificationCode.length !== 6 || isVerifying}
              onClick={handleCodeSubmit}
            >
              {isVerifying ? 'Kontrol ediliyor...' : t("sharedAccept")}
            </Button>
          </DialogActions>
          {alertMessage && (
            <Box mb={2}>
              <Alert severity={alertSeverity} onClose={() => setAlertMessage('')}>
                {alertMessage}
              </Alert>
            </Box>
          )}
        </Dialog>
        <FormControlLabel
          control={
            <Checkbox
              checked={checkedCheckbox}
              onChange={handleChangeCheckbox}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
          label={
            <Typography sx={{ fontSize: 12 }}>
              {t("userTermsPrompt")}{" "}
              <Link
                href="https://www.takipon.com/uyeliksozlesmesi"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {t("userTerms")}
              </Link>{" "}
              {" & "}
              <Link
                href="https://www.takipon.com/gizlilikpolitikasi"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                {t("userPrivacy")}
              </Link>
            </Typography>

          }
        />

        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmit}
          type="submit"
          disabled={!name || !password || !checkedCheckbox ||
            rawPhone.length !== 10 || !isVerified || !(server.newServer || /(.+)@(.+)\.(.{2,})/.test(email))}
          fullWidth
        >
          {t('loginRegister')}
        </Button>
      </div>
      <Snackbar
        open={snackbarOpen}
        onClose={() => {
          dispatch(sessionActions.updateServer({ ...server, newServer: false }));
          navigate('/login');
        }}
        autoHideDuration={snackBarDurationShortMs}
        message={t('loginCreated')}
      />
    </LoginLayout>
  );
};

export default RegisterPage;
