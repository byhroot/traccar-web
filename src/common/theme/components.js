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
      }),
    },
  },
  
  // --------------------- ACCORDION ---------------------
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: 33,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        '&:before': { display: 'none' },
        padding: 0,
      },
    },
  },


  // --------------------- BUTTON ---------------------
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      },
    },
  },

  // --------------------- TEXTFIELD ---------------------
  MuiTextField: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
        },
      },
    },
  },

  // --------------------- DIALOG ---------------------
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        padding: '16px',
      },
    },
  },
  // ---------- MENU ITEM ----------

    MuiList: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.default, 0.05),
          borderRadius: 16,
          padding: 0,
        }),
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          paddingTop: 8,
          paddingBottom: 8,
        }),
      },
    },

  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        color: theme.palette.text.primary,
      }),
      secondary: ({ theme }) => ({
        color: alpha(theme.palette.text.primary, 0.7),
      }),
    },
  },
  
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 40,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
      }),
    },
  },
};