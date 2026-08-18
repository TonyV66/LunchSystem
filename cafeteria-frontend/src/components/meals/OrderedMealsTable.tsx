import React, { useContext } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import PantryItemChip from "./PantryItemChip";
import { grey, yellow } from "@mui/material/colors";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { Delete } from "@mui/icons-material";
import Meal from "../../models/Meal";
import User, { Role } from "../../models/User";
import DailyMenu from "../../models/DailyMenu";
import CancelMealDialog from "../orders/CancelMealDialog";

type TableColumns = {
  date?: number;
  name: number;
  meal: number;
  cost?: number;
  cancel?: number;
};

const uniqueById = <T extends { id: number }>(items: T[]): T[] =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

const getTableColumns = (
  hideDate?: boolean,
  hidePrice?: boolean,
  showCancel?: boolean,
): { template: string; columns: TableColumns } => {
  const template: string[] = [];
  const columns: TableColumns = { name: 1, meal: 2 };
  let column = 1;
  if (!hideDate) {
    columns.date = column++;
    template.push("auto");
  }
  columns.name = column++;
  template.push("auto");
  columns.meal = column++;
  template.push("1fr");
  if (!hidePrice) {
    columns.cost = column++;
    template.push("auto");
  }
  if (showCancel) {
    columns.cancel = column++;
    template.push("auto");
  }
  return { template: template.join(" "), columns };
};

const isAcceptingOrders = (menu?: DailyMenu) => {
  if (!menu) {
    return false;
  }
  const now = DateTimeUtils.getCurrentDate();
  return (
    new Date(menu.orderStartTime) <= now && new Date(menu.orderEndTime) > now
  );
};

interface StudentDailyOrdersProps {
  date: string;
  orders: Order[];
  student?: Student;
  staffMember?: User;
  hidePrice?: boolean;
  highlightMealsNotOrderedByMe?: boolean;
  onDelete?: (meal: Meal) => void;
  showCancelForMeal?: (meal: Meal) => boolean;
  isCancelDisabled?: (meal: Meal) => boolean;
  hideCancelledMeals?: boolean;
  columns: TableColumns;
}

