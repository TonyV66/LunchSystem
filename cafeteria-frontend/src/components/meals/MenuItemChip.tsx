import * as React from "react";
import { Box, Typography } from "@mui/material";
import { blue, green, grey, orange, purple } from "@mui/material/colors";
import { PantryItem, PantryItemType } from "../../models/Menu";
import { Variant } from "@mui/material/styles/createTypography";

interface Props {
  menuItem: PantryItem;
  qty?: number;
  textVariant?: string;
}

const MenuItemChip: React.FC<Props> = ({ menuItem, qty, textVariant }) => {
  let backgroundColor: string = grey[200];
  switch (menuItem.type) {
    case PantryItemType.ENTREE:
      backgroundColor = qty === 0 ? green[50] : green[100];
      break;
    case PantryItemType.SIDE:
      backgroundColor = qty === 0 ? purple[50] : purple[100];
      break;
    case PantryItemType.DESSERT:
      backgroundColor = qty === 0 ? orange[50] : orange[100];
      break;
    case PantryItemType.DRINK:
      backgroundColor = qty === 0 ? blue[50] : blue[100];
      break;
  }
  return (
    <Box
      whiteSpace={"nowrap"}
      bgcolor={backgroundColor}
      borderRadius={2}
      color={qty === 0 ? grey[400] : undefined}
      pl={1}
      pr={1}
      display="flex"
      flexDirection="row"
      gap={1}
      border="1px solid darkgray"
      alignItems={"center"}
    >
      <Typography whiteSpace={"nowrap"} variant={textVariant as Variant ?? "body2"}>
        {menuItem.name}
      </Typography>
      {qty !== undefined ? (
        <Typography whiteSpace={"nowrap"} variant={textVariant as Variant ?? "body2"} fontWeight="bold">
          {qty.toString()}
        </Typography>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default MenuItemChip;
