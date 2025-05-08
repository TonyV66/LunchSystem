import jwt from "jsonwebtoken";
import { Request, RequestHandler } from "express";
import { AppDataSource } from "../data-source";
import { DateTimeUtils } from "../DateTimeUtils";
import MenuEntity, { DailyMenuEntity } from "../entity/MenuEntity";
import { OrderEntity } from "../entity/OrderEntity";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";
import UserEntity from "../entity/UserEntity";
import { Menu, DailyMenu } from "../models/Menu";
import { Order } from "../models/Order";
import SchoolYear from "../models/SchoolYear";
import Student from "../models/Student";
import User, { Role } from "../models/User";


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


export const buildMenuDto = (menuEntity: MenuEntity): Menu => {
  const menu = {
    ...menuEntity,
    items: menuEntity.items.map((item) => ({ ...item, menu: undefined })),
    school: undefined,
  };

  return menu as Menu;
};

export const buildDailyMenuDto = (menuEntity: DailyMenuEntity): DailyMenu => {
  const menu = {
    ...menuEntity,
    items: menuEntity.items.map((item) => ({ ...item, menu: undefined })),
    school: undefined,
    schoolYear: undefined,
  };

  return menu as DailyMenu;
};

export const buildSchoolYearDto = (schoolYearEntity: SchoolYearEntity): SchoolYear => {
  const menu = {
    ...schoolYearEntity,
    lunchTimes: schoolYearEntity.lunchTimes.map((lt) => ({
      ...lt,
      schoolYear: undefined,
    })),
    teacherLunchTimes: undefined,
    studentLunchTimes: undefined,
    orders: undefined,
    dailyMenus: undefined,
    school: undefined,
  };

  return menu as SchoolYear;
};

export const buildOrderDto = (orderEntity: OrderEntity, userId?: number) => {
  const order = {
    ...orderEntity,
    meals:
      orderEntity.meals.map((meal) => ({
        ...meal,
        studentId: meal.student.id,
        items: meal.items.map((item) => ({ ...item, meal: undefined })),
        student: undefined,
        order: undefined,
        schoolYear: undefined,
      })) || [],
    lastMealDate: undefined,
    userId: orderEntity.user?.id ?? userId,
  };
  return order as Order;
};

export const buildUserDto = (userEntity: UserEntity) => {
  const users: User[] = [userEntity].map((user) => ({
    ...user,
    pwd: "",
    lunchTimes: !userEntity.lunchTimes ? [] : userEntity.lunchTimes.map((lt) => ({
      ...lt,
      teacher: undefined,
      schoolYear: undefined,
    })),
    children: undefined,
    students: undefined,
    orders: undefined,
    school: undefined,
    paymentSysUserId: undefined,
  }));
  return users[0] as User;
};

export const buildStudentDto = (studentEntity: StudentEntity) => {
  const students: Student[] =
    [studentEntity].map((student) => ({
      ...student,
      lunchTimes: studentEntity.lunchTimes.map((lt) => ({
        ...lt,
        teacherId: lt.lunchtimeTeacher ? lt.lunchtimeTeacher.id : undefined,
        schoolYear: undefined,
      })),
      parent: undefined,
    })) || [];

  return students[0];
};

export const validateAuthorizationToken = async (request: Request<any, any, any, any, Record<string, any>>): Promise<UserEntity | string> => {
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
}

export const getCurrentSchoolYear = (school: SchoolEntity) => {
  let latestSchoolYear = school!.schoolYears.find(
    (sy) => sy.isCurrent
  );
  return latestSchoolYear;
};

