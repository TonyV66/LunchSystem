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
import { StudentLunchTime } from "../../models/StudentLunchTime";
import TeacherLunchTime from "../../models/TeacherLunchTime";

interface TallyRowProps {
  date: string;
  menuItem: PantryItem;
  mealTimes: string[];
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

const getOrderedQty = (
  orders: Order[],
  menuItem: PantryItem,
  teachers: User[],
  teacherLunchTimes: TeacherLunchTime[],
  students: Student[],
  studentLunchTimes: StudentLunchTime[],
  date: string,
  time?: string
): number => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const teacherIds = teachers
    .filter((teacher) => !time || getMealTime(teacher, teacherLunchTimes, date) === time)
    .map((teacher) => teacher.id);
  const studentIds = students
    .filter((student) =>
      studentLunchTimes.find(
        (lt) =>
          lt.studentId === student.id && lt.dayOfWeek === dayOfWeek && teacherIds.includes(lt.teacherId ?? 0)
      )
        ? true
        : false
    )
    .map((student) => student.id);

  const qty = orders
    .flatMap((order) => order.meals)
    .filter((meal) => studentIds.includes(meal.studentId) && meal.date === date)
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

const TallyRow: React.FC<TallyRowProps> = ({ date, menuItem, mealTimes }) => {
  const { users, students, orders, studentLunchTimes, teacherLunchTimes } = React.useContext(AppContext);
  const teachers = users.filter((user) => user.role === Role.TEACHER);
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
          {getOrderedQty(orders, menuItem, teachers, teacherLunchTimes, students, studentLunchTimes, date)}
        </Typography>
      </TableCell>
      {mealTimes.map((time) => (
        <TableCell key={time}>
          <Typography variant="h6">
            {getOrderedQty(orders, menuItem, teachers, teacherLunchTimes, students, studentLunchTimes, date, time)}
          </Typography>
        </TableCell>
      ))}
    </>
  );
};

const getMealTime = (teacher: User, teacherLunchTimes: TeacherLunchTime[], date: string) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  return (
    teacherLunchTimes.find((lunchTime) => lunchTime.teacherId === teacher.id && lunchTime.dayOfWeek === dayOfWeek)
      ?.time ?? "12:00"
  );
};

// eslint-disable-next-line react/display-name
const CafeteriaReport = React.forwardRef<HTMLDivElement, CafeteriaReportProps>(
  (props, ref) => {
    const { scheduledMenus, users, orders, teacherLunchTimes } = React.useContext(AppContext);

    const mealTimes = Array.from(
      new Set(
        users
          .filter((user) => user.role === Role.TEACHER)
          .map((teacher) => getMealTime(teacher, teacherLunchTimes, props.date))
      )
    ).sort();

    const menuItems = getMenuItems(orders, scheduledMenus, props.date).sort(
      (item1, item2) =>
        item1.type - item2.type ||
        item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
    );

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
            {menuItems.map((menuItem, index) => (
              <TallyRow
                key={index}
                date={props.date}
                menuItem={menuItem}
                mealTimes={mealTimes}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }
);
export default CafeteriaReport;
