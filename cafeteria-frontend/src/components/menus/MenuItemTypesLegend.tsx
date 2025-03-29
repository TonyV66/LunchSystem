import * as React from "react";
import { Box, Typography } from "@mui/material";
import { blue, green, grey, orange, purple } from "@mui/material/colors";

const Bullet: React.FC<{ color: string; borderColor: string }> = ({
  color, borderColor,
}) => {
  return (
    <Box
      sx={{
        width: "16px",
        height: "16px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor,
        backgroundColor: color,
        borderRadius: "50%",
      }}
    ></Box>
  );
};
const MenuItemTypesLegend: React.FC = () => {
  return (
    <Box
      sx={{
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto auto auto auto auto auto",
        gap: 1,
      }}
    > 
      <Bullet borderColor={grey[300]} color={green[100]}></Bullet>
      <Typography variant="caption">Entree</Typography>
      <Bullet borderColor={grey[300]} color={purple[100]}></Bullet>
      <Typography variant="caption">Side</Typography>
      <Bullet borderColor={grey[300]} color={orange[100]}></Bullet>
      <Typography variant="caption">Dessert</Typography>
      <Bullet borderColor={grey[300]} color={blue[100]}></Bullet>
      <Typography variant="caption">Drink</Typography>
    </Box>
  );
};

export default MenuItemTypesLegend;
