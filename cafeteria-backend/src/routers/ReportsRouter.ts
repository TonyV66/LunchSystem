import express from "express";
import { AppDataSource } from "../data-source";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import {  Not } from "typeorm";
import MealEntity from "../entity/MealEntity";
import { GradeLevel } from "../models/GradeLevel";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import { Role } from "../models/User";
import GradeLunchTimeEntity from "../entity/GradeLunchTimeEntity";
import { DateTimeFormat, DateTimeUtils } from "../DateTimeUtils";
import { generatePDFBuffer, getClassroomReport, getDailyReport, getDailyCafeteriaReport } from "../utils/ReportUtils";
import SchoolEntity from "../entity/SchoolEntity";
import { EmailReportService } from "../services/EmailReportService";

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

    const html = await getDailyReport(currentSchoolYear, date);
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

router.get("/cafeteria/:date", async (req, res) => {
  try {
    const date = req.params.date;
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }
    const schoolRepository = AppDataSource.getRepository(SchoolEntity);
    const school = await schoolRepository.findOne({
      where: {
        id: 1,
      },
    });

    if (!school) {
      res.status(400).json({ error: "No school found" });
      return;
    }

    const html = await getDailyCafeteriaReport(school, date);
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

router.get("/classroom/:teacherId/:date", async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const date = req.params.date;

    // Validate inputs
    if (isNaN(teacherId)) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }
    if (isNaN(Date.parse(date))) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    // Get current school year
    const currentSchoolYear = await getDebugSchoolYear();
    if (!currentSchoolYear) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const userRepository = AppDataSource.getRepository(UserEntity);
    const teacher = await userRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      const html = generateNoMealsPage();
      await generateAndSendPDF(html, res);
      return;
    }

    const html = await getClassroomReport(currentSchoolYear, teacher, [date]);
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
  const pdfBuffer = await generatePDFBuffer(html);
 
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

// Test endpoint to manually trigger email sending
router.post("/test-email-reports/:schoolId", async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const date = req.body.date;
    
    try {
      // Get school configuration
      const schoolRepository = AppDataSource.getRepository(SchoolEntity);
      const schoolEntity = await schoolRepository.findOne({ where: { id: schoolId } });
      
      await EmailReportService.sendClassroomReports(schoolEntity!, [date]);
    } catch (error) {
      console.error("Error in sendReportsForDate:", error);
    }

    
    res.json({ 
      success: true, 
      message: `Test email reports sent for date: ${date}` 
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to send test email reports",
      details: errorMessage,
    });
  }
});

// Test endpoint to manually trigger the check and send process
router.post("/test-check-and-send/:schoolId", async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    await EmailReportService.checkAndSendReports(schoolId);
    
    res.json({ 
      success: true, 
      message: "Test check and send process completed" 
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to run test check and send process",
      details: errorMessage,
    });
  }
});

export default router;
