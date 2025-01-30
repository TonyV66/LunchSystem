import * as React from "react";
import { Box, Typography } from "@mui/material";
import {
  Visibility,
  VisibilityOutlined,
  VisibilityTwoTone,
} from "@mui/icons-material";

const MealStatusLegend: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 1,
      }}
    >
      <VisibilityOutlined fontSize="small" color="primary" />
      <Typography variant="caption">In Cart</Typography>
      <VisibilityTwoTone fontSize="small" color="primary" />
      <Typography variant="caption">Ordered</Typography>
      <Visibility fontSize="small" color="primary" />
      <Typography variant="caption">Ordered & in cart</Typography>
    </Box>
  );
};

export default MealStatusLegend;
