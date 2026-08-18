import express, { Router } from "express";
import Menu from "../models/Menu";
import DailyMenu from "../models/DailyMenu";
import PantryItem from "../models/PantryItem";
import Ingredient from "../models/Ingredient";
import UnitOfMeasure from "../models/UnitOfMeasure";
import School from "../models/School";
import Student from "../models/Student";
import { Role } from "../models/User";
import { Notification } from "../models/Notification";
import { Order } from "../models/Order";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import MenuEntity from "../entity/MenuEntity";
import DailyMenuEntity from "../entity/DailyMenuEntity";
import PantryItemEntity from "../entity/PantryItemEntity";
import IngredientEntity from "../entity/IngredientEntity";
import UnitOfMeasureEntity from "../entity/UnitOfMeasureEntity";
import NotificationEntity from "../entity/NotificationEntity";
import { OrderEntity } from "../entity/OrderEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { In, Not } from "typeorm";
import SchoolYear from "../models/SchoolYear";
import StudentLunchTime from "../models/StudentLunchTime";
import StudentEntity from "../entity/StudentEntity";
import { DateTimeUtils } from "../DateTimeUtils";
import SurveyEntity from "../entity/SurveyEntity";
import Survey from "../models/Survey";
import CalendarNote from "../models/CalendarNote";
import CalendarNoteEntity from "../entity/CalendarNoteEntity";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolUser from "../models/SchoolUser";
import { getUserStatus, requireUserStatus } from "../utils/UserStatusUtils";
import {
  getEnrolledStudentsForSchoolYear,
  getStudentsAssignedToLunchtimeTeacher,
  getStudentsForUserInSchoolYear,
  getUsersWithEnrollmentsInSchoolYear,
} from "../utils/EnrollmentUtils";
import { getCurrentSchoolYear } from "./RouterUtils";
import { getOrdersForMealDate } from "../utils/OrderQueryUtils";

const SessionRouter: Router = express.Router();
interface Empty {}

export interface SessionInfo {
  user: SchoolUser;
  menus: Menu[];
  users: SchoolUser[];
  students: Student[];
  orders: Order[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  ingredients: Ingredient[];
  unitsOfMeasure: UnitOfMeasure[];
  notifications: Notification[];
  calendarNotes: CalendarNote[];
  school: School;
  schoolYears: SchoolYear[];
  survey: Survey | null;
}

const toSchoolUser = (
  user: UserEntity,
  overrides: Partial<SchoolUser> = {},
): SchoolUser => {
  const registration = requireUserStatus(user);
  return {
    ...new SchoolUser(user, registration),
    ...overrides,
  };
};

const toSchoolUsers = (users: UserEntity[]): SchoolUser[] => {
  return users
    .filter((user) => getUserStatus(user))
    .map((user) => toSchoolUser(user));
};

const getStudentLunchTimes = async (
  schoolYearId: number,
  studentIds?: number[],
): Promise<StudentLunchTime[]> => {
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity,
  );

  if (studentIds && studentIds.length === 0) {
    return [];
  }

  const whereClause: any = {
    schoolYear: { id: schoolYearId },
  };

  if (studentIds && studentIds.length > 0) {
    whereClause.student = { id: In(studentIds) };
  }

  let studentLunchTimes: StudentLunchTimeEntity[] =
    await studentLunchTimeRepository.find({
      where: whereClause,
      relations: {
        student: true,
        lunchtimeTeacher: true,
      },
    });

  return studentLunchTimes.map((stl) => ({
    dayOfWeek: stl.dayOfWeek,
    grade: stl.grade,
    time: stl.time,
    studentId: stl.student.id,
    teacherId: stl.lunchtimeTeacher ? stl.lunchtimeTeacher.id : undefined,
  }));
};

const getStaff = async (
  school: SchoolEntity,
  role?: Role,
): Promise<UserEntity[]> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.find({
    select: { pwd: false },
    where: {
      userStatuses: {
        school: { id: school.id },
        role: role != undefined ? role : In([Role.TEACHER, Role.STAFF]),
      },
    },
    relations: {
      userStatuses: {
        school: true,
      },
    },
  });
};

const uniqueEntitiesById = <T extends { id: number }>(items: T[]): T[] =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

