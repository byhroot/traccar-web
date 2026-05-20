import { useState, useCallback, useEffect } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Stepper, Step, StepLabel,
  Chip, IconButton, Tooltip, CircularProgress, Alert, Paper,
  Collapse, Fade, Zoom,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import LabelIcon from '@mui/icons-material/Label';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// ─── Yardımcı: en düşük id'li grubu bul ──────────────────────────────────────
const getDefaultParentGroupId = (groups) => {
  if (!groups || groups.length === 0) return 0;
  return groups.reduce((min, g) => (g.id < min ? g.id : min), groups[0].id);
};

// ─── Wizard Adım 1: Grup İsmi ─────────────────────────────────────────────────
const StepName = ({ name, onChange }) => (
  <Box sx={{ py: 1 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
      Yeni grubun adını girin. Grubun amacını açıkça belirten bir isim seçin.
    </Typography>
    <TextField
      autoFocus
      fullWidth
      label="Grup Adı"
      value={name}
      onChange={(e) => onChange(e.target.value)}
      placeholder="ör. İstanbul Araçları, Servis Filosu..."
      inputProps={{ maxLength: 128 }}
      sx={fieldSx}
      helperText={`${name.length} / 128`}
    />
  </Box>
);

// ─── Wizard Adım 2: Üst Grup Seçimi ──────────────────────────────────────────
const StepParentGroup = ({ groups, selectedGroupId, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
        Bu grubun bağlı olacağı üst grubu seçin. Varsayılan olarak Ana Grubunuz Seçilmiştir.
      </Typography>

      {/* Seçili grup göstergesi */}
      <Paper
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2, mb: 1.5,
          border: '1px solid (99,179,237,0.3)',
          borderRadius: 2.5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          transition: 'all 0.2s',
          '&:hover': { background: 'rgba(99,179,237,0.13)', borderColor: 'rgba(99,179,237,0.5)' },
        }}
      >
        <AccountTreeIcon sx={{ color: '#63b3ed', fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="#90cdf4" fontWeight={600}>
            Seçili Üst Grup
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {selectedGroup ? selectedGroup.name : '— Grup Yok —'}
          </Typography>
        </Box>
        <KeyboardArrowDownIcon
          sx={{
            color: '#71c4f8',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}

        />
      </Paper>

      {/* Grup listesi */}
      <Collapse in={expanded}>
        <Paper sx={{
          borderRadius: 2,
          overflow: 'hidden',
          maxHeight: 220,
          overflowY: 'auto',
        }}>
          {groups.map((g, idx) => (
            <Box key={g.id}>
              <Box
                onClick={() => { onChange(g.id); setExpanded(false); }}
                sx={{
                  px: 2, py: 1.25,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {},
                }}
              >
                <AccountTreeIcon sx={{ fontSize: 16, color: selectedGroupId === g.id ? '#63b3ed' : '#718096' }} />
                <Typography variant="body2" fontWeight={selectedGroupId === g.id ? 700 : 400}>
                  {g.name}
                </Typography>
                <Chip
                  size="small"
                  label={`ID: ${g.id}`}
                  sx={{
                    ml: 'auto', height: 18, fontSize: '0.65rem',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </Box>
              {idx < groups.length - 1 && (
                <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
              )}
            </Box>
          ))}
        </Paper>
      </Collapse>
    </Box>
  );
};

// ─── Wizard Adım 3: Özellikler (Attributes) ───────────────────────────────────
const StepAttributes = ({ attributes, onChange }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    const k = newKey.trim();
    const v = newValue.trim();
    if (!k || !v) return;
    onChange({ ...attributes, [k]: v });
    setNewKey('');
    setNewValue('');
  };

  const handleDelete = (key) => {
    const copy = { ...attributes };
    delete copy[key];
    onChange(copy);
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
        İsteğe bağlı olarak gruba özel notlar  ekleyebilirsiniz.
      </Typography>

      {/* Eklenmiş attributes */}
      {Object.keys(attributes).length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {Object.entries(attributes).map(([k, v]) => (
            <Chip
              key={k}
              label={`${k}: ${v}`}
              size="small"
              onDelete={() => handleDelete(k)}
              deleteIcon={<DeleteOutlineIcon style={{ fontSize: 14 }} />}
              sx={{
                bgcolor: 'rgba(159,122,234,0.12)',
                border: '1px solid rgba(159,122,234,0.3)',
                color: '#d6bcfa',
                '& .MuiChip-deleteIcon': { color: '#b794f4' },
                fontSize: '0.72rem',
              }}
            />
          ))}
        </Box>
      )}

      {/* Yeni attribute ekleme */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          label="Notlar"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          sx={{ ...fieldSx, flex: 1 }}
          placeholder="ör. konum, sürücü, servis vs."
        />
        <TextField
          size="small"
          label="Değer"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          sx={{ ...fieldSx, flex: 1 }}
          placeholder="ör. istanbul"
        />
        <Button
          variant="outlined"
          onClick={handleAdd}
          disabled={!newKey.trim() || !newValue.trim()}
          sx={{
            minWidth: 40, px: 1.5,
            borderRadius: 2,

          }}
        >
          <AddIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
};

// ─── Shared TextField sx ──────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99,179,237,0.25)' },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99,179,237,0.5)' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#63b3ed' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#63b3ed' },
};

// ─── Wizard Adımları Konfigürasyonu ───────────────────────────────────────────
const STEPS = [
  { label: 'Grup Adı', icon: <LabelIcon sx={{ fontSize: 16 }} /> },
  { label: 'Üst Grup', icon: <DriveFileMoveIcon sx={{ fontSize: 16 }} /> },
  { label: 'Özellikler', icon: <TuneIcon sx={{ fontSize: 16 }} /> },
];

// ─── Ana Komponent ────────────────────────────────────────────────────────────
const GroupsManagerFab = ({
  groups = [],
  onSuccess,
  editOpen = false,
  editGroupId = null,
  onEditClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = editOpen || internalOpen;
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [parentGroupId, setParentGroupId] = useState(() => getDefaultParentGroupId(groups));
  const [attributes, setAttributes] = useState({});
  useEffect(() => {
    if (editOpen && editGroupId) {
      const group = groups.find((g) => g.id === editGroupId);

      if (group) {
        setName(group.name || '');
        setParentGroupId(group.groupId || 0);
        setAttributes(group.attributes || {});
      }
    }
  }, [editOpen, editGroupId, groups]);
  const resetForm = useCallback(() => {
    setActiveStep(0);
    setName('');
    setParentGroupId(getDefaultParentGroupId(groups));
    setAttributes({});
    setError(null);
    setSaving(false);
    setDone(false);
  }, [groups]);

  const handleOpen = () => {
    resetForm();
    setInternalOpen(true);
  };

  const handleClose = () => {
    if (saving) return;

    setInternalOpen(false);
    onEditClose?.();
  };

  const canNext = () => {
    if (activeStep === 0) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((s) => s - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        groupId: parentGroupId,
        attributes,
      };
      const isEdit = !!editGroupId;

      const url = isEdit
        ? `/api/groups/${editGroupId}`
        : '/api/groups';

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEdit && { id: editGroupId }),
          name: name.trim(),
          groupId: parentGroupId,
          attributes,
        }),
      });
      if (!response.ok) throw new Error('Kayıt başarısız');
      setDone(true);
      setTimeout(() => {
        setInternalOpen(false);
        onEditClose?.();
        onSuccess?.();
      }, 1400);
    } catch {
      setError('Grup oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Yüzen FAB butonu */}
      <Zoom in>
        <Fab
          onClick={handleOpen}
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 88, // CollectionFab'ın hemen üstünde kalır (o bottom:16, bu 16+56+16)
            right: 16,
            boxShadow: '0 4px 20px rgba(128,90,213,0.45)',
            '&:hover': {
              background: 'linear-gradient(135deg, #9f7aea, #805ad5)',
              boxShadow: '0 6px 28px rgba(128,90,213,0.6)',
            },
            transition: 'all 0.25s',
          }}
        >
          <AddIcon />
        </Fab>
      </Zoom>

      {/* Wizard Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        TransitionProps={{ onExited: resetForm }}
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        {/* Başlık */}
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid rgba(128,90,213,0.15)',
          pb: 2, fontWeight: 700, fontSize: '1rem',
        }}>
          <AccountTreeIcon sx={{ color: '#b794f4' }} />
          Yeni Grup Oluştur
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 1 }}>

          {/* Başarı ekranı */}
          <Fade in={done}>
            <Box sx={{
              display: done ? 'flex' : 'none',
              flexDirection: 'column', alignItems: 'center',
              py: 4, gap: 2,
            }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#48bb78' }} />
              <Typography fontWeight={700} fontSize="1.05rem">
                Grup başarıyla oluşturuldu!
              </Typography>
              <Typography variant="body2" color="text.secondary">"{name}"</Typography>
            </Box>
          </Fade>

          {!done && (
            <>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {STEPS.map((step, idx) => (
                  <Step key={step.label}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          '&.Mui-active': { color: '#805ad5' },
                          '&.Mui-completed': { color: '#48bb78' },
                        }
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={activeStep === idx ? 700 : 400}
                        color={activeStep === idx ? '#b794f4' : 'text.secondary'}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Hata */}
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
              )}

              {/* Adım İçerikleri */}
              {activeStep === 0 && (
                <StepName name={name} onChange={setName} />
              )}
              {activeStep === 1 && (
                <StepParentGroup
                  groups={groups}
                  selectedGroupId={parentGroupId}
                  onChange={setParentGroupId}
                />
              )}
              {activeStep === 2 && (
                <StepAttributes attributes={attributes} onChange={setAttributes} />
              )}

              {/* Özet — son adımda */}
              {activeStep === 2 && (
                <Paper sx={{
                  mt: 2.5, p: 2,
                  borderRadius: 2,
                  background: 'rgba(0, 139, 130, 0.1)',
                }}>
                  <Typography variant="caption" color="#68d391" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    Özet
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                      <span style={{ color: '#a0aec0' }}>Ad: </span>
                      <strong>{name}</strong>
                    </Typography>
                    <Typography variant="body2">
                      <span style={{ color: '#a0aec0' }}>Üst Grup: </span>
                      <strong>
                        {groups.find((g) => g.id === parentGroupId)?.name ?? '—'}
                        {' '}
                        <span style={{ color: '#718096', fontSize: '0.75rem' }}>(ID: {parentGroupId})</span>
                      </strong>
                    </Typography>
                    <Typography variant="body2">
                      <span style={{ color: '#a0aec0' }}>Özellikler: </span>
                      {Object.keys(attributes).length === 0
                        ? <span style={{ color: '#718096', fontStyle: 'italic' }}>Yok</span>
                        : <strong>{Object.keys(attributes).length} adet</strong>}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </>
          )}
        </DialogContent>

        {!done && (
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
            <Button
              onClick={handleClose}
              disabled={saving}
              variant="text"
              sx={{ color: '#718096', mr: 'auto' }}
            >
              İptal
            </Button>

            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                disabled={saving}
                startIcon={<ArrowBackIcon />}
                variant="outlined"
                sx={{
                  color: '#90cdf4',
                  borderColor: 'rgba(99,179,237,0.3)',
                  borderRadius: 2,
                  '&:hover': { borderColor: '#63b3ed', bgcolor: 'rgba(99,179,237,0.08)' },
                }}
              >
                Geri
              </Button>
            )}

            {activeStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canNext()}
                endIcon={<ArrowForwardIcon />}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #805ad5, #6b46c1)',
                  borderRadius: 2, fontWeight: 600,
                  '&:hover': { background: 'linear-gradient(135deg, #9f7aea, #805ad5)' },
                  '&:disabled': { opacity: 0.4 },
                }}
              >
                İleri
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                variant="contained"
                startIcon={saving
                  ? <CircularProgress size={16} color="inherit" />
                  : <CheckCircleOutlineIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #38a169, #276749)',
                  borderRadius: 2, fontWeight: 600,
                  '&:hover': { background: 'linear-gradient(135deg, #48bb78, #38a169)' },
                  '&:disabled': { opacity: 0.4 },
                }}
              >
                {saving ? 'Oluşturuluyor…' : 'Oluştur'}
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default GroupsManagerFab;