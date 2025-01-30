import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { AppContext } from "./AppContextProvider";
import Student from "./models/Student";
import Menu, { DailyMenu, PantryItem, PantryItemType } from "./models/Menu";
import { DateTimeFormat, DateTimeUtils } from "./DateTimeUtils";
import ConfirmDialog from "./components/ConfirmDialog";
import { ExpandMore } from "@mui/icons-material";
import { ShoppingCartItem } from "./models/ShoppingCart";

type TypeOfOrder = "meal" | "drink";

interface MenuItemsSelectorProps {
  menu: Menu;
  mealItemType: PantryItemType;
  disabled?: boolean;
  showPrices?: boolean;
  onSelectionChanged: (selectedItems: PantryItem[]) => void;
}

const MenuItemsSelector: React.FC<MenuItemsSelectorProps> = ({
  menu,
  mealItemType,
  onSelectionChanged,
  disabled,
  showPrices,
}) => {
  const [selectedItems, setSelectedItems] = useState<PantryItem[]>([]);
  const [disabledItems, setDisabledItems] = useState<PantryItem[]>([]);

  const numRequiredSelections =
    mealItemType === PantryItemType.SIDE ? menu.numSidesWithMeal : 1;
  const menuItems = menu.items
    .filter((item) => item.type === mealItemType)
    .sort((m1, m2) => m1.name.localeCompare(m2.name));

  useEffect(() => {
    if (disabled) {
      setSelectedItems([]);
      setDisabledItems(menu.items.filter((item) => item.type === mealItemType));
    } else {
      setDisabledItems([]);
    }
  }, [disabled, menu, mealItemType]);

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
  if (showPrices && mealItemType === PantryItemType.ENTREE) {
    price = " - $" + menu.price.toFixed(2);
  } else if (showPrices && mealItemType === PantryItemType.DRINK) {
    price = " - $" + menu.drinkOnlyPrice.toFixed(2);
  }
  let availItems = (
    <Typography color={disabled ? "grey.500" : undefined}>
      {menuItems.map((item) => item.name + price).join(", ")}
    </Typography>
  );
  let instructions = <></>;
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
    instructions = (
      <Typography variant="caption">
        (choose {numRequiredSelections})
      </Typography>
    );
  }
  let itemTypeName = "Entree:";
  switch (mealItemType) {
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
    <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: "70px",
          maxWidth: "70px",
          width: "70px",
        }}
      >
        <Typography>{itemTypeName}</Typography>
        {instructions}
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box sx={{ display: "flex", flexGrow: 1, gap: 1, flexWrap: "wrap" }}>
        {availItems}
      </Box>
    </Box>
  );
};

interface DailyOrderFormProps {
  menu: DailyMenu;
}

