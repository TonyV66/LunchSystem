import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import Menu, { DailyMenu, PantryItem, PantryItemType } from "../../models/Menu";
import {
  DateTimeFormat,
  DateTimeUtils,
  SHORT_DAY_NAMES,
} from "../../DateTimeUtils";
import ConfirmDialog from "../ConfirmDialog";
import { ShoppingCartItem } from "../../models/ShoppingCart";
import User, { Role } from "../../models/User";
import { DayOfWeek } from "../../models/DailyLunchTime";
import NewStudentDialog from "../users/NewStudentDialog";
import Student from "../../models/Student";

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

interface DialogProps {
  date: string;
  onClose: () => void;
  onAddedToCart: (item: ShoppingCartItem) => void;
}

const AddToCartDialog: React.FC<DialogProps> = ({
  date,
  onClose,
  onAddedToCart,
}) => {
  const {
    students,
    setStudents,
    orders,
    shoppingCart,
    setShoppingCart,
    scheduledMenus,
    users,
  } = useContext(AppContext);

  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [selectedTeacher, setSelectedTeacher] = useState<User>();
  const [selectedEntree, setSelectedEntree] = useState<PantryItem>();
  const [selectedSides, setSelectedSides] = useState<PantryItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<PantryItem>();
  const [selectedDrink, setSelectedDrink] = useState<PantryItem>();
  const [typeOfOrder, setTypeOfOrder] = useState<TypeOfOrder>("meal");
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [confirmDialogMsg, setConfirmDialogMsg] = useState<string>();
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);

  const [menu] = useState<DailyMenu>(
    scheduledMenus.find((menu) => menu.date === date)!
  );

  const dayOfWeek = DateTimeUtils.toDate(menu.date).getDay();

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((t1, t2) =>
      t1.name.toLowerCase().localeCompare(t2.name.toLowerCase())
    );

  const handleStudentSelected = (studentId: number) => {
    if (studentId === -1) {
      setShowNewStudentDialog(true);
      return;
    }

    setSelectedStudentId(studentId);

    const student = students.find((student) => student.id === studentId)!;
    if (student && !selectedTeacher) {
      const teacherId = student.lunchTimes.find(
        (lt) => lt.dayOfWeek === dayOfWeek
      )?.teacherId;
      const teacher = teachers.find((teacher) => teacher.id === teacherId);
      setSelectedTeacher(teacher ?? selectedTeacher);
    }
  };

  const handleTeacherSelected = (teacherId: number) => {
    setSelectedTeacher(teachers.find((teacher) => teacher.id === teacherId)!);
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
    const selectedStudent = students.find(
      (student) => student.id === selectedStudentId
    )!;

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
      teacherId: selectedTeacher!.id,
      dailyMenuId: menu.id,
      isDrinkOnly: typeOfOrder === "drink",
      selectedMenuItemIds: [],
    };

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

    let updatedStudent = selectedStudent;
    for (let i = DayOfWeek.MONDAY; i < DayOfWeek.SATURDAY; i++) {
      if (!updatedStudent.lunchTimes.find((lt) => lt.dayOfWeek === i)) {
        updatedStudent = {
          ...updatedStudent,
          lunchTimes: updatedStudent.lunchTimes.concat({
            id: 0,
            teacherId: selectedTeacher!.id,
            time: "",
            dayOfWeek: i,
          }),
        };
      }
    }

    if (
      updatedStudent.lunchTimes.find((lt) => lt.dayOfWeek === dayOfWeek)!
        .teacherId !== selectedTeacher!.id
    ) {
      updatedStudent = {
        ...updatedStudent!,
        lunchTimes: updatedStudent.lunchTimes.map((lt) =>
          lt.dayOfWeek !== dayOfWeek
            ? lt
            : { ...lt, teacherId: selectedTeacher!.id }
        ),
      };
    }

    if (updatedStudent !== selectedStudent) {
      setStudents(
        students.map((student) =>
          student.id === updatedStudent.id ? updatedStudent : student
        )
      );
    }

    setShoppingCart({
      ...shoppingCart,
      items: shoppingCart.items.concat(newCartItem),
    });
    onAddedToCart(newCartItem);
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

  const handleNewStudent = (student: Student) => {
    setShowNewStudentDialog(false);
    setSelectedStudentId(student.id);
    setSelectedTeacher(undefined);
  };

  useEffect(() => {
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

    if (students.length === 1) {
      setSelectedStudentId(students[0].id);
      const teacherId = students[0].lunchTimes.find(
        (lt) => lt.dayOfWeek === dayOfWeek
      )?.teacherId;
      const teacher = teachers.find((teacher) => teacher.id === teacherId);
      setSelectedTeacher(teacher ?? selectedTeacher);
    }
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
  }, []);

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
          selectedTeacher &&
          selectedStudentId > 0
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
    selectedStudentId,
    selectedTeacher,
    typeOfOrder,
  ]);

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
    <Dialog
      open={true}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>
        {DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            textAlign: "left",
          }}
        >
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
          {!entrees.length ? (
            <></>
          ) : (
            <>
              <MenuItemsSelector
                disabled={typeOfOrder === "drink"}
                showPrices={true}
                menu={menu}
                mealItemType={PantryItemType.ENTREE}
                onSelectionChanged={handleEntreeChanged}
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
                mealItemType={PantryItemType.SIDE}
                onSelectionChanged={handleSidesChanged}
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
                mealItemType={PantryItemType.DESSERT}
                onSelectionChanged={handleDessertChanged}
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
                mealItemType={PantryItemType.DRINK}
                showPrices={typeOfOrder === "drink"}
                onSelectionChanged={handlDrinkChanged}
              ></MenuItemsSelector>
              <Divider />
            </>
          )}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box>
              <FormControl variant="standard" sx={{ minWidth: "150px" }}>
                <InputLabel id="order-for-label">Student</InputLabel>
                <Select
                  labelId="order-for-label"
                  id="order-for"
                  value={selectedStudentId.toString()}
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
                  <MuiMenuItem color="primary" key={-1} value={"-1"}>
                    <Typography color='primary'>Add A Student</Typography>
                  </MuiMenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl variant="standard" sx={{ minWidth: "150px" }}>
                <InputLabel id="order-teacher-label">
                  {SHORT_DAY_NAMES[dayOfWeek] + "."} Lunch Teacher
                </InputLabel>
                <Select
                  labelId="order-teacher-label"
                  id="order-teacher"
                  value={selectedTeacher?.id.toString() || "0"}
                  label="Teacher Name"
                  onChange={(event: SelectChangeEvent) =>
                    handleTeacherSelected(
                      parseInt(event.target.value as string)
                    )
                  }
                >
                  {teachers.map((teacher) => (
                    <MuiMenuItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
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
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
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
      </DialogActions>
      {showNewStudentDialog ? (
        <NewStudentDialog
          onClose={() => setShowNewStudentDialog(false)}
          onNewStudent={handleNewStudent}
        />
      ) : (
        <></>
      )}
    </Dialog>
  );
};

export default AddToCartDialog;
