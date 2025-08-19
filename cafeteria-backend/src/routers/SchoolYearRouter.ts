import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { addUserToSchoolYear, authorizeRequest } from "./RouterUtils";

import SchoolYearEntity from "../entity/SchoolYearEntity";
import SchoolYear from "../models/SchoolYear";
import SchoolYearLunchTimeEntity from "../entity/SchoolYearLunchTimeEntity";
import SchoolEntity from "../entity/SchoolEntity";
import { Role } from "../models/User";
import DailyLunchTimes from "../models/DailyLunchTimes";
import GradeLunchTimeEntity from "../entity/GradeLunchTimeEntity";
import { GradeLevel } from "../models/GradeLevel";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";
import UserEntity from "../entity/UserEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { getStaffSession, SessionInfo } from "./SessionRouter";
import { Not, LessThan, In, IsNull } from "typeorm";
import StudentEntity from "../entity/StudentEntity";

const SchoolYearRouter: Router = express.Router();

SchoolYearRouter.post<{}, SchoolYear | string, SchoolYear, {}>(
  "/",
  authorizeRequest,
  async (req, res) => {
    if (req.user.role !== Role.ADMIN) {
      res.status(403).send("Unauthorized");
      return;
    }

    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (startDate > endDate) {
      const tmpDate = startDate;
      startDate = endDate;
      endDate = tmpDate;
    }

    const existingSchoolYears: SchoolYearEntity[] =
      await AppDataSource.createQueryBuilder()
        .relation(SchoolEntity, "schoolYears")
        .of(req.user.school)
        .loadMany();

    const overlappingSchoolYear: SchoolYearEntity | undefined =
      existingSchoolYears.find(
        (esy) => startDate === esy.startDate
      );

    if (overlappingSchoolYear) {
      res.status(400).send("Duplicate school year start dates");
      return;
    }

    const newSchoolYear = await schoolYearRepository.save({
      name: req.body.name,
      startDate: startDate,
      endDate: endDate,
      isCurrent: false,
      school: req.user.school,
    });

    res.send(new SchoolYear(newSchoolYear));
  }
);

SchoolYearRouter.put<{}, SchoolYear | string, SchoolYear, {}>(
  "/",
  authorizeRequest,
  async (req, res) => {
    if (req.user.role !== Role.ADMIN) {
      res.status(403).send("Unauthorized");
      return;
    }

    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (startDate > endDate) {
      const tmpDate = startDate;
      startDate = endDate;
      endDate = tmpDate;
    }

    const existingSchoolYears: SchoolYearEntity[] =
      await AppDataSource.createQueryBuilder()
        .relation(SchoolEntity, "schoolYears")
        .of(req.user.school)
        .loadMany();

    const overlappingSchoolYear: SchoolYearEntity | undefined =
      existingSchoolYears.find(
        (esy) => !(endDate < esy.startDate || startDate > esy.endDate)
      );

    if (overlappingSchoolYear && overlappingSchoolYear.id !== req.body.id) {
      res.status(400).send("Overlapping school year dates");
      return;
    }

    const existingSchoolYear = await schoolYearRepository.findOne({
      where: { id: req.body.id },
      relations: { school: true },
    });

    if (!existingSchoolYear) {
      res.status(404).send("School year not found");
      return;
    }

    if (existingSchoolYear.school.id !== req.user.school.id) {
      res.status(403).send("Unauthorized");
      return;
    }

    await schoolYearRepository.update(req.body.id, {
      name: req.body.name,
      startDate: startDate,
      endDate: endDate,
      hideSchedule: req.body.hideSchedule,
    });

    const updatedSchoolYear = await schoolYearRepository.findOne({
      where: { id: req.body.id },
    });

    res.send(new SchoolYear(updatedSchoolYear!));
  }
);

SchoolYearRouter.post<
  { schoolYearId: string; teacherId: string },
  {},
  DailyLunchTimes[],
  {}
>(
  "/:schoolYearId/teacher/:teacherId/times",
  authorizeRequest,
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
    const teacherLunchTimeRepository = AppDataSource.getRepository(
      TeacherLunchTimeEntity
    );
    const userRepository = AppDataSource.getRepository(UserEntity);

    let schoolYear = await schoolYearRepository.findOne({
      where: { id: parseInt(req.params.schoolYearId) },
      relations: { teacherLunchTimes: { teacher: true } },
    });

    if (!schoolYear) {
      res.status(401).send("School year not found");
      return;
    }

    const teacher = await userRepository.findOne({
      where: { id: parseInt(req.params.teacherId) },
    });

    if (!teacher) {
      res.status(401).send("Teacher not found");
      return;
    }

    for (const dlt of req.body) {
      const newTimes = dlt.times.sort().join("|");
      const newGrades = (dlt as any).grades ? (dlt as any).grades.join("|") : "";
      const dailyTimes = schoolYear.teacherLunchTimes.find(
        (lt) => lt.dayOfWeek === dlt.dayOfWeek && lt.teacher.id === teacher.id
      );

      if (dailyTimes) {
        if (dailyTimes.time !== newTimes || dailyTimes.grades !== newGrades) {
          await teacherLunchTimeRepository.update(dailyTimes.id, {
            time: newTimes,
            grades: newGrades,
          });
        }
      } else {
        await teacherLunchTimeRepository.save({
          dayOfWeek: dlt.dayOfWeek,
          time: newTimes,
          grades: newGrades,
          schoolYear: schoolYear,
          teacher: teacher,
        });
      }
    }

    res.sendStatus(200);
  }
);

