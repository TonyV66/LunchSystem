import React, { useEffect, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { PantryItem, PantryItemType } from "../../models/Menu";
import { DailyMenu } from "../../models/Menu";

interface MenuItemsSelectorProps {
  menu: DailyMenu;
  pantryItemType: PantryItemType;
  disabled?: boolean;
  showPrices?: boolean;
  onSelectionChanged: (selectedItems: PantryItem[]) => void;
}

const MenuItemsSelector: React.FC<MenuItemsSelectorProps> = ({
  menu,
  pantryItemType,
  onSelectionChanged,
  disabled,
  showPrices,
}) => {
  const [selectedItems, setSelectedItems] = useState<PantryItem[]>([]);
  const [disabledItems, setDisabledItems] = useState<PantryItem[]>([]);

  const numRequiredSelections =
    pantryItemType === PantryItemType.SIDE ? menu.numSidesWithMeal : 1;
  const menuItems = menu.items
    .filter((item) => item.type === pantryItemType)
    .sort((m1, m2) => m1.name.localeCompare(m2.name));

  useEffect(() => {
    if (disabled) {
      setSelectedItems([]);
      setDisabledItems(
        menu.items.filter((item) => item.type === pantryItemType)
      );
    } else {
      setDisabledItems([]);
    }
  }, [disabled, menu, pantryItemType]);

  const handleMealItemClicked = (item: PantryItem) => {
    if (selectedItems.includes(item)) {
      if (numRequiredSelections > 1) {
        const updatedSelections = selectedItems.filter(
          (selectedItem) => selectedItem !== item
        );
        setSelectedItems(updatedSelections);
        setDisabledItems([]);
        onSelectionChanged(updatedSelections);
      }
    } else {
      let updatedSelections: PantryItem[] = [];
      if (numRequiredSelections === 1) {
        updatedSelections = [item];
      } else {
        updatedSelections = selectedItems.concat([item]);
        if (updatedSelections.length === numRequiredSelections) {
          setDisabledItems(
            menuItems.filter((mi) => !updatedSelections.includes(mi))
          );
        }
      }
      setSelectedItems(updatedSelections);
      onSelectionChanged(updatedSelections);
    }
  };

  let price = "";
  if (showPrices && pantryItemType === PantryItemType.ENTREE) {
    price = " - $" + menu.price.toFixed(2);
  } else if (showPrices && pantryItemType === PantryItemType.DRINK) {
    price = " - $" + menu.drinkOnlyPrice.toFixed(2);
  }
  let availItems = (
    <Typography color={disabled ? "grey.500" : undefined}>
      {menuItems.map((item) => item.name + price).join(", ")}
    </Typography>
  );
  let instructions = "";
  if (numRequiredSelections && numRequiredSelections < menuItems.length) {
    availItems = (
      <>
        {menuItems.map((item) => {
          const isDisabled = disabledItems.includes(item);
          const isSelected = selectedItems.includes(item);
          return (
            <Chip
              key={item.id}
              label={item.name + price}
              sx={isDisabled ? { color: "grey.500" } : undefined}
              color={isDisabled ? undefined : "primary"}
              variant={!isSelected ? "outlined" : "filled"}
              onClick={
                isDisabled ? undefined : () => handleMealItemClicked(item)
              }
            />
          );
        })}
      </>
    );
    instructions = "(choose " + numRequiredSelections + ")";
  }
  let itemTypeName = "Entree:";
  switch (pantryItemType) {
    case PantryItemType.DESSERT:
      itemTypeName = "Dessert:";
      break;
    case PantryItemType.DRINK:
      itemTypeName = "Drink:";
      break;
    case PantryItemType.SIDE:
      itemTypeName = "Side(s):";
      break;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="body2" fontWeight="bold">
        {itemTypeName} {instructions}
      </Typography>
      <Box sx={{ display: "flex", flexGrow: 1, gap: 1, flexWrap: "wrap" }}>
        {availItems}
      </Box>
    </Box>
  );
};

export default MenuItemsSelector; 