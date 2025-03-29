import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AddShoppingCart } from "@mui/icons-material";

const MealStatusLegend: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
      }}
    >
      <Typography variant="caption" fontWeight="bold">
        Taking Orders:
      </Typography>

      <AddShoppingCart fontSize="small" color="disabled" />
      <Typography variant="caption">No,</Typography>
      <AddShoppingCart fontSize="small" color="primary" />
      <Typography variant="caption">Yes,</Typography>
      <AddShoppingCart fontSize="small" color="warning" />
      <Typography variant="caption">Not Yet</Typography>
    </Box>
  );
};

export default MealStatusLegend;