SchoolYearRouter.post<
  { schoolYearId: string },
  DailyLunchTimes[] | string,
  DailyLunchTimes[],
  {}
>("/:schoolYearId/times", authorizeRequest, async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const schoolLunchTimeRepository = AppDataSource.getRepository(
    SchoolYearLunchTimeEntity
  );

  let schoolYear = await schoolYearRepository.findOne({
    where: { id: parseInt(req.params.schoolYearId) },
    relations: { lunchTimes: true },
  });

  if (!schoolYear) {
    res.status(401).send("School year not found");
    return;
  }

  for (const dlt of req.body) {
    const newTimes = dlt.times.join("|");
    const dailyTimes = schoolYear.lunchTimes.find(
      (lt) => lt.dayOfWeek === dlt.dayOfWeek
    );
    if (dailyTimes) {
      await schoolLunchTimeRepository.update(dailyTimes.id, {
        time: newTimes,
      });
      dailyTimes.time = newTimes;
    } else {
      schoolYear.lunchTimes.push(
        await schoolLunchTimeRepository.save({
          dayOfWeek: dlt.dayOfWeek,
          time: newTimes,
          schoolYear: schoolYear,
        })
      );
    }
  }
  res.status(200).send(
    schoolYear.lunchTimes.map((sylt) => ({
      dayOfWeek: sylt.dayOfWeek,
      times: sylt.time ? sylt.time.split("|") : [],
    }))
  );
});

SchoolYearRouter.put<
  { schoolYearId: string },
  SchoolYear | string,
  GradeLevel[],
  {}
>("/:schoolYearId/gradeconfig", authorizeRequest, async (req, res) => {
  if (req.user.role !== Role.ADMIN) {
    res.status(403).send("Unauthorized");
    return;
  }

  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const schoolYear = await schoolYearRepository.findOne({
    where: {
      id: parseInt(req.params.schoolYearId),
    },
    relations: { school: true },
  });

  if (!schoolYear) {
    res.status(404).send("Current school year not found");
    return;
  }

  await schoolYearRepository.update(schoolYear.id, {
    gradesAssignedByClass: req.body.join("|"),
  });

  const updatedSchoolYear = await schoolYearRepository.findOne({
    where: { id: schoolYear.id },
  });

  res.send(new SchoolYear(updatedSchoolYear!));
});

SchoolYearRouter.put<
  { schoolYearId: string },
  SchoolYear | string,
  { oneTeacherPerStudent: boolean },
  {}
>("/:schoolYearId/teacher-config", authorizeRequest, async (req, res) => {
  if (req.user.role !== Role.ADMIN) {
    res.status(403).send("Unauthorized");
    return;
  }

  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const schoolYear = await schoolYearRepository.findOne({
    where: {
      id: parseInt(req.params.schoolYearId),
    },
    relations: { school: true },
  });

  if (!schoolYear) {
    res.status(404).send("School year not found");
    return;
  }

  if (schoolYear.school.id !== req.user.school.id) {
    res.status(403).send("Unauthorized");
    return;
  }

  await schoolYearRepository.update(schoolYear.id, {
    oneTeacherPerStudent: req.body.oneTeacherPerStudent,
  });

  const updatedSchoolYear = await schoolYearRepository.findOne({
    where: { id: schoolYear.id },
  });

  res.send(new SchoolYear(updatedSchoolYear!));
});

SchoolYearRouter.post<
  { schoolYearId: string; grade: string },
  {},
  DailyLunchTimes[],
  {}
>("/:schoolYearId/grade/:grade/times", authorizeRequest, async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const gradeLunchTimeRepository =
    AppDataSource.getRepository(GradeLunchTimeEntity);

  let schoolYear = await schoolYearRepository.findOne({
    where: { id: parseInt(req.params.schoolYearId) },
    relations: { gradeLunchTimes: true },
  });

  if (!schoolYear) {
    res.status(401).send("School year not found");
    return;
  }

  const grade = req.params.grade as GradeLevel;
  if (!Object.values(GradeLevel).includes(grade)) {
    res.status(400).send("Invalid grade level");
    return;
  }

  for (const dlt of req.body) {
    const newTimes = dlt.times.sort().join("|");
    const dailyTimes = schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === dlt.dayOfWeek && lt.grade === grade
    );

    if (dailyTimes) {
      if (dailyTimes.time !== newTimes) {
        await gradeLunchTimeRepository.update(dailyTimes.id, {
          time: newTimes,
        });
      }
    } else {
      await gradeLunchTimeRepository.save({
        dayOfWeek: dlt.dayOfWeek,
        time: newTimes,
        grade,
        schoolYear,
      });
    }
  }

  res.sendStatus(200);
});

