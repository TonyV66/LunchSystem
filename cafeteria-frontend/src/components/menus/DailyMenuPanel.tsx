import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import DailyMenu from "../../models/DailyMenu";
import DailyMenuItem from "../../models/DailyMenuItem";
import { PantryItemType } from "../../models/PantryItemType";
import { blue, green, orange, purple } from "@mui/material/colors";
import { AppContext } from "../../AppContextProvider";
import PantryItem from "../../models/PantryItem";

interface MenuItemsGroupProps {
  menu: DailyMenu;
  menuItemTypes: PantryItemType[];
  onItemDeleted?: (item: DailyMenuItem) => void;
  disabled?: boolean;
}

const MenuItemsGroup: React.FC<MenuItemsGroupProps> = ({
  menu,
  menuItemTypes,
  onItemDeleted,
  disabled
}) => {
  const { pantryItems } = React.useContext(AppContext);
  const numRequiredSelections = menuItemTypes.includes(PantryItemType.SIDE)
    ? menu.numSidesWithMeal
    : 1;
  const menuItems = menu.items
    .filter((item) => {
      const pantryItem = pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId);
      if (!pantryItem) {
        return false;
      }
      return menuItemTypes.includes(pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)!.type)
    })
    .sort((m1, m2) => {
      const pantryItem1 = pantryItems.find((pantryItem) => pantryItem.id === m1.pantryItemId)!;
      const pantryItem2 = pantryItems.find((pantryItem) => pantryItem.id === m2.pantryItemId)!;
      const typeIndex1 = menuItemTypes.indexOf(pantryItem1.type);
      const typeIndex2 = menuItemTypes.indexOf(pantryItem2.type);

      if (typeIndex1 === typeIndex2) {
        return pantryItem1.name.localeCompare(pantryItem2.name);
      }
      return typeIndex1 < typeIndex2 ? -1 : 1;
    })
    .map((item) => {
      const pantryItem = pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)!;
      let backgroundColor: string = green[100];
      switch (pantryItem.type) {
        case PantryItemType.DESSERT:
          backgroundColor = orange[100];
          break;
        case PantryItemType.SIDE:
          backgroundColor = purple[100];
          break;
        case PantryItemType.DRINK:
          backgroundColor = blue[100];
          break;
      }

      return onItemDeleted ? (
        <Chip
          key={item.id}
          disabled={disabled}
          onDelete={() => onItemDeleted(item)}
          label={pantryItem.name}
          size="small"
          sx={{ backgroundColor: backgroundColor }}
        ></Chip>
      ) : (
        pantryItem.name
      );
    });

  let instructions = <></>;
  if (
    menuItemTypes.includes(PantryItemType.SIDE) &&
    numRequiredSelections &&
    numRequiredSelections < menuItems.length
  ) {
    instructions = (
      <Typography color={disabled ? 'textDisabled' : undefined} variant="caption">
        (choose {numRequiredSelections})
      </Typography>
    );
  }
  let itemTypeName = "Entree(s):";
  switch (menuItemTypes[0]) {
    case PantryItemType.DESSERT:
      itemTypeName = "Dessert(s):";
      break;
    case PantryItemType.DRINK:
      itemTypeName = "Drink(s):";
      break;
    case PantryItemType.SIDE:
      itemTypeName = "Side(s):";
      break;
  }

  if (!menuItems.length) {
    return <></>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
        <Typography color={disabled ? 'textDisabled' : undefined} variant="caption" fontWeight={"bold"}>
          {itemTypeName}
        </Typography>
        {instructions}
      </Box>
      {onItemDeleted ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {menuItems}
        </Box>
      ) : (
        <Typography color={disabled ? 'textDisabled' : undefined} variant="caption">{menuItems.join(", ")}</Typography>
      )}
    </Box>
  );
};

interface DailyMenuPanelProps {
  menu: DailyMenu;
  disabled?: boolean;
  onMenuChanged?: (menu: DailyMenu) => void;
}

const canShowDessertsAsSides = (menu: DailyMenu, pantryItems: PantryItem[]) => {
  const numDesserts = menu.items.filter(
    (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === PantryItemType.DESSERT
  ).length;
  const numSides = menu.items.filter(
    (item) => pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)?.type === PantryItemType.SIDE
  ).length;

  return (!numSides && numDesserts) ||
    (numDesserts === 1 &&
      (!menu.numSidesWithMeal || menu.numSidesWithMeal >= numSides))
    ? true
    : false;
};

const DailyMenuPanel: React.FC<DailyMenuPanelProps> = ({ menu, onMenuChanged, disabled }) => {
  const { pantryItems } = React.useContext(AppContext);
  const handleMealItemDeleted = (menuItem: DailyMenuItem) => {
    onMenuChanged!({
      ...menu,
      items: menu.items.filter((item) => item !== menuItem),
    });
  };

  const showDessertAsSide =
    menu.showDessertAsSide && canShowDessertsAsSides(menu, pantryItems);
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        textAlign: "left",
      }}
    >
      <MenuItemsGroup
        onItemDeleted={onMenuChanged ? handleMealItemDeleted : undefined}
        menu={menu}
        disabled={disabled}
        menuItemTypes={[PantryItemType.ENTREE]}
      ></MenuItemsGroup>
      <MenuItemsGroup
        onItemDeleted={onMenuChanged ? handleMealItemDeleted : undefined}
        menu={menu}
        disabled={disabled}
        menuItemTypes={
          showDessertAsSide
            ? [PantryItemType.SIDE, PantryItemType.DESSERT]
            : [PantryItemType.SIDE]
        }
      ></MenuItemsGroup>
      {showDessertAsSide ? (
        <></>
      ) : (
        <MenuItemsGroup
          onItemDeleted={onMenuChanged ? handleMealItemDeleted : undefined}
          menu={menu}
          disabled={disabled}
          menuItemTypes={[PantryItemType.DESSERT]}
        ></MenuItemsGroup>
      )}
      <MenuItemsGroup
        onItemDeleted={onMenuChanged ? handleMealItemDeleted : undefined}
        menu={menu}
        disabled={disabled}
        menuItemTypes={[PantryItemType.DRINK]}
      ></MenuItemsGroup>
    </Box>
  );
};

export default DailyMenuPanel;
