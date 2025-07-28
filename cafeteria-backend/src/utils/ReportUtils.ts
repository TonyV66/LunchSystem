import express from "express";
import { chromium } from "playwright";
import { AppDataSource } from "../data-source";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { In } from "typeorm";
import MealEntity from "../entity/MealEntity";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";
import { GradeLevel } from "../models/GradeLevel";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import { Role } from "../models/User";
import GradeLunchTimeEntity from "../entity/GradeLunchTimeEntity";
import { DateTimeFormat, DateTimeUtils } from "../DateTimeUtils";
import { DailyMenuEntity } from "../entity/MenuEntity";
import SchoolEntity from "../entity/SchoolEntity";
import { PantryItem } from "../models/Menu";

const router = express.Router();

interface MealData {
  items: string[];
}

interface CustomerData {
  name: string;
  meals: MealData[];
}

interface ReportData {
  isClassroom: boolean;
  title: string;
  time: string;
  date: string;
  customers: CustomerData[];
}

function getDefaultPageStyle() {
  return `
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      p { margin: 0; }
      th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 14px; }
      .page-break { page-break-before: always; }
      .header { 
        font-weight: bold;
        font-size: 1.2em;
      }
    </style>
  `;
}

function generateStudentMealsTable(reportData: ReportData, pageBreak: boolean) {
  return `
    <div class="${pageBreak ? "page-break" : ""}">
      <div class="header">
        <p>${reportData.title}<p>
        <p>${DateTimeUtils.toString(
          reportData.date,
          DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
        )} @ ${reportData.time}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Meal Items</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.customers
            .flatMap((customer) =>
              customer.meals.map(
                (meal, mealIndex) => `
              <tr>
                <td class="student-name">${
                  mealIndex === 0 ? customer.name : ""
                }</td>
                <td>${meal.items.join(", ")}</td>
              </tr>
            `
              )
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function generateMealReports(reportData: ReportData[]) {
  return `
    <html>
      <head>
        ${getDefaultPageStyle()}
      </head>
      <body>
        ${reportData
          .map(
            (report, i) => `
          ${generateStudentMealsTable(report, i > 0)}
        `
          )
          .join("")}
      </body>
    </html>
  `;
}

function generateNoMealsPage() {
  return `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .message {
              font-size: 24px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="message">No meals being served.</div>
        </body>
      </html>
    `;
}

const getClassroomStudents = async (
  schoolYear: SchoolYearEntity,
  lunchtimeTeacherId: number,
  dayOfWeek: number
): Promise<StudentEntity[]> => {
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  // Find all lunchtime assignments where this teacher is assigned
  const lunchTimeAssignments = await studentLunchTimeRepository.find({
    where: {
      schoolYear,
      lunchtimeTeacher: { id: lunchtimeTeacherId },
      dayOfWeek,
    },
    relations: {
      student: true,
    },
  });

  return lunchTimeAssignments.map((assignment) => assignment.student);
};

const getMealsBeingServed = async (
  schoolYear: SchoolYearEntity,
  date: string
): Promise<MealEntity[]> => {
  const mealRepository = AppDataSource.getRepository(MealEntity);

  return await mealRepository.find({
    where: {
      date: date,
    },
    relations: {
      student: {
        lunchTimes: { lunchtimeTeacher: true },
      },
      staffMember: true,
      items: true,
      order: true,
    },
  });
};

const getClassroomTeachers = async (
  schoolYear: SchoolYearEntity,
  date: string
): Promise<UserEntity[]> => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const userRepository = AppDataSource.getRepository(UserEntity);

  // Find all teachers who have students assigned to them for lunchtime on this day
  const teachersWithStudents = await userRepository.find({
    where: {
      role: Role.TEACHER,
      studentLunchTimes: {
        schoolYear: { id: schoolYear.id },
        dayOfWeek: dayOfWeek,
      },
    },
    relations: {
      studentLunchTimes: {
        schoolYear: true,
      },
    },
  });

  return teachersWithStudents;
};

const getStudentGradeLevelMap = (
  date: string,
  gradeLevels: GradeLevel[],
  students: StudentEntity[]
): Map<GradeLevel, StudentEntity[]> => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const gradeLevelSet = new Set(gradeLevels);

  // Create a map to group students by grade level
  const gradeLevelMap = new Map<GradeLevel, StudentEntity[]>();

  for (const student of students) {
    // Find lunch time assignments for this student on the given day
    const lunchTimeAssignments =
      student.lunchTimes?.filter(
        (assignment) =>
          assignment.dayOfWeek === dayOfWeek &&
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

const getClassroomMap = (
  date: string,
  teachers: UserEntity[],
  students: StudentEntity[]
): Map<number, StudentEntity[]> => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const teacherIds = new Set(teachers.map((teacher) => teacher.id));

  // Create a map to group students by teacher
  const classroomMap = new Map<number, StudentEntity[]>();

  for (const student of students) {
    // Find lunch time assignments for this student on the given day
    const lunchTimeAssignments =
      student.lunchTimes?.filter(
        (assignment) =>
          assignment.dayOfWeek === dayOfWeek &&
          assignment.lunchtimeTeacher &&
          teacherIds.has(assignment.lunchtimeTeacher.id)
      ) || [];

    // Add student to each teacher's classroom
    for (const assignment of lunchTimeAssignments) {
      const teacherId = assignment.lunchtimeTeacher!.id;

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

const getStaffBeingServed = (mealsBeingServed: MealEntity[]): UserEntity[] => {
  // Get all staff being served meals directly from the meals data
  const staffMeals = mealsBeingServed.filter((meal) => meal.staffMember);

  // Use Set to get unique staff members
  const uniqueStaff: UserEntity[] = [];
  staffMeals.forEach((meal) => {
    if (!uniqueStaff.some((s) => s.id === meal.staffMember!.id)) {
      uniqueStaff.push(meal.staffMember!);
    }
  });

  return uniqueStaff;
};

const getStudentsBeingServed = (
  mealsBeingServed: MealEntity[]
): StudentEntity[] => {
  // Get all students being served meals directly from the meals data
  const studentMeals = mealsBeingServed.filter((meal) => meal.student);

  // Use Set to get unique students
  const uniqueStudents: StudentEntity[] = [];
  studentMeals.forEach((meal) => {
    if (!uniqueStudents.some((s) => s.id === meal.student!.id)) {
      uniqueStudents.push(meal.student!);
    }
  });

  return uniqueStudents;
};

const getTeacherLunchTimes = async (
  schoolYear: SchoolYearEntity,
  date: string
): Promise<TeacherLunchTimeEntity[]> => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const teacherLunchTimeRepository = AppDataSource.getRepository(
    TeacherLunchTimeEntity
  );
  return await teacherLunchTimeRepository.find({
    where: {
      schoolYear: { id: schoolYear.id },
      dayOfWeek: dayOfWeek,
    },
    relations: {
      teacher: true,
    },
  });
};

const getGradeLevelLunchTimes = async (
  schoolYear: SchoolYearEntity,
  date: string
): Promise<GradeLunchTimeEntity[]> => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const gradeLunchTimeRepository =
    AppDataSource.getRepository(GradeLunchTimeEntity);

  return await gradeLunchTimeRepository.find({
    where: {
      schoolYear: { id: schoolYear.id },
      dayOfWeek: dayOfWeek,
    },
    relations: {
      schoolYear: true,
    },
  });
};

const buildClassroomReportData = (
  mealsBeingServed: MealEntity[],
  classroomMap: Map<number, StudentEntity[]>,
  classroomTeachers: UserEntity[],
  date: string,
  teacherLunchTimes: TeacherLunchTimeEntity[]
): ReportData[] => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const reportDataArray: ReportData[] = [];

  for (const [teacherId, students] of classroomMap) {
    // Find the teacher
    const teacher = classroomTeachers.find((t) => t.id === teacherId);
    if (!teacher) continue;

    // Get teacher's lunch time for this day
    const teacherLunchTime = teacherLunchTimes.find(
      (tlt) => tlt.teacher.id === teacherId && tlt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this classroom
    const studentMeals = mealsBeingServed.filter(
      (meal) =>
        meal.student &&
        students.some((student) => student.id === meal.student!.id)
    );

    // Get teacher's meals
    const teacherMeals = mealsBeingServed.filter(
      (meal) => meal.staffMember?.id === teacherId
    );

    // Skip if no meals for either students or teacher
    if (studentMeals.length === 0 && teacherMeals.length === 0) {
      continue;
    }

    // Create classroom data
    const reportData: ReportData = {
      isClassroom: true,
      title:
        teacher.name.length > 0
          ? teacher.name
          : teacher.firstName + " " + teacher.lastName,
      time: teacherLunchTime?.time
        ? teacherLunchTime.time.split("|")[0]
        : "Not assigned",
      date: date,
      customers: [],
    };

    // Add students and their meals
    for (const student of students) {
      const studentMealsForStudent = studentMeals
        .filter((meal) => meal.student?.id === student.id)
        .map((meal) => ({
          items: meal.items.map((item) => item.name),
        }));

      if (studentMealsForStudent.length > 0) {
        reportData.customers.push({
          name: student.firstName + " " + student.lastName,
          meals: studentMealsForStudent,
        });
      }
    }

    reportData.customers.sort((a, b) => a.name.localeCompare(b.name));

    // Add teacher meals last (if any)
    if (teacherMeals.length > 0) {
      const teacherMealData = teacherMeals.map((meal) => ({
        items: meal.items.map((item) => item.name),
      }));

      reportData.customers.push({
        name:
          teacher.name.length > 0
            ? teacher.name
            : `${teacher.firstName} ${teacher.lastName}`,
        meals: teacherMealData,
      });
    }

    reportDataArray.push(reportData);
  }

  return reportDataArray;
};

const buildGradeLevelReportData = (
  mealsBeingServed: MealEntity[],
  gradeLevelMap: Map<GradeLevel, StudentEntity[]>,
  date: string,
  gradeLevelLunchTimes: GradeLunchTimeEntity[]
): ReportData[] => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const reportDataArray: ReportData[] = [];

  for (const [gradeLevel, students] of gradeLevelMap) {
    // Get grade level lunch time for this day
    const gradeLunchTime = gradeLevelLunchTimes.find(
      (glt) => glt.grade === gradeLevel && glt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this grade level
    const studentMeals = mealsBeingServed.filter(
      (meal) =>
        meal.student &&
        students.some((student) => student.id === meal.student!.id)
    );

    // Skip if no meals for students
    if (studentMeals.length === 0) {
      continue;
    }

    // Create grade level data
    const reportData: ReportData = {
      isClassroom: false,
      title: `${gradeLevel} Grade`,
      time: gradeLunchTime?.time
        ? gradeLunchTime.time.split("|")[0]
        : "Various times",
      date: date,
      customers: [],
    };

    // Add students and their meals
    for (const student of students) {
      const studentMealsForStudent = studentMeals
        .filter((meal) => meal.student?.id === student.id)
        .map((meal) => ({
          items: meal.items.map((item) => item.name),
        }));

      if (studentMealsForStudent.length > 0) {
        reportData.customers.push({
          name: student.firstName + " " + student.lastName,
          meals: studentMealsForStudent,
        });
      }
    }

    reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
    reportDataArray.push(reportData);
  }

  return reportDataArray;
};

const buildOtherStudentsReportData = (
  mealsBeingServed: MealEntity[],
  otherStudents: StudentEntity[],
  date: string
): ReportData[] => {
  // Get meals for the other students
  const studentMeals = mealsBeingServed.filter(
    (meal) =>
      meal.student &&
      otherStudents.some((student) => student.id === meal.student!.id)
  );

  // Skip if no meals for these students
  if (studentMeals.length === 0) {
    return [];
  }

  // Create report data for unassigned students
  const reportData: ReportData = {
    isClassroom: false,
    title: "Students With Unassigned Lunch Times",
    time: "Various times", // No specific lunch time assignment
    date: date,
    customers: [],
  };

  // Add students and their meals
  for (const student of otherStudents) {
    const studentMealsForStudent = studentMeals
      .filter((meal) => meal.student?.id === student.id)
      .map((meal) => ({
        items: meal.items.map((item) => item.name),
      }));

    if (studentMealsForStudent.length > 0) {
      reportData.customers.push({
        name: student.firstName + " " + student.lastName,
        meals: studentMealsForStudent,
      });
    }
  }

  reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
  return [reportData];
};

const buildStaffReportData = (
  mealsBeingServed: MealEntity[],
  staffMembers: UserEntity[],
  date: string
): ReportData[] => {
  // Get meals for the other staff members
  const staffMeals = mealsBeingServed.filter(
    (meal) =>
      meal.staffMember &&
      staffMembers.some((staff) => staff.id === meal.staffMember!.id)
  );

  // Skip if no meals for these staff members
  if (staffMeals.length === 0) {
    return [];
  }

  // Create report data for other staff
  const reportData: ReportData = {
    isClassroom: false,
    title: "Staff Lunches",
    time: "Various Lunchtimes", // Various lunch times for staff
    date: date,
    customers: [],
  };

  // Add staff members and their meals
  for (const staff of staffMembers) {
    const staffMealsForMember = staffMeals
      .filter((meal) => meal.staffMember?.id === staff.id)
      .map((meal) => ({
        items: meal.items.map((item) => item.name),
      }));

    if (staffMealsForMember.length > 0) {
      reportData.customers.push({
        name: `${staff.firstName} ${staff.lastName}`,
        meals: staffMealsForMember,
      });
    }
  }

  reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
  return [reportData];
};

const getClassroomReportData = async (
  schoolYear: SchoolYearEntity,
  teacher: UserEntity,
  date: string
): Promise<ReportData[]> => {
  const mealsBeingServed = await getMealsBeingServed(schoolYear, date);
  const teacherLunchTimeRepository = AppDataSource.getRepository(
    TeacherLunchTimeEntity
  );
  const teacherLunchTimes = await teacherLunchTimeRepository.find({
    where: {
      schoolYear: { id: schoolYear.id },
    },
    relations: {
      teacher: true,
    },
  });
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const students = await getClassroomStudents(
    schoolYear,
    teacher.id,
    dayOfWeek
  );

  // Create classroom map
  const classroomMap = new Map([[teacher.id, students]]);

  const reportData = buildClassroomReportData(
    mealsBeingServed,
    classroomMap,
    [teacher],
    date,
    teacherLunchTimes
  );

  return !reportData || reportData.length === 0 ? [] : reportData;
};

export const getClassroomReport = async (
  schoolYear: SchoolYearEntity,
  teacher: UserEntity,
  dates: string[]
): Promise<string> => {
  let reportData: ReportData[] = [];
  for (const date of dates) {
    const dailyReportData = await getClassroomReportData(
      schoolYear,
      teacher,
      date
    );
    reportData.push(...dailyReportData);
  }
  return !reportData || reportData.length === 0
    ? generateNoMealsPage()
    : generateMealReports(reportData);
};

export const getDailyReport = async (
  schoolYear: SchoolYearEntity,
  date: string
): Promise<string> => {
  const mealsBeingServed = await getMealsBeingServed(schoolYear, date);

  const studentsBeingServed = getStudentsBeingServed(mealsBeingServed);

  const classroomTeachers = await getClassroomTeachers(schoolYear, date);

  const classroomMap = getClassroomMap(
    date,
    classroomTeachers,
    studentsBeingServed
  );

  const gradesAssignedByClass = schoolYear.gradesAssignedByClass
    ? (schoolYear.gradesAssignedByClass.split("|") as GradeLevel[])
    : [];
  // Get grade levels not assigned by class
  const allGradeLevels = Object.values(GradeLevel).filter(
    (grade) => grade !== GradeLevel.UNKNOWN
  );
  const gradeLevelsWithLunchTimes: GradeLevel[] = allGradeLevels.filter(
    (grade) => !gradesAssignedByClass.includes(grade)
  );
  const gradeLevelMap = getStudentGradeLevelMap(
    date,
    gradeLevelsWithLunchTimes,
    studentsBeingServed
  );

  const teacherLunchTimes = await getTeacherLunchTimes(schoolYear, date);
  const gradeLevelLunchTimes = await getGradeLevelLunchTimes(schoolYear, date);

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
  for (const [teacherId, students] of classroomMap) {
    for (const student of students) {
      studentsInClassrooms.add(student.id);
    }
  }
  for (const [gradeLevel, students] of gradeLevelMap) {
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
  const staffMeals = mealsBeingServed.filter((meal) => meal.staffMember);
  const staffBeingServed = staffMeals
    .map((meal) => meal.staffMember!)
    .filter(
      (staffMember, index, self) =>
        index === self.findIndex((s) => s.id === staffMember.id)
    );
  const otherStaffReportData = buildStaffReportData(
    mealsBeingServed,
    staffBeingServed,
    date
  );

  const allReportData: ReportData[] = classroomReportData
    .concat(gradeLevelReportData)
    .concat(otherStudentsReportData)
    .concat(otherStaffReportData);

  const html = generateMealReports(allReportData);
  return html;
};

export async function generatePDFBuffer(html: string): Promise<Buffer> {
  // Launch Playwright browser
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  // Set viewport size
  await page.setViewportSize({ width: 1200, height: 800 });

  await page.setContent(html, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait a bit to ensure everything is rendered
  await page.waitForTimeout(1000);

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
    preferCSSPageSize: true,
  });

  await browser.close();

  return pdfBuffer;
}

// Generate HTML for ordered items table
const generateOrderedItemsTable = (
  allMeals: MealEntity[],
  dailyMenu: DailyMenuEntity,
  staff: UserEntity[],
  students: StudentEntity[],
  schoolYear: SchoolYearEntity,
  date: string,
  mealTimes: string[]
): string => {
  let tableRows = "";

  // Add header row
  tableRows += `
    <tr>
      <th style="border: 1px solid #333; padding: 8px; text-align: left; font-weight: bold;">Time</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: left; font-weight: bold;">Items</th>
    </tr>
  `;

  const pantryItems = getMenuItems(allMeals, dailyMenu).sort(
    (item1, item2) =>
      item1.type - item2.type ||
      item1.name.toLowerCase().localeCompare(item2.name.toLowerCase())
  );

  // Add rows for each meal time
  let leftOverMeals: MealEntity[] = [...allMeals];

  const totalQtysMap = new Map<string, number>();

  for (const time of mealTimes) {
    const meals = getMealsAtTime(
      allMeals,
      staff,
      students,
      schoolYear,
      date,
      time
    );

    leftOverMeals = leftOverMeals.filter((meal) => !meals.includes(meal));

    const timeItems = [];

    for (const pantryItem of pantryItems) {
      const quantity = meals
        .flatMap((meal) => meal.items)
        .filter(
          (orderedItem) =>
            pantryItem.name.toLowerCase() === orderedItem.name.toLowerCase() &&
            pantryItem.type === orderedItem.type
        ).length;
      timeItems.push(`${pantryItem.name} (${quantity})`);
      totalQtysMap.set(
        pantryItem.name,
        (totalQtysMap.get(pantryItem.name) || 0) + quantity
      );
    }

    tableRows += `
        <tr>
          <td style="border: 1px solid #333; padding: 8px; text-align: left;">${DateTimeUtils.toTwelveHourTime(
            time
          )}</td>
          <td style="border: 1px solid #333; padding: 8px; text-align: left;">${timeItems.join(
            ", "
          )}</td>
        </tr>
      `;
  }

  const leftOverItems = [];
  for (const pantryItem of pantryItems) {
    const quantity = leftOverMeals
      .flatMap((meal) => meal.items)
      .filter(
        (orderedItem) =>
          pantryItem.name.toLowerCase() === orderedItem.name.toLowerCase() &&
          pantryItem.type === orderedItem.type
      ).length;
    leftOverItems.push(`${pantryItem.name} (${quantity})`);
    totalQtysMap.set(
      pantryItem.name,
      (totalQtysMap.get(pantryItem.name) || 0) + quantity
    );
  }

  tableRows += `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: left;">Other/Unknown Times</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: left;">${leftOverItems.join(
        ", "
      )}</td>
    </tr>
  `;

  const totalItems = [];
  for (const [itemName, quantity] of totalQtysMap) {
    totalItems.push(`${itemName} (${quantity})`);
  }

  tableRows += `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: left; font-weight: bold;">Total</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: left;">${totalItems.join(
        ", "
      )}</td>
    </tr>
  `;

  return `
    <div style="page-break-before: always;">
      <h2 style="margin-bottom: 20px;">Ordered Items - ${DateTimeUtils.toString(
        date,
        DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
      )}</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        ${tableRows}
      </table>
    </div>
  `;
};

const buildMealsTable = (meals: MealEntity[]): string => {
  const studentsBeingServed = getStudentsBeingServed(meals).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });
  const staffBeingServed = getStaffBeingServed(meals).sort((a, b) => {
    const aName = a.firstName + " " + a.lastName;
    const bName = b.firstName + " " + b.lastName;
    return aName.toLowerCase().localeCompare(bName.toLowerCase());
  });

  let tableRows = "";

  // Add header row
  tableRows += `
    <tr>
      <th style="border: 1px solid #333; padding: 8px; text-align: left; font-weight: bold;">Name</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: left; font-weight: bold;">Items</th>
    </tr>
  `;

  // Group meals by person
  for (const person of studentsBeingServed) {
    const personMeals = meals.filter((meal) => meal.student?.id === person.id);

    if (personMeals.length === 0) continue;

    const personName = `${person.firstName} ${person.lastName}`;
    const rowspan = personMeals.length;

    // Add first row with rowspan
    const firstMeal = personMeals[0];
    const firstItems = firstMeal.items.map((item) => item.name).join(", ");

    tableRows += `
      <tr>
        <td style="border: 1px solid #333; padding: 8px; text-align: left;" rowspan="${rowspan}">${personName}</td>
        <td style="border: 1px solid #333; padding: 8px; text-align: left;">${firstItems}</td>
      </tr>
    `;

    // Add remaining rows for this person (without name column)
    for (let i = 1; i < personMeals.length; i++) {
      const meal = personMeals[i];
      const items = meal.items.map((item) => item.name).join(", ");

      tableRows += `
        <tr>
          <td style="border: 1px solid #333; padding: 8px; text-align: left;">${items}</td>
        </tr>
      `;
    }
  }

  for (const person of staffBeingServed) {
    const personMeals = meals.filter((meal) => meal.staffMember?.id === person.id);

    if (personMeals.length === 0) continue;

    const personName = `${person.firstName} ${person.lastName}`;
    const rowspan = personMeals.length;

    // Add first row with rowspan
    const firstMeal = personMeals[0];
    const firstItems = firstMeal.items.map((item) => item.name).join(", ");

    tableRows += `
      <tr>
        <td style="border: 1px solid #333; padding: 8px; text-align: left;" rowspan="${rowspan}">${personName}</td>
        <td style="border: 1px solid #333; padding: 8px; text-align: left;">${firstItems}</td>
      </tr>
    `;

    // Add remaining rows for this person (without name column)
    for (let i = 1; i < personMeals.length; i++) {
      const meal = personMeals[i];
      const items = meal.items.map((item) => item.name).join(", ");

      tableRows += `
        <tr>
          <td style="border: 1px solid #333; padding: 8px; text-align: left;">${items}</td>
        </tr>
      `;
    }
    
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      ${tableRows}
    </table>`;
};

// Generate HTML for hourly meal report
const generateHourlyMealReport = (
  allMeals: MealEntity[],
  staff: UserEntity[],
  students: StudentEntity[],
  schoolYear: SchoolYearEntity,
  date: string,
  time: string
): string => {
  // Get meals for this time
  const meals = getMealsAtTime(
    allMeals,
    staff,
    students,
    schoolYear,
    date,
    time
  );

  if (meals.length === 0) {
    return "";
  }

  const mealsTable = buildMealsTable(meals);

  return `
    <div style="page-break-before: always;">
      <h2 style="margin-bottom: 20px;">${DateTimeUtils.toTwelveHourTime(
        time
      )} - ${DateTimeUtils.toString(
    date,
    DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
  )}</h2>
      ${mealsTable}
    </div>
  `;
};

// Generate HTML for unassigned meals report
const generateUnassignedMealsReport = (
  allMeals: MealEntity[],
  staff: UserEntity[],
  students: StudentEntity[],
  schoolYear: SchoolYearEntity,
  date: string,
  mealTimes: string[]
): string => {
  let leftOverMeals: MealEntity[] = [...allMeals];
  for (const time of mealTimes) {
    const meals = getMealsAtTime(
      allMeals,
      staff,
      students,
      schoolYear,
      date,
      time
    );

    leftOverMeals = leftOverMeals.filter((meal) => !meals.includes(meal));
  }

  if (leftOverMeals.length === 0) {
    return "";
  }

  const mealsTable = buildMealsTable(leftOverMeals);
  return `
    <div style="page-break-before: always;">
      <h2 style="margin-bottom: 20px;">Unassigned Meals - ${DateTimeUtils.toString(
        date,
        DateTimeFormat.SHORT_DAY_OF_WEEK_DESC
      )}</h2>
      ${mealsTable}
    </div>
  `;
};

export const getDailyCafeteriaReport = async (
  school: SchoolEntity,
  date: string
): Promise<string> => {
  // Get the current school year for this school
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const schoolYear = await schoolYearRepository.findOne({
    where: {
      school: { id: school.id },
      isCurrent: true,
    },
    relations: {
      lunchTimes: true,
      teacherLunchTimes: {
        teacher: true,
      },
      gradeLunchTimes: true,
      studentLunchTimes: {
        student: true,
        lunchtimeTeacher: true,
      },
    },
  });

  if (!schoolYear) {
    return generateNoMealsPage();
  }

  const mealRepository = AppDataSource.getRepository(MealEntity);
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const staffRepository = AppDataSource.getRepository(UserEntity);

  const meals = await mealRepository.find({
    where: {
      date: date,
      order: {
        schoolYear: {
          school: { id: school.id },
        },
      },
    },
    relations: {
      student: true,
      staffMember: true,
      items: true,
      order: {
        schoolYear: {
          school: true,
        },
      },
    },
  });

  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const dailyMenu = await dailyMenuRepository.findOne({
    where: {
      schoolYear: { id: schoolYear.id },
      date: date,
    },
  });

  const uniqueStudentIds = new Set<number>();
  meals.forEach((meal) => {
    if (meal.student) {
      uniqueStudentIds.add(meal.student.id);
    }
  });

  const uniqueStaffIds = new Set<number>();
  meals.forEach((meal) => {
    if (meal.staffMember) {
      uniqueStaffIds.add(meal.staffMember.id);
    }
  });

  const students = await studentRepository.find({
    where: { id: In(Array.from(uniqueStudentIds)) },
  });

  const staff = await staffRepository.find({
    where: { id: In(Array.from(uniqueStaffIds)) },
  });

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  // Get meal times for this day from schoolYear.lunchTimes (same as frontend)
  const dailyTimes = schoolYear.lunchTimes?.find(
    (lt) => lt.dayOfWeek === dayOfWeek
  );
  const mealTimes = dailyTimes?.time ? dailyTimes.time.split("|").sort() : [];

  const orderedItemsHtml = generateOrderedItemsTable(
    meals,
    dailyMenu!,
    staff,
    students,
    schoolYear,
    date,
    mealTimes
  );

  let hourlyReportsHtml = "";
  for (const time of mealTimes) {
    const hourlyHtml = generateHourlyMealReport(
      meals,
      staff,
      students,
      schoolYear,
      date,
      time
    );
    if (hourlyHtml) {
      hourlyReportsHtml += hourlyHtml;
    }
  }

  const unassignedMealsHtml = generateUnassignedMealsReport(
    meals,
    staff,
    students,
    schoolYear,
    date,
    mealTimes
  );

  // Combine all sections
  const html = `
    <html>
      <head>
        ${getDefaultPageStyle()}
      </head>
      <body>
        ${orderedItemsHtml}
        ${hourlyReportsHtml}
        ${unassignedMealsHtml}
      </body>
    </html>
  `;

  return html;
};

const getMenuItems = (
  allMeals: MealEntity[],
  scheduledMenu: DailyMenuEntity
): PantryItem[] => {
  const orderedItems: PantryItem[] = [];

  allMeals
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

const getTeacherLunchtime = (
  teacher: UserEntity | undefined,
  date: string,
  schoolYear: SchoolYearEntity
) => {
  if (teacher === undefined || teacher.role !== Role.TEACHER) {
    return undefined;
  }

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const teacherLunchTime = schoolYear.teacherLunchTimes.find(
    (tlt) => tlt.teacher.id === teacher.id && tlt.dayOfWeek === dayOfWeek
  );
  return teacherLunchTime?.time;
};

const getStudentLunchtime = (
  student: StudentEntity | undefined,
  date: string,
  schoolYear: SchoolYearEntity
) => {
  if (student === undefined) {
    return undefined;
  }

  const dayOfWeek = DateTimeUtils.toDate(date).getDay();

  const studentLunchTime = schoolYear.studentLunchTimes.find(
    (lt) => lt.student.id === student.id && lt.dayOfWeek === dayOfWeek
  );

  if (studentLunchTime?.lunchtimeTeacher) {
    const teacher = studentLunchTime.lunchtimeTeacher;
    if (teacher) {
      const teacherLunchTime = schoolYear.teacherLunchTimes.find(
        (tlt) => tlt.teacher.id === teacher.id && tlt.dayOfWeek === dayOfWeek
      );
      return teacherLunchTime?.time;
    }
  }

  const gradeLunchTime = schoolYear.gradeLunchTimes.find(
    (glt) =>
      glt.grade === studentLunchTime?.grade && glt.dayOfWeek === dayOfWeek
  );

  return gradeLunchTime?.time;
};

const getMealsAtTime = (
  allMeals: MealEntity[],
  teachers: UserEntity[],
  students: StudentEntity[],
  schoolYear: SchoolYearEntity,
  date: string,
  time: string
) => {
  return allMeals.filter(
    (meal: MealEntity) =>
      meal.date === date &&
      (meal.time === time ||
        getTeacherLunchtime(
          teachers.find((teacher) => teacher.id === meal.staffMember?.id),
          date,
          schoolYear
        ) === time ||
        getStudentLunchtime(
          students.find((student) => student.id === meal.student?.id),
          date,
          schoolYear
        ) === time)
  );
};
