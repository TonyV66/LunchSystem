import express, { Router } from "express";
import { Menu, DailyMenu, PantryItem } from "../models/Menu";
import School from "../models/School";
import Student from "../models/Student";
import User, { Role } from "../models/User";
import { Notification } from "../models/Notification";
import { Order } from "../models/Order";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import {
  getLatestSchoolYear,
  buildStudentDto,
  buildOrderDto,
  buildDailyMenuDto,
  buildUserDto,
  buildMenuDto,
} from "./RouterUtils";
import MenuEntity, {
  DailyMenuEntity,
  PantryItemEntity,
} from "../entity/MenuEntity";
import NotificationEntity from "../entity/NotificationEntity";
import SchoolLunchTimeEntity from "../entity/SchoolLunchTimeEntity";
import { OrderEntity } from "../entity/OrderEntity";
import DailyLunchTime from "../models/DailyLunchTime";
import StudentEntity from "../entity/StudentEntity";

const SessionRouter: Router = express.Router();
interface Empty {}

export interface SessionInfo {
  user: User;
  menus: Menu[];
  users: User[];
  students: Student[];
  orders: Order[];
  lunchTimes: DailyLunchTime[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  school: School;
}

const getParentSession = async (user: UserEntity): Promise<SessionInfo> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const schoolLunchTimeRepository = AppDataSource.getRepository(
    SchoolLunchTimeEntity
  );
  const studentRepository = AppDataSource.getRepository(StudentEntity);

  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  const notifications = await notificationRepository.find({
    where: {
      school: { id: user.school.id },
    },
  });

  const teachers = await userRepository.find({
    where: {
      school: { id: user.school.id },
      role: Role.TEACHER,
    },
    relations: {
      lunchTimes: {
        schoolYear: true,
      },
    },
  });

  let schoolYear = getLatestSchoolYear(user.school);

  const teachersWithLunchTimes = teachers.filter((user) =>
    user.lunchTimes.find((lt) => lt.schoolYear.id === schoolYear?.id)
  );

  const orders = !schoolYear
    ? []
    : await orderRepository.find({
        where: {
          user: { id: user.id },
          schoolYear: { id: schoolYear.id },
        },
        relations: {
          meals: {
            student: true,
            items: true,
          },
        },
      });

  const students = await studentRepository.find({
    where: {
      parent: { id: user.id },
    },
    relations: {
      lunchTimes: {
        lunchtimeTeacher: true,
        schoolYear: true,
      },
    },
  });

  const userEntity = (await userRepository.findOne({
    where: { id: user.id },
    relations: {
      lunchTimes: true
    }
  })) as UserEntity;

  const lunchTimes = !schoolYear
    ? []
    : await schoolLunchTimeRepository.find({
        where: { schoolYear: { id: schoolYear.id } },
      });

  const dailyMenus = !schoolYear
    ? []
    : await dailyMenuRepository.find({
        where: { schoolYear: { id: schoolYear.id } },
        relations: { items: true },
      });

  const scheduledMenus = dailyMenus.map((menu) => buildDailyMenuDto(menu));

  const sessionInfo: SessionInfo = {
    user: buildUserDto(userEntity),
    users: teachersWithLunchTimes.map((teacher) => buildUserDto(teacher)),
    menus: [],
    students: students.map((student) =>
      buildStudentDto({
        ...student,
        lunchTimes: student.lunchTimes.filter(
          (lt) => lt.schoolYear.id === schoolYear?.id
        ),
      })
    ),
    orders: orders.map((order) => buildOrderDto(order, user.id)),
    scheduledMenus,
    pantryItems: [],
    notifications,
    school: { ...user.school, squareAppAccessToken: "" },
    lunchTimes,
  };

  return sessionInfo;
};

const getStaffSession = async (user: UserEntity): Promise<SessionInfo> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const pantryRepository = AppDataSource.getRepository(PantryItemEntity);
  const schoolLunchTimeRepository = AppDataSource.getRepository(
    SchoolLunchTimeEntity
  );
  const menuRepository = AppDataSource.getRepository(MenuEntity);
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  let lastCheckpoint = new Date();

  const userEntity = (await userRepository.findOne({
    where: { id: user.id },
    relations: {
      lunchTimes: true,
    },
  })) as UserEntity;

  let currentCheckpoint = new Date();
  lastCheckpoint = currentCheckpoint;

  let schoolYear = getLatestSchoolYear(user.school);

  const lunchTimes = !schoolYear
    ? []
    : await schoolLunchTimeRepository.find({
        where: { schoolYear: { id: schoolYear.id } },
      });

  const dailyMenus = !schoolYear
    ? []
    : await dailyMenuRepository.find({
        where: { schoolYear: { id: schoolYear.id } },
        relations: { items: true },
      });

  let orders = !schoolYear
    ? []
    : await orderRepository.find({
        where: { schoolYear: { id: schoolYear.id } },
        relations: {
          user: true,
          meals: {
            student: true,
            items: true,
          },
        },
      });

  currentCheckpoint = new Date();
  lastCheckpoint = currentCheckpoint;

  const users = await userRepository.find({
    where: { school: { id: user.school.id } },
    relations: {
      lunchTimes: true,
      children: {
        lunchTimes: {
          lunchtimeTeacher: true,
          schoolYear: true,
        },
      },
    },
  });

  const menus =
    user.role != Role.ADMIN
      ? []
      : await menuRepository.find({
          where: { school: { id: user.school.id } },
          relations: {
            items: true,
          },
        });

  const notifications = await notificationRepository.find({
    where: {
      school: { id: user.school.id },
    },
  });

  const pantryItems =
    user.role != Role.ADMIN
      ? []
      : await pantryRepository.find({
          where: {
            school: { id: user.school.id },
          },
        });

  currentCheckpoint = new Date();
  lastCheckpoint = currentCheckpoint;

  let students = users.flatMap((user) => user.children);

  if (user.role == Role.TEACHER) {
    students = students.filter((student) =>
      student.lunchTimes.find(
        (lt) =>
          lt.schoolYear.id === schoolYear?.id &&
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
    users: users.map((user) => buildUserDto(user)),
    menus: menus.map((menu) => buildMenuDto(menu)),
    students: students.map((student) =>
      buildStudentDto({
        ...student,
        lunchTimes: student.lunchTimes.filter(
          (lt) => lt.schoolYear.id === schoolYear?.id
        ),
      })
    ),
    orders: orders.map((order) => buildOrderDto(order)),
    scheduledMenus: dailyMenus.map((menu) => buildDailyMenuDto(menu)),
    pantryItems,
    notifications,
    school: { ...user.school, squareAppAccessToken: "" },
    lunchTimes,
  };

  currentCheckpoint = new Date();
  lastCheckpoint = currentCheckpoint;

  return sessionInfo;
};

export const getSessionInfo = async (
  user: UserEntity
): Promise<SessionInfo> => {
  return user.role === Role.PARENT
    ? await getParentSession(user)
    : await getStaffSession(user);
};

SessionRouter.get<Empty, SessionInfo, Empty, Empty>("/", async (req, res) => {
  res.send(await getSessionInfo(req.user));
});

export default SessionRouter;
