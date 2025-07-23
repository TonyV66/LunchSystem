import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import StudentEntity from "../entity/StudentEntity";
import Student from "../models/Student";
import UserEntity from "../entity/UserEntity";
import { randomUUID } from "crypto";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { getCurrentSchoolYear } from "./RouterUtils";
import { GradeLevel } from "../models/GradeLevel";
import StudentLunchTime from "../models/StudentLunchTime";
import User from "../models/User";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { Order } from "../models/Order";

const StudentRouter: Router = express.Router();
interface Empty {}

interface StudentWithLunchTimes extends Student {
  lunchTimes?: { grade: GradeLevel; dayOfWeek: number; teacherId: number }[];
}

interface Relations {
  students: Student[];
  parents: User[];
  studentLunchTimes: StudentLunchTime[];
}

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

    const currentSchoolYear = getCurrentSchoolYear(req.user.school);

    const studentToSave: DeepPartial<StudentEntity> = {
      name: req.body.name,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      birthDate: req.body.birthDate,
      studentId: randomUUID(),
      school: req.user.school,
    };

    const savedStudent = await studentRepository.save(studentToSave);

    await AppDataSource.createQueryBuilder()
      .relation(UserEntity, "students")
      .of(req.user)
      .add(savedStudent);
    if (currentSchoolYear) {
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
        parents: true,
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

    const currentSchoolYear = getCurrentSchoolYear(req.user.school);
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

  const currentSchoolYear = getCurrentSchoolYear(req.user.school);
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

StudentRouter.put<
  { studentId: string; userId: string },
  { student: Student; lunchTimes: StudentLunchTime[]; parents: User[]; orders: Order[] } | string,
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
      parents: true,
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

  // Check if the association already exists
  const existingAssociation = student.parents?.find(
    (parent) => parent.id === userId
  );

  const currentSchoolYear = getCurrentSchoolYear(req.user.school);
  if (!currentSchoolYear) {
    res.status(400).send("No current school year found" as string);
    return;
  }

  let lunchTimes: StudentLunchTimeEntity[] = [];
  if (!existingAssociation) {
    // Add the user to the student's parents
    await AppDataSource.createQueryBuilder()
      .relation(UserEntity, "students")
      .of(user)
      .add(student);
      
    student.parents.push(user);
  }

  const myChildren = await studentRepository.find({
    where: {
      parents: { id: user.id },
    },
  });

  const ordersForStudent = (await getOrdersForStudent(currentSchoolYear, student)).map(order => ({
    ...order,
    meals: order.meals.filter(meal => myChildren.some(child => child.id === meal.student?.id))
  }));
  
  const uniqueUserIds = new Set(ordersForStudent.map((order) => order.user.id));
  const parents = Array.from(uniqueUserIds).map(userId => 
    ordersForStudent.find(order => order.user.id === userId)!.user
  );

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
    parents: parents.map((p) => new User(p)),
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

  const currentSchoolYear = getCurrentSchoolYear(req.user.school);
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
      .leftJoinAndSelect("student.parents", "parents")
      .leftJoinAndSelect("student.lunchTimes", "lunchTimes")
      .leftJoinAndSelect("lunchTimes.schoolYear", "schoolYear")
      .where("LOWER(student.firstName) = LOWER(:firstName)", { firstName })
      .andWhere("LOWER(student.lastName) = LOWER(:lastName)", { lastName })
      .andWhere("student.school.id = :schoolId", {
        schoolId: req.user.school.id,
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
      student.parents?.forEach((parent) => {
        parentIds.add(parent.id);
      });
    });

    // Get all parent users
    const parents = await userRepository.find({
      where: {
        id: In(Array.from(parentIds)),
      },
    });

    // Convert to User objects
    const parentUsers = parents.map((parent) => new User(parent));

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

export default StudentRouter;
