import { alpha } from '@mui/material';

export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      sizeMedium: {
        height: '45px',
      },
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      enterDelay: 500,
      enterNextDelay: 500,
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        '@media print': {
          color: theme.palette.alwaysDark.main,
        },
      }),
    },
  },

  MuiCssBaseline: {
    styleOverrides: {
      '*': {
        scrollbarWidth: 'thin', // Firefox için ince scrollbar
        scrollbarColor: '#07b8b4 #999999', // (Kaydırma çubuğu, Arka plan)
      },
      '::-webkit-scrollbar': {
        width: '8px', // Scrollbar genişliği
        height: '8px',
      },
      '::-webkit-scrollbar-thumb': {
        backgroundColor: '#808080', // Kaydırma çubuğu rengi
        borderRadius: '10px',
      },
      '::-webkit-scrollbar-track': {
        backgroundColor: '#808080', // Scrollbar arka plan rengi
      },
    },
  },

  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 20,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1.5px solid rgba(255, 255, 255, 0.35)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        padding: 0,
        // Genişlik Ayarları:
        width: '100%', // Kartın her zaman parent (Grid item) genişliğinde olmasını sağlar
        maxWidth: 'none', // Varsa bir kısıtlamayı kaldırır
        boxSizing: 'border-box', // Padding'lerin genişliği bozmasını engeller

      }),
    },
  },

};
