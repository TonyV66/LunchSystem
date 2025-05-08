import React from "react";

import { Box, Typography } from "@mui/material";
const PageNotFound: React.FC = () => {

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
      }}
    >
      <Box
        sx={{
          flexBasis: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            padding: 2,
            display: "flex",
            gap: 6,
            flexDirection: "column",
            width: "80%",
            maxWidth: "400px",
          }}
        >
          <img
            src="/logo.jpg"
            style={{ display: "block", width: "100%", height: "auto" }}
            alt="logo"
          />
          <Typography textAlign="center" fontWeight="bold" variant="h4">
            Page Not Found
          </Typography>

        </Box>
      </Box>
    </Box>
  );
};

export default PageNotFound;
