import React, { useContext } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import PantryItemChip from "./PantryItemChip";
import { grey, yellow } from "@mui/material/colors";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { Delete } from "@mui/icons-material";
import Meal from "../../models/Meal";
import User, { Role } from "../../models/User";
import CancelMealDialog from "../orders/CancelMealDialog";

interface StudentDailyOrdersProps {
  date: string;
  orders: Order[];
  student?: Student;
  staffMember?: User;
  hidePrice?: boolean;
  highlightMealsNotOrderedByMe?: boolean;
  onDelete?: (meal: Meal) => void;
  hideCancelledMeals?: boolean;
}

const MealDescription: React.FC<{
  meal: Meal;
  hidePrice?: boolean;
  onDelete?: (meal: Meal) => void;
  orderedBy?: string;
}> = ({ meal, onDelete, hidePrice, orderedBy }) => {
  const { pantryItems } = useContext(AppContext);

  const amountPaid = meal.items
    .map((item) => item.price)
    .reduce((prev, curr) => prev + curr, 0);

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
          position: "relative",
        }}
      >
        {meal.cancelled && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: "bold",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              CANCELLED
            </Typography>
          </Box>
        )}
        {meal.items
          .map(
            (item) =>
              pantryItems.find(
                (pantryItem) => pantryItem.id === item.pantryItemId,
              )!,
          )
          .sort((item1, item2) => {
            return (
              item1.type - item2.type ||
              item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
            );
          })
          .map((item) => (
            <PantryItemChip key={item.id} pantryItem={item}></PantryItemChip>
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
          <Typography
            sx={{
              textDecoration:
                meal.refundType && amountPaid > 0 ? "line-through" : "none",
            }}
          >
            ${amountPaid.toFixed(2)}
          </Typography>
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
            disabled={meal.cancelled}
            size="small"
            aria-label="delete"
            color="primary"
          >
            <Delete />
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
  hideCancelledMeals,
}) => {
  const { user, users } = useContext(AppContext);

  const mealsOrderedBySomeoneElse = new Map<number, string>();
  orders
    .filter((o) => o.userId !== user.id)
    .forEach((o) =>
      o.meals.forEach((m) =>
        mealsOrderedBySomeoneElse.set(
          m.id,
          getUserName(users.find((u) => u.id === o.userId)),
        ),
      ),
    );

  const meals = orders
    .flatMap((order) => order.meals)
    .filter(
      (meal) =>
        (!hideCancelledMeals || !meal.cancelled) &&
        meal.date === date &&
        ((student && meal.studentId === student.id) ||
          (staffMember && meal.staffMemberId === staffMember.id)),
    );

  let title = student ? student.firstName + " " + student.lastName : "Unknown";
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
        <MealDescription
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
  students: Student[];
  staffMembers: User[];
  onDelete?: (meal: Meal) => void;
  highlightMealsNotOrderedByMe?: boolean;
  hideCancelledMeals?: boolean;
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
  students,
  staffMembers,
  hideCancelledMeals,
}) => {
  const studentIds = new Set<number>(students.map((student) => student.id));
  const staffMemberIds = new Set<number>(staffMembers.map((user) => user.id));

  const meals = orders
    .flatMap((order) => order.meals)
    .filter(
      (meal) =>
        (!hideCancelledMeals || !meal.cancelled) &&
        meal.date === date &&
        ((meal.studentId && studentIds.has(meal.studentId)) ||
          (meal.staffMemberId && staffMemberIds.has(meal.staffMemberId))),
    );

  const studentsWithMeals = students.filter((student) =>
    meals.some((meal) => meal.studentId === student.id),
  );
  const staffMembersWithMeals = staffMembers.filter((user) =>
    meals.some((meal) => meal.staffMemberId === user.id),
  );

  const uniquePersons: Person[] = [
    ...Array.from(studentsWithMeals).map((student) => ({
      student,
      staffMember: undefined,
    })),
    ...Array.from(staffMembersWithMeals).map((staffMember) => ({
      student: undefined,
      staffMember,
    })),
  ].sort((a, b) => {
    const nameA = a.student
      ? a.student.firstName + " " + a.student.lastName
      : a.staffMember?.firstName + " " + a.staffMember?.lastName;
    const nameB = b.student
      ? b.student.firstName + " " + b.student.lastName
      : b.staffMember?.firstName + " " + b.staffMember?.lastName;
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
  });

  if (!meals.length) {
    return <></>;
  }

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
              DateTimeFormat.SHORT_DAY_OF_WEEK_DESC,
            )}
          </Typography>
        </Box>
      ) : (
        <></>
      )}

      {uniquePersons.map((person) => (
        <DailyOrdersForPerson
          key={
            person.student
              ? "s" + person.student.id
              : "m" + person.staffMember!.id
          }
          orders={orders}
          date={date}
          student={person.student}
          staffMember={person.staffMember}
          hidePrice={hidePrice}
          onDelete={onDelete}
          hideCancelledMeals={hideCancelledMeals}
          highlightMealsNotOrderedByMe={highlightMealsNotOrderedByMe}
        ></DailyOrdersForPerson>
      ))}
    </>
  );
};

