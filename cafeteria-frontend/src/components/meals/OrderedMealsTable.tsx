import React, { useContext } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import MenuItemChip from "./MenuItemChip";
import { grey, yellow } from "@mui/material/colors";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { Delete } from "@mui/icons-material";
import Meal from "../../models/Meal";
import User from "../../models/User";

interface StudentDailyOrdersProps {
  date: string;
  orders: Order[];
  student?: Student;
  staffMember?: User;
  hidePrice?: boolean;
  highlightMealsNotOrderedByMe?: boolean;
  onDelete?: (meal: Meal) => void;
}

const StudentMealDescription: React.FC<{
  meal: Meal;
  hidePrice?: boolean;
  onDelete?: (meal: Meal) => void;
  orderedBy?: string;
}> = ({ meal, onDelete, hidePrice, orderedBy }) => {
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
          backgroundColor: orderedBy ? yellow[500] : undefined,
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

const getUserName = (user?: User): string => {
  if (!user) {
    return "Unknown";
  } else if (user.firstName && user.lastName) {
    return user.firstName + " " + user.lastName;
  }
  return user.userName;
};

const DailyOrdersForPerson: React.FC<StudentDailyOrdersProps> = ({
  orders,
  date,
  student,
  staffMember,
  hidePrice,
  onDelete,
  highlightMealsNotOrderedByMe,
}) => {
  const { user, users } = useContext(AppContext);

  const mealsOrderedBySomeoneElse = new Map<number, string>();
  orders
    .filter((o) => o.userId !== user.id)
    .forEach((o) =>
      o.meals.forEach((m) =>
        mealsOrderedBySomeoneElse.set(
          m.id,
          getUserName(users.find((u) => u.id === o.userId))
        )
      )
    );

  const meals = orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date && ((student && meal.studentId === student.id) || (staffMember && meal.staffMemberId === staffMember.id)));

  let title = student?.name ?? "Unknown";
  if (staffMember) {
    title = getUserName(staffMember);
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
        <Typography textAlign="left">{title}</Typography>
      </Box>

      {meals.map((meal) => (
        <StudentMealDescription
          orderedBy={
            highlightMealsNotOrderedByMe
              ? mealsOrderedBySomeoneElse.get(meal.id)
              : undefined
          }
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
  students?: Student[]
  onDelete?: (meal: Meal) => void;
  highlightMealsNotOrderedByMe?: boolean;
  includeMealsForStaff?: boolean;
}
interface Person {
  student?: Student;
  staffMember?: User;
}

const DailyOrders: React.FC<DailyOrdersProps> = ({
  orders,
  date,
  onDelete,
  hideDate,
  hidePrice,
  highlightMealsNotOrderedByMe,
  includeMealsForStaff,
  students,
}) => {
  const { users, students: allStudents } = useContext(AppContext);

  const uniqueStudents = new Set<Student>();
  const uniqueStaffMembers = new Set<User>();
  const meals = orders
    .flatMap((order) => order.meals)
    .filter(
      (meal) => (includeMealsForStaff || meal.studentId) && meal.date === date
    );

  meals
    .filter(meal => meal.studentId)
    .map((meal) => (students || allStudents).find((student) => student.id === meal.studentId)!)
    .forEach((student) => uniqueStudents.add(student));

  meals
    .filter(meal => meal.staffMemberId)
    .map((meal) => users.find((user) => user.id === meal.staffMemberId)!)
    .forEach((user) => uniqueStaffMembers.add(user));

  const uniquePersons: Person[] = [
    ...Array.from(uniqueStudents).map(student => ({ student, staffMember: undefined })),
    ...Array.from(uniqueStaffMembers).map(staffMember => ({ student: undefined, staffMember }))
  ].sort((a, b) => {
    const nameA = a.student?.name ?? (a.staffMember?.firstName + " " + a.staffMember?.lastName).trim();
    const nameB = b.student?.name ?? (b.staffMember?.firstName + " " + b.staffMember?.lastName).trim();
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
  });

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

      {uniquePersons.map((person) => (
        <DailyOrdersForPerson
          key={person.student ? "s" + person.student.id : "m" + person.staffMember!.id}
          orders={orders}
          date={date}
          student={person.student}
          staffMember={person.staffMember}
          hidePrice={hidePrice}
          onDelete={onDelete}
          highlightMealsNotOrderedByMe={highlightMealsNotOrderedByMe}
        ></DailyOrdersForPerson>
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
  students?: Student[]
  onDelete?: (meal: Meal) => void;
  highlightMealsNotOrderedByMe?: boolean;
  includeMealsForStaff?: boolean;
}

const OrderedMealsTable: React.FC<OrdersTableProps> = ({
  orders,
  onDelete,
  startDate,
  endDate,
  hideDate,
  hidePrice,
  hideTitlebar,
  highlightMealsNotOrderedByMe,
  includeMealsForStaff,
  students,
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
          <Typography fontWeight="bold">Name</Typography>
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
      {onDelete && !hideTitlebar ? (
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
              students={students}
              orders={orders}
              date={date}
              onDelete={onDelete}
              hideDate={hideDate}
              hidePrice={hidePrice}
              highlightMealsNotOrderedByMe={highlightMealsNotOrderedByMe}
              includeMealsForStaff={includeMealsForStaff}
            ></DailyOrders>
          ))
      )}
    </Box>
  );
};

export default OrderedMealsTable;
