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
  getCurrentSchoolYear,
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
import SchoolYearLunchTimeEntity from "../entity/SchoolYearLunchTimeEntity";
import { OrderEntity } from "../entity/OrderEntity";
import DailyLunchTime from "../models/DailyLunchTime";
import StudentEntity from "../entity/StudentEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { In, Not } from "typeorm";
import SchoolYear from "../models/SchoolYear";
import StudentLunchTime from "../models/StudentLunchTime";
import TeacherLunchTime from "../models/TeacherLunchTime";

const SessionRouter: Router = express.Router();
interface Empty {}

export interface SessionInfo {
  user: User;
  menus: Menu[];
  users: User[];
  students: Student[];
  orders: Order[];
  schoolLunchTimes: DailyLunchTime[];
  teacherLunchTimes: TeacherLunchTime[];
  studentLunchTimes: StudentLunchTime[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  school: School;
}

const getStudentLunchTimes = async (
  schoolYear: SchoolYear
): Promise<StudentLunchTime[]> => {
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  let studentLunchTimes: StudentLunchTimeEntity[] =
    await studentLunchTimeRepository.find({
      where: {
        schoolYear: { id: schoolYear.id },
      },
      relations: {
        student: true,
        lunchtimeTeacher: true,
      },
    });

  return studentLunchTimes.map((stl) => ({
    dayOfWeek: stl.dayOfWeek,
    time: stl.time,
    studentId: stl.student.id,
    teacherId: stl.lunchtimeTeacher ? stl.lunchtimeTeacher.id : undefined,
  }));
};

const getTeacherLunchTimes = async (
  schoolYear: SchoolYear
): Promise<TeacherLunchTime[]> => {
  const teacherLunchTimeRepository = AppDataSource.getRepository(
    TeacherLunchTimeEntity
  );

  let teacherLunchTimes: TeacherLunchTimeEntity[] =
    await teacherLunchTimeRepository.find({
      where: {
        schoolYear: { id: schoolYear.id },
      },
      relations: {
        teacher: true,
      },
    });

  return teacherLunchTimes.map((tlt) => ({
    teacherId: tlt.teacher.id,
    dayOfWeek: tlt.dayOfWeek,
    time: tlt.time,
  }));
};

const getSchoolLunchTimes = async (
  schoolYear: SchoolYear
): Promise<DailyLunchTime[]> => {
  const schoolYearLunchTimeRepository = AppDataSource.getRepository(
    SchoolYearLunchTimeEntity
  );

  let schoolLunchTimes: SchoolYearLunchTimeEntity[] =
    await schoolYearLunchTimeRepository.find({
      where: {
        schoolYear: { id: schoolYear.id },
      },
    });

  return schoolLunchTimes.map((stl) => ({
    id: stl.id,
    dayOfWeek: stl.dayOfWeek,
    time: stl.time,
  }));
};

const getStudents = async (
  schoolYear: SchoolYear,
  user: User
): Promise<Student[]> => {
  let schoolYearStudents: Student[] = await AppDataSource.createQueryBuilder()
    .relation(SchoolYearEntity, "students")
    .of(schoolYear)
    .loadMany();

  if (user.role === Role.PARENT) {
    schoolYearStudents = (
      await AppDataSource.createQueryBuilder()
        .relation(UserEntity, "students")
        .of(user)
        .loadMany()
    ).filter((myStudent) =>
      schoolYearStudents.find((sys) => sys.id === myStudent.id)
    );
  }
  return schoolYearStudents;
};

const getStaff = async (school: School): Promise<User[]> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.find({
    select: { pwd: false },
    where: { school, role: Not(Role.PARENT + 1) },
  });
};

const getUsers = async (schoolYear: SchoolYear): Promise<User[]> => {
  let users: User[] = await AppDataSource.createQueryBuilder()
    .relation(SchoolYearEntity, "parents")
    .of(schoolYear)
    .loadMany();

  return users;
};