const getOrdersForFamilyMembers = async (
  schoolYear: SchoolYearEntity,
  parent: UserEntity,
  children: StudentEntity[],
): Promise<OrderEntity[]> => {
  const orderRepository = AppDataSource.getRepository(OrderEntity);

  const ordersByParent = (
    await orderRepository.find({
      where: {
        user: { id: parent.id },
        schoolYear: { id: schoolYear.id },
      },
      relations: {
        meals: {
          student: true,
          staffMember: true,
          items: true,
        },
      },
    })
  ).map((o) => ({ ...o, user: parent }));

  const studentIds = children.map((s) => s.id);
  if (studentIds.length === 0) {
    return ordersByParent;
  }

  const ordersBySomeoneElse = await orderRepository.find({
    where: {
      user: { id: Not(parent.id) },
      schoolYear: { id: schoolYear.id },
      meals: {
        student: { id: In(studentIds) },
      },
    },
    relations: {
      meals: {
        student: true,
        staffMember: true,
        items: true,
      },
      user: true,
    },
  });

  return ordersByParent.concat(ordersBySomeoneElse);
};

const getParentSession = async (
  user: UserEntity,
  school: SchoolEntity,
  options: { includeClassroomStudents?: boolean } = {},
): Promise<SessionInfo> => {
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const pantryRepository = AppDataSource.getRepository(PantryItemEntity);
  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  const notifications = await notificationRepository.find({
    where: {
      school: { id: school.id },
    },
  });

  let currentSchoolYear: SchoolYearEntity | null | undefined =
    await schoolYearRepository.findOne({
      where: { school: { id: school.id }, isCurrent: true },
      relations: {
        lunchTimes: true,
        gradeLunchTimes: true,
        teacherLunchTimes: {
          teacher: true,
        },
      },
    });

  if (!currentSchoolYear) {
    const startOfMonth = DateTimeUtils.getCurrentDate();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0,
    );
    endOfMonth.setHours(23, 59, 59, 999);

    currentSchoolYear = {
      id: 0,
      name: "No School Year Active",
      isCurrent: true,
      startDate: DateTimeUtils.toString(startOfMonth),
      endDate: DateTimeUtils.toString(endOfMonth),
      factsId: null,
      lunchTimes: [],
      teacherLunchTimes: [],
      gradeLunchTimes: [],
      studentLunchTimes: [],
      gradesAssignedByClass: "",
      oneTeacherPerStudent: true,
      hideSchedule: true,
      school,
      enrollments: [],
      orders: [],
      dailyMenus: [],
    };
  }

  if (!currentSchoolYear) {
    throw new Error("No school year found");
  }

  const myChildren: StudentEntity[] = await getStudentsForUserInSchoolYear(
    user.id,
    currentSchoolYear.id,
  );
  const classroomStudents = options.includeClassroomStudents
    ? await getStudentsAssignedToLunchtimeTeacher(user.id, currentSchoolYear.id)
    : [];
  const students = uniqueEntitiesById(myChildren.concat(classroomStudents));
  const allowedStudentIds = new Set(students.map((s) => s.id));

  let orders = await getOrdersForFamilyMembers(
    currentSchoolYear,
    user,
    students,
  );

  orders = orders
    .map((o) => ({
      ...o,
      meals: o.meals.filter(
        (m) =>
          m.staffMember?.id === user.id ||
          (m.student?.id != null && allowedStudentIds.has(m.student.id)),
      ),
    }))
    .filter((o) => o.meals.length > 0);

  const relatedUserIds = new Set<number>();
  orders.forEach((order) => {
    if (order.user?.id && order.user.id !== user.id) {
      relatedUserIds.add(order.user.id);
    }
  });
  students.forEach((student) => {
    student.enrollments?.forEach((enrollment) => {
      if (enrollment.user?.id && enrollment.user.id !== user.id) {
        relatedUserIds.add(enrollment.user.id);
      }
    });
  });

  const dailyMenus = await dailyMenuRepository.find({
    where: { schoolYear: { id: currentSchoolYear.id } },
    relations: { items: true },
  });

  const scheduledMenus = dailyMenus.map((menu) => new DailyMenu(menu));

  const teachers = await getStaff(school, Role.TEACHER);
  const extraUserIds = [...relatedUserIds].filter(
    (id) => !teachers.some((teacher) => teacher.id === id),
  );
  const extraUsers =
    extraUserIds.length > 0
      ? await AppDataSource.getRepository(UserEntity).find({
          select: { pwd: false },
          where: { id: In(extraUserIds) },
          relations: {
            userStatuses: {
              school: true,
            },
          },
        })
      : [];

  const studentLunchTimes = await getStudentLunchTimes(
    currentSchoolYear.id,
    students.map((s) => s.id),
  );

  const users = toSchoolUsers(teachers.concat(extraUsers));
  if (!users.find((u) => u.id === user.id)) {
    users.push(toSchoolUser(user));
  }

  // Check if school has an active survey
  const surveyRepository = AppDataSource.getRepository(SurveyEntity);
  const surveyEntity = await surveyRepository.findOne({
    where: { school: { id: school.id } },
    relations: { questions: true },
  });

  const userRegistration = requireUserStatus(user);

  // If no active survey exists, treat survey as completed in the returned session
  const sessionUser = toSchoolUser(user, {
    surveyCompleted:
      !surveyEntity || !surveyEntity.active
        ? true
        : userRegistration.surveyCompleted,
  });

  // Add survey to session info if user has not completed it and survey is active
  let survey: Survey | null = null;
  if (
    surveyEntity &&
    surveyEntity.active &&
    !userRegistration.surveyCompleted
  ) {
    surveyEntity.questions.sort((a, b) => a.order - b.order);
    survey = new Survey(surveyEntity);
  }

  const pantryItems = await pantryRepository.find({
    where: {
      school: { id: school.id },
    },
    relations: {
      recipeItems: true,
    },
  });

  const sessionInfo: SessionInfo = {
    user: sessionUser,
    users,
    menus: [],
    students: students.map((c) => new Student(c)),
    orders: orders.map((order) => new Order(order)),
    scheduledMenus,
    pantryItems: pantryItems.map((item) => new PantryItem(item)),
    ingredients: [],
    unitsOfMeasure: [],
    notifications,
    calendarNotes: [],
    school: new School(school),
    schoolYears: currentSchoolYear.id
      ? [{ ...new SchoolYear(currentSchoolYear), studentLunchTimes }]
      : [],
    survey,
  };

  return sessionInfo;
};

