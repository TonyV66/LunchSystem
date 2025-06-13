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
import { Role } from "../../models/User";
import Student from "../../models/Student";
import { GradeLevel } from "../../models/GradeLevel";
import SchoolYear from "../../models/SchoolYear";
import StudentLunchtimePanel from "../users/StudentLunchtimePanel";
import { DayOfWeek } from "../../models/DayOfWeek";
import { Edit } from "@mui/icons-material";
import StudentLunchtimeDialog from "../users/StudentLunchtimeDialog";
import MealDesigner from "./MealDesigner";
import StudentAutoCompleteSelector from "../users/StudentAutoCompleteSelector";
import { donate } from "../../api/CafeteriaClient";
import { AxiosError } from "axios";

type TypeOfOrder = "meal" | "drink";

interface DialogProps {
  menu: DailyMenu;
  onClose: () => void;
}

const DonateMealDialog: React.FC<DialogProps> = ({
  menu,
  onClose,
}) => {
  const { users, orders, setOrders, setSnackbarErrorMsg, currentSchoolYear } =
    useContext(AppContext);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedEntree, setSelectedEntree] = useState<PantryItem>();
  const [selectedSides, setSelectedSides] = useState<PantryItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<PantryItem>();
  const [selectedDrink, setSelectedDrink] = useState<PantryItem>();
  const [typeOfOrder, setTypeOfOrder] = useState<TypeOfOrder>("meal");
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [confirmDialogMsg, setConfirmDialogMsg] = useState<string>();
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);

  const dayOfWeek = DateTimeUtils.toDate(menu.date).getDay();

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

  const handleAddToCart = async (confirmed: boolean) => {
    if (!selectedStudent) {
      setSnackbarErrorMsg("Please select a student first");
      return;
    }

    if (!confirmed) {
      const mealsOrdered = orders
        .map((order) =>
          order.meals.filter(
            (meal) => meal.date === DateTimeUtils.toString(menu.date)
          )
        )
        .flat();

      const isMealOrdered = mealsOrdered.find(
        (sm) => sm.studentId === selectedStudent.id
      )
        ? true
        : false;
      if (isMealOrdered) {
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

    const shoppingCart: ShoppingCart = {
      items: [newCartItem],
    };

    try {
      const completedOrder = await donate(shoppingCart);
      setOrders(orders.concat(completedOrder));
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError;
      setSnackbarErrorMsg(
        "Error occurred while submitting order: " +
          (axiosError.response?.data?.toString() ??
            axiosError.response?.statusText ??
            "Unknown server error")
      );
    }
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

  const handleCloseStudentDialog = () => {
    setShowEditStudentDialog(false);
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

  const studentGradeLevel = selectedStudent
    ? currentSchoolYear.studentLunchTimes.find(
        (stl) => stl.studentId === selectedStudent.id
      )?.grade ?? GradeLevel.UNKNOWN
    : undefined;

  const isTeacherRequired = studentGradeLevel
    ? getIsTeacherSelectionRequired(currentSchoolYear, studentGradeLevel)
    : false;

  const teacherId = selectedStudent
    ? currentSchoolYear.studentLunchTimes.find(
        (slt) =>
          slt.studentId === selectedStudent.id && slt.dayOfWeek === dayOfWeek
      )?.teacherId
    : undefined;

  const assignedTeacher = teacherId
    ? users.find((user) => user.role === Role.TEACHER && user.id === teacherId)
    : undefined;

  useEffect(() => {
    setIsAddToCartEnabled(false);
    if (
      !selectedStudent ||
      !studentGradeLevel ||
      (isTeacherRequired && !assignedTeacher)
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
    currentSchoolYear,
    typeOfOrder,
    selectedStudent,
    studentGradeLevel,
    isTeacherRequired,
    assignedTeacher,
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
        {DateTimeUtils.toString(
          menu.date,
          DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
        )}
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
          <Box>
            <StudentAutoCompleteSelector
              value={selectedStudent}
              onChange={setSelectedStudent}
              label="Select Student"
            />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
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
                student={selectedStudent || undefined}
                dayOfWeek={dayOfWeek as DayOfWeek}
              />
            </Stack>
          </Box>
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
          disabled={!isAddToCartEnabled || !selectedStudent}
        >
          Add To Cart - $
          {typeOfOrder === "meal"
            ? menu.price.toFixed(2)
            : menu.drinkOnlyPrice.toFixed(2)}
        </Button>
      </DialogActions>
      {showEditStudentDialog && selectedStudent ? (
        <StudentLunchtimeDialog
          schoolYear={currentSchoolYear}
          student={selectedStudent}
          onClose={handleCloseStudentDialog}
        />
      ) : (
        <></>
      )}
    </Dialog>
  );
};

export default DonateMealDialog;