const MealDescription: React.FC<{
  meal: Meal;
  hidePrice?: boolean;
  onDelete?: (meal: Meal) => void;
  showCancelButton?: boolean;
  cancelDisabled?: boolean;
  orderedBy?: string;
  columns: TableColumns;
}> = ({ meal, onDelete, hidePrice, orderedBy, showCancelButton, cancelDisabled, columns }) => {
  const { pantryItems } = useContext(AppContext);

  const amountPaid = meal.items
    .map((item) => item.price)
    .reduce((prev, curr) => prev + curr, 0);

  return (
    <>
      <Box
        sx={{
          gridColumn: columns.meal,
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
            gridColumn: columns.cost,
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
            gridColumn: columns.cancel,
            p: 1,
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showCancelButton !== false ? (
            <Tooltip
              title={
                meal.cancelled
                  ? "Meal already cancelled"
                  : cancelDisabled
                    ? "Cancellations are no longer being accepted"
                    : "Cancel meal"
              }
            >
              <span>
                <IconButton
                  onClick={() => onDelete(meal)}
                  disabled={meal.cancelled || cancelDisabled}
                  size="small"
                  aria-label="cancel meal"
                  color="primary"
                >
                  <Delete />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
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
  showCancelForMeal,
  isCancelDisabled,
  highlightMealsNotOrderedByMe,
  hideCancelledMeals,
  columns,
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

  if (!meals.length) {
    return <></>;
  }

  let title = student ? student.firstName + " " + student.lastName : "Unknown";
  if (staffMember) {
    title = getUserName(staffMember);
  }
  return (
    <>
      <Box
        sx={{
          gridColumn: columns.name,
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
          showCancelButton={showCancelForMeal ? showCancelForMeal(meal) : true}
          cancelDisabled={isCancelDisabled ? isCancelDisabled(meal) : false}
          hidePrice={hidePrice}
          columns={columns}
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
  showCancelForMeal?: (meal: Meal) => boolean;
  isCancelDisabled?: (meal: Meal) => boolean;
  highlightMealsNotOrderedByMe?: boolean;
  hideCancelledMeals?: boolean;
  columns: TableColumns;
}
interface Person {
  student?: Student;
  staffMember?: User;
}

const DailyOrders: React.FC<DailyOrdersProps> = ({
  orders,
  date,
  onDelete,
  showCancelForMeal,
  isCancelDisabled,
  hidePrice,
  highlightMealsNotOrderedByMe,
  students,
  staffMembers,
  hideCancelledMeals,
  columns,
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

  const seenPersonKeys = new Set<string>();
  const uniquePersons: Person[] = [];
  for (const student of uniqueById(students)) {
    if (!meals.some((meal) => meal.studentId === student.id)) {
      continue;
    }
    const key = "s" + student.id;
    if (seenPersonKeys.has(key)) {
      continue;
    }
    seenPersonKeys.add(key);
    uniquePersons.push({ student });
  }
  for (const staffMember of uniqueById(staffMembers)) {
    if (!meals.some((meal) => meal.staffMemberId === staffMember.id)) {
      continue;
    }
    const key = "m" + staffMember.id;
    if (seenPersonKeys.has(key)) {
      continue;
    }
    seenPersonKeys.add(key);
    uniquePersons.push({ staffMember });
  }
  uniquePersons.sort((a, b) => {
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
      {columns.date ? (
        <Box
          sx={{
            gridColumn: columns.date,
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
          showCancelForMeal={showCancelForMeal}
          isCancelDisabled={isCancelDisabled}
          hideCancelledMeals={hideCancelledMeals}
          highlightMealsNotOrderedByMe={highlightMealsNotOrderedByMe}
          columns={columns}
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
  allowPurchaserCancel?: boolean;
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
  allowPurchaserCancel,
}) => {
  const {
    orders: allOrders,
    students: allStudents,
    users,
    user: loggedInUser,
    scheduledMenus,
  } = useContext(AppContext);

  const [mealToCancel, setMealToCancel] = React.useState<Meal | null>(null);

  const orders = order ? [order] : allOrders;
  const students = uniqueById(
    (student ? [student] : allStudents).filter(
      (s) => !user || s.parents.includes(user.id),
    ),
  );
  const staffMembers = uniqueById(
    student ? [] : user ? users.filter((u) => u.id === user.id) : users,
  );
  const dates = new Set<string>();
  orders
    .flatMap((order) => order.meals)
    .filter((meal) => !hideCancelledMeals || !meal.cancelled)
    .map((meal) => meal.date)
    .filter((mealDate) => !startDate || mealDate >= startDate)
    .filter((mealDate) => !endDate || mealDate <= endDate)
    .forEach((date) => dates.add(date));

  const showCancelColumn =
    Boolean(onDelete) ||
    loggedInUser?.role === Role.ADMIN ||
    Boolean(allowPurchaserCancel);

  const handleMealAction = onDelete ?? (showCancelColumn ? setMealToCancel : undefined);

  const showCancelForMeal = (meal: Meal) => {
    if (onDelete || loggedInUser?.role === Role.ADMIN) {
      return true;
    }
    if (!allowPurchaserCancel || !loggedInUser) {
      return false;
    }
    const mealOrder = orders.find((o) => o.meals.some((m) => m.id === meal.id));
    return mealOrder?.userId === loggedInUser.id;
  };

  const isCancelDisabled = (meal: Meal) => {
    if (meal.cancelled) {
      return true;
    }
    if (onDelete || loggedInUser?.role === Role.ADMIN) {
      return false;
    }
    const menu = scheduledMenus.find((m) => m.date === meal.date);
    return !isAcceptingOrders(menu);
  };

  const { template: gridColumns, columns } = getTableColumns(
    hideDate,
    hidePrice,
    showCancelColumn,
  );
  const emptyStateColumns =
    (hideDate ? 0 : 1) + 2 + (hidePrice ? 0 : 1) + (showCancelColumn ? 1 : 0);

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
              gridColumn: columns.date,
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
              gridColumn: columns.name,
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
              gridColumn: columns.meal,
              borderRightWidth: showCancelColumn || !hidePrice ? "1px" : "0px",
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
              gridColumn: columns.cost,
              borderRightWidth: showCancelColumn ? "1px" : "0px",
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
        {showCancelColumn && !hideTitlebar ? (
          <Box
            sx={{
              gridColumn: columns.cancel,
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
              gridColumn: "1/span " + emptyStateColumns,
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
                staffMembers={staffMembers}
                orders={orders}
                date={date}
                hideCancelledMeals={hideCancelledMeals}
                onDelete={handleMealAction}
                showCancelForMeal={showCancelForMeal}
                isCancelDisabled={isCancelDisabled}
                hideDate={hideDate}
                hidePrice={hidePrice}
                highlightMealsNotOrderedByMe={highlightMealsNotOrderedByMe}
                columns={columns}
              ></DailyOrders>
            ))
        )}
      </Box>
      {mealToCancel && !onDelete && (
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
