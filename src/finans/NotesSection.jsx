/**
 * NotesSection — paylaşılan not bileşenleri
 *
 * parseNotes(raw)         — notes string'ini array'e çevirir
 * serializeNotes(arr)     — array'i JSON string'e çevirir
 * NotesCard               — kompakt not listesi + ekleme butonu
 * NoteDialog              — not ekleme / düzenleme dialog'u
 *
 * NOT FORMATI:
 * [{ id, type: 'customer'|'admin'|'servis', text, by, byId, at, showServis? }]
 *
 * Görünürlük:
 *   customer → müşteri + admin görür. showServis:true ise servis de görür.
 *   admin    → sadece admin. showServis:true ise servis de görür.
 *   servis   → servis + admin görür. Müşteri görmez.
 */

import React, { useState } from 'react';
import {
  Box, Typography, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Collapse,
  FormControlLabel, Switch, Avatar,
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { alpha } from '@mui/material/styles';
import { formatTime } from '../common/util/formatter';

// ── Yardımcılar ──────────────────────────────────────────────────────────────
export const parseNotes = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // Eski düz string → customer notu olarak sar
    return [{ id: 1, type: 'customer', text: String(parsed), by: '?', byId: 0, at: null, showServis: false }];
  } catch {
    if (typeof raw === 'string' && raw.trim()) {
      return [{ id: 1, type: 'customer', text: raw.trim(), by: '?', byId: 0, at: null, showServis: false }];
    }
    return [];
  }
};

export const serializeNotes = (arr) => JSON.stringify(arr);

const typeConfig = {
  customer: { label: 'Müşteri', color: '#1976d2', bgColor: alpha('#1976d2', 0.07) },
  admin: { label: 'Müşteri Hizmetleri', color: '#7b1fa2', bgColor: alpha('#7b1fa2', 0.07) },
  servis: { label: 'Servis', color: '#2e7d32', bgColor: alpha('#2e7d32', 0.07) },
};

