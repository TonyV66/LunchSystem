import * as React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import { AppContext } from "../../AppContextProvider";
import { grey } from "@mui/material/colors";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { DateTimeUtils } from "../../DateTimeUtils";
import User, { Role } from "../../models/User";
import { Order } from "../../models/Order";
import SchoolYear from "../../models/SchoolYear";
import MenuItemChip from "../meals/MenuItemChip";
import { ExpandMore } from "@mui/icons-material";

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

  const gradeLunchTime = schoolYear.gradeLunchTimes.find(
    (glt) =>
      glt.grade === studentLunchTime?.grade && glt.dayOfWeek === dayOfWeek
  );

  return gradeLunchTime?.times[0];
};

const getMealsAtTime = (
  orders: Order[],
  teachers: User[],
  students: Student[],
  schoolYear: SchoolYear,
  date: string,
  time: string
) => {
  return orders
    .flatMap((order) => order.meals)
    .filter(
      (meal: Meal) =>
        meal.date === date &&
        (meal.time === time ||
          getAssignedLunchtime(
            students.find((student) => student.id === meal.studentId),
            date,
            schoolYear,
            teachers
          ) === time)
    );
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

const HourlyMealReport: React.FC<{ date: string; time?: string }> = ({
  date,
  time,
}) => {
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
  const sortedStaff = Array.from(staffSet).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedStudents = Array.from(studentSet).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });

  if (sortedStaff.length === 0 && sortedStudents.length === 0) {
    return <></>;
  }

  const summaryText = time
    ? `Meals Served at ${DateTimeUtils.toTwelveHourTime(time)}`
    : `Meals Served at Other Times`;

  return (
    <Accordion elevation={3}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1-content"
      >
        <Typography fontWeight="bold">{summaryText}</Typography>
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
              key={staffMember.id}
              staffMember={staffMember}
              date={date}
            />
          ))}
          {sortedStudents.map((student) => (
            <StudentMealReport key={student.id} student={student} date={date} />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const MealReport: React.FC<MealReportProps> = ({ meals, title }) => {
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

  const title =
    staffMember.firstName && staffMember.lastName
      ? staffMember.firstName + " " + staffMember.lastName
      : staffMember.userName;
  return <MealReport meals={meals} title={title} />;
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

  return <MealReport meals={meals} title={student.firstName + " " + student.lastName} />;
};

export default HourlyMealReport;
