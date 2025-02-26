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

interface StudentDailyOrdersProps {
  date: string;
  student: Student;
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

const StudentDailyOrders: React.FC<StudentDailyOrdersProps> = ({
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
        <Typography textAlign="left">{student.name}</Typography>
      </Box>

      {meals.map((meal) => (
        <OrderedMealDescription key={meal.id} meal={meal} />
      ))}
    </>
  );
};

interface DialogProps {
  date: string;
  onClose: () => void;
}

const DailyMealsDialog: React.FC<DialogProps> = ({ date, onClose }) => {
  const { students, orders, shoppingCart, scheduledMenus } =
    useContext(AppContext);

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
        {" "  + DateTimeUtils.toString(date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)}
      </DialogTitle>
      <DialogContent>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
          {hasOrderedMeals ? (
            <Box>
              <Typography fontWeight='bold'>Ordered</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: grey[400],
                }}
              >
                {Array.from(students)
                  .sort((s1, s2) => {
                    return s1.name
                      .toLowerCase()
                      .localeCompare(s2.name.toLowerCase());
                  })
                  .map((student) => (
                    <StudentDailyOrders
                      key={student.id}
                      date={date}
                      student={student}
                    ></StudentDailyOrders>
                  ))}
              </Box>
            </Box>
          ) : (
            <></>
          )}
          {hasMealsInCart ? (
            <Box>
              <Typography fontWeight='bold'>In Cart</Typography>
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
        <Button variant="contained" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyMealsDialog;
