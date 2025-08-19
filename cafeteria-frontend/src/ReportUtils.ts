import User from "./models/User";

import { Role } from "./models/User";

import { DateTimeUtils } from "./DateTimeUtils";
import SchoolYear from "./models/SchoolYear";
import Student from "./models/Student";
import { Order } from "./models/Order";
import Meal from "./models/Meal";

export const getTeacherLunchtime = (
    teacher: User | undefined,
    date: string,
    schoolYear: SchoolYear
  ) => {
    if (teacher === undefined || teacher.role !== Role.TEACHER) {
      return undefined;
    }
  
    const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  
    const teacherLunchTime = schoolYear.teacherLunchTimes.find(
      (tlt) => tlt.teacherId === teacher.id && tlt.dayOfWeek === dayOfWeek
    );
    return teacherLunchTime?.times[0];
  };
  
  export const getStudentLunchtime = (
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
  
  export const getMealsAtTime = (
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
            getTeacherLunchtime(
              teachers.find((teacher) => teacher.id === meal.staffMemberId),
              date,
              schoolYear
            ) === time ||
            getStudentLunchtime(
              students.find((student) => student.id === meal.studentId),
              date,
              schoolYear,
              teachers
            ) === time)
      );
  };
  
  export const getMealsWithIrregularTimes = (
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
          !lunchTimes.includes(meal.studentId ? 
            getStudentLunchtime(
              students.find((student) => student.id === meal.studentId),
              date,
              schoolYear,
              teachers
            ) ?? "" :
            getTeacherLunchtime(
              teachers.find((teacher) => teacher.id === meal.staffMemberId),
              date,
              schoolYear
            ) ?? ""
          )
      );
  };
  