const getTeacherSession = async (
  user: UserEntity,
  school: SchoolEntity,
): Promise<SessionInfo> => {
  return getParentSession(user, school, { includeClassroomStudents: true });
};

export const getCafeteriaSession = async (
  user: UserEntity,
  school: SchoolEntity,
): Promise<SessionInfo> => {
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);
  const calendarNoteRepository =
    AppDataSource.getRepository(CalendarNoteEntity);
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const pantryRepository = AppDataSource.getRepository(PantryItemEntity);


  const allSchoolYears = await schoolYearRepository.find({
    where: { school: { id: school.id } },
    relations: {
      lunchTimes: true,
      gradeLunchTimes: true,
      teacherLunchTimes: {
        teacher: true,
      },
    },
    order: { startDate: "DESC" },
  });

  let currentSchoolYear = allSchoolYears.find((sy) => sy.isCurrent);
  if (!currentSchoolYear) {
    const startOfMonth = DateTimeUtils.getCurrentDate();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0,
    );
    endOfMonth.setHours(23, 59, 59, 999);

    currentSchoolYear = {
      id: 0,
      name: "No School Year Active",
      isCurrent: true,
      startDate: DateTimeUtils.toString(startOfMonth),
      endDate: DateTimeUtils.toString(endOfMonth),
      factsId: null,
      lunchTimes: [],
      teacherLunchTimes: [],
      gradeLunchTimes: [],
      studentLunchTimes: [],
      gradesAssignedByClass: "",
      oneTeacherPerStudent: true,
      hideSchedule: true,
      school,
      enrollments: [],
      orders: [],
      dailyMenus: [],
    };
  }

  const notifications = await notificationRepository.find({
    where: {
      school: { id: school.id },
    },
  });

  const calendarNotes = await calendarNoteRepository.find({
    where: {
      school: { id: school.id },
    },
  });

  let dailyMenus: DailyMenuEntity[] = [];
  let studentDtos: Student[] = [];
  let orders: Order[] = [];
  let studentLunchTimes: StudentLunchTime[] = [];
  let users: UserEntity[] = [];

  dailyMenus = await dailyMenuRepository.find({
    where: { schoolYear: { id: currentSchoolYear.id } },
    relations: { items: true },
  });

  const enrolledStudents = await getEnrolledStudentsForSchoolYear(
    currentSchoolYear.id,
  );
  studentDtos = enrolledStudents.map((student) => new Student(student));

  const staffUsers = await getStaff(school);
  const enrolledUsers = await getUsersWithEnrollmentsInSchoolYear(
    currentSchoolYear.id,
  );
  const userMap = new Map<number, UserEntity>();
  for (const schoolUser of staffUsers.concat(enrolledUsers)) {
    userMap.set(schoolUser.id, schoolUser);
  }
  users = Array.from(userMap.values());

  studentLunchTimes = await getStudentLunchTimes(currentSchoolYear.id);

  const role = getUserStatus(user)?.role;
  if (role === Role.KITCHEN) {
    const today = DateTimeUtils.toString(DateTimeUtils.getCurrentDate());
    const nextServingDate =
      dailyMenus
        .map((menu) => menu.date)
        .filter((menuDate) => menuDate >= today)
        .sort()[0] ?? today;
    orders = await getOrdersForMealDate(currentSchoolYear.id, nextServingDate);
  } else {
    const orderEntities = await orderRepository.find({
      where: { schoolYear: { id: currentSchoolYear.id } },
      relations: {
        user: true,
        meals: {
          student: true,
          staffMember: true,
          items: true,
        },
      },
    });
    orders = orderEntities.map((order) => new Order(order));
  }

  const schoolYears = allSchoolYears.map((sy) => new SchoolYear(sy));
  if (currentSchoolYear.id) {
    schoolYears.find(
      (sy) => sy.id === currentSchoolYear.id,
    )!.studentLunchTimes = studentLunchTimes;
  }

  // Check if school has an active survey
  const surveyRepository = AppDataSource.getRepository(SurveyEntity);
  const surveyEntity = await surveyRepository.findOne({
    where: { school: { id: school.id } },
    relations: { questions: true },
  });

  const userRegistration = requireUserStatus(user);

  // If no active survey exists, treat survey as completed in the returned session
  const sessionUser = toSchoolUser(user, {
    surveyCompleted:
      !surveyEntity || !surveyEntity.active
        ? true
        : userRegistration.surveyCompleted,
  });

  // Add survey to session info if user has not completed it and survey is active
  let survey: Survey | null = null;
  if (
    surveyEntity &&
    surveyEntity.active &&
    !userRegistration.surveyCompleted
  ) {
    surveyEntity.questions.sort((a, b) => a.order - b.order);
    survey = new Survey(surveyEntity);
  }

  const pantryItems = await pantryRepository.find({
    where: {
      school: { id: school.id },
    },
    relations: {
      recipeItems: true,
    },
  });
  const sessionInfo: SessionInfo = {
    user: sessionUser,
    users: toSchoolUsers(users.concat([user])),
    menus: [],
    students: studentDtos,
    orders,
    scheduledMenus: dailyMenus.map((menu) => new DailyMenu(menu)),
    pantryItems: pantryItems.map((item) => new PantryItem(item)),
    ingredients: [],
    unitsOfMeasure: [],
    notifications: notifications.map((n) => new Notification(n)),
    calendarNotes: calendarNotes.map((n) => new CalendarNote(n)),
    school: new School(school),
    schoolYears,
    survey,
  };

  return sessionInfo;
};

