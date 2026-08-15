import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Menu from "../../models/Menu";
import DailyMenu from "../../models/DailyMenu";
import PantryItem from "../../models/PantryItem";
import { PantryItemType } from "../../models/PantryItemType";
import MenuItemsList from "./MenuItemsList";
import PantryItemDialog from "./PantryItemDialog";
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
import MenuPanel from "./MenuPanel";
import DailyMenuPanel from "./DailyMenuPanel";
import { Search, Add } from "@mui/icons-material";
import {
  createMenu,
  updateDailyMenu,
  updateMenu,
} from "../../api/CafeteriaClient";
import { AppContext } from "../../AppContextProvider";
import { AxiosError } from "axios";

type EditableMenu = Menu | DailyMenu;

interface DialogProps {
  menu?: EditableMenu;
  onOk: (meal: EditableMenu) => void;
  onCancel: () => void;
}

const isDailyMenu = (menu: EditableMenu): menu is DailyMenu =>
  Object.prototype.hasOwnProperty.call(menu, "date");

const canShowDessertsAsSides = (
  menu: EditableMenu,
  pantryItems: PantryItem[]
) => {
  const numDesserts = menu.items.filter(
    (item) =>
      pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
        ?.type === PantryItemType.DESSERT
  ).length;
  const numSides = menu.items.filter(
    (item) =>
      pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
        ?.type === PantryItemType.SIDE
  ).length;

  return (!numSides && numDesserts) ||
    (numDesserts === 1 &&
      (!menu.numSidesWithMeal || menu.numSidesWithMeal >= numSides))
    ? true
    : false;
};

