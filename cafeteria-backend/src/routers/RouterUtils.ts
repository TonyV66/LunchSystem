import jwt from "jsonwebtoken";
import { Request, RequestHandler } from "express";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import UserEntity from "../entity/UserEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";

export const JWT_PRIVATE_KEY = "your-secret-key";

type JwtPayload = {
  userId: number;
};

declare global {
  namespace Express {
    interface Request {
      user: UserEntity;
    }
  }
}

export const authorizeRequest: RequestHandler<any, any, any, any> = async (
  req,
  res,
  next
) => {
  const result = await validateAuthorizationToken(req);
  if (typeof result === "string") {
    res.status(401).send(result);
  } else {
    req.user = result as UserEntity;
    next();
  }
};

export const validateAuthorizationToken = async (
  request: Request<any, any, any, any, Record<string, any>>
): Promise<UserEntity | string> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const jwtToken = request.header("Authorization")?.replace("Bearer ", "");

  if (!jwtToken) {
    return "Access denied. No token provided";
  } else {
    try {
      const jwtPayload = jwt.verify(jwtToken, JWT_PRIVATE_KEY) as JwtPayload;

      const user = await userRepository.findOne({
        where: { id: jwtPayload.userId },
        relations: {
          school: {
            schoolYears: true,
          },
        },
      });

      if (user) {
        return user;
      } else {
        return "Access denied. Invalid authorization token";
      }
    } catch (err) {
      return "Access denied. Unable to process authorization token";
    }
  }
};

export const addStudentToSchoolYear = async (
  student: StudentEntity,
  schoolYear: SchoolYearEntity
) => {
  const schoolYearStudents = await AppDataSource.createQueryBuilder()
    .relation(SchoolYearEntity, "students")
    .of(schoolYear)
    .loadMany();

  if (!schoolYearStudents.find(s => s.id === student.id)) {
    await AppDataSource.createQueryBuilder()
      .relation(SchoolYearEntity, "students")
      .of(schoolYear)
      .add(student);
  }
};

export const addUserToSchoolYear = async (
  user: UserEntity,
  schoolYear: SchoolYearEntity
) => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const userYears = await AppDataSource.createQueryBuilder()
    .relation(UserEntity, "schoolYears")
    .of(user)
    .loadMany();

  if (!userYears.find((year) => year.id === schoolYear.id)) {
    // Add user to school year
    await AppDataSource.createQueryBuilder()
      .relation(SchoolYearEntity, "parents")
      .of(schoolYear)
      .add(user);

    // Load user's students using repository
    const userWithStudents = await userRepository.findOne({
      where: { id: user.id },
      relations: { students: true }
    });

    if (userWithStudents?.students) {
      // Add each student to the school year if they're not already in it
      for (const student of userWithStudents.students) {
        await addStudentToSchoolYear(student, schoolYear);
      }
    }
  }
};

export const getCurrentSchoolYear = (school: SchoolEntity) => {
  let latestSchoolYear = school!.schoolYears.find((sy) => sy.isCurrent);
  return latestSchoolYear;
};
