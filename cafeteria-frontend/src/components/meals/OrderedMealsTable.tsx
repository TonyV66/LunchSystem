import React, { useContext } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import MenuItemChip from "./MenuItemChip";
import { grey } from "@mui/material/colors";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { Delete } from "@mui/icons-material";
import Meal from "../../models/Meal";

interface StudentDailyOrdersProps {
  date: string;
  orders: Order[];
  student: Student;
  hidePrice?: boolean;
  onDelete?: (meal: Meal) => void;
}

const StudentMealDescription: React.FC<{
  meal: Meal;
  hidePrice?: boolean;
  onDelete?: (meal: Meal) => void;
}> = ({ meal, onDelete, hidePrice }) => {
  return (
    <>
      <Box
        sx={{
          p: 1,
          display: "flex",
          flexWrap: "wrap",
          flexDirection: "row",
          alignItems: "center",
          gap: 1,
          borderRightWidth: "1px",
          borderRightColor: grey[400],
          borderRightStyle: "solid",
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
      {!hidePrice ? (
        <Box
          sx={{
            p: 1,
            borderRightWidth: onDelete ? "1px" : "0px",
            borderRightColor: grey[400],
            borderRightStyle: "solid",
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          $
          {meal.items
            .map((item) => item.price)
            .reduce((prev, curr) => prev + curr, 0)
            .toFixed(2)}
        </Box>
      ) : (
        <></>
      )}
      {onDelete ? (
        <Box
          sx={{
            p: 1,
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
          }}
        >
          <IconButton
            onClick={() => onDelete(meal)}
            size="small"
            aria-label="delete"
          >
            <Delete color="primary" />
          </IconButton>
        </Box>
      ) : (
        <></>
      )}
    </>
  );
};

const StudentDailyOrders: React.FC<StudentDailyOrdersProps> = ({
  orders,
  date,
  student,
  hidePrice,
  onDelete,
}) => {
  const meals = orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date && meal.studentId === student.id);

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
        <StudentMealDescription
          key={meal.id}
          meal={meal}
          onDelete={onDelete}
          hidePrice={hidePrice}
        />
      ))}
    </>
  );
};

interface DailyOrdersProps {
  date: string;
  hideDate?: boolean;
  hidePrice?: boolean;
  orders: Order[];
  onDelete?: (meal: Meal) => void;
}

const DailyOrders: React.FC<DailyOrdersProps> = ({
  orders,
  date,
  onDelete,
  hideDate,
  hidePrice,
}) => {
  const { students } = useContext(AppContext);

  const uniqueStudents = new Set<Student>();
  const meals = orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date);

  meals
    .map((meal) => students.find((student) => student.id === meal.studentId)!)
    .forEach((student) => uniqueStudents.add(student));

  return (
    <>
      {!hideDate ? (
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
          <Typography textAlign="left">
            {DateTimeUtils.toString(
              date,
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
            )}
          </Typography>
        </Box>
      ) : (
        <></>
      )}

      {Array.from(uniqueStudents)
        .sort((s1, s2) => {
          return s1.name.toLowerCase().localeCompare(s2.name.toLowerCase());
        })
        .map((student) => (
          <StudentDailyOrders
            key={student.id}
            orders={orders}
            date={date}
            student={student}
            hidePrice={hidePrice}
            onDelete={onDelete}
          ></StudentDailyOrders>
        ))}
    </>
  );
};

interface OrdersTableProps {
  orders: Order[];
  startDate?: string;
  endDate?: string;
  hidePrice?: boolean;
  hideDate?: boolean;
  hideTitlebar?: boolean;
  onDelete?: (meal: Meal) => void;
}

const OrderedMealsTable: React.FC<OrdersTableProps> = ({
  orders,
  onDelete,
  startDate,
  endDate,
  hideDate,
  hidePrice,
  hideTitlebar,
}) => {
  const dates = new Set<string>();
  orders
    .flatMap((order) => order.meals)
    .map((meal) => meal.date)
    .filter(
      (mealDate) =>
        (!startDate || mealDate >= startDate) &&
        (!endDate || mealDate <= endDate)
    )
    .forEach((date) => dates.add(date));

  let gridColumns = "auto 1fr";
  if (!hideDate) {
    gridColumns = "auto " + gridColumns;
  }
  if (!hidePrice) {
    gridColumns = gridColumns + " auto";
  }
  if (onDelete) {
    gridColumns = gridColumns + " auto";
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: gridColumns,
        borderWidth: "1px",
        borderColor: grey[400],
        borderStyle: "solid",
        backgroundColor: "white",
      }}
    >
      {!hideDate && !hideTitlebar ? (
        <Box
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            borderRightWidth: "1px",
            borderRightColor: grey[400],
            borderRightStyle: "solid",
            p: 1,
          }}
        >
          <Typography fontWeight="bold">Meal Date</Typography>
        </Box>
      ) : (
        <></>
      )}
      {!hideTitlebar ? (
        <Box
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            borderRightWidth: "1px",
            borderRightColor: grey[400],
            borderRightStyle: "solid",
            p: 1,
          }}
        >
          <Typography fontWeight="bold">Student Name</Typography>
        </Box>
      ) : (
        <></>
      )}

      {!hideTitlebar ? (
        <Box
          sx={{
            borderRightWidth: onDelete || !hidePrice ? "1px" : "0px",
            borderRightColor: grey[400],
            borderRightStyle: "solid",
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
          }}
        >
          <Typography fontWeight="bold">Meal</Typography>
        </Box>
      ) : (
        <></>
      )}
      {!hidePrice && !hideTitlebar ? (
        <Box
          sx={{
            borderRightWidth: onDelete ? "1px" : "0px",
            borderRightColor: grey[400],
            borderRightStyle: "solid",
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
          }}
        >
          <Typography fontWeight="bold">Price</Typography>
        </Box>
      ) : (
        <></>
      )}
      {onDelete&& !hideTitlebar ? (
        <Box
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
          }}
        ></Box>
      ) : (
        <></>
      )}
      {!dates.size ? (
        <Box
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
            gridColumn: "1/span " + (onDelete ? "5" : "4"),
          }}
        >
          No meals ordered
        </Box>
      ) : (
        Array.from(dates)
          .sort((d1, d2) => d1.localeCompare(d2))
          .map((date) => (
            <DailyOrders
              key={date}
              orders={orders}
              date={date}
              onDelete={onDelete}
              hideDate={hideDate}
              hidePrice={hidePrice}
            ></DailyOrders>
          ))
      )}
    </Box>
  );
};

export default OrderedMealsTable;