const MenuDialog: React.FC<DialogProps> = ({ menu, onOk, onCancel }) => {
  const { school, setSnackbarErrorMsg, pantryItems, setPantryItems } =
    useContext(AppContext);

  const editingDailyMenu = menu ? isDailyMenu(menu) : false;

  const [selectedTab, setSelectedTab] = useState(PantryItemType.ENTREE);
  const [isDirty, setIsDirty] = useState(false);
  const [showPantryItemDialog, setShowPantryItemDialog] = useState(false);
  const [viewArchive, setViewArchive] = useState(false);
  const [price, setPrice] = useState(
    menu?.price.toFixed(2) ?? school.mealPrice.toFixed(2)
  );
  const [drinkOnlyPrice, setDrinkOnlyPrice] = useState(
    menu?.drinkOnlyPrice.toFixed(2) ?? school.drinkOnlyPrice.toFixed(2)
  );

  const [updatedMenu, setUpdatedMenu] = useState<EditableMenu>(() => {
    if (menu && isDailyMenu(menu)) {
      return { ...menu, items: [...menu.items] };
    }
    return {
      id: menu?.id ?? 0,
      showDessertAsSide: menu?.showDessertAsSide || false,
      name: menu?.name ?? "",
      numSidesWithMeal: menu?.numSidesWithMeal ?? 0,
      items: menu?.items ?? [],
      price: menu?.price ?? school.mealPrice,
      drinkOnlyPrice: menu?.drinkOnlyPrice ?? school.drinkOnlyPrice,
    };
  });

  const handleSaveMenu = async () => {
    let savedMenu: EditableMenu | undefined;
    updatedMenu.price = parseFloat(price);
    updatedMenu.drinkOnlyPrice = parseFloat(drinkOnlyPrice);

    if (editingDailyMenu && menu && isDailyMenu(menu)) {
      try {
        savedMenu = await updateDailyMenu({
          ...(updatedMenu as DailyMenu),
          date: menu.date,
          orderStartTime: menu.orderStartTime,
          orderEndTime: menu.orderEndTime,
          items: updatedMenu.items.map((item) => ({
            id: item.id,
            price: item.price,
            pantryItemId: item.pantryItemId,
          })),
        });
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error updating menu: " +
            (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")
        );
      }
    } else if (!updatedMenu.id) {
      try {
        savedMenu = await createMenu(updatedMenu as Menu);
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error creating menu: " +
            (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")
        );
      }
    } else {
      try {
        savedMenu = await updateMenu(updatedMenu as Menu);
      } catch (error) {
        const axiosError = error as AxiosError;
        setSnackbarErrorMsg(
          "Error updating menu: " +
            (axiosError.response?.data?.toString() ??
              axiosError.response?.statusText ??
              "Unknown server error")
        );
      }
    }

    if (savedMenu) {
      setIsDirty(false);
      setUpdatedMenu(savedMenu);
      onOk(savedMenu);
    }
  };

  const handleNumSidesSelected = (count: number) => {
    const revisedMeal = {
      ...updatedMenu,
      numSidesWithMeal: count,
    };

    if (
      canShowDessertsAsSides(revisedMeal, pantryItems) !==
      canShowDessertsAsSides(updatedMenu, pantryItems)
    ) {
      revisedMeal.showDessertAsSide = canShowDessertsAsSides(
        revisedMeal,
        pantryItems
      );
    }

    setIsDirty(true);
    setUpdatedMenu(revisedMeal);
  };

  const handleTabSelected = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setViewArchive(false);
  };

  const handleItemClicked = (pantryItem: PantryItem) => {
    if (
      !updatedMenu.items.find(
        (mealItem) => mealItem.pantryItemId === pantryItem.id
      )
    ) {
      const newItem = {
        id: 0,
        price: pantryItem.price,
        pantryItemId: pantryItem.id,
      };
      setUpdatedMenu({
        ...updatedMenu,
        items: [...updatedMenu.items, newItem],
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

  const handleMealChanged = (meal: EditableMenu) => {
    if (
      canShowDessertsAsSides(updatedMenu, pantryItems) !==
      canShowDessertsAsSides(meal, pantryItems)
    ) {
      meal = {
        ...meal,
        showDessertAsSide: canShowDessertsAsSides(meal, pantryItems),
      };
    }
    setIsDirty(true);
    setUpdatedMenu(meal);
  };

  const handlePriceChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value);
    const parsedPrice = parseFloat(event.target.value);
    if (!isNaN(parsedPrice)) {
      setUpdatedMenu({
        ...updatedMenu,
        price: parsedPrice,
      });
      setIsDirty(true);
    }
  };

  const handleDrinkPriceChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setDrinkOnlyPrice(event.target.value);
    const parsedPrice = parseFloat(event.target.value);
    if (!isNaN(parsedPrice)) {
      setUpdatedMenu({
        ...updatedMenu,
        drinkOnlyPrice: parsedPrice,
      });
      setIsDirty(true);
    }
  };

  const handlePantryItemSaved = (pantryItem: PantryItem) => {
    setPantryItems(pantryItems.concat(pantryItem));
    setShowPantryItemDialog(false);
  };

  const priceFloat = parseFloat(price);
  const drinkPriceFloat = parseFloat(drinkOnlyPrice);
  const isSaveEnabled =
    isDirty &&
    !isNaN(priceFloat) &&
    !isNaN(drinkPriceFloat) &&
    priceFloat >= 0 &&
    drinkPriceFloat >= 0 &&
    updatedMenu.items.length;
  const hasArchivedItems = pantryItems.some(
    (item) => item.archived && item.type === selectedTab
  );

  useEffect(() => {
    if (!hasArchivedItems) {
      setViewArchive(false);
    }
  }, [hasArchivedItems]);

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
              columnGap: 2,
              rowGap: 0.5,
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
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              {hasArchivedItems && (
                <FormControlLabel
                  label={
                    <Typography variant="subtitle2">View Archive</Typography>
                  }
                  control={
                    <Checkbox
                      sx={{ p: 0, pr: 1, pl: 1 }}
                      checked={viewArchive}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setViewArchive(event.target.checked)
                      }
                      size="small"
                    />
                  }
                />
              )}
              {!viewArchive && (
                <IconButton
                  onClick={() => setShowPantryItemDialog(true)}
                  size="small"
                  color="primary"
                  aria-label="add a menu item"
                >
                  <Add />
                </IconButton>
              )}
            </Box>
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
                  disabled={!canShowDessertsAsSides(updatedMenu, pantryItems)}
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
                archived={viewArchive}
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
                {editingDailyMenu ? (
                  <DailyMenuPanel
                    menu={updatedMenu as DailyMenu}
                    onMenuChanged={(meal) =>
                      handleMealChanged(meal as DailyMenu)
                    }
                  />
                ) : (
                  <MenuPanel
                    menu={updatedMenu as Menu}
                    onMenuChanged={(meal) => handleMealChanged(meal as Menu)}
                  />
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!isSaveEnabled}
          variant="contained"
          onClick={handleSaveMenu}
        >
          OK
        </Button>
      </DialogActions>
      <PantryItemDialog
        open={showPantryItemDialog}
        type={selectedTab}
        onCancel={() => setShowPantryItemDialog(false)}
        onSaved={handlePantryItemSaved}
      />
    </Dialog>
  );
};

export default MenuDialog;
