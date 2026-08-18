import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import StudentEntity from "../entity/StudentEntity";
import Student from "../models/Student";
import UserEntity from "../entity/UserEntity";
import { randomUUID } from "crypto";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { GradeLevel } from "../models/GradeLevel";
import StudentLunchTime from "../models/StudentLunchTime";
import SchoolUser from "../models/SchoolUser";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { Order } from "../models/Order";
import { getUserStatus } from "../utils/UserStatusUtils";
import {
  ensureEnrollment,
  getStudentsForUserInSchoolYear,
  getUsersWithEnrollmentHistoryForStudentAtSchool,
  removeEnrollment,
} from "../utils/EnrollmentUtils";
import EnrollmentEntity from "../entity/EnrollmentEntity";
import { authorizeUserWithRole } from "./RouterUtils";
import { Role, isFactsUserRole } from "../models/User";

const StudentRouter: Router = express.Router();
interface Empty {}

interface StudentWithLunchTimes extends Student {
  lunchTimes?: { grade: GradeLevel; dayOfWeek: number; teacherId: number }[];
}

interface Relations {
  students: Student[];
  parents: SchoolUser[];
  studentLunchTimes: StudentLunchTime[];
}

const toSchoolUsers = (users: UserEntity[]): SchoolUser[] => {
  return users
    .map((user) => {
      const registration = getUserStatus(user);
      return registration ? new SchoolUser(user, registration) : null;
    })
    .filter((user): user is SchoolUser => user != null);
};

const getOrdersForStudent = async (
  schoolYear: SchoolYearEntity,
  student: StudentEntity
): Promise<OrderEntity[]> => {
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  return await orderRepository.find({
    where: {
      schoolYear: { id: schoolYear.id },
      meals: { student: { id: student.id } },
    },
    relations: {
      meals: {
        student: true,
        items: true,
      },
      user: true,
    },
  });
};

StudentRouter.post<Empty, Student | string, StudentWithLunchTimes, Empty>(
  "/",
  async (req, res) => {
    const studentRepository = AppDataSource.getRepository(StudentEntity);
    const studentLunchTimeRepository = AppDataSource.getRepository(
      StudentLunchTimeEntity
    );
    const userRepository = AppDataSource.getRepository(UserEntity);

    const currentSchoolYear = req.schoolYear;

    const studentToSave: DeepPartial<StudentEntity> = {
      name: req.body.name,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      birthDate: req.body.birthDate,
      studentId: randomUUID(),
      school: req.school,
    };

    const savedStudent = await studentRepository.save(studentToSave);

    if (currentSchoolYear) {
      await ensureEnrollment(req.user, savedStudent, currentSchoolYear);

      // Save lunch times if provided
      if (req.body.lunchTimes && req.body.lunchTimes.length > 0) {
        const teacherIds = req.body.lunchTimes
          .filter((lt) => lt.teacherId)
          .map((lt) => lt.teacherId);
        const teachers = await userRepository.findBy({ id: In(teacherIds) });

        for (const lunchTime of req.body.lunchTimes) {
          const teacher = teachers.find((t) => t.id === lunchTime.teacherId);
          if (!lunchTime.teacherId || teacher) {
            await studentLunchTimeRepository.save({
              grade: lunchTime.grade,
              dayOfWeek: lunchTime.dayOfWeek,
              student: savedStudent,
              schoolYear: currentSchoolYear,
              lunchtimeTeacher: teacher,
            });
          }
        }
      }
    }

    // Reload student with lunch times
    const studentWithLunchTimes = await studentRepository.findOne({
      where: { id: savedStudent.id },
      relations: {
        enrollments: {
          user: true,
          schoolYear: true,
        },
        lunchTimes: {
          lunchtimeTeacher: true,
          schoolYear: true,
        },
      },
    });

    if (!studentWithLunchTimes) {
      res.status(500).send("Failed to save student" as string);
      return;
    }

    res.send(new Student(studentWithLunchTimes));
  }
);

