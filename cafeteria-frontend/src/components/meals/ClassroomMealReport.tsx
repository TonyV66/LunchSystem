import * as React from "react";
import { Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { grey } from "@mui/material/colors";
import MenuItemChip from "./MenuItemChip";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { DateTimeUtils } from "../../DateTimeUtils";
import User from "../../models/User";

interface StudentMealReportProps {
  student: Student;
  date: string;
}

interface StaffMealReportProps {
  staffMember: User;
  date: string;
}

interface MealReportProps {
  meals: Meal[];
  title: string;
}

const ClassroomMealReport: React.FC<{ date: string; teacherId: number }> = ({
  date,
  teacherId,
}) => {
  const { students, user, users, currentSchoolYear } = React.useContext(AppContext);

  const staffMember = users.find((u) => u.id === teacherId) || user;
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const sortedStudents = students
    .filter((student) =>
      currentSchoolYear.studentLunchTimes.find(
        (lt) =>
          lt.studentId === student.id &&
          lt.dayOfWeek === dayOfWeek &&
          lt.teacherId == teacherId
      )
        ? true
        : false
    )
    .sort((s1, s2) =>
      s1.name.toLowerCase().localeCompare(s2.name.toLowerCase())
    );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <StaffMealReport key={user.id} staffMember={staffMember} date={date} />
      {sortedStudents.map((student) => (
        <StudentMealReport key={student.id} student={student} date={date} />
      ))}
    </Box>
  );
};

const MealReport: React.FC<MealReportProps> = ({
  meals,
  title,
}) => {

  if (!meals.length) {
    return <></>;
  }

  return (
    <>
      <Box
        sx={{
          borderBottomWidth: "1px",
          borderBottomColor: grey[400],
          borderBottomStyle: "solid",
          borderRightWidth: "1px",
          borderRightColor: grey[400],
          borderRightStyle: "solid",
          p: 1,
          gridRowEnd: meals.length > 1 ? "span " + meals.length : undefined,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2">{title}</Typography>
      </Box>
      {meals.map((meal) => (
        <Box
          key={meal.id}
          sx={{
            borderBottomWidth: "1px",
            borderBottomColor: grey[400],
            borderBottomStyle: "solid",
            p: 1,
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "row",
            gap: 1,
          }}
        >
          {[...meal.items]
            .sort((item1, item2) => {
              return (
                item1.type - item2.type ||
                item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
              );
            })
            .map((item) => (
              <MenuItemChip key={item.id} menuItem={item} />
            ))}
        </Box>
      ))}
    </>
  );
};


const StaffMealReport: React.FC<StaffMealReportProps> = ({
  staffMember,
  date,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter((m) => m.staffMemberId === staffMember.id && m.date === date);

  if (!meals.length) {
    return <></>;
  }

  const title = staffMember.firstName && staffMember.lastName ? staffMember.firstName + " " + staffMember.lastName : staffMember.userName;
  return (
    <MealReport meals={meals} title={title} />
  );
};

const StudentMealReport: React.FC<StudentMealReportProps> = ({
  student,
  date,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter((m) => m.studentId === student.id && m.date === date);

  if (!meals.length) {
    return <></>;
  }

  return (
    <MealReport meals={meals} title={student.name} />
  );
};

export default ClassroomMealReport;
