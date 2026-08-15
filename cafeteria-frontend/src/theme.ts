import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
  },
});

export default theme;
