import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Badge,
  ListItemButton,
  ListItemText,
  Tooltip,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import DnsIcon from '@mui/icons-material/Dns';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAdministrator, useDeviceReadonly } from '../common/util/permissions';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles()((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 2),
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    gap: theme.spacing(2.5),
    width: theme.dimensions.drawerWidthTablet,
    '& .MuiFormControl-root': {
      width: '100%',
    }
  },
  modernButton: {
    backgroundColor: theme.palette.action.hover,
    borderRadius: '12px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
      transform: 'scale(1.05)',
    }
  }
}));

const MainToolbar = ({
  filteredDevices,
  devicesOpen,
  setDevicesOpen,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();
  const admin = useAdministrator();
  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);

  const toolbarRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);

  const deviceStatusCount = (status) => Object.values(devices).filter((d) => d.status === status).length;
  const deviceMotionesCount = (motionState) =>
    Object.values(devices)
      .filter((d) => d.status !== "offline" && d.motionState === motionState)
      .length;

  return (
    <Toolbar ref={toolbarRef} className={classes.toolbar}>
      <IconButton
        edge="start"
        onClick={() => setDevicesOpen(!devicesOpen)}
        className={classes.modernButton}
      >
        {devicesOpen ? <MapIcon color="primary" /> : <DnsIcon color="primary" />}
      </IconButton>

      <OutlinedInput
        ref={inputRef}
        placeholder={t('sharedSearchDevices')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => setDevicesAnchorEl(toolbarRef.current)}
        onBlur={() => setDevicesAnchorEl(null)}
        sx={{
          borderRadius: '20px', // Arama çubuğunu hap (pill) şeklinde yapar
          backgroundColor: 'background.paper',
          transition: 'all 0.3s',
          '& fieldset': {
            borderColor: 'divider',
          },
          '&:hover fieldset': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`, // Focuslandığında şık bir parlama efekti
          }
        }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              size="small"
              edge="end"
              onClick={() => setFilterAnchorEl(inputRef.current)}
              sx={{ mr: -0.5 }}
            >
              <Badge
                color="error" // Info yerine Error rengi uyarı/filtre aktifliğini daha iyi belli eder
                variant="dot"
                invisible={!filter.statuses.length && !filter.groups.length && !filter.motiones?.length}
              >
                <TuneIcon fontSize="small" color="action" />
              </Badge>
            </IconButton>
          </InputAdornment>
        }
        size="small"
        fullWidth
      />

      {/* ARAMA SONUÇLARI POPOVER */}
      <Popover
        open={!!devicesAnchorEl && !devicesOpen}
        anchorEl={devicesAnchorEl}
        onClose={() => setDevicesAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: Number(theme.spacing(2).slice(0, -2)),
        }}
        marginThreshold={0}
        slotProps={{
          paper: {
            style: {
              width: `calc(${toolbarRef.current?.clientWidth}px - ${theme.spacing(4)})`,
              borderRadius: '16px', // Yuvarlatılmış köşeler
              marginTop: '8px',
              boxShadow: theme.shadows[4]
            },
          },
        }}
        elevation={0}
        disableAutoFocus
        disableEnforceFocus
      >
        <Box sx={{ p: 1 }}>
          {filteredDevices.slice(0, 3).map((_, index) => (
            <DeviceRow key={filteredDevices[index].id} devices={filteredDevices} index={index} />
          ))}
          {filteredDevices.length > 3 && (
            <ListItemButton
              alignItems="center"
              onClick={() => setDevicesOpen(true)}
              sx={{ borderRadius: '12px', mt: 0.5, bgcolor: 'action.hover' }}
            >
              <ListItemText
                primary={t('notificationAlways')}
                primaryTypographyProps={{ fontWeight: 'bold', color: 'primary', textAlign: 'center' }}
              />
            </ListItemButton>
          )}
        </Box>
      </Popover>

      {/* FİLTRE POPOVER */}
      <Popover
        open={!!filterAnchorEl}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right', // Açılır menü sağa daha düzgün hizalansın
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              marginTop: '12px',
              boxShadow: theme.shadows[8] // Karta biraz daha derinlik
            }
          }
        }}
      >
        <div className={classes.filterPanel}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: -1 }}>
            <TuneIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">{t('sharedFilterMap')}</Typography>
          </Box>
          <Divider />

          <FormControl size="small">
            <InputLabel>{t('positionMotion')}</InputLabel>
            <Select
              multiple
              label={t('positionMotion')}
              value={Array.isArray(filter.motiones) ? filter.motiones : []}
              sx={{ borderRadius: '10px' }}
              onChange={(e) => {
                let value = e.target.value;
                if (!Array.isArray(value)) value = [value];
                setFilter({
                  ...filter,
                  motiones: value,
                });
              }}
              renderValue={(selected) =>
                selected
                  .map((val) =>
                    val === true
                      ? t('eventDeviceMoving')
                      : val === false
                        ? t('eventDeviceStopped')
                        : val
                  )
                  .join(', ')
              }
            >
              <MenuItem value={true}>
                {`${t('alarmMovement')} (${deviceMotionesCount(true)})`}
              </MenuItem>
              <MenuItem value={false}>
                {`${t('eventDeviceStopped')} (${deviceMotionesCount(false)})`}
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>{t('deviceStatus')}</InputLabel>
            <Select
              label={t('deviceStatus')}
              value={filter.statuses}
              onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
              multiple
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
              <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
              <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>{t('settingsGroups')}</InputLabel>
            <Select
              label={t('settingsGroups')}
              value={filter.groups}
              onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
              multiple
              sx={{ borderRadius: '10px' }}
            >
              {Object.values(groups)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>{t('sharedSortBy')}</InputLabel>
            <Select
              label={t('sharedSortBy')}
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">{'\u00a0'}</MenuItem>
              <MenuItem value="name">{t('sharedName')}</MenuItem>
              <MenuItem value="lastUpdate">{t('deviceLastUpdate')}</MenuItem>
            </Select>
          </FormControl>

          <FormGroup sx={{ mt: -1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filterMap}
                  onChange={(e) => setFilterMap(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight="medium">
                  {t('sharedFilterMap')}
                </Typography>
              }
            />
          </FormGroup>
        </div>
      </Popover>

      <IconButton
        edge="end"
        onClick={() => navigate('/settings/device')}
        disabled={deviceReadonly || !admin}
        className={classes.modernButton}
      >
        <Tooltip
          open={!deviceReadonly && Object.keys(devices).length === 0}
          title={t('deviceRegisterFirst')}
          arrow
        >
          {admin ? <AddIcon color="primary" /> : <span />}
        </Tooltip>
      </IconButton>
    </Toolbar>
  );
};

export default MainToolbar;