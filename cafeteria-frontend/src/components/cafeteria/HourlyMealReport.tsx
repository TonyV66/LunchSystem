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
import PantryItemChip from "../meals/PantryItemChip";
import { ExpandMore } from "@mui/icons-material";
import { getMealsAtTime, getMealsWithIrregularTimes } from "../../ReportUtils";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";

const gradeOrder = [
  GradeLevel.PRE_K2,
  GradeLevel.PRE_K3,
  GradeLevel.PRE_K4,
  GradeLevel.KINDERGARTEN,
  GradeLevel.FIRST,
  GradeLevel.SECOND,
  GradeLevel.THIRD,
  GradeLevel.FOURTH,
  GradeLevel.FIFTH,
  GradeLevel.SIXTH,
  GradeLevel.SEVENTH,
  GradeLevel.EIGHTH,
  GradeLevel.NINTH,
  GradeLevel.TENTH,
  GradeLevel.ELEVENTH,
  GradeLevel.TWELFTH,
  GradeLevel.UNKNOWN,
];

interface Classroom {
  teacher: User;
  grade: GradeLevel;
  students: Student[];
}

interface GradeLevelStudents {
  gradeLevel: GradeLevel;
  students: Student[];
}

interface StudentCohort {
  key: string;
  title: string;
  students: Student[];
  gradeLevel: GradeLevel;
  teacher?: User;
}

const sortStudentsByName = (a: Student, b: Student) => {
  const aName = a.firstName + " " + a.lastName;
  const bName = b.firstName + " " + b.lastName;
  return aName.toLowerCase().localeCompare(bName.toLowerCase());
};

const getTeacherDisplayName = (teacher: User) => {
  if (teacher.name) {
    return teacher.name;
  }
  if (teacher.firstName && teacher.lastName) {
    return teacher.firstName + " " + teacher.lastName;
  }
  return teacher.userName;
};

interface StudentMealReportProps {
  student: Student;
  date: string;
  large?: boolean;
}

interface StaffMealReportProps {
  staffMember: User;
  date: string;
  large?: boolean;
  boldTitle?: boolean;
  meals?: Meal[];
}

interface MealReportProps {
  meals: Meal[];
  title: string;
  large?: boolean;
  boldTitle?: boolean;
}

interface CohortHeaderRowProps {
  title: string;
  large?: boolean;
}

const CohortHeaderRow: React.FC<CohortHeaderRowProps> = ({ title, large }) => (
  <Box
    sx={{
      gridColumn: "1 / -1",
      borderBottomWidth: "1px",
      borderBottomColor: grey[400],
      borderBottomStyle: "solid",
      p: 1,
    }}
  >
    <Typography variant={large ? "h4" : "body2"} fontWeight="bold">
      {title}
    </Typography>
  </Box>
);