const getParentSession = async (user: UserEntity): Promise<SessionInfo> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);

  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  const notifications = await notificationRepository.find({
    where: {
      school: { id: user.school.id },
    },
  });

  const schoolYear = getCurrentSchoolYear(user.school);

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

  const userEntity = (await userRepository.findOne({
    select: { pwd: false },
    where: { id: user.id },
  })) as UserEntity;

  const dailyMenus = !schoolYear
    ? []
    : await dailyMenuRepository.find({
        where: { schoolYear: { id: schoolYear.id } },
        relations: { items: true },
      });

  const scheduledMenus = dailyMenus.map((menu) => buildDailyMenuDto(menu));

  const students = schoolYear ? await getStudents(schoolYear, user) : [];
  let teachers = schoolYear
    ? (await getUsers(schoolYear)).filter((user) => user.role === Role.TEACHER)
    : [];

  const schoolLunchTimes = schoolYear
    ? await getSchoolLunchTimes(schoolYear)
    : [];

  const studentLunchTimes = schoolYear
    ? await getStudentLunchTimes(schoolYear)
    : [];

  const teacherLunchTimes = schoolYear
    ? await getTeacherLunchTimes(schoolYear)
    : [];

  const studentIds = students.map((stu) => stu.id);

  const otherTeacherIds = studentLunchTimes.filter(
    (slt) =>
      studentIds.includes(slt.studentId) &&
      slt.teacherId &&
      !teachers.find((teacher) => teacher.id)
  );
  teachers = teachers.concat(
    await userRepository.find({ where: { id: In(otherTeacherIds) } })
  );

  const sessionInfo: SessionInfo = {
    user: userEntity,
    users: teachers,
    menus: [],
    students,
    orders: orders.map((order) => buildOrderDto(order, user.id)),
    scheduledMenus,
    pantryItems: [],
    notifications,
    school: { ...user.school, squareAppAccessToken: "" },
    schoolLunchTimes,
    studentLunchTimes,
    teacherLunchTimes,
  };

  return sessionInfo;
};

const getStaffSession = async (user: UserEntity): Promise<SessionInfo> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const pantryRepository = AppDataSource.getRepository(PantryItemEntity);
  const menuRepository = AppDataSource.getRepository(MenuEntity);
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  const userEntity = (await userRepository.findOne({
    select: { pwd: false },
    where: { id: user.id },
  })) as UserEntity;

  let schoolYear = getCurrentSchoolYear(user.school);

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

  let students = !schoolYear ? [] : await getStudents(schoolYear, user);

  if (user.role == Role.TEACHER) {
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

  const users = schoolYear ? await getUsers(schoolYear) : [];
  const staff = await getStaff(user.school);
  staff.forEach((sm) => {
    if (!users.find((user) => user.id === sm.id)) {
      users.push(sm);
    }
  });
  const schoolLunchTimes = schoolYear
    ? await getSchoolLunchTimes(schoolYear)
    : [];

  const studentLunchTimes = schoolYear
    ? await getStudentLunchTimes(schoolYear)
    : [];

  const teacherLunchTimes = schoolYear
    ? await getTeacherLunchTimes(schoolYear)
    : [];

  const sessionInfo: SessionInfo = {
    user: userEntity,
    users,
    menus: menus.map((menu) => buildMenuDto(menu)),
    students,
    orders: orders.map((order) => buildOrderDto(order)),
    scheduledMenus: dailyMenus.map((menu) => buildDailyMenuDto(menu)),
    pantryItems,
    notifications,
    school: { ...user.school, squareAppAccessToken: "" },
    schoolLunchTimes,
    studentLunchTimes,
    teacherLunchTimes,
  };

  return sessionInfo;
};

export const getSessionInfo = async (
  user: UserEntity
): Promise<SessionInfo> => {

  const currentSchoolYear = getCurrentSchoolYear(user.school);

  if (currentSchoolYear) {
    const userYears = await AppDataSource.createQueryBuilder()
      .relation(UserEntity, "schoolYears")
      .of(user)
      .loadMany();

    if (!userYears.find((year) => year.id === currentSchoolYear.id)) {
      await AppDataSource.createQueryBuilder()
        .relation(SchoolYearEntity, "parents")
        .of(currentSchoolYear)
        .add(user);
    }
  }

  return user.role === Role.PARENT
    ? await getParentSession(user)
    : await getStaffSession(user);
};

SessionRouter.get<Empty, SessionInfo, Empty, Empty>("/", async (req, res) => {
  res.send(await getSessionInfo(req.user));
});

export default SessionRouter;
