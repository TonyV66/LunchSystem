import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Dialog,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close, ExpandMore, Print } from "@mui/icons-material";

import { TransitionProps } from "@mui/material/transitions";
import { useReactToPrint } from "react-to-print";
import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils, DateTimeFormat } from "../../DateTimeUtils";
import User, { Role } from "../../models/User";
import MealReport, { ReportData } from "./MealReport";
import TeacherLunchTime from "../../models/TeacherLunchTime";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { Order } from "../../models/Order";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { StudentLunchTime } from "../../models/StudentLunchTime";
import SchoolYear from "../../models/SchoolYear";
import GradeLunchTime from "../../models/GradeLunchTime";

const buildStaffReportData = (
  mealsBeingServed: Meal[],
  staffMembers: User[],
  date: string
): ReportData[] => {
  // Get meals for the other staff members
  const staffMeals = mealsBeingServed.filter(
    (meal) =>
      meal.staffMemberId &&
      staffMembers.some((staff) => staff.id === meal.staffMemberId)
  );

  // Skip if no meals for these staff members
  if (staffMeals.length === 0) {
    return [];
  }

  // Create report data for other staff
  const reportData: ReportData = {
    title: "Staff Lunches",
    date: date,
    customers: [],
  };

  // Add staff members and their meals
  for (const staff of staffMembers) {
    const meals = staffMeals.filter((meal) => meal.staffMemberId === staff.id);

    if (meals.length > 0) {
      reportData.customers.push({
        name: `${staff.firstName} ${staff.lastName}`,
        meals,
      });
    }
  }

  reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
  return [reportData];
};

const buildOtherStudentsReportData = (
  mealsBeingServed: Meal[],
  otherStudents: Student[],
  date: string
): ReportData[] => {
  // Get meals for the other students
  const studentMeals = mealsBeingServed.filter(
    (meal) =>
      meal.studentId &&
      otherStudents.some((student) => student.id === meal.studentId)
  );

  // Skip if no meals for these students
  if (studentMeals.length === 0) {
    return [];
  }

  // Create report data for unassigned students
  const reportData: ReportData = {
    title: "Students With Unassigned Lunch Times",
    date: date,
    customers: [],
  };

  // Add students and their meals
  for (const student of otherStudents) {
    const meals = studentMeals.filter((meal) => meal.studentId === student.id);

    if (meals.length > 0) {
      reportData.customers.push({
        name: student.name,
        meals,
      });
    }
  }

  reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
  return [reportData];
};

