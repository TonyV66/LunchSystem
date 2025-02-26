import express, { Router } from "express";
import { Menu, DailyMenu, PantryItem } from "../models/Menu";
import School from "../models/School";
import SchoolYear from "../models/SchoolYear";
import Student from "../models/Student";
import User, { Role } from "../models/User";
import {Notification} from "../models/Notification";
import {Order} from "../models/Order";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import UserEntity from "../entity/UserEntity";
import { getLatestSchoolYear, buildStudentDto, buildOrderDto, buildDailyMenuDto, buildUserDto, buildSchoolYearDto, buildMenuDto } from "./RouterUtils";


const SessionRouter: Router = express.Router();
interface Empty {}


export interface SessionInfo {
  user: User;
  menus: Menu[];
  users: User[];
  students: Student[];
  orders: Order[];
  schoolYear: SchoolYear;
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  schoolSettings: School;
}

const getParentSession = async (user: UserEntity): Promise<SessionInfo> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const userEntity = (await userRepository.findOne({
    where: { id: user.id },
    relations: {
      lunchTimes: true,
      orders: {
        meals: {
          student: true,
          items: true,
        },
      },
      school: {
        notifications: true,
        users: {
          lunchTimes: {
            schoolYear: true,
          },
        },
      },
      children: {
        lunchTimes: {
          lunchtimeTeacher: true,
          schoolYear: true,
        },
      },
    },
  })) as UserEntity;

  let schoolYear = getLatestSchoolYear(user.school);
  if (!schoolYear) {
    schoolYear = {
      id: 0,
      startDate: "2000-01-01",
      endDate: "2000-01-01",
      lunchTimes: [],
      teacherLunchTimes: [],
      studentLunchTimes: [],
      dailyMenus: [],
      orders: [],
      school: user.school,
    };
  } else {
    schoolYear =
      (await schoolYearRepository.findOne({
        where: { id: schoolYear.id },
        relations: {
          lunchTimes: true,
          dailyMenus: {
            items: true,
          },
        },
      })) || schoolYear;
  }

  const teachersWithLunchTimes = userEntity.school.users.filter(
    (user) =>
      user.role === Role.TEACHER &&
      user.lunchTimes.find((lt) => lt.schoolYear.id === schoolYear.id)
  );

  const students = userEntity.children.map((child) =>
    buildStudentDto({
      ...child,
      lunchTimes: child.lunchTimes.filter(
        (lt) => lt.schoolYear.id === schoolYear.id
      ),
    })
  );
  const orders = userEntity.orders.map((order) => buildOrderDto(order, user.id));
  const scheduledMenus = schoolYear.dailyMenus.map((menu) =>
    buildDailyMenuDto(menu)
  );

  const sessionInfo: SessionInfo = {
    user: buildUserDto(userEntity),
    users: teachersWithLunchTimes.map((teacher) => buildUserDto(teacher)),
    menus: [],
    students,
    orders,
    scheduledMenus,
    pantryItems: [],
    notifications: userEntity.school.notifications,
    schoolSettings: { ...user.school, squareAppAccessToken: "" },
    schoolYear: buildSchoolYearDto(schoolYear!),
  };

  return sessionInfo;
};

const getStaffSession = async (user: UserEntity): Promise<SessionInfo> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const userEntity = (await userRepository.findOne({
    where: { id: user.id },
    relations: {
      lunchTimes: true,
    },
  })) as UserEntity;

  let schoolYear = getLatestSchoolYear(user.school);
  if (!schoolYear) {
    schoolYear = {
      id: 0,
      startDate: "2000-01-01",
      endDate: "2000-01-01",
      lunchTimes: [],
      teacherLunchTimes: [],
      studentLunchTimes: [],
      dailyMenus: [],
      orders: [],
      school: user.school,
    };
  } else {
    schoolYear =
      (await schoolYearRepository.findOne({
        where: { id: schoolYear.id },
        relations: {
          lunchTimes: true,
          dailyMenus: {
            items: true,
          },
          orders: {
            user: true,
            meals: {
              student: true,
              items: true,
            },
          },
        },
      })) || schoolYear;
  }

  const schoolEntity = await schoolRepository.findOne({
    where: { id: user.school.id },
    relations: {
      users: {
        lunchTimes: true,
        children: {
          lunchTimes: {
            lunchtimeTeacher: true,
            schoolYear: true,
          },
        },
      },
      menus:
        user.role == Role.ADMIN
          ? {
              items: true,
            }
          : undefined,
      pantry: user.role == Role.ADMIN ? true : undefined,
      notifications: true,
    },
  });

  let students = schoolEntity!.users.flatMap((user) => user.children);
  let orders = schoolYear.orders;

  if (user.role == Role.TEACHER) {
    students = students.filter((student) =>
      student.lunchTimes.find(
        (lt) =>
          lt.schoolYear.id === schoolYear.id &&
          lt.lunchtimeTeacher.id === user.id
      )
    );

    const studentIds = students.map((student) => student.id);
    orders = orders
      .filter((order) =>
        order.meals.find((meal) => studentIds.includes(meal.student.id))
      )
      .map((order) => ({
        ...order,
        meals: order.meals.filter((meal) =>
          studentIds.includes(meal.student.id)
        ),
      }));
  }

  const sessionInfo: SessionInfo = {
    user: buildUserDto(userEntity),
    users: schoolEntity!.users.map((user) => buildUserDto(user)),
    menus:
      user.role != Role.ADMIN
        ? []
        : schoolEntity!.menus.map((menu) => buildMenuDto(menu)),
    students: students.map((child) =>
      buildStudentDto({
        ...child,
        lunchTimes: child.lunchTimes.filter(
          (lt) => lt.schoolYear.id === schoolYear.id
        ),
      })
    ),
    orders: orders.map((order) => buildOrderDto(order)),
    scheduledMenus: schoolYear.dailyMenus.map((menu) =>
      buildDailyMenuDto(menu)
    ),
    pantryItems: user.role != Role.ADMIN ? [] : schoolEntity!.pantry,
    notifications: schoolEntity!.notifications,
    schoolSettings: { ...user.school, squareAppAccessToken: "" },
    schoolYear: buildSchoolYearDto(schoolYear!),
  };

  return sessionInfo;
};

export const getSessionInfo = async (user: UserEntity): Promise<SessionInfo> => {
  return user.role === Role.PARENT
    ? await getParentSession(user)
    : await getStaffSession(user);
};

SessionRouter.get<Empty, SessionInfo, Empty, Empty>(
  "/",
  async (req, res) => {
    res.send(await getSessionInfo(req.user));
  }
);

export default SessionRouter;
