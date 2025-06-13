import React from "react";
import { Box, Divider, FormControlLabel, Radio, Stack, Typography } from "@mui/material";
import { PantryItem, PantryItemType } from "../../models/Menu";
import { DailyMenu } from "../../models/Menu";
import MenuItemsSelector from "./MenuItemsSelector";

interface MealDesignerProps {
  menu: DailyMenu;
  typeOfOrder: "meal" | "drink";
  onTypeOfOrderChanged: (type: "meal" | "drink") => void;
  onEntreeChanged: (menuItems: PantryItem[]) => void;
  onSidesChanged: (menuItems: PantryItem[]) => void;
  onDessertChanged: (menuItems: PantryItem[]) => void;
  onDrinkChanged: (menuItems: PantryItem[]) => void;
}

const MealDesigner: React.FC<MealDesignerProps> = ({
  menu,
  typeOfOrder,
  onTypeOfOrderChanged,
  onEntreeChanged,
  onSidesChanged,
  onDessertChanged,
  onDrinkChanged,
}) => {
  const entrees = menu.items.filter(
    (item) => item.type === PantryItemType.ENTREE
  );
  const sides = menu.items.filter(
    (item) => item.type === PantryItemType.SIDE
  );
  const desserts = menu.items.filter(
    (item) => item.type === PantryItemType.DESSERT
  );
  const drinks = menu.items.filter(
    (item) => item.type === PantryItemType.DRINK
  );

  return (
    <Stack direction="column" spacing={1}>
      <Box>
        <Typography variant="body2" fontWeight="bold">
          Type Of Order:
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormControlLabel
            value="meal"
            control={
              <Radio
                checked={typeOfOrder === "meal"}
                onChange={() => onTypeOfOrderChanged("meal")}
              />
            }
            label="Meal & Drink"
          />
          <FormControlLabel
            value="drink"
            control={
              <Radio
                checked={typeOfOrder === "drink"}
                onChange={() => onTypeOfOrderChanged("drink")}
              />
            }
            label="Drink Only"
          />
        </Stack>
      </Box>
      <Divider />
      {!entrees.length ? (
        <></>
      ) : (
        <>
          <MenuItemsSelector
            disabled={typeOfOrder === "drink"}
            showPrices={true}
            menu={menu}
            pantryItemType={PantryItemType.ENTREE}
            onSelectionChanged={onEntreeChanged}
          ></MenuItemsSelector>
          <Divider />
        </>
      )}
      {!sides.length ? (
        <></>
      ) : (
        <>
          <MenuItemsSelector
            disabled={typeOfOrder === "drink"}
            menu={menu}
            pantryItemType={PantryItemType.SIDE}
            onSelectionChanged={onSidesChanged}
          ></MenuItemsSelector>
          <Divider />
        </>
      )}
      {!desserts.length ? (
        <></>
      ) : (
        <>
          <MenuItemsSelector
            disabled={typeOfOrder === "drink"}
            menu={menu}
            pantryItemType={PantryItemType.DESSERT}
            onSelectionChanged={onDessertChanged}
          ></MenuItemsSelector>
          <Divider />
        </>
      )}
      {!drinks.length ? (
        <></>
      ) : (
        <>
          <MenuItemsSelector
            menu={menu}
            pantryItemType={PantryItemType.DRINK}
            showPrices={typeOfOrder === "drink"}
            onSelectionChanged={onDrinkChanged}
          ></MenuItemsSelector>
          <Divider />
        </>
      )}
    </Stack>
  );
};

export default MealDesigner; 