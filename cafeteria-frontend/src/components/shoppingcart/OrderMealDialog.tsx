import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { DailyMenu, PantryItem, PantryItemType } from "../../models/Menu";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import ConfirmDialog from "../ConfirmDialog";
import { ShoppingCartItem } from "../../models/ShoppingCart";
import { Role } from "../../models/User";
import NewFamilyMemberDialog from "../users/NewFamilyMemberDialog";
import Student from "../../models/Student";
import { GradeLevel } from "../../models/GradeLevel";
import SchoolYear from "../../models/SchoolYear";
import FamilyMemberSelector from "./FamilyMemberSelector";
import MealDesigner from "./MealDesigner";
import StudentAutoCompleteSelector from "../users/StudentAutoCompleteSelector";
import {
  associateStudentWithUser,
  createStudent,
} from "../../api/CafeteriaClient";
import { StudentLunchTime } from "../../models/StudentLunchTime";
import StudentLunchtimeDialog from "../users/StudentLunchtimeDialog";
import StaffLunchtimeDialog from "../users/StaffLunchtimeDialog";

type TypeOfOrder = "meal" | "drink";

interface DialogProps {
  date: string;
  onClose: () => void;
  onAddedToCart: (item: ShoppingCartItem) => void;
}

const MY_ID = -1;