export const getAdminSession = async (
  user: UserEntity,
  school: SchoolEntity,
): Promise<SessionInfo> => {
  const sessionInfo = await getCafeteriaSession(user, school);

  const pantryRepository = AppDataSource.getRepository(PantryItemEntity);
  const ingredientRepository = AppDataSource.getRepository(IngredientEntity);
  const unitOfMeasureRepository =
    AppDataSource.getRepository(UnitOfMeasureEntity);
  const menuRepository = AppDataSource.getRepository(MenuEntity);
  AppDataSource.getRepository(NotificationEntity);

  const menus = await menuRepository.find({
    where: { school: { id: school.id } },
    relations: {
      items: true,
    },
  });

  const pantryItems = await pantryRepository.find({
    where: {
      school: { id: school.id },
    },
    relations: {
      recipeItems: true,
    },
  });

  const ingredients = await ingredientRepository.find({
    where: {
      school: { id: school.id },
    },
  });

  const unitsOfMeasure = await unitOfMeasureRepository.find({
    where: {
      school: { id: school.id },
    },
  });

  sessionInfo.menus = menus.map((menu) => new Menu(menu));
  sessionInfo.pantryItems = pantryItems.map((item) => new PantryItem(item));
  sessionInfo.ingredients = ingredients.map((item) => new Ingredient(item));
  sessionInfo.unitsOfMeasure = unitsOfMeasure.map(
    (item) => new UnitOfMeasure(item),
  );
  return sessionInfo;
};

export const getSessionInfo = async (
  user: UserEntity,
  school: SchoolEntity,
  schoolYear?: SchoolYearEntity,
): Promise<SessionInfo> => {
  const currentSchoolYear = schoolYear ?? getCurrentSchoolYear(school);

  const role = getUserStatus(user)?.role;

  const sessionInfo =
    role === Role.PARENT || role === Role.STAFF
      ? await getParentSession(user, school)
      : role === Role.TEACHER
        ? await getTeacherSession(user, school)
        : role === Role.ADMIN
          ? await getAdminSession(user, school)
          : await getCafeteriaSession(user, school);

  if (role !== Role.ADMIN) {
    sessionInfo.school.factsApiKey = "x".repeat(
      sessionInfo.school.factsApiKey?.length ?? 0,
    );
  }

  return sessionInfo;
};

SessionRouter.get<Empty, SessionInfo, Empty, Empty>("/", async (req, res) => {
  const updatedSessionInfo = await getSessionInfo(
    req.user,
    req.school,
    req.schoolYear,
  );
  if (!updatedSessionInfo) {
    throw new Error("Failed to get updated session info");
  }

  res.send(updatedSessionInfo);
});

export default SessionRouter;