StudentRouter.put<Empty, Student | string, StudentWithLunchTimes, Empty>(
  "/",
  async (req, res) => {
    const studentRepository = AppDataSource.getRepository(StudentEntity);
    const studentLunchTimeRepository = AppDataSource.getRepository(
      StudentLunchTimeEntity
    );
    const userRepository = AppDataSource.getRepository(UserEntity);

    const currentSchoolYear = req.schoolYear;
    if (!currentSchoolYear) {
      res.status(400).send("No current school year found" as string);
      return;
    }

    const student = await studentRepository.findOne({
      where: { id: req.body.id },
      relations: {
        lunchTimes: {
          lunchtimeTeacher: true,
          schoolYear: true,
        },
      },
    });

    if (student) {
      const updatedStudent: DeepPartial<StudentEntity> = {
        id: student.id,
        name: req.body.name,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        birthDate: req.body.birthDate,
      };

      const savedStudent = await studentRepository.save(updatedStudent);

      // Update lunch times if provided
      if (req.body.lunchTimes) {
        // Remove existing lunch times
        await studentLunchTimeRepository.delete({
          student: { id: student.id },
          schoolYear: currentSchoolYear,
        });

        // Add new lunch times
        if (req.body.lunchTimes.length > 0) {
          const teacherIds = req.body.lunchTimes.map((lt) => lt.teacherId);
          const teachers = await userRepository.findBy({ id: In(teacherIds) });

          for (const lunchTime of req.body.lunchTimes) {
            const teacher = teachers.find((t) => t.id === lunchTime.teacherId);
            await studentLunchTimeRepository.save({
              grade: lunchTime.grade,
              dayOfWeek: lunchTime.dayOfWeek,
              student: savedStudent,
              schoolYear: currentSchoolYear,
              lunchtimeTeacher: teacher,
            });
          }
        }
      }

      // Reload student with lunch times
      const studentWithLunchTimes = await studentRepository.findOne({
        where: { id: savedStudent.id },
        relations: {
          lunchTimes: {
            lunchtimeTeacher: true,
            schoolYear: true,
          },
        },
      });

      if (!studentWithLunchTimes) {
        res.status(500).send("Failed to update student" as string);
        return;
      }

      res.send(new Student(studentWithLunchTimes));
    } else {
      res.status(404).send("Student not found" as string);
    }
  }
);

StudentRouter.put<
  { studentId: string },
  StudentLunchTime[] | string,
  StudentLunchTime[],
  Empty
>("/:studentId/lunchtimes", async (req, res) => {
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );
  const userRepository = AppDataSource.getRepository(UserEntity);

  const currentSchoolYear = req.schoolYear;
  if (!currentSchoolYear) {
    res.status(400).send("No current school year found" as string);
    return;
  }

  const studentId = parseInt(req.params.studentId);
  const student = await studentRepository.findOne({
    where: { id: studentId },
    relations: {
      lunchTimes: {
        lunchtimeTeacher: true,
        schoolYear: true,
      },
    },
  });

  if (!student) {
    res.status(404).send("Student not found" as string);
    return;
  }

  // Remove existing lunch times for this student and school year
  await studentLunchTimeRepository.delete({
    student: { id: studentId },
    schoolYear: currentSchoolYear,
  });

  // Add new lunch times
  const savedLunchTimes: StudentLunchTime[] = [];
  if (req.body.length > 0) {
    const teacherIds = req.body
      .filter((lt) => lt.teacherId)
      .map((lt) => lt.teacherId!);
    const teachers = await userRepository.findBy({ id: In(teacherIds) });

    for (const lunchTime of req.body) {
      const teacher = teachers.find((t) => t.id === lunchTime.teacherId);
      const savedLunchTime = await studentLunchTimeRepository.save({
        grade: lunchTime.grade,
        dayOfWeek: lunchTime.dayOfWeek,
        student: student,
        schoolYear: currentSchoolYear,
        lunchtimeTeacher: teacher,
      });

      savedLunchTimes.push(new StudentLunchTime(savedLunchTime));
    }
  }

  res.send(savedLunchTimes);
});

// TODO: How to handle unenrollments?
StudentRouter.put<
  { studentId: string; userId: string },
  { student: Student; lunchTimes: StudentLunchTime[]; parents: SchoolUser[]; orders: Order[] } | string,
  Empty,
  Empty
