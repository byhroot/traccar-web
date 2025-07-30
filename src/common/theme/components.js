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


  MuiMenuItem: {
    styleOverrides: {
      root: {
        '&.Mui-selected': {
          backgroundColor: "#53a3a6", // Seçili öğenin arka plan rengi
          '&:hover': {
            backgroundColor: "#7d7c7c", // Hover sırasında farklı bir renk
          },
        },
      },
    },
  },
};
