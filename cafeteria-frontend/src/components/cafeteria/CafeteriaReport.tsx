import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import User, { Role } from "../../models/User";
import { DateTimeFormat, DateTimeUtils } from "../../DateTimeUtils";
import { grey } from "@mui/material/colors";
import { PantryItem, DailyMenu } from "../../models/Menu";
import { Order } from "../../models/Order";
import Student from "../../models/Student";
import MenuItemChip from "../meals/MenuItemChip";
import TeacherLunchTime from "../../models/TeacherLunchTime";
import SchoolYear from "../../models/SchoolYear";
import Meal from "../../models/Meal";

interface TallyRowProps {
  schoolYear: SchoolYear;
  date: string;
  menuItem: PantryItem;
  mealTimes: string[];
  students: Student[];
  teachers: User[];
  orders: Order[];
}

interface CafeteriaReportProps {
  date: string;
}

const getMenuItems = (
  orders: Order[],
  scheduledMenus: DailyMenu[],
  date: string
): PantryItem[] => {
  const orderedItems: PantryItem[] = [];

  orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date)
    .flatMap((meal) => meal.items)
    .forEach((orderedItem) => {
      const matchingItem = orderedItems.find(
        (item) =>
          item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
          item.type === orderedItem.type
      );
      if (!matchingItem) {
        orderedItems.push(orderedItem);
      }
    });

  const scheduledMenu = scheduledMenus.find((menu) => menu.date === date);
  const servedItems: PantryItem[] = scheduledMenu?.items ?? [];

  servedItems.forEach((orderedItem) => {
    const matchingItem = orderedItems.find(
      (item) =>
        item.name.toLowerCase() === orderedItem.name.toLowerCase() &&
        item.type === orderedItem.type
    );
    if (!matchingItem) {
      orderedItems.push(orderedItem);
    }
  });

  return orderedItems;
};

const getAssignedLunchtime = (
  student: Student | undefined,
  date: string,
  schoolYear: SchoolYear,
  teachers: User[]
) => {
  if (student === undefined) {
    return undefined;
  }

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  // First check if student has a specific teacher assignment
  const studentLunchTime = schoolYear.studentLunchTimes.find(
    (lt) => lt.studentId === student.id && lt.dayOfWeek === dayOfWeek
  );

  if (studentLunchTime?.teacherId) {
    const teacher = teachers.find((t) => t.id === studentLunchTime.teacherId);
    if (teacher) {
      const teacherLunchTime = schoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacherId === teacher.id && tlt.dayOfWeek === dayOfWeek
      );
      return teacherLunchTime?.times[0];
    }
  }

  // If no teacher assignment, check grade level assignment
  const gradeLunchTime = schoolYear.gradeLunchTimes.find(
    (glt) =>
      glt.grade === studentLunchTime?.grade && glt.dayOfWeek === dayOfWeek
  );

  return gradeLunchTime?.times[0];
};

const getMealsWithIrregularTimes = (
  orders: Order[],
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string
) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const lunchTimes =
    schoolYear.lunchTimes.find((lt) => lt.dayOfWeek === dayOfWeek)?.times ?? [];

  return orders
    .flatMap((order) => order.meals)
    .filter(
      (meal) =>
        meal.date === date &&
        !lunchTimes.includes(meal.time) &&
        !lunchTimes.includes(
          getAssignedLunchtime(
            students.find((student) => student.id === meal.studentId),
            date,
            schoolYear,
            teachers
          ) ?? ""
        )
    );
};

const getMealsAtTime = (
  orders: Order[],
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string,
  time?: string
) => {
  return orders
    .flatMap((order) => order.meals)
    .filter(
      (meal: Meal) =>
        meal.date === date &&
        (!time ||
          meal.time === time ||
          getAssignedLunchtime(
            students.find((student) => student.id === meal.studentId),
            date,
            schoolYear,
            teachers
          ) === time)
    );
};

const getOrderedQty = (
  orders: Order[],
  menuItem: PantryItem,
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string,
  time?: string
): number => {
  const meals =
    time === "other"
      ? getMealsWithIrregularTimes(orders, teachers, students, schoolYear, date)
      : getMealsAtTime(orders, teachers, students, schoolYear, date, time);
  const qty = meals
    .flatMap((meal) => meal.items)
    .filter(
      (orderedItem) =>
        menuItem.name.toLowerCase() === orderedItem.name.toLowerCase() &&
        menuItem.type === orderedItem.type
    ).length;

  return qty;
};

