import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial } from "typeorm";
import StudentEntity from "../entity/StudentEntity";
import Student from "../models/Student";
import UserEntity from "../entity/UserEntity";
import { randomUUID } from "crypto";

const StudentRouter: Router = express.Router();
interface Empty {}

StudentRouter.post<Empty, Student, Student, Empty>("/", async (req, res) => {
  const studentRepository = AppDataSource.getRepository(StudentEntity);

  const savedStudent = await studentRepository.save({
    ...req.body,
    id: undefined,
    studentId: randomUUID(),
    schoolId: req.user.school.id
  });

  await AppDataSource.createQueryBuilder().relation(UserEntity, 'students').of(req.user).add(savedStudent);
  res.send(savedStudent as Student);
});

StudentRouter.put<Empty, Student, Student, Empty>("/", async (req, res) => {
  const studentRepository = AppDataSource.getRepository(StudentEntity);

  const student = await studentRepository.findOne({
    where: {
      id: req.body.id,
    },
  });

  if (student) {
    const updatedStudent: DeepPartial<StudentEntity> = {
      id: student.id,
      name: req.body.name,
    };

    const savedUser = await studentRepository.save(updatedStudent);
    res.send(savedUser);
  }
});

export default StudentRouter;
