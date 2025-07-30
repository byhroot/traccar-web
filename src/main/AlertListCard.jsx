import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Typography, ButtonGroup, Button } from '@mui/material';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useNavigate } from 'react-router-dom';
import { useAdministrator } from '../common/util/permissions';

const AlertListCard = ({ deviceDetails }) => {
  const [alertDevices, setAlertDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [smsWarning, setSmsWarning] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'package', 'insurance',

  const user = useSelector((state) => state.session.user);
  const attributes = user.attributes;
  const smsLimit = attributes.smsLimit;
  const disableSms = attributes.ui?.disableSms;
  const t = useTranslation();
  const admin = useAdministrator();

  useEffect(() => {
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);
    const lastYear = new Date();
    lastYear.setFullYear(now.getFullYear() - 1);

    const devices = deviceDetails.filter(device => {
      const expirationTime = device.expirationTime ? new Date(device.expirationTime) : null;
      const insuranceExpiration = device.attributes?.insuranceExpiration ? new Date(device.attributes.insuranceExpiration) : null;

      const isExpirationValid = expirationTime && expirationTime >= lastYear && expirationTime <= oneMonthLater;
      const isInsuranceExpiring = insuranceExpiration && insuranceExpiration >= lastYear && insuranceExpiration <= oneMonthLater;

      return isExpirationValid || isInsuranceExpiring ;
    });

    setAlertDevices(devices);
    setFilteredDevices(devices); // İlk açılışta tümü göster

    if (!disableSms && smsLimit < 500) {
      setSmsWarning(`SMS ${t("userUserLimit")}!: ${smsLimit}`);
    } else {
      setSmsWarning(null);
    }
  }, [deviceDetails, smsLimit, disableSms]);

  const handleFilterChange = (type) => {
    setFilterType(type);
    const now = new Date();

    const filtered = alertDevices.filter(device => {
      const expirationTime = device.expirationTime ? new Date(device.expirationTime) : null;
      const insuranceExpiration = device.attributes?.insuranceExpiration ? new Date(device.attributes.insuranceExpiration + "T00:00:00") : null;

      if (type === 'package') {
        return expirationTime && expirationTime <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      } else if (type === 'insurance') {
        return insuranceExpiration && insuranceExpiration <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      } else {
        // 'all'
        return true;
      }
    });

    setFilteredDevices(filtered);
  };
  const navigate = useNavigate();

  const handleClickInsurance = (deviceId) => {
    {admin ? navigate(`/settings/device/${deviceId}`) : navigate(`/settings/device/${deviceId}/commandnew`)};
  };
  return (
    <div>
      {smsWarning && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {smsWarning}
        </Typography>
      )}

      {/* Filtre ButtonGroup */}
      <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
        <Button
          variant={filterType === 'all' ? 'contained' : 'outlined'}
          onClick={() => handleFilterChange('all')}
        >
          {t("eventAll")}
        </Button>
        <Button
          variant={filterType === 'package' ? 'contained' : 'outlined'}
          onClick={() => handleFilterChange('package')}
        >
          {t("deviceTitle")}
        </Button>
        <Button
          variant={filterType === 'insurance' ? 'contained' : 'outlined'}
          onClick={() => handleFilterChange('insurance')}
        >
          {t("sigortaTarih")}
        </Button>
      </ButtonGroup>

      {/* Tablo */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("sharedDevice")}</TableCell>
              <TableCell>{t("userExpirationTime")}</TableCell>
              <TableCell>{t("sharedDescription")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>{t("uyariYokAlert")}</TableCell>
              </TableRow>
            ) : (
              filteredDevices.map(device => {
                const now = new Date();
                const expirationTime = device.expirationTime ? new Date(device.expirationTime) : null;
                const insuranceExpiration = device.attributes?.insuranceExpiration ? new Date(device.attributes.insuranceExpiration + "T00:00:00") : null;

                let alertMessage = '';
                let endDate = null;

                if (expirationTime && expirationTime < now) {
                  alertMessage = t("paketAlertgecmis");
                  endDate = expirationTime;
                } else if (expirationTime && expirationTime >= now && expirationTime <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())) {
                  alertMessage = t("paketAlert");
                  endDate = expirationTime;
                } else if (insuranceExpiration && insuranceExpiration < now) {
                  alertMessage = t("insuranceAlertGecmis");
                  endDate = insuranceExpiration;
                } else if (insuranceExpiration && insuranceExpiration <= new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())) {
                  alertMessage = t("insuranceAlert");
                  endDate = insuranceExpiration;
                } 
                return (
                  <TableRow onClick={() => handleClickInsurance(device.id)} key={device.id}>
                    <TableCell
                      style={{
                        fontFamily: 'Segoe UI, Roboto, sans-serif',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'color 0.3s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#007BFF')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                    >
                      {device.name}
                    </TableCell>

                    <TableCell>{endDate ? endDate.toLocaleDateString('tr-TR') : '-'}</TableCell>
                    <TableCell                       style={{
                        fontFamily: 'Segoe UI, Roboto, sans-serif',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'orange',
                        transition: 'color 0.3s ease',
                        cursor: 'pointer',
                      }}>{alertMessage}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AlertListCard;
