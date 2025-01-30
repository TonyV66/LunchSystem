import React, { ChangeEvent, MutableRefObject, useContext } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Menu, { DailyMenu, PantryItem, PantryItemType } from "../models/Menu";
import MenuItemsList from "./MenuItemsList";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import MenuPanel from "../MenuPanel";
import { Search, Add } from "@mui/icons-material";
import {
  createMenu,
  createPantryItem,
  updateDailyMenu,
  updateMenu,
} from "../services/AdminClientServices";
import { AppContext } from "../AppContextProvider";

interface DialogProps {
  menu?: Menu;
  onOk: (meal: Menu) => void;
  onCancel: () => void;
}

const canShowDessertsAsSides = (menu: Menu) => {
  const numDesserts = menu.items.filter(
    (item) => item.type === PantryItemType.DESSERT
  ).length;
  const numSides = menu.items.filter(
    (item) => item.type === PantryItemType.SIDE
  ).length;

  return (!numSides && numDesserts) ||
    (numDesserts === 1 &&
      (!menu.numSidesWithMeal || menu.numSidesWithMeal >= numSides))
    ? true
    : false;
};

const EditMenuDialog: React.FC<DialogProps> = ({ menu, onOk, onCancel }) => {
  const { systemDefaults } = useContext(AppContext);
  const newItemRef: MutableRefObject<HTMLInputElement | undefined> =
    React.useRef();

  const { pantryItems, setPantryItems } = useContext(AppContext);

  const [selectedTab, setSelectedTab] = useState(PantryItemType.ENTREE);
  const [isDirty, setIsDirty] = useState(false);
  const [price, setPrice] = useState(
    menu?.price.toFixed(2) ?? systemDefaults.mealPrice.toFixed(2)
  );
  const [drinkOnlyPrice, setDrinkOnlyPrice] = useState(
    menu?.drinkOnlyPrice.toFixed(2) ?? systemDefaults.drinkOnlyPrice.toFixed(2)
  );

  const [updatedMenu, setUpdatedMenu] = useState<Menu | DailyMenu>({
    id: menu?.id ?? 0,
    showDessertAsSide: false,
    name: "",
    numSidesWithMeal: 0,
    items: menu?.items ?? [],
    price: menu?.price ?? systemDefaults.mealPrice,
    drinkOnlyPrice: menu?.drinkOnlyPrice ?? systemDefaults.drinkOnlyPrice,
  });
  const [newMenuItem, setNewMenuItem] = useState("");

  const handleSaveMenu = async () => {
    let savedMenu = undefined;
    updatedMenu.price = parseFloat(price);
    updatedMenu.drinkOnlyPrice = parseFloat(drinkOnlyPrice);

    if (!updatedMenu.id) {
      savedMenu = await createMenu(updatedMenu);
    } else if (menu && Object.prototype.hasOwnProperty.call(menu, "date")) {
      const originalDailyMenu = menu as DailyMenu;
      savedMenu = await updateDailyMenu({
        ...updatedMenu,
        date: originalDailyMenu.date,
        orderStartTime: originalDailyMenu.orderStartTime,
        orderEndTime: originalDailyMenu.orderEndTime,
      });
    } else {
      savedMenu = await updateMenu({
        ...updatedMenu,
      });
    }
    setIsDirty(false);
    setUpdatedMenu(savedMenu);
    onOk(savedMenu);
  };

  const handleNumSidesSelected = (count: number) => {
    const revisedMeal = {
      ...updatedMenu,
      numSidesWithMeal: count,
    };

    if (
      canShowDessertsAsSides(revisedMeal) !==
      canShowDessertsAsSides(updatedMenu)
    ) {
      revisedMeal.showDessertAsSide = canShowDessertsAsSides(revisedMeal);
    }

    setIsDirty(true);
    setUpdatedMenu(revisedMeal);
  };

  const handleTabSelected = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleItemClicked = (item: PantryItem) => {
    if (
      !updatedMenu.items.find(
        (mealItem) =>
          mealItem.type === item.type &&
          mealItem.name.toLocaleLowerCase() === item.name.toLocaleLowerCase()
      )
    ) {
      setUpdatedMenu({
        ...updatedMenu,
        items: updatedMenu.items.concat(item),
      });
      setIsDirty(true);
    }
  };

  const handleShowDessertWithSidesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUpdatedMenu({
      ...updatedMenu,
      showDessertAsSide: event.target.checked,
    });
    setIsDirty(true);
  };

  const handleMealChanged = (meal: Menu) => {
    if (canShowDessertsAsSides(updatedMenu) !== canShowDessertsAsSides(meal)) {
      meal = {
        ...meal,
        showDessertAsSide: canShowDessertsAsSides(meal),
      };
    }
    setIsDirty(true);
    setUpdatedMenu(meal);
  };

  const handleNewMenuItemChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMenuItem(event.target.value);
  };

  const handlePriceChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value);
    const price = parseFloat(event.target.value);
    if (!isNaN(price)) {
      setUpdatedMenu({
        ...updatedMenu,
        price: price,
      });
      setIsDirty(true);
    }
  };

  const handleDrinkPriceChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setDrinkOnlyPrice(event.target.value);
    const price = parseFloat(event.target.value);
    if (!isNaN(price)) {
      setUpdatedMenu({
        ...updatedMenu,
        drinkOnlyPrice: price,
      });
      setIsDirty(true);
    }
  };

  const handleCreatePantryItem = async () => {
    const pantryItem = await createPantryItem({
      id: 0,
      name: newMenuItem,
      type: selectedTab,
    });
    setPantryItems(pantryItems.concat(pantryItem));
    setNewMenuItem("");
    if (newItemRef.current) {
      newItemRef.current.focus();
    }
  };

  const priceFloat = parseFloat(price);
  const drinkPriceFloat = parseFloat(drinkOnlyPrice);
  const isSaveEnabled = isDirty && !isNaN(priceFloat) && !isNaN(drinkPriceFloat) && priceFloat >= 0 && drinkPriceFloat >= 0 && updateMenu.length;

  return (
    <Dialog
      open={true}
      fullWidth={true}
      maxWidth="md"
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogContent sx={{ overflow: "hidden" }}>
        <Box sx={{ minHeight: "250px", maxHeight: "500px" }}>
          <Box
            sx={{
              columnGap: 1,
              gap: 2,
              height: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gridTemplateRows: "auto auto 1fr",
            }}
          >
            <Box
              sx={{
                gridColumn: "1 / span 2",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Tabs
                value={selectedTab}
                onChange={handleTabSelected}
                aria-label="basic tabs example"
              >
                <Tab
                  label={<Typography variant="caption">Entrees</Typography>}
                />
                <Tab label={<Typography variant="caption">Sides</Typography>} />
                <Tab
                  label={<Typography variant="caption">Desserts</Typography>}
                />
                <Tab
                  label={<Typography variant="caption">Drinks</Typography>}
                />
              </Tabs>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gridColumn: "3 / span 2",
                gap: 2,
              }}
            >
              <FormControl fullWidth variant="standard">
                <InputLabel htmlFor="meal-price">Meal Price</InputLabel>
                <Input
                  id="meal-price"
                  type="text"
                  value={price}
                  onChange={handlePriceChanged}
                  startAdornment={
                    <InputAdornment position="start">$</InputAdornment>
                  }
                />
              </FormControl>
              <FormControl fullWidth variant="standard">
                <InputLabel htmlFor="drink-price">Drink Price</InputLabel>
                <Input
                  id="drink-price"
                  type="text"
                  value={drinkOnlyPrice}
                  onChange={handleDrinkPriceChanged}
                  startAdornment={
                    <InputAdornment position="start">$</InputAdornment>
                  }
                />
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  # sides with meal
                </InputLabel>
                <Select
                  labelId="what-to-order-label"
                  variant="standard"
                  id="what-to-order"
                  value={updatedMenu.numSidesWithMeal.toString()}
                  label="# included sides"
                  onChange={(event: SelectChangeEvent) =>
                    handleNumSidesSelected(parseInt(event.target.value))
                  }
                >
                  <MuiMenuItem value={"0"}>All</MuiMenuItem>
                  <MuiMenuItem value={"1"}>1</MuiMenuItem>
                  <MuiMenuItem value={"2"}>2</MuiMenuItem>
                  <MuiMenuItem value={"3"}>3</MuiMenuItem>
                  <MuiMenuItem value={"4"}>4</MuiMenuItem>
                  <MuiMenuItem value={"5"}>5</MuiMenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl variant="standard">
              <InputLabel htmlFor="meal-item-search">Search</InputLabel>
              <Input
                id="meal-item-search"
                type="text"
                endAdornment={
                  <InputAdornment position="end">
                    <Search />
                  </InputAdornment>
                }
              />
            </FormControl>
            <FormControl variant="standard">
              <InputLabel htmlFor="standard-adornment-password">
                Create
              </InputLabel>
              <Input
                id="new-menu-item-name"
                inputRef={newItemRef}
                type="text"
                value={newMenuItem}
                onChange={handleNewMenuItemChanged}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      disabled={!newMenuItem.length}
                      onClick={handleCreatePantryItem}
                      size="small"
                      color="primary"
                      aria-label="add a menu item"
                    >
                      <Add />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            <Typography
              fontWeight="bold"
              variant="subtitle2"
              sx={{ alignSelf: "end" }}
            >
              On The Menu
            </Typography>

            <FormControlLabel
              sx={{ alignSelf: "end" }}
              label={
                <Typography variant="subtitle2">
                  Show dessert as side
                </Typography>
              }
              control={
                <Checkbox
                  sx={{ p: 0, pr: 1, pl: 1 }}
                  disabled={!canShowDessertsAsSides(updatedMenu)}
                  checked={updatedMenu.showDessertAsSide}
                  onChange={handleShowDessertWithSidesChange}
                  size="small"
                />
              }
            />
            <Paper
              elevation={3}
              sx={{
                gridColumn: "1 / span 2",
                height: "300px",
                overflowY: "auto",
              }}
            >
              <MenuItemsList
                onItemClicked={handleItemClicked}
                typeOfItem={selectedTab}
              />
            </Paper>
            <Paper
              elevation={3}
              sx={{
                gridColumn: "3 / span 2",
                height: "300px",
                overflowY: "auto",
              }}
            >
              <Box p={1}>
                <MenuPanel
                  menu={updatedMenu}
                  onMenuChanged={handleMealChanged}
                ></MenuPanel>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!isSaveEnabled} variant="contained" onClick={handleSaveMenu}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMenuDialog;