const TableCell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Box
      sx={{
        borderBottomWidth: "1px",
        borderBottomColor: grey[200],
        borderBottomStyle: "solid",
        borderRightWidth: "1px",
        borderRightColor: grey[200],
        borderRightStyle: "solid",
        p: 1,
      }}
    >
      {children}
    </Box>
  );
};

const TallyRow: React.FC<TallyRowProps> = ({
  date,
  menuItem,
  mealTimes,
  schoolYear,
  students,
  teachers,
  orders,
}) => {
  return (
    <>
      <TableCell>
        <MenuItemChip
          key={menuItem.name + ":" + menuItem.type.toString()}
          menuItem={menuItem}
          textVariant="body"
        ></MenuItemChip>
      </TableCell>
      <TableCell>
        <Typography variant="h6">
          {getOrderedQty(
            orders,
            menuItem,
            teachers,
            students,
            schoolYear,
            date
          )}
        </Typography>
      </TableCell>
      {mealTimes.map((time) => (
        <TableCell key={time}>
          <Typography variant="h6">
            {getOrderedQty(
              orders,
              menuItem,
              teachers,
              students,
              schoolYear,
              date,
              time
            )}
          </Typography>
        </TableCell>
      ))}
      <TableCell>
        <Typography variant="h6">
          {getOrderedQty(
            orders,
            menuItem,
            teachers,
            students,
            schoolYear,
            date,
            "other"
          )}
        </Typography>
      </TableCell>
    </>
  );
};

const getMealTime = (
  teacher: User,
  teacherLunchTimes: TeacherLunchTime[],
  date: string
) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  return (
    teacherLunchTimes.find(
      (lunchTime) =>
        lunchTime.teacherId === teacher.id && lunchTime.dayOfWeek === dayOfWeek
    )?.times[0] ?? "12:00"
  );
};

// eslint-disable-next-line react/display-name
const CafeteriaReport = React.forwardRef<HTMLDivElement, CafeteriaReportProps>(
  (props, ref) => {
    const { scheduledMenus, users, orders, students, currentSchoolYear } =
      React.useContext(AppContext);

    const mealTimes = Array.from(
      new Set(
        users
          .filter((user) => user.role === Role.TEACHER)
          .map((teacher) =>
            getMealTime(
              teacher,
              currentSchoolYear.teacherLunchTimes,
              props.date
            )
          )
      )
    ).sort();

    const menuItems = getMenuItems(orders, scheduledMenus, props.date).sort(
      (item1, item2) =>
        item1.type - item2.type ||
        item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
    );

    const teachers = users.filter((user) => user.role === Role.TEACHER);

    return (
      <Box ref={ref} p={2}>
        <Typography variant="h6" mb={1} fontWeight={"bold"}>
          {DateTimeUtils.toString(
            props.date,
            DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
          )}
        </Typography>
        <Box
          sx={{
            borderLeftidth: "1px",
            borderLeftColor: grey[200],
            borderLeftStyle: "solid",
            borderTopWidth: "1px",
            borderTopColor: grey[200],
            borderTopStyle: "solid",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "auto repeat(" + (mealTimes.length + 1) + ", 1fr)",
            }}
          >
            <TableCell>
              <Typography fontWeight="bold" variant="body1">
                Menu Item
              </Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight="bold" variant="body1">
                Total
              </Typography>
            </TableCell>
            {mealTimes.map((time) => (
              <TableCell key={time}>
                <Typography fontWeight="bold" variant="body1">
                  {DateTimeUtils.toTwelveHourTime(time)}
                </Typography>
              </TableCell>
            ))}
            <TableCell>
              <Typography fontWeight="bold" variant="body1">
                Other
              </Typography>
            </TableCell>
            {menuItems.map((menuItem, index) => (
              <TallyRow
                key={index}
                schoolYear={currentSchoolYear}
                date={props.date}
                menuItem={menuItem}
                mealTimes={mealTimes}
                students={students}
                teachers={teachers}
                orders={orders}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }
);
export default CafeteriaReport;
