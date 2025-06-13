import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { DailyMenu, PantryItem, PantryItemType } from "../../models/Menu";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import ConfirmDialog from "../ConfirmDialog";
import { ShoppingCart, ShoppingCartItem } from "../../models/ShoppingCart";
import User, { Role } from "../../models/User";
import NewStudentDialog from "../users/NewStudentDialog";
import Student from "../../models/Student";
import { GradeLevel } from "../../models/GradeLevel";
import SchoolYear from "../../models/SchoolYear";
import OrderForSelector from "./OrderForSelector";
import LunchtimeSelector from "./LunchtimeSelector";
import StudentLunchtimePanel from "../users/StudentLunchtimePanel";
import { DayOfWeek } from "../../models/DayOfWeek";
import { Edit } from "@mui/icons-material";
import StudentLunchtimeDialog from "../users/StudentLunchtimeDialog";
import MealDesigner from "./MealDesigner";

type TypeOfOrder = "meal" | "drink";

interface DialogProps {
  user: User;
  date: string;
  onClose: () => void;
  onAddedToCart: (item: ShoppingCartItem) => void;
}

const MY_ID = -1;

const addMealTimeToShoppingCart = (
  shoppingCart: ShoppingCart,
  date: string,
  time: string
) => {
  if (!time) return;

  // Initialize mealTimes array if it doesn't exist
  if (!shoppingCart.mealTimes) {
    shoppingCart.mealTimes = [];
  }

  const existingTimeIndex = shoppingCart.mealTimes.findIndex(
    (mt) => mt.date === date
  );

  if (existingTimeIndex >= 0) {
    // Update existing time
    shoppingCart.mealTimes[existingTimeIndex].time = time;
  } else {
    // Add new time
    shoppingCart.mealTimes.push({ date, time });
  }
};

