import React, { useContext } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import Student from "../../models/Student";
import MenuItemChip from "./MenuItemChip";
import { grey } from "@mui/material/colors";
import Meal from "../../models/Meal";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import ShoppingCartTable from "../shoppingcart/ShoppingCartTable";
import User from "../../models/User";

interface StudentMealsTableProps {
  date: string;
  student: Student;
}

interface StaffMealsTableProps {
  date: string;
  staffMember: User;
}

interface MealsTableProps {
  title: string;
  meals: Meal[];
}

const OrderedMealDescription: React.FC<{
  meal: Meal;
}> = ({ meal }) => {
  return (
    <Box
      sx={{
        p: 1,
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        alignItems: "center",
        gap: 1,
        borderBottomWidth: "1px",
        borderBottomColor: grey[400],
        borderBottomStyle: "solid",
      }}
    >
      {meal.items
        .sort(
          (item1, item2) =>
            item1.type - item2.type ||
            item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
        )
        .map((item) => (
          <MenuItemChip
            key={item.name + ":" + item.type.toString()}
            menuItem={item}
          ></MenuItemChip>
        ))}
    </Box>
  );
};

const MealsTable: React.FC<MealsTableProps> = ({ title, meals }) => {
  return (
    <>
      <Box
        sx={{
          gridRow: "span " + meals.length,
          borderBottomWidth: "1px",
          borderBottomColor: grey[400],
          borderBottomStyle: "solid",
          borderRightWidth: "1px",
          borderRightColor: grey[400],
          borderRightStyle: "solid",
          p: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography textAlign="left">{title}</Typography>
      </Box>

      {meals.map((meal) => (
        <OrderedMealDescription key={meal.id} meal={meal} />
      ))}
    </>
  );
};

const StudentMealsTable: React.FC<StudentMealsTableProps> = ({
  date,
  student,
}) => {
  const { orders } = useContext(AppContext);

  const meals = orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date && meal.studentId === student.id);
  if (!meals.length) {
    return <></>;
  }

  return <MealsTable title={student.name} meals={meals} />;
};

const StaffMealsTable: React.FC<StaffMealsTableProps> = ({
  date,
  staffMember,
}) => {
  const { orders } = useContext(AppContext);

  const meals = orders
    .flatMap((order) => order.meals)
    .filter(
      (meal) => meal.date === date && meal.staffMemberId === staffMember.id
    );
  if (!meals.length) {
    return <></>;
  }

  return (
    <MealsTable
      title={
        staffMember.firstName.length && staffMember.lastName.length
          ? staffMember.firstName + " " + staffMember.lastName
          : staffMember.userName
      }
      meals={meals}
    />
  );
};

interface DialogProps {
  date: string;
  user: User;
  onClose: () => void;
}

const DailyMealsDialog: React.FC<DialogProps> = ({ date, onClose, user }) => {
  const { orders, shoppingCart, scheduledMenus } =
    useContext(AppContext);

  const { students } = useContext(AppContext);
  const siblings = students.filter(s => s.parents.includes(user.id))
  
  const hasOrderedMeals = orders
    .flatMap((order) => order.meals)
    .find((meal) => meal.date === date)
    ? true
    : false;

  const menu = scheduledMenus.find((menu) => menu.date === date);

  const hasMealsInCart = shoppingCart.items.find(
    (item) => item.dailyMenuId === menu?.id
  )
    ? true
    : false;

  return (
    <Dialog
      open={true}
      maxWidth={"md"}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle>
        Meals for
        {" " +
          DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {hasOrderedMeals ? (
            <Box>
              <Typography fontWeight="bold">Ordered</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: grey[400],
                }}
              >
                <StaffMealsTable
                  date={date}
                  staffMember={user}
                ></StaffMealsTable>
                {Array.from(siblings)
                  .sort((s1, s2) => {
                    return s1.name
                      .toLowerCase()
                      .localeCompare(s2.name.toLowerCase());
                  })
                  .map((student) => (
                    <StudentMealsTable
                      key={student.id}
                      date={date}
                      student={student}
                    ></StudentMealsTable>
                  ))}
              </Box>
            </Box>
          ) : (
            <></>
          )}
          {hasMealsInCart ? (
            <Box>
              <Typography fontWeight="bold">In Cart</Typography>
              <ShoppingCartTable
                date={date}
                editable={false}
                hidePrice={true}
                hideDate={true}
                hideTitlebar={true}
              ></ShoppingCartTable>
            </Box>
          ) : (
            <></>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyMealsDialog;
