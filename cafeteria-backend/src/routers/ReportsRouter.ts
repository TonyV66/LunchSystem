import express from 'express';
import puppeteer from 'puppeteer';
import { AppDataSource } from '../data-source';
import StudentLunchTimeEntity from '../entity/StudentLunchTimeEntity';
import { getCurrentSchoolYear } from './RouterUtils';
import { Not } from 'typeorm';
import MealEntity from '../entity/MealEntity';
import TeacherLunchTimeEntity from '../entity/TeacherLunchTimeEntity';
import { DayOfWeek } from '../models/DayOfWeek';

const router = express.Router();

interface MealData {
  items: string[];
}

interface StudentData {
  name: string;
  meals: MealData[];
}

interface ClassroomData {
  teacherName: string;
  teacherLunchTime: string;
  students: StudentData[];
}

function generateHTML(classrooms: ClassroomData[], date: string) {
  if (classrooms.length === 0) {
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
          <div class="message">No active school year.</div>
        </body>
      </html>
    `;
  }

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          h2 { margin-top: 0; }
          .page-break { page-break-before: always; }
          .header { 
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          .date {
            color: #666;
            font-size: 14px;
          }
          .teacher-time {
            color: #666;
            font-size: 14px;
            margin-top: 4px;
          }
          .meal-items {
            color: #666;
          }
          .student-name {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${classrooms.map((classroom, i) => `
          <div class="${i > 0 ? 'page-break' : ''}">
            <div class="header">
              <h2>${classroom.teacherName}'s Classroom</h2>
              <div class="date">Date: ${date}</div>
              <div class="teacher-time">Teacher's Lunch Time: ${classroom.teacherLunchTime}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Meal Items</th>
                </tr>
              </thead>
              <tbody>
                ${classroom.students.flatMap(student => 
                  student.meals.map((meal, mealIndex) => `
                    <tr>
                      <td class="student-name">${mealIndex === 0 ? student.name : ''}</td>
                      <td class="meal-items">${meal.items.join(', ')}</td>
                    </tr>
                  `)
                ).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </body>
    </html>
  `;
}

function generateTeacherClassroomHTML(classroom: ClassroomData | null, date: string) {
  if (!classroom) {
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
          <div class="message">No classroom data found for this teacher.</div>
        </body>
      </html>
    `;
  }

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          h2 { margin-top: 0; }
          .header { 
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          .date {
            color: #666;
            font-size: 14px;
          }
          .teacher-time {
            color: #666;
            font-size: 14px;
            margin-top: 4px;
          }
          .meal-items {
            color: #666;
          }
          .student-name {
            font-weight: bold;
          }
          .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
          }
          .summary-item {
            margin: 5px 0;
            color: #444;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${classroom.teacherName}'s Classroom Meal Report</h2>
          <div class="date">Date: ${date}</div>
          <div class="teacher-time">Teacher's Lunch Time: ${classroom.teacherLunchTime}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Meal Items</th>
            </tr>
          </thead>
          <tbody>
            ${classroom.students.flatMap(student => 
              student.meals.map((meal, mealIndex) => `
                <tr>
                  <td class="student-name">${mealIndex === 0 ? student.name : ''}</td>
                  <td class="meal-items">${meal.items.join(', ')}</td>
                </tr>
              `)
            ).join('')}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-item">Total Students: ${classroom.students.length}</div>
          <div class="summary-item">Total Meals: ${classroom.students.reduce((sum, student) => sum + student.meals.length, 0)}</div>
          <div class="summary-item">Students with Meals: ${classroom.students.filter(student => student.meals.length > 0).length}</div>
        </div>
      </body>
    </html>
  `;
}

router.get('/classrooms/:date', async (req, res) => {
  try {
    const date = req.params.date;
    // Simple date validation - check if it's a valid date string
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getCurrentSchoolYear(req.user.school);
    if (!currentSchoolYear) {
      const html = generateHTML([], date);
      await generateAndSendPDF(html, res);
      return;
    }

    // Get the day of week for the date
    const dayOfWeek = new Date(date).getDay();

    // Get all student lunch times with teacher assignments for the current school year
    const studentLunchTimeRepository = AppDataSource.getRepository(StudentLunchTimeEntity);
    const studentLunchTimes = await studentLunchTimeRepository.find({
      where: {
        schoolYear: { id: currentSchoolYear.id },
        lunchtimeTeacher: { id: Not(0) }
      },
      relations: {
        student: true,
        lunchtimeTeacher: true
      }
    });

    // Get all meals for the date
    const mealRepository = AppDataSource.getRepository(MealEntity);
    const meals = await mealRepository.find({
      where: {
        date: date,
        student: { id: Not(0) }
      },
      relations: {
        student: true,
        items: true,
        order: true
      }
    });

    // Get teacher lunch times for the current school year
    const teacherLunchTimeRepository = AppDataSource.getRepository(TeacherLunchTimeEntity);
    const teacherLunchTimes = await teacherLunchTimeRepository.find({
      where: {
        schoolYear: { id: currentSchoolYear.id },
        dayOfWeek: dayOfWeek
      },
      relations: {
        teacher: true
      }
    });

    // Group students by teacher
    const teacherGroups = new Map<number, ClassroomData>();
    
    for (const lunchTime of studentLunchTimes) {
      if (!lunchTime.lunchtimeTeacher) continue;
      
      const teacherId = lunchTime.lunchtimeTeacher.id;
      const teacherName = `${lunchTime.lunchtimeTeacher.firstName} ${lunchTime.lunchtimeTeacher.lastName}`.trim();
      
      if (!teacherGroups.has(teacherId)) {
        // Find teacher's lunch time for this day
        const teacherLunchTime = teacherLunchTimes.find(tlt => tlt.teacher.id === teacherId);
        const teacherTime = teacherLunchTime?.time ? teacherLunchTime.time.split('|')[0] : 'Not assigned';

        teacherGroups.set(teacherId, {
          teacherName,
          teacherLunchTime: teacherTime,
          students: []
        });
      }
      
      const classroom = teacherGroups.get(teacherId)!;
      const student = lunchTime.student;
      
      // Only add student if not already in the list
      if (!classroom.students.some(s => s.name === student.name)) {
        // Get all meals for this student on this date that match their lunch time
        const studentMeals = meals
          .filter(meal => 
            meal.student?.id === student.id && 
            meal.time === lunchTime.time
          )
          .map(meal => ({
            items: meal.items.map(item => item.name)
          }));

        classroom.students.push({
          name: student.name,
          meals: studentMeals
        });
      }
    }

    // Convert map to array and sort by teacher name
    const classrooms = Array.from(teacherGroups.values())
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

    const html = generateHTML(classrooms, date);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: errorMessage 
    });
  }
});

router.get('/classroom/:teacherId/:date', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const date = req.params.date;

    // Validate inputs
    if (isNaN(teacherId)) {
      res.status(400).json({ error: 'Invalid teacher ID' });
      return;
    }
    if (isNaN(Date.parse(date))) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    // Get current school year
    const currentSchoolYear = await getCurrentSchoolYear(req.user.school);
    if (!currentSchoolYear) {
      const html = generateTeacherClassroomHTML(null, date);
      await generateAndSendPDF(html, res);
      return;
    }

    // Get the day of week for the date
    const dayOfWeek = new Date(date).getDay();

    // Get student lunch times for this teacher
    const studentLunchTimeRepository = AppDataSource.getRepository(StudentLunchTimeEntity);
    const studentLunchTimes = await studentLunchTimeRepository.find({
      where: {
        schoolYear: { id: currentSchoolYear.id },
        lunchtimeTeacher: { id: teacherId }
      },
      relations: {
        student: true,
        lunchtimeTeacher: true
      }
    });

    if (studentLunchTimes.length === 0) {
      const html = generateTeacherClassroomHTML(null, date);
      await generateAndSendPDF(html, res);
      return;
    }

    // Get all meals for the date
    const mealRepository = AppDataSource.getRepository(MealEntity);
    const meals = await mealRepository.find({
      where: {
        date: date,
        student: { id: Not(0) }
      },
      relations: {
        student: true,
        items: true,
        order: true
      }
    });

    // Get teacher's lunch time
    const teacherLunchTimeRepository = AppDataSource.getRepository(TeacherLunchTimeEntity);
    const teacherLunchTime = await teacherLunchTimeRepository.findOne({
      where: {
        schoolYear: { id: currentSchoolYear.id },
        dayOfWeek: dayOfWeek,
        teacher: { id: teacherId }
      },
      relations: {
        teacher: true
      }
    });

    const teacher = studentLunchTimes[0].lunchtimeTeacher;
    if (!teacher) {
      const html = generateTeacherClassroomHTML(null, date);
      await generateAndSendPDF(html, res);
      return;
    }

    // Create classroom data
    const classroom: ClassroomData = {
      teacherName: `${teacher.firstName} ${teacher.lastName}`.trim(),
      teacherLunchTime: teacherLunchTime?.time ? teacherLunchTime.time.split('|')[0] : 'Not assigned',
      students: []
    };

    // Add students and their meals
    for (const lunchTime of studentLunchTimes) {
      const student = lunchTime.student;
      
      // Get all meals for this student on this date that match their lunch time
      const studentMeals = meals
        .filter(meal => 
          meal.student?.id === student.id && 
          meal.time === lunchTime.time
        )
        .map(meal => ({
          items: meal.items.map(item => item.name)
        }));

      classroom.students.push({
        name: student.name,
        meals: studentMeals
      });
    }

    // Sort students by name
    classroom.students.sort((a, b) => a.name.localeCompare(b.name));

    const html = generateTeacherClassroomHTML(classroom, date);
    await generateAndSendPDF(html, res);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: errorMessage 
    });
  }
});

async function generateAndSendPDF(html: string, res: express.Response) {
  // Launch Puppeteer with more flexible options
  const browser = await puppeteer.launch({
    executablePath: "/Users/angelo/.cache/puppeteer/chrome/mac-136.0.7103.94/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();

  // Set viewport size
  await page.setViewport({ width: 1200, height: 800 });

  await page.setContent(html, { 
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 30000 
  });

  // Wait a bit to ensure everything is rendered
  await new Promise(resolve => setTimeout(resolve, 1000));

  const pdfBuffer = await page.pdf({ 
    format: 'A4', 
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    },
    preferCSSPageSize: true
  });

  await browser.close();
  
  // Clear any existing headers
  res.removeHeader('Content-Type');
  res.removeHeader('Content-Length');
  res.removeHeader('Content-Disposition');
  res.removeHeader('Cache-Control');
  
  // Set headers in a specific order
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdfBuffer.length);
  res.setHeader('Content-Disposition', 'inline; filename="classrooms.pdf"');
  
  // Send the PDF
  res.write(pdfBuffer);
  res.end();
}

export default router; 