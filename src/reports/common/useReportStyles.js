import { makeStyles } from 'tss-react/mui';
import { alpha } from '@mui/material/styles';

export default makeStyles()((theme) => ({
  // ─── Layout ────────────────────────────────────────────────────────
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  containerMap: {
    flexBasis: '40%',
    flexShrink: 0,
  },

  // containerMain: tablo stillerinin tamamı buradan cascade eder.
  // overflow:auto → mobil yatay scroll çalışır, sayfalara dokunulmaz.
  containerMain: {
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',

    // ── Tablo genel ──────────────────────────────────────────────────
    '& .MuiTable-root': {
      minWidth: 700,
      borderCollapse: 'separate',
      borderSpacing: 0,
    },

    // ── Head ─────────────────────────────────────────────────────────
    '& .MuiTableHead-root .MuiTableCell-root': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.white, 0.04)
          : alpha(theme.palette.common.black, 0.028),
      color: theme.palette.text.secondary,
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '10px 14px',
      whiteSpace: 'nowrap',
      borderBottom: `1px solid ${alpha(
        theme.palette.divider,
        theme.palette.mode === 'dark' ? 0.15 : 0.1,
      )}`,
      '@media print': {
        backgroundColor: 'transparent',
        color: '#000',
        fontSize: '0.65rem',
        letterSpacing: 0,
        textTransform: 'none',
        borderBottom: '1px solid #ccc',
      },
    },

    // ── Body rows ─────────────────────────────────────────────────────
    '& .MuiTableBody-root .MuiTableRow-root': {
      transition: 'background 0.15s',

      '& .MuiTableCell-root': {
        padding: '11px 14px',
        fontSize: '0.8125rem',
        borderBottom: `1px solid ${alpha(
          theme.palette.divider,
          theme.palette.mode === 'dark' ? 0.08 : 0.07,
        )}`,
        '@media print': {
          padding: '6px 10px',
          fontSize: '0.75rem',
          color: '#000',
          borderBottom: '1px solid #eee',
        },
      },

      '&:last-child .MuiTableCell-root': {
        borderBottom: 'none',
      },

      '&:hover .MuiTableCell-root': {
        backgroundColor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.04)
            : alpha(theme.palette.common.black, 0.022),
        '@media print': { backgroundColor: 'transparent' },
      },
    },

    // ── Print: scroll kaldır ──────────────────────────────────────────
    '@media print': {
      overflow: 'visible',
    },
  },

  header: {
    position: 'sticky',
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  // ─── Filter ────────────────────────────────────────────────────────
  filter: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    padding: theme.spacing(3, 2, 2),
    '@media print': {
      display: 'none !important',
    },
  },
  filterItem: {
    minWidth: 0,
    flex: `1 1 ${theme.dimensions.filterFormWidth}`,
  },
  filterButtons: {
    display: 'flex',
    gap: theme.spacing(1),
    flex: `1 1 ${theme.dimensions.filterFormWidth}`,
  },
  filterButton: {
    flexGrow: 1,
  },

  // ─── Chart ─────────────────────────────────────────────────────────
  chart: {
    flexGrow: 1,
    overflow: 'hidden',
  },

  // ─── Action column ─────────────────────────────────────────────────
  columnAction: {
    width: '1%',
    paddingLeft: theme.spacing(1),
    '@media print': {
      display: 'none',
    },
    // Konum butonu modern görünümü — sayfa kodu değişmeden
    '& .MuiIconButton-root': {
      width: 28,
      height: 28,
      borderRadius: 8,
      border: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
      color: theme.palette.text.secondary,
      transition: 'all 0.15s',
      '&:hover': {
        backgroundColor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.06)
            : alpha(theme.palette.common.black, 0.04),
        borderColor: alpha(theme.palette.divider, 0.45),
      },
    },
  },
  columnActionContainer: {
    display: 'flex',
  },
  actionCellPadding: {
    '&.MuiTableCell-body': {
      paddingTop: 0,
      paddingBottom: 0,
    },
    '@media print': {
      display: 'none',
    },
  },

  // ─── tableBox — isteğe bağlı wrapper ───────────────────────────────
  //
  // Border + border-radius + yatay scroll üçlüsü için tablonun bir
  // wrapper element'e ihtiyacı var. Sayfalara minimum dokunuşla
  // aktifleştirmek için:
  //
  //   <Box className={classes.tableBox}>
  //     <Table> ... </Table>
  //   </Box>
  //
  // Bu tek satır değişikliği yapmak istemiyorsanız containerMain'deki
  // overflow:auto yatay scroll'u zaten sağlar; sadece dış border/radius
  // olmaz.
  //
  tableBox: {
    border: `1px solid ${alpha(
      theme.palette.divider,
      theme.palette.mode === 'dark' ? 0.12 : 0.1,
    )}`,
    borderRadius: 12,
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    '& .MuiTable-root': {
      minWidth: 700,
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    // tableBox kullanıldığında containerMain'deki override'lar da geçerli,
    // ayrıca head/row stilleri tekrar yazmaya gerek yok.
    '@media print': {
      border: 'none',
      borderRadius: 0,
      overflowX: 'visible',
    },
  },
}));