const OrderMealDialog: React.FC<DialogProps> = ({
  user,
  date,
  onClose,
  onAddedToCart,
}) => {
  const {
    users,
    students,
    orders,
    shoppingCart,
    setShoppingCart,
    scheduledMenus,
    currentSchoolYear
  } = useContext(AppContext);

  const [selectedPersonId, setSelectedPersonId] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedEntree, setSelectedEntree] = useState<PantryItem>();
  const [selectedSides, setSelectedSides] = useState<PantryItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<PantryItem>();
  const [selectedDrink, setSelectedDrink] = useState<PantryItem>();
  const [typeOfOrder, setTypeOfOrder] = useState<TypeOfOrder>("meal");
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [confirmDialogMsg, setConfirmDialogMsg] = useState<string>();
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);



  const siblings = students.filter((s) => s.parents.includes(user.id));

  const [menu] = useState<DailyMenu>(
    scheduledMenus.find((menu) => menu.date === date)!
  );

  const dayOfWeek = DateTimeUtils.toDate(menu.date).getDay();

  const selectedStudent = siblings.find(
    (student) => student.id === selectedPersonId
  );

  const showLunchtimeSelector =
    selectedPersonId === MY_ID &&
    (user.role !== Role.TEACHER ||
      !currentSchoolYear.teacherLunchTimes.find(
        (lt) => lt.teacherId === selectedPersonId
      )?.times.length);

  const handlePersonSelected = (personId: number) => {
    if (personId === -2) {
      setShowNewStudentDialog(true);
      return;
    }
    setSelectedPersonId(personId);
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

      const hasMealInCart = shoppingCart.items.find(
        (item) =>
          item.dailyMenuId === menu.id && item.studentId === selectedStudent?.id
      )
        ? true
        : false;
      const isMealOrdered = mealsOrdered.find((sm) =>
        selectedStudent
          ? sm.studentId === selectedStudent.id
          : sm.staffMemberId === user.id
      )
        ? true
        : false;
      if (hasMealInCart) {
        setConfirmDialogMsg(
          "A meal and/or drink is already in your cart for " +
            (selectedStudent?.name ?? "you") +
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
            (selectedStudent?.name ?? "you") +
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
      studentId: selectedStudent?.id,
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

    const updatedCart = {
      ...shoppingCart,
      items: shoppingCart.items.concat(newCartItem),
    };
    if (showLunchtimeSelector) {
      addMealTimeToShoppingCart(updatedCart, menu.date, selectedTime!);
    }

    setShoppingCart(updatedCart);
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

  const handleCloseStudentDialog = (student?: Student) => {
    setShowNewStudentDialog(false);
    setShowEditStudentDialog(false);
    if (student) {
      setSelectedPersonId(student.id);
    }
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

    if (siblings.length === 1) {
      setSelectedPersonId(siblings[0].id);
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

  const getIsTeacherSelectionRequired = (
    schoolYear: SchoolYear,
    selectedGrade: GradeLevel
  ) => {
    return schoolYear.gradesAssignedByClass.includes(selectedGrade) ?? false;
  };

  const studentGradeLevel =
    selectedPersonId !== MY_ID
      ? currentSchoolYear.studentLunchTimes.find(
          (stl) => stl.studentId === selectedPersonId
        )?.grade ?? GradeLevel.UNKNOWN
      : GradeLevel.UNKNOWN;

  const isTeacherRequired = getIsTeacherSelectionRequired(
    currentSchoolYear,
    studentGradeLevel
  );
  const teacherId = currentSchoolYear.studentLunchTimes.find(
    (slt) =>
      slt.studentId === selectedStudent?.id && slt.dayOfWeek === dayOfWeek
  )?.teacherId;

  const assignedTeacher = users.find(
    (user) => user.role === Role.TEACHER && user.id === teacherId
  );

  useEffect(() => {
    setIsAddToCartEnabled(false);
    if (
      (selectedPersonId !== MY_ID && selectedPersonId <= 0) ||
      (showLunchtimeSelector && !selectedTime) ||
      (selectedPersonId !== MY_ID && !studentGradeLevel) ||
      (selectedPersonId !== MY_ID && isTeacherRequired && !assignedTeacher)
    ) {
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
          isEntreeSelectionCompleted
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
    selectedPersonId,
    currentSchoolYear,
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

  return (
    <Dialog
      open={true}
      fullWidth
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
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
            <OrderForSelector
              selectedPersonId={selectedPersonId}
              userRole={user.role}
              students={siblings}
              onPersonSelected={handlePersonSelected}
            />
            {showLunchtimeSelector ? (
              <LunchtimeSelector
                selectedTime={selectedTime}
                schoolYear={currentSchoolYear}
                dayOfWeek={dayOfWeek}
                onTimeSelected={setSelectedTime}
              />
            ) : (
              <></>
            )}
          </Box>
          {selectedPersonId !== MY_ID && (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                flexWrap="wrap"
              >
                <IconButton
                  size="small"
                  color="primary"
                  disabled={!selectedStudent}
                  onClick={() => setShowEditStudentDialog(true)}
                >
                  <Edit />
                </IconButton>
                <StudentLunchtimePanel
                  schoolYear={currentSchoolYear}
                  student={selectedStudent}
                  dayOfWeek={dayOfWeek as DayOfWeek}
                />
              </Stack>
            </Box>
          )}
          <Divider />
          <MealDesigner
            menu={menu}
            typeOfOrder={typeOfOrder}
            onTypeOfOrderChanged={handleTypeOfOrderSelected}
            onEntreeChanged={handleEntreeChanged}
            onSidesChanged={handleSidesChanged}
            onDessertChanged={handleDessertChanged}
            onDrinkChanged={handlDrinkChanged}
          />
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
          parent={user}
          onClose={handleCloseStudentDialog}
        />
      ) : showEditStudentDialog ? (
        <StudentLunchtimeDialog
          schoolYear={currentSchoolYear}
          student={selectedStudent!}
          onClose={handleCloseStudentDialog}
        />
      ) : (
        <></>
      )}
    </Dialog>
  );
};

export default OrderMealDialog;
