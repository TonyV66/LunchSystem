import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { grey } from "@mui/material/colors";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { DateTimeUtils } from "../../DateTimeUtils";
import User, { Role } from "../../models/User";
import MenuItemChip from "../meals/MenuItemChip";
import { ExpandMore } from "@mui/icons-material";
import { getMealsAtTime, getMealsWithIrregularTimes } from "../../ReportUtils";

interface StudentMealReportProps {
  student: Student;
  date: string;
  large?: boolean;
}

interface StaffMealReportProps {
  staffMember: User;
  date: string;
  large?: boolean;
}

interface MealReportProps {
  meals: Meal[];
  title: string;
  large?: boolean;
}

const HourlyMealReport: React.FC<{
  date: string;
  time?: string;
  large?: boolean;
}> = ({ date, time, large }) => {
  const { students, users, currentSchoolYear, orders } =
    React.useContext(AppContext);

  const teachers = users.filter((user) => user.role === Role.TEACHER);

  const meals = time
    ? getMealsAtTime(orders, teachers, students, currentSchoolYear, date, time)
    : getMealsWithIrregularTimes(
        orders,
        teachers,
        students,
        currentSchoolYear,
        date
      );

  // Use Sets to store unique staff and students
  const staffSet = new Set<User>();
  const studentSet = new Set<Student>();

  meals.forEach((meal) => {
    if (meal.staffMemberId) {
      const staffMember = users.find((u) => u.id === meal.staffMemberId);
      if (staffMember) {
        staffSet.add(staffMember);
      }
    }
    if (meal.studentId) {
      const student = students.find((s) => s.id === meal.studentId);
      if (student) {
        studentSet.add(student);
      }
    }
  });

  // Convert Sets to arrays and sort
  const sortedStaff = Array.from(staffSet).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });
  const sortedStudents = Array.from(studentSet).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });

  if (sortedStaff.length === 0 && sortedStudents.length === 0) {
    return <></>;
  }

  const summaryText = time
    ? DateTimeUtils.toTwelveHourTime(time)
    : `Other/Unknown Times`;

  return (
    <Accordion elevation={3}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1-content"
      >
        <Typography variant="h6" fontWeight="bold">
          {summaryText}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          {sortedStaff.map((staffMember) => (
            <StaffMealReport
              large={large}
              key={staffMember.id}
              staffMember={staffMember}
              date={date}
            />
          ))}
          {sortedStudents.map((student) => (
            <StudentMealReport
              large={large}
              key={student.id}
              student={student}
              date={date}
            />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const MealReport: React.FC<MealReportProps> = ({ meals, title, large }) => {
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
        <Typography variant={large ? "h6" : "body2"}>{title}</Typography>
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
              <MenuItemChip
                textVariant={large ? "h6" : undefined}
                key={item.id}
                menuItem={item}
              />
            ))}
        </Box>
      ))}
    </>
  );
};

const StaffMealReport: React.FC<StaffMealReportProps> = ({
  staffMember,
  date,
  large,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter((m) => m.staffMemberId === staffMember.id && m.date === date);

  if (!meals.length) {
    return <></>;
  }

  const title =
    staffMember.firstName && staffMember.lastName
      ? staffMember.firstName + " " + staffMember.lastName
      : staffMember.userName;
  return <MealReport large={large} meals={meals} title={title} />;
};

const StudentMealReport: React.FC<StudentMealReportProps> = ({
  student,
  date,
  large,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter((m) => m.studentId === student.id && m.date === date);

  if (!meals.length) {
    return <></>;
  }

  return (
    <MealReport
      large={large}
      meals={meals}
      title={student.firstName + " " + student.lastName}
    />
  );
};

export default HourlyMealReport;