const buildGradeLevelReportData = (
  mealsBeingServed: Meal[],
  gradeLevelMap: Map<GradeLevel, Student[]>,
  date: string,
  gradeLevelLunchTimes: GradeLunchTime[]
): ReportData[] => {
  const dayOfWeek = new Date(date).getDay();
  const reportDataArray: ReportData[] = [];

  const gradeLevels = Array.from(gradeLevelMap.keys());
  for (const gradeLevel of gradeLevels) {
    const students = gradeLevelMap.get(gradeLevel)!;
    // Get grade level lunch time for this day
    const gradeLunchTime = gradeLevelLunchTimes.find(
      (glt) => glt.grade === gradeLevel && glt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this grade level
    const studentMeals = mealsBeingServed.filter(
      (meal) =>
        meal.studentId &&
        students.some((student) => student.id === meal.studentId)
    );

    // Skip if no meals for students
    if (studentMeals.length === 0) {
      continue;
    }

    // Create grade level data
    const reportData: ReportData = {
      title: getGradeName(gradeLevel),
      time: gradeLunchTime?.times[0] ? gradeLunchTime.times[0] : undefined,
      date: date,
      customers: [],
    };

    // Add students and their meals
    for (const student of students) {
      const meals = studentMeals.filter(
        (meal) => meal.studentId === student.id
      );

      if (meals.length > 0) {
        reportData.customers.push({
          name: student.name,
          meals,
        });
      }
    }

    reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
    reportDataArray.push(reportData);
  }

  return reportDataArray;
};

const buildClassroomReportData = (
  mealsBeingServed: Meal[],
  classroomMap: Map<number, Student[]>,
  classroomTeachers: User[],
  date: string,
  teacherLunchTimes: TeacherLunchTime[]
): ReportData[] => {
  const dayOfWeek = new Date(date).getDay();
  const reportDataArray: ReportData[] = [];

  const teacherIds = Array.from(classroomMap.keys());

  for (const teacherId of teacherIds) {
    const students = classroomMap.get(teacherId)!;
    // Find the teacher
    const teacher = classroomTeachers.find((t) => t.id === teacherId);
    if (!teacher) continue;

    // Get teacher's lunch time for this day
    const teacherLunchTime = teacherLunchTimes.find(
      (tlt) => tlt.teacherId === teacherId && tlt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this classroom
    const studentMeals = mealsBeingServed.filter(
      (meal) =>
        meal.studentId &&
        students.some((student) => student.id === meal.studentId)
    );

    // Get teacher's meals
    const teacherMeals = mealsBeingServed.filter(
      (meal) => meal.staffMemberId === teacherId
    );

    // Skip if no meals for either students or teacher
    if (studentMeals.length === 0 && teacherMeals.length === 0) {
      continue;
    }

    // Create classroom data
    const reportData: ReportData = {
      title: teacher.firstName + " " + teacher.lastName + "'s Classroom",
      time: teacherLunchTime?.times[0] ? teacherLunchTime.times[0] : undefined,
      date: date,
      customers: [],
    };

    // Add teacher meals first (if any)
    if (teacherMeals.length > 0) {
      reportData.customers.push({
        name: `${teacher.firstName} ${teacher.lastName}`,
        meals: teacherMeals,
      });
    }

    // Add students and their meals
    for (const student of students) {
      const meals = studentMeals.filter(
        (meal) => meal.studentId === student.id
      );

      if (meals.length > 0) {
        reportData.customers.push({
          name: student.name,
          meals,
        });
      }
    }

    reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
    reportDataArray.push(reportData);
  }

  return reportDataArray;
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface DialogProps {
  date: string;
  teacherId?: number;
  onClose: () => void;
}

const getMealsBeingServed = (orders: Order[], date: string) => {
  return orders
    .flatMap((order) => order.meals)
    .filter((meal) => meal.date === date);
};

const getStudentsBeingServed = (meals: Meal[], students: Student[]) => {
  const studentIdsWithMeals = new Set(
    meals.filter((meal) => meal.studentId).map((meal) => meal.studentId!)
  );

  return students.filter((student) => studentIdsWithMeals.has(student.id));
};

const getClassroomTeachers = (
  users: User[],
  date: string,
  studentLunchTimes: StudentLunchTime[]
) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  return users.filter(
    (user) =>
      user.role === Role.TEACHER &&
      studentLunchTimes.find(
        (lt) => lt.teacherId === user.id && lt.dayOfWeek === dayOfWeek
      )
  );
};

const getClassroomMap = (
  date: string,
  teachers: User[],
  students: Student[],
  studentLunchTimes: StudentLunchTime[]
): Map<number, Student[]> => {
  const dayOfWeek = new Date(date).getDay();
  const teacherIds = new Set(teachers.map((teacher) => teacher.id));

  // Create a map to group students by teacher
  const classroomMap = new Map<number, Student[]>();

  for (const student of students) {
    // Find lunch time assignments for this student on the given day
    const lunchTimeAssignments =
      studentLunchTimes.filter(
        (assignment) =>
          assignment.dayOfWeek === dayOfWeek &&
          assignment.studentId === student.id &&
          assignment.teacherId &&
          teacherIds.has(assignment.teacherId)
      ) || [];

    // Add student to each teacher's classroom
    for (const assignment of lunchTimeAssignments) {
      const teacherId = assignment.teacherId!;

      if (!classroomMap.has(teacherId)) {
        classroomMap.set(teacherId, []);
      }

      // Only add student if not already in the array (avoid duplicates)
      const studentsInClassroom = classroomMap.get(teacherId)!;
      if (!studentsInClassroom.some((s) => s.id === student.id)) {
        studentsInClassroom.push(student);
      }
    }
  }

  return classroomMap;
};

const getStudentGradeLevelMap = (
  date: string,
  gradeLevels: GradeLevel[],
  students: Student[],
  studentLunchTimes: StudentLunchTime[]
): Map<GradeLevel, Student[]> => {
  const dayOfWeek = new Date(date).getDay();
  const gradeLevelSet = new Set(gradeLevels);

  // Create a map to group students by grade level
  const gradeLevelMap = new Map<GradeLevel, Student[]>();

  for (const student of students) {
    // Find lunch time assignments for this student on the given day
    const lunchTimeAssignments =
      studentLunchTimes.filter(
        (assignment) =>
          assignment.dayOfWeek === dayOfWeek &&
          assignment.studentId === student.id &&
          gradeLevelSet.has(assignment.grade)
      ) || [];

    // Add student to each grade level they're assigned to
    for (const assignment of lunchTimeAssignments) {
      const gradeLevel = assignment.grade;

      if (!gradeLevelMap.has(gradeLevel)) {
        gradeLevelMap.set(gradeLevel, []);
      }

      // Only add student if not already in the array (avoid duplicates)
      const studentsInGrade = gradeLevelMap.get(gradeLevel)!;
      if (!studentsInGrade.some((s) => s.id === student.id)) {
        studentsInGrade.push(student);
      }
    }
  }

  return gradeLevelMap;
};

const getTeacherLunchTimes = (schoolYear: SchoolYear, date: string) => {
  const dayOfWeek = new Date(date).getDay();
  return schoolYear.teacherLunchTimes.filter(
    (lt) => lt.dayOfWeek === dayOfWeek
  );
};

const getGradeLevelLunchTimes = (schoolYear: SchoolYear, date: string) => {
  const dayOfWeek = new Date(date).getDay();
  return schoolYear.gradeLunchTimes.filter((lt) => lt.dayOfWeek === dayOfWeek);
};

const getTeacherReportData = (
  orders: Order[],
  students: Student[],
  teacher: User,
  currentSchoolYear: SchoolYear,
  date: string
) => {
  const mealsBeingServed = getMealsBeingServed(orders, date);

  const studentsBeingServed = getStudentsBeingServed(
    mealsBeingServed,
    students
  );

  const classroomTeachers = [teacher];

  const classroomMap = getClassroomMap(
    date,
    classroomTeachers,
    studentsBeingServed,
    currentSchoolYear.studentLunchTimes
  );

  const teacherLunchTimes = getTeacherLunchTimes(currentSchoolYear, date);

  const classroomReportData = buildClassroomReportData(
    mealsBeingServed,
    classroomMap,
    classroomTeachers,
    date,
    teacherLunchTimes
  );

  // Find students who are being served meals but not in either map
  const studentsInClassrooms = new Set<number>();
  const classroomStudents = Array.from(classroomMap.values());
  for (const students of classroomStudents) {
    for (const student of students) {
      studentsInClassrooms.add(student.id);
    }
  }

  return classroomReportData;
};

const getDailyReportData = (
  orders: Order[],
  students: Student[],
  users: User[],
  currentSchoolYear: SchoolYear,
  date: string
) => {
  const mealsBeingServed = getMealsBeingServed(orders, date);

  const studentsBeingServed = getStudentsBeingServed(
    mealsBeingServed,
    students
  );

  const classroomTeachers = getClassroomTeachers(
    users,
    date,
    currentSchoolYear.studentLunchTimes
  );

  const classroomMap = getClassroomMap(
    date,
    classroomTeachers,
    studentsBeingServed,
    currentSchoolYear.studentLunchTimes
  );

  const gradeLevelsWithLunchTimes: GradeLevel[] = Object.values(GradeLevel)
    .filter((grade) => grade !== GradeLevel.UNKNOWN)
    .filter(
      (grade) => !currentSchoolYear.gradesAssignedByClass.includes(grade)
    );

  const gradeLevelMap = getStudentGradeLevelMap(
    date,
    gradeLevelsWithLunchTimes,
    studentsBeingServed,
    currentSchoolYear.studentLunchTimes
  );

  const teacherLunchTimes = getTeacherLunchTimes(currentSchoolYear, date);
  const gradeLevelLunchTimes = getGradeLevelLunchTimes(currentSchoolYear, date);

  const classroomReportData = buildClassroomReportData(
    mealsBeingServed,
    classroomMap,
    classroomTeachers,
    date,
    teacherLunchTimes
  );
  const gradeLevelReportData = buildGradeLevelReportData(
    mealsBeingServed,
    gradeLevelMap,
    date,
    gradeLevelLunchTimes
  );

  // Find students who are being served meals but not in either map
  const studentsInClassrooms = new Set<number>();
  const studentsInGradeLevels = new Set<number>();
  const classroomStudents = Array.from(classroomMap.values());
  for (const students of classroomStudents) {
    for (const student of students) {
      studentsInClassrooms.add(student.id);
    }
  }
  const gradeLevelStudents = Array.from(gradeLevelMap.values());
  for (const students of gradeLevelStudents) {
    for (const student of students) {
      studentsInGradeLevels.add(student.id);
    }
  }
  const otherStudents = studentsBeingServed.filter(
    (student) =>
      !studentsInClassrooms.has(student.id) &&
      !studentsInGradeLevels.has(student.id)
  );
  const otherStudentsReportData = buildOtherStudentsReportData(
    mealsBeingServed,
    otherStudents,
    date
  );

  // Find staff members who are being served meals but not in classroomTeachers array
  const staffMeals = mealsBeingServed.filter((meal) => meal.staffMemberId);
  const staffBeingServed = staffMeals
    .map((meal) => users.find((user) => user.id === meal.staffMemberId)!)
    .filter(
      (staffMember, index, self) =>
        index === self.findIndex((s) => s.id === staffMember.id)
    );

  const staffReportData = buildStaffReportData(
    mealsBeingServed,
    staffBeingServed,
    date
  );

  return classroomReportData
    .concat(gradeLevelReportData)
    .concat(otherStudentsReportData)
    .concat(staffReportData);
};

const MealReportDialog: React.FC<DialogProps> = ({
  teacherId,
  date,
  onClose,
}) => {
  const { students, orders, users, currentSchoolYear } =
    React.useContext(AppContext);

  const reportRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  const reportData = teacherId
    ? getTeacherReportData(
        orders,
        students,
        users.find((user) => user.id === teacherId)!,
        currentSchoolYear,
        date
      )
    : getDailyReportData(orders, students, users, currentSchoolYear, date);

  function handleClick(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void {
    event.stopPropagation();
    handlePrint();
  }

  return (
    <Dialog
      open={true}
      fullScreen
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <Close />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {teacherId
              ? reportData[0].title +
                " - " +
                DateTimeUtils.toString(
                  date,
                  DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                ) +
                (reportData[0].time
                  ? " @ " + DateTimeUtils.toTwelveHourTime(reportData[0].time)
                  : "")
              : "Daily Report - " +
                DateTimeUtils.toString(
                  date,
                  DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
                )}
          </Typography>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ color: "white" }}
          >
            <Print />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box ref={reportRef} p={2} overflow="visible">
        {teacherId ? (
          <MealReport customers={reportData[0].customers} />
        ) : (
          <>
            {reportData.map((report) => {
              return (
                <Accordion elevation={3} key={report.title}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography fontWeight="bold">
                      {report.title}
                      {report.time
                        ? " @ " + DateTimeUtils.toTwelveHourTime(report.time)
                        : ""}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <MealReport customers={report.customers} />
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default MealReportDialog;
