import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import DailyMenu from "../../models/DailyMenu";
import { PantryItemType } from "../../models/PantryItemType";
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
import StaffAutoCompleteSelector from "../users/StaffAutoCompleteSelector";
import {
  associateStudentWithUser,
  createStudent,
} from "../../api/CafeteriaClient";
import { StudentLunchTime } from "../../models/StudentLunchTime";
import StudentLunchtimeDialog from "../users/StudentLunchtimeDialog";
import StaffLunchtimeDialog from "../users/StaffLunchtimeDialog";
import DailyMenuItem from "../../models/DailyMenuItem";
import SchoolUser from "../../models/SchoolUser";

type TypeOfOrder = "meal" | "drink";
type DinerType = "student" | "staff";

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
  const { pantryItems } = React.useContext(AppContext);
  const [selectedPersonId, setSelectedPersonId] = useState<number>(0);
  const [selectedEntree, setSelectedEntree] = useState<DailyMenuItem>();
  const [selectedSides, setSelectedSides] = useState<DailyMenuItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<DailyMenuItem>();
  const [selectedDrink, setSelectedDrink] = useState<DailyMenuItem>();
  const [typeOfOrder, setTypeOfOrder] = useState<TypeOfOrder>("meal");
  const [isAddToCartEnabled, setIsAddToCartEnabled] = useState(false);
  const [confirmDialogMsg, setConfirmDialogMsg] = useState<string>();
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [showStudentLunchTimeDialog, setShowStudentLunchTimeDialog] =
    useState(false);
  const [showStaffLunchtimeDialog, setShowStaffLunchtimeDialog] =
    useState(false);
  const [staffLunchtime, setStaffLunchtime] = useState<string>();

  const [selectedNonFamilyStudent, setSelectedNonFamilyStudent] =
    useState<Student | null>(null);
  const [selectedStaffMember, setSelectedStaffMember] =
    useState<SchoolUser | null>(null);
  const [dinerType, setDinerType] = useState<DinerType>("student");

  const [menu] = useState<DailyMenu>(
    scheduledMenus.find((menu) => menu.date === date)!,
  );

  const dayOfWeek = DateTimeUtils.toDate(menu.date).getDay();

  const siblings = students.filter((s) => s.parents.includes(user.id));
  const selectedStudent =
    user.role === Role.ADMIN
      ? dinerType === "student"
        ? selectedNonFamilyStudent || undefined
        : undefined
      : siblings.find((student) => student.id === selectedPersonId);

  const hasAssignedStaffLunchTime = (staffMember?: SchoolUser | null) =>
    !!staffMember &&
    staffMember.role === Role.TEACHER &&
    !!currentSchoolYear.teacherLunchTimes.find(
      (lt) => lt.teacherId === staffMember.id && lt.dayOfWeek === dayOfWeek,
    );

  const handlePersonSelected = (personId: number) => {
    if (personId === -2) {
      setShowNewStudentDialog(true);
      return;
    }
    setSelectedPersonId(personId);
    if (personId == MY_ID) {
      if (
        user.role !== Role.TEACHER ||
        !currentSchoolYear.teacherLunchTimes.find(
          (lt) => lt.teacherId === user.id && lt.dayOfWeek === dayOfWeek,
        )
      ) {
        setShowStaffLunchtimeDialog(true);
      }
    } else {
      const studentLunchTimes = currentSchoolYear.studentLunchTimes.filter(
        (slt) => slt.studentId === personId,
      );
      if (studentLunchTimes.length === 0) {
        setShowStudentLunchTimeDialog(true);
      }
    }
  };

  const handleNonFamilyStudentSelected = (student: Student | null) => {
    setSelectedNonFamilyStudent(student);
    if (!student) {
      setSelectedPersonId(0);
      return;
    }
    setSelectedPersonId(student.id);
    const studentLunchTimes = currentSchoolYear.studentLunchTimes.filter(
      (slt) => slt.studentId === student.id,
    );
    if (studentLunchTimes.length === 0) {
      setShowStudentLunchTimeDialog(true);
    }
  };

  const handleStaffMemberSelected = (staffMember: SchoolUser | null) => {
    setSelectedStaffMember(staffMember);
    setStaffLunchtime(undefined);
    if (!staffMember) {
      setSelectedPersonId(0);
      return;
    }
    setSelectedPersonId(staffMember.id);
    if (!hasAssignedStaffLunchTime(staffMember)) {
      setShowStaffLunchtimeDialog(true);
    }
  };

  const handleDinerTypeChanged = (nextType: DinerType) => {
    setDinerType(nextType);
    setSelectedPersonId(0);
    setSelectedNonFamilyStudent(null);
    setSelectedStaffMember(null);
    setStaffLunchtime(undefined);
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
            (meal) =>
              !meal.cancelled &&
              meal.date === DateTimeUtils.toString(menu.date),
          ),
        )
        .flat();

      const hasMealInCart = shoppingCart.items.find((item) => {
        if (item.dailyMenuId !== menu.id) {
          return false;
        }
        if (selectedStudent) {
          return item.studentId === selectedStudent.id;
        }
        if (selectedStaffMember) {
          return item.staffMemberId === selectedStaffMember.id;
        }
        return !item.studentId && !item.staffMemberId;
      })
        ? true
        : false;
      const isMealOrdered = mealsOrdered.find((sm) =>
        selectedStudent
          ? sm.studentId === selectedStudent.id
          : selectedStaffMember
            ? sm.staffMemberId === selectedStaffMember.id
            : sm.staffMemberId === user.id,
      )
        ? true
        : false;
      const dinerName = selectedStudent
        ? selectedStudent.firstName + " " + selectedStudent.lastName
        : selectedStaffMember
          ? selectedStaffMember.firstName + " " + selectedStaffMember.lastName
          : "you";
      if (hasMealInCart) {
        setConfirmDialogMsg(
          "A meal / drink is already in your cart for " +
            dinerName +
            " on " +
            DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
            ) +
            ". Press OK to add another meal / drink to the cart.",
        );
        return;
      } else if (isMealOrdered) {
        setConfirmDialogMsg(
          "A meal / drink has already been ordered for " +
            dinerName +
            " on " +
            DateTimeUtils.toString(
              menu.date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
            ) +
            ". Press OK to add another meal / drink to the cart.",
        );
        return;
      }
    } else {
      setConfirmDialogMsg(undefined);
    }

    const newCartItem: ShoppingCartItem = {
      studentId: selectedStudent?.id,
      staffMemberId: selectedStaffMember?.id,
      time: staffLunchtime,
      dailyMenuId: menu.id,
      isDrinkOnly: typeOfOrder === "drink",
      selectedMenuItemIds: [],
    };

    const entrees = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.ENTREE,
    );
    const sides = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.SIDE,
    );
    const desserts = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.DESSERT,
    );
    const drinks = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.DRINK,
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
            selectedSides.map((side) => side.id),
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

  const handleEntreeChanged = (menuItems: DailyMenuItem[]) => {
    setSelectedEntree(menuItems.length ? menuItems[0] : undefined);
  };

  const handleSidesChanged = (menuItems: DailyMenuItem[]) => {
    setSelectedSides(menuItems);
  };

  const handleDessertChanged = (menuItems: DailyMenuItem[]) => {
    setSelectedDessert(menuItems.length ? menuItems[0] : undefined);
  };

  const handlDrinkChanged = (menuItems: DailyMenuItem[]) => {
    setSelectedDrink(menuItems.length ? menuItems[0] : undefined);
  };

  const handleCreateStudent = async (
    student: Student,
    studentLunchTimes: StudentLunchTime[],
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
          })),
        );

      setCurrentSchoolYear(updatedSchoolYear);
      setSchoolYears(
        schoolYears.map((sy) =>
          sy.id !== updatedSchoolYear.id ? sy : updatedSchoolYear,
        ),
      );
    }
    setSelectedPersonId(newStudent.id);
  };

  const updateStudentLunchTimes = (
    student: Student,
    lunchTimes: StudentLunchTime[],
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
        })),
      );

    setCurrentSchoolYear(updatedSchoolYear);
    setSchoolYears(
      schoolYears.map((sy) =>
        sy.id !== updatedSchoolYear.id ? sy : updatedSchoolYear,
      ),
    );
  };

  const handleStudentLunchTimeDialogClosed = (saved: boolean) => {
    setShowStudentLunchTimeDialog(false);
    if (!saved) {
      setSelectedPersonId(0);
      setSelectedNonFamilyStudent(null);
    }
  };

  const handleStaffLunchtimeDialogClosed = (selectedTime?: string) => {
    setShowStaffLunchtimeDialog(false);
    setStaffLunchtime(selectedTime);
    if (!selectedTime) {
      setSelectedPersonId(0);
      setSelectedStaffMember(null);
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
        users.concat(
          parents.filter((p) => !users.some((u) => u.id === p.id)),
        ),
      );
      setOrders(
        orders
          .filter((o) => !ordersForStudent.some((os) => os.id === o.id))
          .concat(ordersForStudent),
      );

      if (currentSchoolYear.id) {
        updateStudentLunchTimes(updatedStudent, lunchTimes);
      }
      setSelectedPersonId(updatedStudent.id);
    } else if (!existingStudent.parents.includes(user.id)) {
      setStudents(
        students.map((s) =>
          s.id === student.id ? { ...s, parents: [...s.parents, user.id] } : s,
        ),
      );
      setSelectedPersonId(student.id);
    } else {
      setSelectedPersonId(student.id);
    }
  };

  useEffect(() => {
    const entrees = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.ENTREE,
    );
    const sides = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.SIDE,
    );
    const desserts = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.DESSERT,
    );
    const drinks = menu.items.filter(
      (item) =>
        pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
          ?.type === PantryItemType.DRINK,
    );

    if (siblings.length === 1) {
      if (
        currentSchoolYear.studentLunchTimes.find(
          (slt) =>
            slt.studentId === siblings[0].id && slt.dayOfWeek === dayOfWeek,
        )
      ) {
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
    selectedGrade: GradeLevel,
  ) => {
    return schoolYear.gradesAssignedByClass.includes(selectedGrade) ?? false;
  };

  const studentGradeLevel =
    selectedPersonId !== MY_ID
      ? (currentSchoolYear.studentLunchTimes.find(
          (stl) => stl.studentId === selectedPersonId,
        )?.grade ?? GradeLevel.UNKNOWN)
      : GradeLevel.UNKNOWN;

  const isTeacherRequired = getIsTeacherSelectionRequired(
    currentSchoolYear,
    studentGradeLevel,
  );
  const teacherId = currentSchoolYear.studentLunchTimes.find(
    (slt) =>
      slt.studentId === selectedStudent?.id && slt.dayOfWeek === dayOfWeek,
  )?.teacherId;

  const assignedTeacher = users.find(
    (u) => u.role === Role.TEACHER && u.id === teacherId,
  );

  const entrees = !menu
    ? []
    : menu.items.filter(
        (item) =>
          pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
            ?.type === PantryItemType.ENTREE,
      );
  const sides = !menu
    ? []
    : menu.items.filter(
        (item) =>
          pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
            ?.type === PantryItemType.SIDE,
      );
  const desserts = !menu
    ? []
    : menu.items.filter(
        (item) =>
          pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
            ?.type === PantryItemType.DESSERT,
      );
  const drinks = !menu
    ? []
    : menu.items.filter(
        (item) =>
          pantryItems.find((pantryItem) => pantryItem.id === item.pantryItemId)
            ?.type === PantryItemType.DRINK,
      );

  useEffect(() => {
    setIsAddToCartEnabled(false);
    const orderingForStaff =
      user.role === Role.ADMIN && dinerType === "staff";
    if (orderingForStaff) {
      if (
        !selectedStaffMember ||
        (!hasAssignedStaffLunchTime(selectedStaffMember) && !staffLunchtime)
      ) {
        return;
      }
    } else if (
      (selectedPersonId !== MY_ID && selectedPersonId <= 0) ||
      (selectedPersonId !== MY_ID && !studentGradeLevel) ||
      (selectedPersonId !== MY_ID && isTeacherRequired && !assignedTeacher)
    ) {
      return;
    }

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
          : false,
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
    dinerType,
    selectedStaffMember,
    staffLunchtime,
  ]);

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
          {user.role === Role.ADMIN ? (
            <>
              <FormControl component="fieldset">
                <FormLabel component="legend">Order For</FormLabel>
                <RadioGroup
                  row
                  value={dinerType}
                  onChange={(event) =>
                    handleDinerTypeChanged(event.target.value as DinerType)
                  }
                >
                  <FormControlLabel
                    value="student"
                    control={<Radio />}
                    label="Student"
                  />
                  <FormControlLabel
                    value="staff"
                    control={<Radio />}
                    label="Teacher / Staff"
                  />
                </RadioGroup>
              </FormControl>
              {dinerType === "student" ? (
                <StudentAutoCompleteSelector
                  value={selectedNonFamilyStudent}
                  onChange={handleNonFamilyStudentSelected}
                  label="Select Student"
                />
              ) : (
                <StaffAutoCompleteSelector
                  value={selectedStaffMember}
                  onChange={handleStaffMemberSelected}
                  label="Select Teacher / Staff"
                />
              )}
            </>
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
      {showStudentLunchTimeDialog && selectedStudent ? (
        <StudentLunchtimeDialog
          student={selectedStudent}
          onClose={handleStudentLunchTimeDialogClosed}
        />
      ) : (
        <></>
      )}
    </Dialog>
  );
};

export default OrderMealDialog;