interface OrdersTableProps {
  order?: Order;
  onDelete?: (meal: Meal) => void;
  user?: User;
  student?: Student;
  startDate?: string;
  endDate?: string;
  hidePrice?: boolean;
  hideDate?: boolean;
  hideTitlebar?: boolean;
  hideCancelledMeals?: boolean;
  highlightMealsNotOrderedByMe?: boolean;
}

const OrderedMealsTable: React.FC<OrdersTableProps> = ({
  order,
  onDelete,
  user,
  student,
  startDate,
  endDate,
  hideDate,
  hidePrice,
  hideTitlebar,
  hideCancelledMeals,
  highlightMealsNotOrderedByMe,
}) => {
  const {
    orders: allOrders,
    students: allStudents,
    users,
    user: loggedInUser,
  } = useContext(AppContext);

  const [mealToCancel, setMealToCancel] = React.useState<Meal | null>(null);

  const orders = order ? [order] : allOrders;
  const students = (student ? [student] : allStudents).filter(
    (s) => !user || s.parents.includes(user.id),
  );
  const dates = new Set<string>();
  orders
    .flatMap((order) => order.meals)
    .filter((meal) => !hideCancelledMeals || !meal.cancelled)
    .map((meal) => meal.date)
    .filter((mealDate) => !startDate || mealDate >= startDate)
    .filter((mealDate) => !endDate || mealDate <= endDate)
    .forEach((date) => dates.add(date));

  let gridColumns = (hideDate ? "" : "auto") + " auto 1fr";
  if (!hidePrice) {
    gridColumns = gridColumns + " auto";
  }
  if (loggedInUser?.role === Role.ADMIN || onDelete) {
    gridColumns = gridColumns + " auto";
  }

  const showDeleteButton = loggedInUser?.role === Role.ADMIN || onDelete;
  return (
    <>
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
              borderRightWidth: showDeleteButton || !hidePrice ? "1px" : "0px",
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
              borderRightWidth: showDeleteButton ? "1px" : "0px",
              borderRightColor: grey[400],
              borderRightStyle: "solid",
              borderBottomWidth: "1px",
              borderBottomColor: grey[400],
              borderBottomStyle: "solid",
              p: 1,
            }}
          >
            <Typography fontWeight="bold">Cost</Typography>
          </Box>
        ) : (
          <></>
        )}
        {showDeleteButton && !hideTitlebar ? (
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
              gridColumn:
                "1/span " + (loggedInUser?.role === Role.ADMIN ? "5" : "4"),
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
                staffMembers={!student ? users : []}
                orders={orders}
                date={date}
                hideCancelledMeals={hideCancelledMeals}
                onDelete={
                  onDelete || showDeleteButton ? setMealToCancel : undefined
                }
                hideDate={hideDate}
                hidePrice={hidePrice}
                highlightMealsNotOrderedByMe={highlightMealsNotOrderedByMe}
              ></DailyOrders>
            ))
        )}
      </Box>
      {mealToCancel && (
        <CancelMealDialog
          onClose={() => {
            setMealToCancel(null);
          }}
          meal={mealToCancel}
        />
      )}
    </>
  );
};

export default OrderedMealsTable;
