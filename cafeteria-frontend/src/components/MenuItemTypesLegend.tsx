import * as React from "react";
import { Box, Typography } from "@mui/material";
import { blue, green, grey, orange, purple } from "@mui/material/colors";

const MenuItemTypesLegend: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: green[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Entree</Typography>
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: purple[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Side</Typography>
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: orange[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Dessert</Typography>
      <Box
        sx={{
          width: "16px",
          height: "16px",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: grey[300],
          backgroundColor: blue[100],
          borderRadius: "50%",
        }}
      ></Box>
      <Typography variant="caption">Drink</Typography>
    </Box>
  );
};

export default MenuItemTypesLegend;