// ── NoteDialog ────────────────────────────────────────────────────────────────
export const NoteDialog = ({ open, onClose, onSave, note, isAdmin, currentUser, forcedType }) => {
  const [text, setText] = useState(note?.text || '');
  const [type, setType] = useState(note?.type || forcedType || 'admin');
  const [showServis, setShowServis] = useState(note?.showServis ?? false);
  const [showCustomer, setShowCustomer] = useState(note?.showCustomer ?? false);

  React.useEffect(() => {
    if (open) {
      setText(note?.text || '');
      setType(note?.type || forcedType || (isAdmin ? 'admin' : 'servis'));
      setShowServis(note?.showServis ?? false);
      setShowCustomer(note?.showCustomer ?? false);
    }
  }, [open, note]);

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      id: note?.id || Date.now(),
      type,
      text: text.trim(),
      by: currentUser?.name || '?',
      byId: currentUser?.id || 0,
      at: note?.at || new Date().toISOString(),
      showServis: type === 'servis' ? true : showServis,
      showCustomer: type === 'admin' ? showCustomer : false,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1, fontSize: 15, fontWeight: 700 }}>
        {note ? 'Notu Düzenle' : 'Not Ekle'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
        {/* Not tipi — sadece admin seçebilir, servis için sabit */}
        {isAdmin && !forcedType && (
          <ToggleButtonGroup
            size="small" exclusive value={type}
            onChange={(_, v) => { if (v) setType(v); }}
            sx={{ width: '100%' }}
          >
            {Object.entries(typeConfig).map(([k, cfg]) => (
              <ToggleButton key={k} value={k} sx={{
                flex: 1, fontSize: 11, py: 0.5,
                '&.Mui-selected': { bgcolor: alpha(cfg.color, 0.12), color: cfg.color, fontWeight: 700 },
              }}>
                {cfg.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        <TextField
          autoFocus multiline rows={3} fullWidth size="small"
          label="Not" value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Not içeriğini yazın..."
        />

        {/* Görünürlük — sadece admin, servis tipi değilse */}
        {isAdmin && type !== 'servis' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={<Switch size="small" checked={showServis} onChange={(e) => setShowServis(e.target.checked)} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {showServis ? <VisibilityIcon sx={{ fontSize: 14, color: '#2e7d32' }} /> : <VisibilityOffIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                  <Typography variant="caption">{showServis ? 'Servis görebilir' : 'Servis göremez'}</Typography>
                </Box>
              }
              sx={{ m: 0 }}
            />
            {type === 'admin' && (
              <FormControlLabel
                control={<Switch size="small" checked={showCustomer} onChange={(e) => setShowCustomer(e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {showCustomer ? <VisibilityIcon sx={{ fontSize: 14, color: '#1976d2' }} /> : <VisibilityOffIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                    <Typography variant="caption">{showCustomer ? 'Müşteri görebilir' : 'Müşteri göremez'}</Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            )}
          </Box>
        )}

        {/* Görünürlük özeti */}
        <Box sx={{ px: 1, py: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {type === 'customer' && !showServis && '👁 Müşteri + Admin'}
            {type === 'customer' && showServis && '👁 Müşteri + Admin + Servis'}
            {type === 'admin' && !showServis && !showCustomer && '🔒 Sadece Admin'}
            {type === 'admin' && showServis && !showCustomer && '👁 Admin + Servis'}
            {type === 'admin' && !showServis && showCustomer && '👁 Admin + Müşteri'}
            {type === 'admin' && showServis && showCustomer && '👁 Admin + Servis + Müşteri'}
            {type === 'servis' && '👁 Servis + Admin'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button size="small" color="inherit" onClick={onClose}>İptal</Button>
        <Button size="small" variant="contained" onClick={handleSave} disabled={!text.trim()}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── NotesCard ─────────────────────────────────────────────────────────────────
/**
 * visibleTypes: hangi tiplerdeki notlar gösterilsin
 *   admin:   ['customer', 'admin', 'servis']
 *   servis:  ['servis'] + showServis:true olanlar
 *   customer:['customer'] + showServis:true olan customer notları (admin görünmez)
 */
export const NotesCard = ({
  notes,           // parseNotes() sonucu — array
  canAdd,          // not ekleyebilir mi
  isAdmin,         // admin mi
  currentUser,     // { id, name }
  viewerRole,      // 'admin' | 'servis' | 'customer'
  forcedType,      // sabit not tipi (servis için 'servis')
  onSave,          // (updatedNotes: array) => void
  onDelete,        // (id) => void — sadece admin
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState(null);

  // Görünür notları filtrele
  const visible = notes.filter((n) => {
    if (viewerRole === 'admin') return true;
    if (viewerRole === 'servis') return n.type === 'servis' || (n.showServis === true);
    // customer
    if (n.type === 'customer') return true;
    if (n.type === 'admin') return n.showCustomer === true; // admin notu müşteriye sadece showCustomer:true ise
    return false; // servis notu müşteriye kapalı
  });

  if (visible.length === 0 && !canAdd) return null;

  const handleSave = (noteData) => {
    let updated;
    if (editNote) {
      updated = notes.map((n) => n.id === noteData.id ? noteData : n);
    } else {
      updated = [...notes, noteData];
    }
    onSave(updated);
    setEditNote(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Bu not silinsin mi?')) return;
    onDelete(notes.filter((n) => n.id !== id));
  };

  const shownNotes = expanded ? visible : visible.slice(0, 2);
  const hasMore = visible.length > 2;

  return (
    <Box>
      {/* Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>
          Notlar
        </Typography>
        {visible.length > 0 && (
          <Chip size="small" label={visible.length} sx={{ height: 16, fontSize: 9, minWidth: 0 }} />
        )}
        <Box sx={{ flex: 1 }} />
        {canAdd && (
          <Tooltip title="Not Ekle">
            <IconButton size="small" onClick={() => { setEditNote(null); setDialogOpen(true); }}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              <AddCommentIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Not listesi */}
      {visible.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: 11 }}>
          Henüz not yok
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625 }}>
          {shownNotes.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.admin;
            return (
              <Box key={n.id} sx={{
                px: 1, py: 0.625, borderRadius: 1,
                bgcolor: cfg.bgColor,
                border: '1px solid', borderColor: alpha(cfg.color, 0.15),
                display: 'flex', gap: 0.75, alignItems: 'flex-start',
              }}>
                {/* Sol renk çubuğu */}
                <Box sx={{ width: 3, borderRadius: 4, bgcolor: cfg.color, flexShrink: 0, alignSelf: 'stretch', mt: 0.25 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {n.text}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.375, flexWrap: 'wrap' }}>
                    <Chip size="small" label={cfg.label}
                      sx={{ height: 14, fontSize: 9, bgcolor: alpha(cfg.color, 0.12), color: cfg.color, fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }} />
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                      {isAdmin ? n.by : ''}
                      {n.at ? ` · ${formatTime(n.at, 'datetime')}` : ''}
                    </Typography>
                    {/* Görünürlük ikonu — sadece admin */}
                    {isAdmin && n.type !== 'servis' && (
                      <Tooltip title={n.showServis ? 'Servis görebilir' : 'Servis göremez'}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {n.showServis
                            ? <VisibilityIcon sx={{ fontSize: 11, color: '#2e7d32' }} />
                            : <VisibilityOffIcon sx={{ fontSize: 11, color: 'text.disabled' }} />}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                {/* Düzenle/Sil — sadece admin veya kendi notu */}
                {(isAdmin || n.byId === currentUser?.id) && (
                  <Box sx={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                    <IconButton size="small" sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1 } }}
                      onClick={() => { setEditNote(n); setDialogOpen(true); }}>
                      <EditIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                    {isAdmin && (
                      <IconButton size="small" sx={{ p: 0.25, opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                        onClick={() => handleDelete(n.id)}>
                        <DeleteIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Daha fazla / az */}
          {hasMore && (
            <Box onClick={() => setExpanded((v) => !v)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', px: 0.5, opacity: 0.6, '&:hover': { opacity: 1 } }}>
              {expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              <Typography variant="caption" sx={{ fontSize: 10 }}>
                {expanded ? 'Daha az göster' : `+${visible.length - 2} not daha`}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <NoteDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditNote(null); }}
        onSave={handleSave}
        note={editNote}
        isAdmin={isAdmin}
        currentUser={currentUser}
        forcedType={forcedType}
      />
    </Box>
  );
};