const HourlyMealReport: React.FC<{
  date: string;
  time?: string;
  large?: boolean;
}> = ({ date, time, large }) => {
  const { students, users, currentSchoolYear, orders } =
    React.useContext(AppContext);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const teachers = users
    .filter((user) => user.role === Role.TEACHER)
    .sort((a, b) => {
      const aTeacherLunchTime = currentSchoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacherId === a.id && tlt.dayOfWeek === dayOfWeek,
      );
      const bTeacherLunchTime = currentSchoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacherId === b.id && tlt.dayOfWeek === dayOfWeek,
      );
      const aGradeLevel = aTeacherLunchTime?.grades?.[0];
      const bGradeLevel = bTeacherLunchTime?.grades?.[0];

      if (aGradeLevel && bGradeLevel) {
        const aIndex = gradeOrder.indexOf(aGradeLevel);
        const bIndex = gradeOrder.indexOf(bGradeLevel);
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
      } else if (aGradeLevel && !bGradeLevel) {
        return -1;
      } else if (!aGradeLevel && bGradeLevel) {
        return 1;
      }

      const aName = a.firstName + " " + a.lastName;
      const bName = b.firstName + " " + b.lastName;
      return aName.toLowerCase().localeCompare(bName.toLowerCase());
    });

  const meals = time
    ? getMealsAtTime(orders, teachers, students, currentSchoolYear, date, time)
    : getMealsWithIrregularTimes(
        orders,
        teachers,
        students,
        currentSchoolYear,
        date,
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

  // Convert Sets to arrays and sort (teachers shown as cohort meal reports are excluded below)
  const sortedStaff = Array.from(staffSet).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });
  const sortedStudents = Array.from(studentSet).sort(sortStudentsByName);

  const classrooms: Classroom[] = teachers.map((teacher) => {
    const teacherLunchTimes = currentSchoolYear.teacherLunchTimes.filter(
      (tlt) => tlt.teacherId === teacher.id,
    );
    const grade =
      teacherLunchTimes.find((tlt) => tlt.dayOfWeek === dayOfWeek)
        ?.grades?.[0] ?? GradeLevel.UNKNOWN;
    return {
      teacher,
      grade,
      students: [],
    };
  });

  sortedStudents.forEach((student) => {
    const studentLunchTime = currentSchoolYear.studentLunchTimes.find(
      (slt) => slt.studentId === student.id && slt.dayOfWeek === dayOfWeek,
    );

    if (studentLunchTime?.teacherId) {
      const classroom = classrooms.find(
        (c) => c.teacher.id === studentLunchTime.teacherId,
      );
      if (classroom && !classroom.students.find((s) => s.id === student.id)) {
        classroom.students.push(student);
      }
    }
  });

  const gradesNotAssignedByTeacher = gradeOrder.filter(
    (grade) => !currentSchoolYear.gradesAssignedByClass.includes(grade),
  );
  const gradeLevelStudents: GradeLevelStudents[] =
    gradesNotAssignedByTeacher.map((grade) => ({
      gradeLevel: grade,
      students: [],
    }));

  sortedStudents.forEach((student) => {
    const studentLunchTime = currentSchoolYear.studentLunchTimes.find(
      (slt) => slt.studentId === student.id && slt.dayOfWeek === dayOfWeek,
    );

    if (studentLunchTime && !studentLunchTime.teacherId) {
      const cohort = gradeLevelStudents.find(
        (c) => c.gradeLevel === studentLunchTime.grade,
      );
      if (cohort && !cohort.students.find((s) => s.id === student.id)) {
        cohort.students.push(student);
      }
    }
  });

  const studentsWithUnknownLunchTimes = sortedStudents.filter((student) => {
    const isInClassroom = classrooms.some((classroom) =>
      classroom.students.some((s) => s.id === student.id),
    );
    const isInGradeLevel = gradeLevelStudents.some((gradeGroup) =>
      gradeGroup.students.some((s) => s.id === student.id),
    );
    return !isInClassroom && !isInGradeLevel;
  });

  if (studentsWithUnknownLunchTimes.length > 0) {
    gradeLevelStudents.push({
      gradeLevel: GradeLevel.UNKNOWN,
      students: studentsWithUnknownLunchTimes,
    });
  }

  classrooms.forEach((classroom) => {
    classroom.students.sort(sortStudentsByName);
  });
  gradeLevelStudents.forEach((gradeGroup) => {
    gradeGroup.students.sort(sortStudentsByName);
  });

  const teacherIdsAsCohortMealReport = time
    ? new Set(
        classrooms
          .filter(
            (classroom) =>
              classroom.students.length > 0 &&
              meals.some((meal) => meal.staffMemberId === classroom.teacher.id),
          )
          .map((classroom) => classroom.teacher.id),
      )
    : new Set<number>();

  const studentCohorts: StudentCohort[] = [
    ...classrooms
      .filter((classroom) => classroom.students.length > 0)
      .map((classroom) => ({
        key: `teacher-${classroom.teacher.id}`,
        title: getTeacherDisplayName(classroom.teacher),
        students: classroom.students,
        gradeLevel: classroom.grade,
        teacher: classroom.teacher,
      })),
    ...gradeLevelStudents
      .filter((gradeGroup) => gradeGroup.students.length > 0)
      .map((gradeGroup) => ({
        key: `grade-${gradeGroup.gradeLevel}`,
        title:
          gradeGroup.gradeLevel === GradeLevel.UNKNOWN
            ? "Students with No Lunch Time"
            : getGradeName(gradeGroup.gradeLevel),
        students: gradeGroup.students,
        gradeLevel: gradeGroup.gradeLevel,
      })),
  ].sort((a, b) => {
    const gradeDiff =
      gradeOrder.indexOf(a.gradeLevel) - gradeOrder.indexOf(b.gradeLevel);
    if (gradeDiff !== 0) {
      return gradeDiff;
    }
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });

  const sortedStaffExcludingCohortTeachers = sortedStaff.filter(
    (staffMember) => !teacherIdsAsCohortMealReport.has(staffMember.id),
  );

  if (
    sortedStaffExcludingCohortTeachers.length === 0 &&
    sortedStudents.length === 0
  ) {
    return <></>;
  }

  const summaryText = time
    ? DateTimeUtils.toTwelveHourTime(time)
    : `Other Times`;

  return (
    <Accordion elevation={3}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1-content"
      >
        <Typography variant={large ? "h4" : "h6"} fontWeight="bold">
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
          {studentCohorts.map((cohort) => {
            const showTeacherAsStaffMealReport =
              !!time &&
              !!cohort.teacher &&
              teacherIdsAsCohortMealReport.has(cohort.teacher.id);

            return (
              <React.Fragment key={cohort.key}>
                {showTeacherAsStaffMealReport ? (
                  <StaffMealReport
                    large={large}
                    staffMember={cohort.teacher!}
                    date={date}
                    boldTitle
                    meals={meals.filter(
                      (meal) => meal.staffMemberId === cohort.teacher!.id,
                    )}
                  />
                ) : (
                  <CohortHeaderRow title={cohort.title} large={large} />
                )}
                {cohort.students.map((student) => (
                  <StudentMealReport
                    large={large}
                    key={student.id}
                    student={student}
                    date={date}
                  />
                ))}
              </React.Fragment>
            );
          })}
          {sortedStaffExcludingCohortTeachers.length > 0 && (
            <>
              <CohortHeaderRow title="Other Staff" large={large} />
              {sortedStaffExcludingCohortTeachers.map((staffMember) => (
                <StaffMealReport
                  large={large}
                  key={staffMember.id}
                  staffMember={staffMember}
                  date={date}
                  meals={meals.filter(
                    (meal) => meal.staffMemberId === staffMember.id,
                  )}
                />
              ))}
            </>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const MealReport: React.FC<MealReportProps> = ({
  meals,
  title,
  large,
  boldTitle,
}) => {
  const { pantryItems } = React.useContext(AppContext);

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
        <Typography
          variant={large ? "h4" : "body2"}
          fontWeight={boldTitle ? "bold" : undefined}
        >
          {title}
        </Typography>
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
            rowGap: 1,
            columnGap: large ? 2 : 1,
          }}
        >
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
              <PantryItemChip
                textVariant={large ? "h4" : undefined}
                key={item.id}
                pantryItem={item}
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
  boldTitle,
  meals: mealsProp,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] =
    mealsProp ??
    orders
      .flatMap((order) => order.meals)
      .filter(
        (m) =>
          !m.cancelled && m.staffMemberId === staffMember.id && m.date === date,
      );

  if (!meals.length) {
    return <></>;
  }

  const title = boldTitle
    ? getTeacherDisplayName(staffMember)
    : staffMember.firstName && staffMember.lastName
      ? staffMember.firstName + " " + staffMember.lastName
      : staffMember.userName;
  return (
    <MealReport
      large={large}
      meals={meals}
      title={title}
      boldTitle={boldTitle}
    />
  );
};

const StudentMealReport: React.FC<StudentMealReportProps> = ({
  student,
  date,
  large,
}) => {
  const { orders } = React.useContext(AppContext);
  const meals: Meal[] = orders
    .flatMap((order) => order.meals)
    .filter(
      (m) => !m.cancelled && m.studentId === student.id && m.date === date,
    );

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
