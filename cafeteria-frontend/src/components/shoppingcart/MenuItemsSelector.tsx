import React, { useEffect, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { PantryItemType } from "../../models/PantryItemType";
import DailyMenu from "../../models/DailyMenu";
import { AppContext } from "../../AppContextProvider";
import DailyMenuItem from "../../models/DailyMenuItem";

interface MenuItemsSelectorProps {
  menu: DailyMenu;
  pantryItemType: PantryItemType;
  disabled?: boolean;
  showPrices?: boolean;
  onSelectionChanged: (selectedItems: DailyMenuItem[]) => void;
}

const MenuItemsSelector: React.FC<MenuItemsSelectorProps> = ({
  menu,
  pantryItemType,
  onSelectionChanged,
  disabled,
  showPrices,
}) => {
  const { pantryItems } = React.useContext(AppContext);
  const [selectedItems, setSelectedItems] = useState<DailyMenuItem[]>([]);
  const [disabledItems, setDisabledItems] = useState<DailyMenuItem[]>([]);

  const numRequiredSelections =
    pantryItemType === PantryItemType.SIDE ? menu.numSidesWithMeal : 1;
  const menuItems = menu.items
    .filter((item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === pantryItemType)
    .sort((m1, m2) => {
      const pantryItem1 = pantryItems.find((pantryItem) => pantryItem.id === m1.pantryItemId)!;
      const pantryItem2 = pantryItems.find((pantryItem) => pantryItem.id === m2.pantryItemId)!;
      return pantryItem1.name.localeCompare(pantryItem2.name);
    });

  useEffect(() => {
    if (disabled) {
      setSelectedItems([]);
      setDisabledItems(
        menu.items.filter((item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === pantryItemType),
      );
    } else {
      setDisabledItems([]);
    }
  }, [disabled, menu, pantryItemType]);

  const handleMealItemClicked = (item: DailyMenuItem) => {
    if (selectedItems.includes(item)) {
      if (numRequiredSelections > 1) {
        const updatedSelections = selectedItems.filter(
          (selectedItem) => selectedItem !== item,
        );
        setSelectedItems(updatedSelections);
        setDisabledItems([]);
        onSelectionChanged(updatedSelections);
      }
    } else {
      let updatedSelections: DailyMenuItem[] = [];
      if (numRequiredSelections === 1) {
        updatedSelections = [item];
      } else {
        updatedSelections = selectedItems.concat([item]);
        if (updatedSelections.length === numRequiredSelections) {
          setDisabledItems(
            menuItems.filter((mi) => !updatedSelections.includes(mi)),
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
      {menuItems.map((item) => {
        const pantryItem = pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)!;
        return pantryItem.name + price;
      }).join(", ")}
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
              label={pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)!.name + price}
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