SchoolYearRouter.put<{ schoolYearId: string }, SessionInfo | string, {}, {}>(
  "/:schoolYearId/toggle-current",
  authorizeRequest,
  async (req, res) => {
    if (req.user.role !== Role.ADMIN) {
      res.status(403).send("Unauthorized");
      return;
    }

    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
    const userRepository = AppDataSource.getRepository(UserEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const studentRepository = AppDataSource.getRepository(StudentEntity);

    const schoolYear = await schoolYearRepository.findOne({
      where: { id: parseInt(req.params.schoolYearId) },
      relations: { school: true },
    });

    if (!schoolYear) {
      res.status(404).send("School year not found");
      return;
    }

    if (schoolYear.school.id !== req.user.school.id) {
      res.status(403).send("Unauthorized");
      return;
    }

    const isCurrent = !schoolYear.isCurrent;

    // If we're activating this year, deactivate all other years first
    if (isCurrent) {
      await schoolYearRepository.update(
        { school: { id: req.user.school.id } },
        { isCurrent: false }
      );

      // Get all non-parent users for the school
      const staffUsers = await userRepository.find({
        where: {
          school: { id: req.user.school.id },
          role: Not(Role.PARENT)
        }
      });

      // Add all staff users to the school year
      for (const user of staffUsers) {
        await addUserToSchoolYear(user, schoolYear);
      }

      // Find the previous school year by comparing start dates
      // const previousSchoolYear = await schoolYearRepository.findOne({
      //   where: {
      //     school: { id: req.user.school.id },
      //     startDate: LessThan(schoolYear.startDate)
      //   },
      //   order: { startDate: 'DESC' }
      // });

      // if (previousSchoolYear) {
      //   // Get all users who placed orders in the previous school year
      //   const orders = await orderRepository.find({
      //     where: { schoolYear: { id: previousSchoolYear.id } },
      //     relations: { user: true },
      //     select: { user: { id: true } }
      //   });

      //   // Get unique user IDs from orders
      //   const previousYearUserIds = [...new Set(orders.map(order => order.user.id))];

      //   // Get full user entities for those who placed orders
      //   const previousYearUsers = await userRepository.find({
      //     where: { id: In(previousYearUserIds) }
      //   });

      //   // Add previous year's ordering users to the new school year
      //   for (const user of previousYearUsers) {
      //     await addUserToSchoolYear(user, schoolYear);
      //   }

      //   // Clean up unused user accounts from all previous school years
      //   await cleanupUnusedUserAccounts(req.user.school.id, schoolYear.startDate);
      // }
    }

    // Toggle the current status
    await schoolYearRepository.update(schoolYear.id, {
      isCurrent,
      hideSchedule: !isCurrent ? true : schoolYear.hideSchedule,
    });

    const updatedSessionInfo: SessionInfo = await getStaffSession(req.user);

    res.send(updatedSessionInfo);
  }
);

// Helper function to clean up unused user accounts
async function cleanupUnusedUserAccounts(schoolId: number, currentSchoolYearStartDate: string) {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);

  // Get all parent users from previous school years with lastLoginDate = null
  const unusedUsers = await userRepository.find({
    where: {
      school: { id: schoolId },
      role: Role.PARENT,
      lastLoginDate: IsNull()
    },
    relations: {
      students: true,
      schoolYears: true
    }
  });

  // Filter out users from the current school year
  const usersFromPreviousYears = unusedUsers.filter(user => 
    !user.schoolYears.some(sy => sy.startDate >= currentSchoolYearStartDate) && user.role === Role.PARENT
  );

  for (const user of usersFromPreviousYears) {
    let shouldDeleteUser = true;

    // Check if user has students with purchased meals
    for (const student of user.students) {
      // Check if student has any meals purchased
      const studentMeals = await orderRepository.find({
        where: {
          meals: {
            student: { id: student.id }
          }
        }
      });

      if (studentMeals.length > 0) {
        // Student has purchased meals, check if user is the only parent
        const studentWithParents = await studentRepository.findOne({
          where: { id: student.id },
          relations: { parents: true }
        });

        if (studentWithParents && studentWithParents.parents.length === 1) {
          // User is the only parent and student has meals, don't delete the user
          shouldDeleteUser = false;
          break;
        }
      }
    }

    if (shouldDeleteUser) {
      // Delete students that have no purchased meals
      for (const student of user.students) {
        const studentMeals = await orderRepository.find({
          where: {
            meals: {
              student: { id: student.id }
            }
          }
        });

        if (studentMeals.length === 0) {
          // Remove the user-student association before deleting the student
          await AppDataSource.createQueryBuilder()
            .relation(UserEntity, "students")
            .of(user)
            .remove(student);
          
          // Delete the student
          await studentRepository.remove(student);
        }
      }

      // Remove all user-student associations before deleting the user
      await AppDataSource.createQueryBuilder()
        .relation(UserEntity, "students")
        .of(user)
        .remove(user.students);

      // Delete the unused user account
      await userRepository.remove(user);
    }
  }
}

export default SchoolYearRouter;