const OrderMealDialog: React.FC<DialogProps> = ({
  date,
  onClose,
  onAddedToCart,
}) => {
  const {
    users,
    setUsers,
    students,
    setStudents,
    orders,
    setOrders,
    shoppingCart,
    setShoppingCart,
    scheduledMenus,
    currentSchoolYear,
    setCurrentSchoolYear,
    schoolYears,
    setSchoolYears,
    user,
  } = useContext(AppContext);

  const [selectedPersonId, setSelectedPersonId] = useState<number>(0);
  const [selectedEntree, setSelectedEntree] = useState<PantryItem>();
  const [selectedSides, setSelectedSides] = useState<PantryItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<PantryItem>();
  const [selectedDrink, setSelectedDrink] = useState<PantryItem>();
  const [typeOfOrder, setTypeOfOrder] = useState<TypeOfOrder>("meal");
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [confirmDialogMsg, setConfirmDialogMsg] = useState<string>();
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [showStudentLunchTimeDialog, setShowStudentLunchTimeDialog] = useState(false);
  const [showStaffLunchtimeDialog, setShowStaffLunchtimeDialog] = useState(false);
  const [staffLunchtime, setStaffLunchtime] = useState<string>();

  const [familyOrder, setFamilyOrder] = useState(user.role !== Role.ADMIN);
  const [selectedNonFamilyStudent, setSelectedNonFamilyStudent] =
    useState<Student | null>(null);

  const [menu] = useState<DailyMenu>(
    scheduledMenus.find((menu) => menu.date === date)!
  );

  const dayOfWeek = DateTimeUtils.toDate(menu.date).getDay();

  const siblings = students.filter((s) => s.parents.includes(user.id));
  const selectedStudent = !familyOrder
    ? selectedNonFamilyStudent || undefined
    : siblings.find((student) => student.id === selectedPersonId);

  const handlePersonSelected = (personId: number) => {
    if (personId === -2) {
      setShowNewStudentDialog(true);
      return;
    } 
    setSelectedPersonId(personId);
    if (personId == MY_ID) {
      if (user.role !== Role.TEACHER || !currentSchoolYear.teacherLunchTimes.find(lt => lt.teacherId === user.id && lt.dayOfWeek === dayOfWeek)) {
        setShowStaffLunchtimeDialog(true);
      }
    } else {
      const studentLunchTimes = currentSchoolYear.studentLunchTimes.filter(slt => slt.studentId === personId);
      if (studentLunchTimes.length === 0) {
        setShowStudentLunchTimeDialog(true);
      }
    }
  };

  const handleNonFamilyStudentSelected = (student: Student | null) => {
    setSelectedNonFamilyStudent(student);
    if (student) {
      setSelectedPersonId(student.id);
    }
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
          "A meal / drink is already in your cart for " +
            (selectedStudent
              ? selectedStudent.firstName + " " + selectedStudent.lastName
              : "you") +
            " on " +
            DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            ) +
            ". Press OK to add another meal / drink to the cart."
        );
        return;
      } else if (isMealOrdered) {
        setConfirmDialogMsg(
          "A meal / drink has already been ordered for " +
            (selectedStudent
              ? selectedStudent.firstName + " " + selectedStudent.lastName
              : "you") +
            " on " +
            DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            ) +
            ". Press OK to add another meal / drink to the cart."
        );
        return;
      }
    } else {
      setConfirmDialogMsg(undefined);
    }

    const newCartItem: ShoppingCartItem = {
      studentId: selectedStudent?.id,
      time: staffLunchtime,
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

  const handleCreateStudent = async (
    student: Student,
    studentLunchTimes: StudentLunchTime[]
  ) => {
    setShowNewStudentDialog(false);

    const newStudent = await createStudent({
      ...student,
      lunchTimes: studentLunchTimes,
    });

    setStudents(students.concat(newStudent));
    if (currentSchoolYear.id) {
      const updatedSchoolYear = {
        ...schoolYears.find((sy) => sy.id === currentSchoolYear.id)!,
      };
      updatedSchoolYear.studentLunchTimes =
        currentSchoolYear.studentLunchTimes.concat(
          studentLunchTimes!.map((lt) => ({
            ...lt,
            studentId: newStudent.id,
          }))
        );

      setCurrentSchoolYear(updatedSchoolYear);
      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== updatedSchoolYear.id ? sy : updatedSchoolYear
        )
      );
    }
    setSelectedPersonId(newStudent.id);
  };

  const updateStudentLunchTimes = (
    student: Student,
    lunchTimes: StudentLunchTime[]
  ) => {
    const updatedSchoolYear = {
      ...schoolYears.find((sy) => sy.id === currentSchoolYear.id)!,
    };
    updatedSchoolYear.studentLunchTimes = currentSchoolYear.studentLunchTimes
      .filter((lt) => lt.studentId !== student.id)
      .concat(
        lunchTimes!.map((lt) => ({
          ...lt,
          studentId: student.id,
        }))
      );

    setCurrentSchoolYear(updatedSchoolYear);
    setSchoolYears(
      schoolYears.map((sy) =>
        sy.id !== updatedSchoolYear.id ? sy : updatedSchoolYear
      )
    );
  };

  const handleStudentLunchTimeDialogClosed = (saved: boolean) => {
    setShowStudentLunchTimeDialog(false);
    if (!saved) {
      setSelectedPersonId(0);
    }
  };

  const handleStaffLunchtimeDialogClosed = (selectedTime?: string) => {
    setShowStaffLunchtimeDialog(false);
    setStaffLunchtime(selectedTime);
    if (!selectedTime) {
      setSelectedPersonId(0);
    }
  };

  const handleAddStudent = async (student: Student) => {
    setShowNewStudentDialog(false);

    const existingStudent = students.find((s) => s.id === student.id);

    if (!existingStudent) {
      const {
        student: updatedStudent,
        lunchTimes,
        parents,
        orders: ordersForStudent,
      } = await associateStudentWithUser(student.id, user.id);

      setStudents(students.concat(updatedStudent));
      setUsers(
        users.concat(parents.filter((p) => !users.some((u) => u.id === p.id)))
      );
      setOrders(
        orders
          .filter((o) => !ordersForStudent.some((os) => os.id === o.id))
          .concat(ordersForStudent)
      );

      if (currentSchoolYear.id) {
        updateStudentLunchTimes(updatedStudent, lunchTimes);
      }
      setSelectedPersonId(updatedStudent.id);
    } else if (!existingStudent.parents.includes(user.id)) {
      setStudents(
        students.map((s) =>
          s.id === student.id ? { ...s, parents: [...s.parents, user.id] } : s
        )
      );
      setSelectedPersonId(student.id);
    } else {
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
      if (currentSchoolYear.studentLunchTimes.find(slt => slt.studentId === siblings[0].id && slt.dayOfWeek === dayOfWeek)) {
        setSelectedPersonId(siblings[0].id);
      }
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
          {user.role === Role.ADMIN && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={familyOrder}
                  onChange={(e) => setFamilyOrder(e.target.checked)}
                />
              }
              label="Order for my family"
            />
          )}

          {!familyOrder && user.role === Role.ADMIN ? (
            <StudentAutoCompleteSelector
              value={selectedNonFamilyStudent}
              onChange={handleNonFamilyStudentSelected}
              label="Select Student"
            />
          ) : (
            <FamilyMemberSelector
              selectedPersonId={selectedPersonId}
              onPersonSelected={handlePersonSelected}
            />
          )}
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
        <NewFamilyMemberDialog
          onCreateStudent={handleCreateStudent}
          onAddStudent={handleAddStudent}
          onClose={() => setShowNewStudentDialog(false)}
          dayOfWeek={dayOfWeek}
        />
      ) : (
        <></>
      )}
      {showStaffLunchtimeDialog ? (
        <StaffLunchtimeDialog
          dayOfWeek={dayOfWeek}
          onClose={handleStaffLunchtimeDialogClosed}
        />
      ) : (
        <></>
      )}
      {showStudentLunchTimeDialog ? (
        <StudentLunchtimeDialog
          student={students.find((s) => s.id === selectedPersonId)!}
          onClose={handleStudentLunchTimeDialogClosed}
        />
      ) : (
        <></>
      )}

    </Dialog>
  );
};

export default OrderMealDialog;