const DailyOrderForm: React.FC<DailyOrderFormProps> = ({ menu }) => {
  const { students, orders, shoppingCart, setShoppingCart } = useContext(AppContext);

  const [selectedStudent, setSelectedStudent] = useState<Student>(students[0]);
  const [selectedEntree, setSelectedEntree] = useState<PantryItem>();
  const [selectedSides, setSelectedSides] = useState<PantryItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<PantryItem>();
  const [selectedDrink, setSelectedDrink] = useState<PantryItem>();
  const [typeOfOrder, setTypeOfOrder] = useState<TypeOfOrder>("meal");
  const [numMealsInCart, setNumMealsInCart] = useState(0);
  const [numMealsOrdered, setNumMealsOrdered] = useState(0);
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [confirmDialogMsg, setConfirmDialogMsg] = useState<string>();

  const handleStudentSelected = (studentId: number) => {
    setSelectedStudent(students.find((student) => student.id === studentId)!);
  };

  const handleTypeOfOrderSelected = (type: TypeOfOrder) => {
    if (type === "meal" && menu) {
      if (entrees.length === 1) {
        setSelectedEntree(entrees[0]);
      }
      if (
        sides.length === 1 ||
        !menu.numSidesWithMeal ||
        menu.numSidesWithMeal >= sides.length
      ) {
        setSelectedSides(sides);
      }
      if (desserts.length === 1) {
        setSelectedDessert(desserts[0]);
      }
    } else if (type === "drink") {
      setSelectedEntree(undefined);
      setSelectedSides([]);
      setSelectedDessert(undefined);
    }
    setTypeOfOrder(type);
  };

  const handleAddToCart = (confirmed: boolean) => {
    if (!confirmed) {
      const mealsOrdered = orders
        .map((order) =>
          order.meals.filter(
            (meal) => meal.date === DateTimeUtils.toString(menu.date)
          )
        )
        .flat();

      const studentHasMealInCart = shoppingCart.items.find(
        (item) =>
          item.dailyMenuId === menu.id && item.studentId === selectedStudent.id
      )
        ? true
        : false;
      const isMealOrdered = mealsOrdered.find(
        (sm) => sm.studentId === selectedStudent.id
      )
        ? true
        : false;
      if (studentHasMealInCart) {
        setConfirmDialogMsg(
          "A meal and/or drink is already in your cart for " +
            selectedStudent.name +
            " on " +
            DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            ) +
            ". Press OK to add another item to the cart."
        );
        return;
      } else if (isMealOrdered) {
        setConfirmDialogMsg(
          "A meal and/or drink has already been ordered for " +
            selectedStudent.name +
            " on " +
            DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            ) +
            ". Press OK to add another item to the cart."
        );
        return;
      }
    } else {
      setConfirmDialogMsg(undefined);
    }


    const newCartItem: ShoppingCartItem = {
      studentId: selectedStudent.id,
      dailyMenuId: menu.id,
      isDrinkOnly: typeOfOrder === "drink",
      selectedMenuItemIds: [],
    };

    const entrees = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.ENTREE);
    const sides = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.SIDE);
    const desserts = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.DESSERT);
    const drinks = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.DRINK);

    if (typeOfOrder === "meal") {
      if (entrees.length > 1) {
        newCartItem.selectedMenuItemIds.push(selectedEntree!.id);
      }

      if (
        sides.length > 1 &&
        menu.numSidesWithMeal &&
        menu.numSidesWithMeal < sides.length
      ) {
        newCartItem.selectedMenuItemIds =
          newCartItem.selectedMenuItemIds.concat(
            selectedSides.map((side) => side.id)
          );
      }

      if (desserts.length > 1) {
        newCartItem.selectedMenuItemIds.push(selectedDessert!.id);
      }
    }

    if (drinks.length > 1) {
      newCartItem.selectedMenuItemIds.push(selectedDrink!.id);
    }

    setShoppingCart({
      ...shoppingCart,
      items: shoppingCart.items.concat(newCartItem)
    })
  };

  const handleEntreeChanged = (menuItems: PantryItem[]) => {
    setSelectedEntree(menuItems.length ? menuItems[0] : undefined);
  };

  const handleSidesChanged = (menuItems: PantryItem[]) => {
    setSelectedSides(menuItems);
  };

  const handleDessertChanged = (menuItems: PantryItem[]) => {
    setSelectedDessert(menuItems.length ? menuItems[0] : undefined);
  };

  const handlDrinkChanged = (menuItems: PantryItem[]) => {
    setSelectedDrink(menuItems.length ? menuItems[0] : undefined);
  };

  useEffect(() => {
    if (!menu) {
      return;
    }

    const entrees = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.ENTREE);
    const sides = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.SIDE);
    const desserts = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.DESSERT);
    const drinks = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.DRINK);

    if (entrees.length === 1) {
      setSelectedEntree(entrees[0]);
    }
    if (
      sides.length === 1 ||
      !menu.numSidesWithMeal ||
      menu.numSidesWithMeal >= sides.length
    ) {
      setSelectedSides(sides);
    }
    if (desserts.length === 1) {
      setSelectedDessert(desserts[0]);
    }

    if (drinks.length === 1) {
      setSelectedDrink(drinks[0]);
    }
  }, [menu]);

  useEffect(() => {
    const entrees = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.ENTREE);
    const sides = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.SIDE);
    const desserts = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.DESSERT);
    const drinks = !menu
      ? []
      : menu.items.filter((item) => item.type === PantryItemType.DRINK);

    setIsAddToCartEnabled(false);
    if (typeOfOrder === "drink") {
      setIsAddToCartEnabled(selectedDrink ? true : false);
    } else {
      const isEntreeSelectionCompleted =
        typeOfOrder !== "meal" || !entrees.length || selectedEntree
          ? true
          : false;
      const isSidesSelectionCompleted =
        typeOfOrder !== "meal" ||
        !sides.length ||
        menu?.numSidesWithMeal === 0 ||
        selectedSides.length === menu?.numSidesWithMeal
          ? true
          : false;
      const isDessertSelectionCompleted =
        typeOfOrder !== "meal" || !desserts.length || selectedDessert
          ? true
          : false;
      const isDrinkSelectionCompleted =
        !drinks.length || selectedDrink ? true : false;
      setIsAddToCartEnabled(
        isDessertSelectionCompleted &&
          isDrinkSelectionCompleted &&
          isSidesSelectionCompleted &&
          isEntreeSelectionCompleted &&
          selectedStudent
          ? true
          : false
      );
    }
  }, [
    menu,
    selectedDessert,
    selectedDrink,
    selectedEntree,
    selectedSides.length,
    selectedStudent,
    typeOfOrder,
  ]);

  useEffect(() => {
    const itemsInCart = shoppingCart.items.filter(
      (item) => item.dailyMenuId === menu.id
    );
    const mealsOrdered = orders
      .map((order) =>
        order.meals.filter(
          (meal) => meal.date === DateTimeUtils.toString(menu.date)
        )
      )
      .flat();

    setNumMealsInCart(itemsInCart.length);
    setNumMealsOrdered(mealsOrdered.length);
  }, [orders, shoppingCart, menu.date]);

  const entrees = !menu
    ? []
    : menu.items.filter((item) => item.type === PantryItemType.ENTREE);
  const sides = !menu
    ? []
    : menu.items.filter((item) => item.type === PantryItemType.SIDE);
  const desserts = !menu
    ? []
    : menu.items.filter((item) => item.type === PantryItemType.DESSERT);
  const drinks = !menu
    ? []
    : menu.items.filter((item) => item.type === PantryItemType.DRINK);

  return (
    <Accordion elevation={3}>
      <AccordionSummary
        sx={{ flexDirection: "row-reverse" }}
        expandIcon={<ExpandMore />}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            textAlign: "left",
          }}
        >
          <Typography fontSize={"1 em"} textAlign={"left"} fontWeight={"bold"}>
            {DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
          </Typography>
          <Typography>In cart: {numMealsInCart}</Typography>
          <Typography>Ordered: {numMealsOrdered}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textAlign: "left",
          }}
        >
          {!entrees.length ? (
            <></>
          ) : (
            <MenuItemsSelector
              disabled={typeOfOrder === "drink"}
              showPrices={true}
              menu={menu}
              mealItemType={PantryItemType.ENTREE}
              onSelectionChanged={handleEntreeChanged}
            ></MenuItemsSelector>
          )}
          {!sides.length ? (
            <></>
          ) : (
            <MenuItemsSelector
              disabled={typeOfOrder === "drink"}
              menu={menu}
              mealItemType={PantryItemType.SIDE}
              onSelectionChanged={handleSidesChanged}
            ></MenuItemsSelector>
          )}
          {!desserts.length ? (
            <></>
          ) : (
            <MenuItemsSelector
              disabled={typeOfOrder === "drink"}
              menu={menu}
              mealItemType={PantryItemType.DESSERT}
              onSelectionChanged={handleDessertChanged}
            ></MenuItemsSelector>
          )}
          {!drinks.length ? (
            <></>
          ) : (
            <MenuItemsSelector
              menu={menu}
              mealItemType={PantryItemType.DRINK}
              showPrices={typeOfOrder === "drink"}
              onSelectionChanged={handlDrinkChanged}
            ></MenuItemsSelector>
          )}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl variant="standard" sx={{ minWidth: "125px" }}>
              <InputLabel id="what-to-order-label">Order</InputLabel>

              <Select
                labelId="what-to-order-label"
                id="what-to-order"
                value={typeOfOrder}
                label="Order"
                onChange={(event: SelectChangeEvent) =>
                  handleTypeOfOrderSelected(event.target.value as TypeOfOrder)
                }
              >
                <MuiMenuItem value={"meal"}>Meal & Drink</MuiMenuItem>
                <MuiMenuItem value={"drink"}>Drink Only</MuiMenuItem>
              </Select>
            </FormControl>
            <Box>
              <FormControl variant="standard" sx={{ minWidth: "150px" }}>
                <InputLabel id="order-for-label">Student</InputLabel>
                <Select
                  labelId="order-for-label"
                  id="order-for"
                  value={selectedStudent?.id.toString() || "0"}
                  label="Student Name"
                  onChange={(event: SelectChangeEvent) =>
                    handleStudentSelected(
                      parseInt(event.target.value as string)
                    )
                  }
                >
                  {students.map((student) => (
                    <MuiMenuItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              onClick={() => handleAddToCart(false)}
              disabled={!isAddToCartEnabled}
            >
              Add To Cart - $
              {typeOfOrder === "meal"
                ? menu.price.toFixed(2)
                : menu.drinkOnlyPrice.toFixed(2)}
            </Button>
          </Box>
        </Box>
      </AccordionDetails>
      {!confirmDialogMsg ? (
        <></>
      ) : (
        <ConfirmDialog
          open={true}
          onCancel={() => setConfirmDialogMsg(undefined)}
          onOk={() => handleAddToCart(true)}
        >
          <Typography>{confirmDialogMsg}</Typography>
        </ConfirmDialog>
      )}
    </Accordion>
  );
};

export default DailyOrderForm;
