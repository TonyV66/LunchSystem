import express from "express";
import { chromium } from "playwright";
import { AppDataSource } from "../data-source";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import {  Not } from "typeorm";
import MealEntity from "../entity/MealEntity";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";
import { GradeLevel } from "../models/GradeLevel";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import { Role } from "../models/User";
import GradeLunchTimeEntity from "../entity/GradeLunchTimeEntity";
import { DateTimeFormat, DateTimeUtils } from "../DateTimeUtils";

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
        <p>${DateTimeUtils.toString(reportData.date, DateTimeFormat.SHORT_DAY_OF_WEEK_DESC)} @ ${reportData.time}</p>
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

router.get("/unassigned/:date", async (req, res) => {
  try {
    const date = req.params.date;
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getDebugSchoolYear();
    if (!currentSchoolYear) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const mealsBeingServed = await getMealsBeingServed(
      currentSchoolYear,
      date
    );

    const studentsBeingServed = getStudentsBeingServed(mealsBeingServed);

    const classroomTeachers = await getClassroomTeachers(
      currentSchoolYear,
      date
    );

    const classroomMap = getClassroomMap(date, classroomTeachers, studentsBeingServed);

    const gradesAssignedByClass = currentSchoolYear.gradesAssignedByClass
      ? (currentSchoolYear.gradesAssignedByClass.split("|") as GradeLevel[])
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
    const otherStudents = studentsBeingServed.filter(student => 
      !studentsInClassrooms.has(student.id) && !studentsInGradeLevels.has(student.id)
    );
    const otherStudentsReportData = buildOtherStudentsReportData(mealsBeingServed, otherStudents, date);


    const html = generateMealReports(otherStudentsReportData);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to generate PDF",
      details: errorMessage,
    });
  }
});


router.get("/staff/:date", async (req, res) => {
  try {
    const date = req.params.date;
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getDebugSchoolYear();
    if (!currentSchoolYear) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const mealsBeingServed = await getMealsBeingServed(
      currentSchoolYear,
      date
    );

    // Find staff members who are being served meals but not in classroomTeachers array
    const staffMeals = mealsBeingServed.filter(meal => meal.staffMember);
    const staffBeingServed = staffMeals
      .map(meal => meal.staffMember!)
      .filter((staffMember, index, self) => 
        index === self.findIndex(s => s.id === staffMember.id)
      );
    const otherStaffReportData = buildStaffReportData(mealsBeingServed, staffBeingServed, date);

    const html = generateMealReports(otherStaffReportData);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to generate PDF",
      details: errorMessage,
    });
  }
});

router.get("/cohorts/:date", async (req, res) => {
  try {
    const date = req.params.date;
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getDebugSchoolYear();
    if (!currentSchoolYear) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const mealsBeingServed = await getMealsBeingServed(
      currentSchoolYear,
      date
    );

    const studentsBeingServed = getStudentsBeingServed(mealsBeingServed);

    const classroomTeachers = await getClassroomTeachers(
      currentSchoolYear,
      date
    );

    const classroomMap = getClassroomMap(date, classroomTeachers, studentsBeingServed);

    const gradesAssignedByClass = currentSchoolYear.gradesAssignedByClass
      ? (currentSchoolYear.gradesAssignedByClass.split("|") as GradeLevel[])
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

    const teacherLunchTimes = await getTeacherLunchTimes(currentSchoolYear, date);
    const gradeLevelLunchTimes = await getGradeLevelLunchTimes(currentSchoolYear, date);

    const classroomReportData = buildClassroomReportData(mealsBeingServed,classroomMap, classroomTeachers, date, teacherLunchTimes);
    const gradeLevelReportData = buildGradeLevelReportData(mealsBeingServed, gradeLevelMap, date, gradeLevelLunchTimes);

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
    const otherStudents = studentsBeingServed.filter(student => 
      !studentsInClassrooms.has(student.id) && !studentsInGradeLevels.has(student.id)
    );
    const otherStudentsReportData = buildOtherStudentsReportData(mealsBeingServed, otherStudents, date);

    // Find staff members who are being served meals but not in classroomTeachers array
    const staffMeals = mealsBeingServed.filter(meal => meal.staffMember);
    const staffBeingServed = staffMeals
      .map(meal => meal.staffMember!)
      .filter((staffMember, index, self) => 
        index === self.findIndex(s => s.id === staffMember.id)
      );
    const otherStaffReportData = buildStaffReportData(mealsBeingServed, staffBeingServed, date);

    const allReportData: ReportData[] = classroomReportData.concat(gradeLevelReportData).concat(otherStudentsReportData).concat(otherStaffReportData);

    const html = generateMealReports(allReportData);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to generate PDF",
      details: errorMessage,
    });
  }
});

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

