import jwt from "jsonwebtoken";
import { Request } from "express";
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
    lunchTimes: userEntity.lunchTimes.map((lt) => ({
      ...lt,
      teacher: undefined,
      schoolYear: undefined,
    })),
    children: undefined,
    orders: undefined,
    school: undefined,
  }));
  return users[0] as User;
};

export const buildStudentDto = (studentEntity: StudentEntity) => {
  const students: Student[] =
    [studentEntity].map((student) => ({
      ...student,
      lunchTimes: studentEntity.lunchTimes.map((lt) => ({
        ...lt,
        teacherId: lt.lunchtimeTeacher.id,
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

export const getLatestSchoolYear = (school: SchoolEntity) => {
  const today = DateTimeUtils.toString(new Date());
  let latestSchoolYear = school!.schoolYears.find(
    (sy) => sy.startDate <= today && sy.endDate >= today
  );
  if (!latestSchoolYear) {
    const upcomingSchoolYears = school!.schoolYears.filter(
      (sy) => sy.startDate > today
    );
    upcomingSchoolYears.sort((s1, s2) =>
      s1.startDate.localeCompare(s2.startDate)
    );
    latestSchoolYear = upcomingSchoolYears?.length
      ? upcomingSchoolYears[0]
      : undefined;
  }
  if (!latestSchoolYear) {
    const pastSchoolYears = school!.schoolYears.filter(
      (sy) => sy.endDate < today
    );
    pastSchoolYears
      .sort((s1, s2) => s1.endDate.localeCompare(s2.endDate))
      .reverse();
    latestSchoolYear = pastSchoolYears?.length ? pastSchoolYears[0] : undefined;
  }
  return latestSchoolYear;
};