>("/:studentId/associate/:userId", async (req, res) => {
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const userRepository = AppDataSource.getRepository(UserEntity);
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  const studentId = parseInt(req.params.studentId);
  const userId = parseInt(req.params.userId);

  // Find the student
  const student = await studentRepository.findOne({
    where: { id: studentId },
    relations: {
      enrollments: {
        user: true,
        schoolYear: true,
      },
    },
  });

  if (!student) {
    res.status(404).send("Student not found" as string);
    return;
  }

  // Find the user (parent)
  const user = await userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    res.status(404).send("User not found" as string);
    return;
  }

  const currentSchoolYear = req.schoolYear;
  if (!currentSchoolYear) {
    res.status(400).send("No current school year found" as string);
    return;
  }

  // Check if the association already exists for this school year
  const existingAssociation = student.enrollments?.find(
    (enrollment) =>
      enrollment.active &&
      enrollment.user?.id === userId &&
      enrollment.schoolYear?.id === currentSchoolYear.id,
  );

  let lunchTimes: StudentLunchTimeEntity[] = [];
  if (!existingAssociation) {
    await ensureEnrollment(user, student, currentSchoolYear);
    student.enrollments = student.enrollments ?? [];
    student.enrollments.push({
      user,
      student,
      schoolYear: currentSchoolYear,
      active: true,
    } as EnrollmentEntity);
  }

  const myChildren = await getStudentsForUserInSchoolYear(
    user.id,
    currentSchoolYear.id,
  );

  const ordersForStudent = (await getOrdersForStudent(currentSchoolYear, student)).map(order => ({
    ...order,
    meals: order.meals.filter(meal => myChildren.some(child => child.id === meal.student?.id))
  }));
  
  const uniqueUserIds = [...new Set(ordersForStudent.map((order) => order.user.id))];
  const parentEntities =
    uniqueUserIds.length > 0
      ? await userRepository.find({
          where: { id: In(uniqueUserIds) },
          relations: {
            userStatuses: {
              school: true,
            },
          },
        })
      : [];

  lunchTimes = await studentLunchTimeRepository.find({
    where: {
      student: { id: student.id },
      schoolYear: currentSchoolYear,
    },
    relations: {
      student: true,
      lunchtimeTeacher: true,
      schoolYear: true,
    },
  });

  res.send({
    student: new Student(student),
    lunchTimes: lunchTimes.map((lt) => new StudentLunchTime(lt)),
    parents: toSchoolUsers(parentEntities),
    orders: ordersForStudent.map((o) => new Order(o)),
  });
});

StudentRouter.get<
  Empty,
  Relations | string,
  Empty,
  { firstName: string; lastName: string; grade: GradeLevel }
>("/relations", async (req, res) => {
  const { firstName, lastName, grade } = req.query;

  if (!firstName || !lastName || !grade) {
    res
      .status(400)
      .send("firstName, lastName, and grade are required" as string);
    return;
  }

  const currentSchoolYear = req.schoolYear;
  if (!currentSchoolYear) {
    res.status(400).send("No current school year found" as string);
    return;
  }

  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const userRepository = AppDataSource.getRepository(UserEntity);
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  try {
    // Find students with matching name and grade (case-insensitive)
    const matchingStudents = await studentRepository
      .createQueryBuilder("student")
      .leftJoinAndSelect(
        "student.enrollments",
        "enrollment",
        "enrollment.schoolYearId = :schoolYearId AND enrollment.active = true",
        { schoolYearId: currentSchoolYear.id },
      )
      .leftJoinAndSelect("enrollment.user", "parents")
      .leftJoinAndSelect("student.lunchTimes", "lunchTimes")
      .leftJoinAndSelect("lunchTimes.schoolYear", "schoolYear")
      .where("LOWER(student.firstName) = LOWER(:firstName)", { firstName })
      .andWhere("LOWER(student.lastName) = LOWER(:lastName)", { lastName })
      .andWhere("student.school.id = :schoolId", {
        schoolId: req.school.id,
      })
      .andWhere("lunchTimes.grade = :grade", { grade })
      .andWhere("schoolYear.id = :schoolYearId", {
        schoolYearId: currentSchoolYear.id,
      })
      .getMany();

    // Convert students to Student model objects
    const studentModels = matchingStudents.map(
      (student) => new Student(student)
    );

    // Get all unique parent IDs from matching students
    const parentIds = new Set<number>();
    matchingStudents.forEach((student) => {
      student.enrollments?.forEach((enrollment) => {
        if (enrollment.active && enrollment.user?.id) {
          parentIds.add(enrollment.user.id);
        }
      });
    });

    // Get all parent users
    const parents = await userRepository.find({
      where: {
        id: In(Array.from(parentIds)),
      },
      relations: {
        userStatuses: {
          school: true,
        },
      },
    });

    // Convert to SchoolUser objects
    const parentUsers = toSchoolUsers(parents);

    // Get all lunch times for the matching students
    const studentIds = matchingStudents.map((student) => student.id);
    const allLunchTimes = await studentLunchTimeRepository.find({
      where: {
        student: { id: In(studentIds) },
        schoolYear: currentSchoolYear,
      },
      relations: {
        student: true,
        lunchtimeTeacher: true,
      },
    });

    const lunchTimeModels = allLunchTimes.map(
      (lunchTime) => new StudentLunchTime(lunchTime)
    );

    // Return Relations object
    const relations: Relations = {
      students: studentModels,
      parents: parentUsers,
      studentLunchTimes: lunchTimeModels,
    };

    res.send(relations);
  } catch (error) {
    console.error("Error finding relations:", error);
    res.status(500).send("Internal server error" as string);
  }
});

