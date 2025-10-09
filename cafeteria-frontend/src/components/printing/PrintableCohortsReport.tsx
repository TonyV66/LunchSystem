import React from "react";
import { Box } from "@mui/material";

import { AppContext } from "../../AppContextProvider";
import { DateTimeUtils } from "../../DateTimeUtils";
import User, { Role } from "../../models/User";
import { getGradeName, GradeLevel } from "../../models/GradeLevel";
import { Order } from "../../models/Order";
import Meal from "../../models/Meal";
import Student from "../../models/Student";
import { StudentLunchTime } from "../../models/StudentLunchTime";
import SchoolYear from "../../models/SchoolYear";
import { ReportData } from "../meals/MealReport";
import PrintableMealReport from "../meals/PrintableMealReport";

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
        name: student.firstName + " " + student.lastName,
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
  currentSchoolYear: SchoolYear
): ReportData[] => {
  const gradeLevelLunchTimes = getGradeLevelLunchTimes(currentSchoolYear, date);

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const reportDataArray: ReportData[] = [];

  for (const gradeLevel of gradeOrder) {
    if (!gradeLevelMap.has(gradeLevel)) {
      continue;
    }
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
      title: "Grade: " + getGradeName(gradeLevel),
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
          name: student.firstName + " " + student.lastName,
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
  currentSchoolYear: SchoolYear
): ReportData[] => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const reportDataArray: ReportData[] = [];

  const teacherLunchTimes = getTeacherLunchTimes(currentSchoolYear, date);

  const sortedTeachers = classroomTeachers.sort((a, b) => {
    // Get the grade level for each teacher from teacherLunchTimes
    const aTeacherLunchTime = teacherLunchTimes.find(
      (tlt) => tlt.teacherId === a.id && tlt.dayOfWeek === dayOfWeek
    );

    const bTeacherLunchTime = teacherLunchTimes.find(
      (tlt) => tlt.teacherId === b.id && tlt.dayOfWeek === dayOfWeek
    );

    // Get the primary grade level for each teacher (use first grade in the array)
    const aGradeLevel = aTeacherLunchTime?.grades?.[0];
    const bGradeLevel = bTeacherLunchTime?.grades?.[0];

    // If both have grade levels, sort by grade first
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
    // If grade levels are the same or undefined, sort by teacher name
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });

  for (const teacher of sortedTeachers) {
    if (!classroomMap.has(teacher.id)) {
      continue;
    }
    const students = classroomMap.get(teacher.id)!;

    // Get teacher's lunch time for this day
    const teacherLunchTime = teacherLunchTimes.find(
      (tlt) => tlt.teacherId === teacher.id && tlt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this classroom
    const studentMeals = mealsBeingServed.filter(
      (meal) =>
        meal.studentId &&
        students.some((student) => student.id === meal.studentId)
    );

    // Get teacher's meals
    const teacherMeals = mealsBeingServed.filter(
      (meal) => meal.staffMemberId === teacher.id
    );

    // Skip if no meals for either students or teacher
    if (studentMeals.length === 0 && teacherMeals.length === 0) {
      continue;
    }

    const teachersGradeLevel = currentSchoolYear.teacherLunchTimes.find(
      (tlt) => tlt.teacherId === teacher.id && tlt.dayOfWeek === dayOfWeek
    );

    let title = teacher.name.length > 0
      ? teacher.name
      : teacher.firstName + " " + teacher.lastName;

    if (teachersGradeLevel) {
      title += " - " + getGradeName(teachersGradeLevel.grades[0]);
    }

    // Create classroom data
    const reportData: ReportData = {
      title: title,
      time: teacherLunchTime?.times[0] ? teacherLunchTime.times[0] : undefined,
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
          name: student.firstName + " " + student.lastName,
          meals,
        });
      }
    }

    reportData.customers.sort((a, b) => a.name.localeCompare(b.name));

    // Add teacher meals last (if any)
    if (teacherMeals.length > 0) {
      reportData.customers.push({
        name:
          teacher.name.length > 0
            ? teacher.name
            : `${teacher.firstName} ${teacher.lastName}`,
        meals: teacherMeals,
      });
    }

    reportDataArray.push(reportData);
  }

  return reportDataArray;
};

interface ReportProps {
  date: string;
  teacherId?: number;
}

const getMealsBeingServed = (orders: Order[], date: string) => {
  return orders
    .flatMap((order) => order.meals)
    .filter((meal) => !meal.cancelled && meal.date === date);
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
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
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
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
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
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  return schoolYear.teacherLunchTimes.filter(
    (lt) => lt.dayOfWeek === dayOfWeek
  );
};

const getGradeLevelLunchTimes = (schoolYear: SchoolYear, date: string) => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
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

  const classroomReportData = buildClassroomReportData(
    mealsBeingServed,
    classroomMap,
    classroomTeachers,
    date,
    currentSchoolYear
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

  const classroomReportData = buildClassroomReportData(
    mealsBeingServed,
    classroomMap,
    classroomTeachers,
    date,
    currentSchoolYear
  );
  const gradeLevelReportData = buildGradeLevelReportData(
    mealsBeingServed,
    gradeLevelMap,
    date,
    currentSchoolYear
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

const PrintableCohortsReport: React.FC<ReportProps> = ({ teacherId, date }) => {
  const { students, orders, users, currentSchoolYear } =
    React.useContext(AppContext);

  const reportData = teacherId
    ? getTeacherReportData(
        orders,
        students,
        users.find((user) => user.id === teacherId)!,
        currentSchoolYear,
        date
      )
    : getDailyReportData(orders, students, users, currentSchoolYear, date);

  return (
    <Box>
      {reportData.map((report) => {
        return <PrintableMealReport key={report.title} reportData={report} />;
      })}
    </Box>
  );
};

export default PrintableCohortsReport;
