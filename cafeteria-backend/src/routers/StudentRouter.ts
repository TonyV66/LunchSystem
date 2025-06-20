import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import StudentEntity from "../entity/StudentEntity";
import Student from "../models/Student";
import UserEntity from "../entity/UserEntity";
import { randomUUID } from "crypto";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { getCurrentSchoolYear } from "./RouterUtils";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import { GradeLevel } from "../models/GradeLevel";

const StudentRouter: Router = express.Router();
interface Empty {}

interface StudentWithLunchTimes extends Student {
  lunchTimes?: { grade: GradeLevel; dayOfWeek: number; teacherId: number }[];
}

StudentRouter.post<Empty, Student | string, StudentWithLunchTimes, Empty>(
  "/",
  async (req, res) => {
    const studentRepository = AppDataSource.getRepository(StudentEntity);
    const studentLunchTimeRepository = AppDataSource.getRepository(
      StudentLunchTimeEntity
    );
    const userRepository = AppDataSource.getRepository(UserEntity);

    const currentSchoolYear = await getCurrentSchoolYear(req.user.school);

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
      await AppDataSource.createQueryBuilder()
        .relation(SchoolYearEntity, "students")
        .of(currentSchoolYear)
        .add(savedStudent);

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

    const currentSchoolYear = await getCurrentSchoolYear(req.user.school);
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

export default StudentRouter;