interface StudentParentEnrollment {
  user: SchoolUser;
  enrolled: boolean;
}

interface UpdateStudentEnrollmentsRequest {
  enrollments: Array<{ userId: number; enrolled: boolean }>;
}

const toStudentParentEnrollments = (
  users: UserEntity[],
  schoolId: number,
): StudentParentEnrollment[] => {
  const byUserId = new Map<number, StudentParentEnrollment>();
  for (const user of users) {
    if (byUserId.has(user.id)) {
      continue;
    }
    const status =
      user.userStatuses?.find(
        (userStatus) => userStatus.school?.id === schoolId,
      ) ?? getUserStatus(user);
    if (!status) {
      continue;
    }
    byUserId.set(user.id, {
      user: new SchoolUser(user, status),
      enrolled: (user.enrollments?.length ?? 0) > 0,
    });
  }

  return Array.from(byUserId.values()).sort((a, b) =>
    `${a.user.firstName} ${a.user.lastName}`.localeCompare(
      `${b.user.firstName} ${b.user.lastName}`,
    ),
  );
};

const requireStudentAtSchool = async (
  studentId: number,
  schoolId: number,
): Promise<StudentEntity | string> => {
  const student = await AppDataSource.getRepository(StudentEntity).findOne({
    where: { id: studentId, school: { id: schoolId } },
  });
  return student ?? "Student not found.";
};

StudentRouter.get<
  { studentId: string },
  StudentParentEnrollment[] | string,
  Empty,
  Empty
>(
  "/:studentId/enrollments",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const student = await requireStudentAtSchool(studentId, req.school.id);
    if (typeof student === "string") {
      res.status(404).send(student);
      return;
    }

    const users = await getUsersWithEnrollmentHistoryForStudentAtSchool(
      studentId,
      req.school.id,
      req.schoolYear?.id,
    );

    res.send(toStudentParentEnrollments(users, req.school.id));
  },
);

StudentRouter.put<
  { studentId: string },
  StudentParentEnrollment[] | string,
  UpdateStudentEnrollmentsRequest,
  Empty
>(
  "/:studentId/enrollments",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const student = await requireStudentAtSchool(studentId, req.school.id);
    if (typeof student === "string") {
      res.status(404).send(student);
      return;
    }

    const currentSchoolYear = req.schoolYear;
    if (!currentSchoolYear) {
      res.status(400).send("No current school year found.");
      return;
    }

    if (!Array.isArray(req.body.enrollments)) {
      res.status(400).send("enrollments is required.");
      return;
    }

    const historyUsers = await getUsersWithEnrollmentHistoryForStudentAtSchool(
      studentId,
      req.school.id,
      currentSchoolYear.id,
    );
    const usersById = new Map(historyUsers.map((user) => [user.id, user]));

    const unseenUserIds = [
      ...new Set(
        req.body.enrollments
          .map((enrollment) => enrollment.userId)
          .filter((userId) => !usersById.has(userId)),
      ),
    ];
    if (unseenUserIds.length > 0) {
      const extraUsers = await AppDataSource.getRepository(UserEntity).find({
        where: { id: In(unseenUserIds) },
        relations: {
          userStatuses: {
            school: true,
          },
        },
      });
      for (const user of extraUsers) {
        const status = user.userStatuses?.find(
          (userStatus) => userStatus.school?.id === req.school.id,
        );
        if (!status || !isFactsUserRole(status.role)) {
          continue;
        }
        usersById.set(user.id, user);
      }
    }

    const seenUserIds = new Set<number>();
    for (const enrollment of req.body.enrollments) {
      if (seenUserIds.has(enrollment.userId)) {
        res.status(400).send("Duplicate user in enrollment list.");
        return;
      }
      seenUserIds.add(enrollment.userId);

      const user = usersById.get(enrollment.userId);
      if (!user) {
        res
          .status(400)
          .send("User is not a parent, teacher, or staff member at this school.");
        return;
      }

      const currentlyEnrolled = (user.enrollments?.length ?? 0) > 0;

      if (enrollment.enrolled && !currentlyEnrolled) {
        await ensureEnrollment(user, student, currentSchoolYear);
      } else if (!enrollment.enrolled && currentlyEnrolled) {
        await removeEnrollment(user, student, currentSchoolYear);
      }
    }

    const updatedUsers = await getUsersWithEnrollmentHistoryForStudentAtSchool(
      studentId,
      req.school.id,
      currentSchoolYear.id,
    );

    res.send(toStudentParentEnrollments(updatedUsers, req.school.id));
  },
);

export default StudentRouter;