const getGradeLevelStudents = async (
  schoolYear: SchoolYearEntity,
  gradeLevel: GradeLevel,
  dayOfWeek: number
): Promise<StudentEntity[]> => {
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  // Find all lunchtime assignments where this teacher is assigned
  const lunchTimeAssignments = await studentLunchTimeRepository.find({
    where: {
      schoolYear,
      grade: gradeLevel,
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
        lunchTimes: {lunchtimeTeacher: true},
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
    const lunchTimeAssignments = student.lunchTimes?.filter(assignment => 
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
  const teacherIds = new Set(teachers.map(teacher => teacher.id));
  
  // Create a map to group students by teacher
  const classroomMap = new Map<number, StudentEntity[]>();
  
  for (const student of students) {
    // Find lunch time assignments for this student on the given day
    const lunchTimeAssignments = student.lunchTimes?.filter(assignment => 
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

const getStudentsBeingServed = (
  mealsBeingServed: MealEntity[]
): StudentEntity[] => {
  // Get all students being served meals directly from the meals data
  const studentMeals = mealsBeingServed.filter(meal => meal.student);
  
  // Get unique StudentEntity objects for students being served
  const uniqueStudents = studentMeals
    .map(meal => meal.student)
    .filter((student, index, self) => 
      student && index === self.findIndex(s => s?.id === student.id)
    ) as StudentEntity[];
  
  return uniqueStudents;
};

const getTeacherLunchTimes = async (
  schoolYear: SchoolYearEntity,
  date: string
): Promise<TeacherLunchTimeEntity[]> => {
  const dayOfWeek = DateTimeUtils.toDate(date).getDay();
  const teacherLunchTimeRepository = AppDataSource.getRepository(TeacherLunchTimeEntity);
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
  const gradeLunchTimeRepository = AppDataSource.getRepository(GradeLunchTimeEntity);
  
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
    const teacher = classroomTeachers.find(t => t.id === teacherId);
    if (!teacher) continue;

    // Get teacher's lunch time for this day
    const teacherLunchTime = teacherLunchTimes.find(tlt => 
      tlt.teacher.id === teacherId && tlt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this classroom
    const studentMeals = mealsBeingServed.filter(meal => 
      meal.student && students.some(student => student.id === meal.student!.id)
    );

    // Get teacher's meals
    const teacherMeals = mealsBeingServed.filter(meal => 
      meal.staffMember?.id === teacherId
    );

    // Skip if no meals for either students or teacher
    if (studentMeals.length === 0 && teacherMeals.length === 0) {
      continue;
    }

    // Create classroom data
    const reportData: ReportData = {
      isClassroom: true,
      title: teacher.name.length > 0 ? teacher.name : teacher.firstName + " " + teacher.lastName,
      time: teacherLunchTime?.time
        ? teacherLunchTime.time.split("|")[0]
        : "Not assigned",
      date: date,
      customers: [],
    };

    // Add teacher meals first (if any)
    if (teacherMeals.length > 0) {
      const teacherMealData = teacherMeals.map((meal) => ({
        items: meal.items.map((item) => item.name),
      }));

      reportData.customers.push({
        name: `${teacher.firstName} ${teacher.lastName}`,
        meals: teacherMealData,
      });
    }

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

router.get("/classroom/:teacherId/:date", async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const date = req.params.date;

    // Validate inputs
    if (isNaN(teacherId)) {
      res.status(400).json({ error: "Invalid teacher ID" });
      return;
    }
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getDebugSchoolYear();
    if (!currentSchoolYear) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    // Get meals being served
    const mealsBeingServed = await getMealsBeingServed(currentSchoolYear, date);
    
    // Get teacher data
    const userRepository = AppDataSource.getRepository(UserEntity);
    const teacher = await userRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }

    // Get teacher lunch times
    const teacherLunchTimeRepository = AppDataSource.getRepository(TeacherLunchTimeEntity);
    const teacherLunchTimes = await teacherLunchTimeRepository.find({
      where: {
        schoolYear: { id: currentSchoolYear.id },
      },
      relations: {
        teacher: true,
      },
    });

    // Get students for this teacher
    const dayOfWeek = DateTimeUtils.toDate(date).getDay();
    const students = await getClassroomStudents(currentSchoolYear, teacherId, dayOfWeek);
    
    // Create classroom map
    const classroomMap = new Map([[teacherId, students]]);

    const reportData = buildClassroomReportData(
      mealsBeingServed,
      classroomMap,
      [teacher],
      date,
      teacherLunchTimes
    );

    if (!reportData || reportData.length === 0) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const html = generateMealReports(reportData);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to generate PDF",
      details: errorMessage,
    });
  }
});

const getGradeLevelReportData = async (
  schoolYear: SchoolYearEntity,
  gradeLevels: GradeLevel[],
  date: string
): Promise<ReportData[]> => {
  const reportDataArray: ReportData[] = [];

  for (const gradeLevel of gradeLevels) {
    const dayOfWeek = DateTimeUtils.toDate(date).getDay();

    const students = await getGradeLevelStudents(
      schoolYear,
      gradeLevel,
      dayOfWeek
    );

    if (students.length === 0) {
      continue; // Skip this teacher if no students
    }

    const mealRepository = AppDataSource.getRepository(MealEntity);
    const meals = await mealRepository.find({
      where: {
        date: date,
        student: { id: Not(0) },
      },
      relations: {
        student: true,
        items: true,
        order: true,
      },
    });

    const reportData: ReportData = {
      isClassroom: false,
      title: `${gradeLevel} Grade`,
      time: "Various times", // Grade levels may have different lunch times
      date: date,
      customers: [],
    };

    // Add students and their meals
    for (const student of students) {
      // Get all meals for this student on this date that match their lunch time
      const studentMeals = meals
        .filter((meal) => meal.student?.id === student.id)
        .map((meal) => ({
          items: meal.items.map((item) => item.name),
        }));

      reportData.customers.push({
        name: student.firstName + " " + student.lastName,
        meals: studentMeals,
      });
    }

    reportData.customers.sort((a, b) => a.name.localeCompare(b.name));
    reportDataArray.push(reportData);
  }

  return reportDataArray;
};

router.get("/grade/:gradeLevel/:date", async (req, res) => {
  try {
    const gradeLevel = req.params.gradeLevel;
    const date = req.params.date;

    if (!gradeLevel) {
      res.status(400).json({ error: "Invalid grade level" });
      return;
    }
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getDebugSchoolYear();
    if (!currentSchoolYear) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const reportData = await getGradeLevelReportData(
      currentSchoolYear,
      [gradeLevel as GradeLevel],
      date
    );

    if (!reportData || reportData.length === 0) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const html = generateMealReports(reportData);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to generate PDF",
      details: errorMessage,
    });
  }
});

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
    const gradeLunchTime = gradeLevelLunchTimes.find(glt => 
      glt.grade === gradeLevel && glt.dayOfWeek === dayOfWeek
    );

    // Get meals for students in this grade level
    const studentMeals = mealsBeingServed.filter(meal => 
      meal.student && students.some(student => student.id === meal.student!.id)
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
  const studentMeals = mealsBeingServed.filter(meal => 
    meal.student && otherStudents.some(student => student.id === meal.student!.id)
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
  const staffMeals = mealsBeingServed.filter(meal => 
    meal.staffMember && staffMembers.some(staff => staff.id === meal.staffMember!.id)
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

async function generateAndSendPDF(html: string, res: express.Response) {
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

  // Clear any existing headers
  res.removeHeader("Content-Type");
  res.removeHeader("Content-Length");
  res.removeHeader("Content-Disposition");
  res.removeHeader("Cache-Control");

  // Set headers in a specific order
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", pdfBuffer.length);
  res.setHeader("Content-Disposition", 'inline; filename="classrooms.pdf"');

  // Send the PDF
  res.write(pdfBuffer);
  res.end();
}

const getDebugSchoolYear = async () => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  let schoolYear = await schoolYearRepository.findOne({
    where: { id: 1 },
  });

  return schoolYear;
};

export default router;
