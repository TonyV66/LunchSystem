import express, { Router } from "express";
import { Menu, DailyMenu, PantryItem } from "../models/Menu";
import School from "../models/School";
import Student from "../models/Student";
import User, { Role } from "../models/User";
import { Notification } from "../models/Notification";
import { Order } from "../models/Order";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import { addUserToSchoolYear, getCurrentSchoolYear } from "./RouterUtils";
import MenuEntity, {
  DailyMenuEntity,
  PantryItemEntity,
} from "../entity/MenuEntity";
import NotificationEntity from "../entity/NotificationEntity";
import { OrderEntity } from "../entity/OrderEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { In, Not } from "typeorm";
import SchoolYear from "../models/SchoolYear";
import StudentLunchTime from "../models/StudentLunchTime";
import StudentEntity from "../entity/StudentEntity";
import { DateTimeUtils } from "../DateTimeUtils";

const SessionRouter: Router = express.Router();
interface Empty {}

export interface SessionInfo {
  user: User;
  menus: Menu[];
  users: User[];
  students: Student[];
  orders: Order[];
  scheduledMenus: DailyMenu[];
  pantryItems: PantryItem[];
  notifications: Notification[];
  school: School;
  schoolYears: SchoolYear[];
}

const getStudentLunchTimes = async (
  schoolYearId: number,
  studentIds?: number[]
): Promise<StudentLunchTime[]> => {
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

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

const getClassroomStudents = async (
  schoolYearId: number,
  teacher: User
): Promise<StudentEntity[]> => {
  let schoolYearStudents: StudentEntity[] = [];

  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  // Find all lunchtime assignments where this teacher is assigned
  const lunchTimeAssignments = await studentLunchTimeRepository.find({
    where: {
      schoolYear: { id: schoolYearId },
      lunchtimeTeacher: { id: teacher.id },
    },
    relations: {
      student: true,
    },
  });

  // Extract unique students from the assignments
  const studentIds = [
    ...new Set(lunchTimeAssignments.map((assignment) => assignment.student.id)),
  ];

  // Get full student information for these students, including their parents
  schoolYearStudents = await AppDataSource.getRepository(StudentEntity)
    .createQueryBuilder("student")
    .innerJoin(
      "student.schoolYears",
      "schoolYear",
      "schoolYear.id = :schoolYearId",
      { schoolYearId }
    )
    .leftJoinAndSelect("student.parents", "parents")
    .where("student.id IN (:...studentIds)", { studentIds })
    .getMany();

  return schoolYearStudents;
};

const getOrdersForStudents = async (
  schoolYearId: number,
  students: StudentEntity[]
): Promise<OrderEntity[]> => {
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const studentIds = students.map((student) => student.id);

  const orders = await orderRepository.find({
    where: {
      schoolYear: { id: schoolYearId },
      meals: {
        student: { id: In(studentIds) },
      },
    },
    relations: {
      user: true,
      meals: {
        student: true,
        items: true,
      },
    },
  });

  // Filter meals to only include those for the specified students
  return orders.map((order) => ({
    ...order,
    meals: order.meals.filter(
      (meal) => meal.student && studentIds.includes(meal.student.id)
    ),
  }));
};

const getStaff = async (school: School, role?: Role): Promise<UserEntity[]> => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  return await userRepository.find({
    select: { pwd: false },
    where: {
      school,
      role: role != undefined ? role + 1 : Not(Role.PARENT + 1),
    },
  });
};

const getUsers = async (schoolYearId: number): Promise<UserEntity[]> => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  // Get all users that are parents in the school year with their students in a single query
  const users = await userRepository
    .createQueryBuilder("user")
    .innerJoin(
      "user.schoolYears",
      "schoolYear",
      "schoolYear.id = :schoolYearId",
      { schoolYearId }
    )
    .leftJoinAndSelect("user.students", "students")
    .getMany();

  return users;
};

const getOrdersForFamilyMembers = async (
  schoolYear: SchoolYearEntity,
  parent: UserEntity,
  children: StudentEntity[]
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
          items: true,
        },
      },
    })
  ).map((o) => ({ ...o, user: parent }));

  const ordersBySomeoneElse = await orderRepository.find({
    where: {
      user: { id: Not(parent.id) },
      schoolYear: { id: schoolYear.id },
      meals: {
        student: { id: In(children.map((s) => s.id)) },
      },
    },
    relations: {
      meals: {
        student: true,
        items: true,
      },
      user: true,
    },
  });

  return ordersByParent.concat(ordersBySomeoneElse);
};

const getParentSession = async (user: UserEntity): Promise<SessionInfo> => {
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);

  const notifications = await notificationRepository.find({
    where: {
      school: { id: user.school.id },
    },
  });

  let currentSchoolYear: SchoolYearEntity | null | undefined =
    await schoolYearRepository.findOne({
      where: { school: { id: user.school.id }, isCurrent: true },
      relations: {
        lunchTimes: true,
        gradeLunchTimes: true,
        teacherLunchTimes: {
          teacher: true,
        },
      },
    });

  if (!currentSchoolYear) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    );
    endOfMonth.setHours(23, 59, 59, 999);

    currentSchoolYear = {
      id: 0,
      name: "No School Year Active",
      isCurrent: true,
      startDate: DateTimeUtils.toString(startOfMonth),
      endDate: DateTimeUtils.toString(endOfMonth),
      lunchTimes: [],
      teacherLunchTimes: [],
      gradeLunchTimes: [],
      studentLunchTimes: [],
      gradesAssignedByClass: "",
      school: user.school,
      parents: [],
      students: [],
      orders: [],
      dailyMenus: [],
    };
  }

  // Get my children with their parents
  const myChildren: StudentEntity[] = await AppDataSource.getRepository(
    StudentEntity
  )
    .createQueryBuilder("student")
    .innerJoin("student.parents", "parent", "parent.id = :userId", {
      userId: user.id,
    })
    .leftJoinAndSelect("student.parents", "allParents")
    .getMany();

  let orders = await getOrdersForFamilyMembers(
    currentSchoolYear,
    user,
    myChildren
  );

  orders = orders.map((o) => ({
    ...o,
    meals: o.meals.filter((m) =>
      myChildren.find((s) => s.id === m.student?.id)
    ),
  }));

  const otherUsers: UserEntity[] = [];
  orders.forEach(
    (order) =>
      !otherUsers.find(
        (u) => order.user && order.user.id !== user.id && u.id === order.user.id
      ) && otherUsers.push(order.user)
  );

  const dailyMenus = await dailyMenuRepository.find({
    where: { schoolYear: { id: currentSchoolYear.id } },
    relations: { items: true },
  });

  const scheduledMenus = dailyMenus.map((menu) => new DailyMenu(menu));

  let teachers = await getStaff(user.school, Role.TEACHER);

  const studentLunchTimes = await getStudentLunchTimes(
    currentSchoolYear.id,
    myChildren.map((s) => s.id)
  );

  const users = teachers
    .concat(otherUsers.filter((u) => !teachers.find((t) => t.id === u.id)))
    .map((u) => new User(u));
  if (!users.find((u) => u.id === user.id)) {
    users.push(new User(user));
  }

  const sessionInfo: SessionInfo = {
    user: new User(user),
    users,
    menus: [],
    students: myChildren.map((c) => new Student(c)),
    orders: orders.map((order) => new Order(order)),
    scheduledMenus,
    pantryItems: [],
    notifications,
    school: new School(user.school),
    schoolYears: currentSchoolYear.id
      ? [{ ...new SchoolYear(currentSchoolYear), studentLunchTimes }]
      : [],
  };

  return sessionInfo;
};

export const getStaffSession = async (
  user: UserEntity
): Promise<SessionInfo> => {
  const pantryRepository = AppDataSource.getRepository(PantryItemEntity);
  const menuRepository = AppDataSource.getRepository(MenuEntity);
  const dailyMenuRepository = AppDataSource.getRepository(DailyMenuEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const notificationRepository =
    AppDataSource.getRepository(NotificationEntity);
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const allSchoolYears = await schoolYearRepository.find({
    where: { school: { id: user.school.id } },
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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    );
    endOfMonth.setHours(23, 59, 59, 999);

    currentSchoolYear = {
      id: 0,
      name: "No School Year Active",
      isCurrent: true,
      startDate: DateTimeUtils.toString(startOfMonth),
      endDate: DateTimeUtils.toString(endOfMonth),
      lunchTimes: [],
      teacherLunchTimes: [],
      gradeLunchTimes: [],
      studentLunchTimes: [],
      gradesAssignedByClass: "",
      school: user.school,
      parents: [],
      students: [],
      orders: [],
      dailyMenus: [],
    };
  }
  // Get my children with their parents
  const myChildren: StudentEntity[] = await AppDataSource.getRepository(
    StudentEntity
  )
    .createQueryBuilder("student")
    .innerJoin("student.parents", "parent", "parent.id = :userId", {
      userId: user.id,
    })
    .leftJoinAndSelect("student.parents", "allParents")
    .getMany();

  const notifications = await notificationRepository.find({
    where: {
      school: { id: user.school.id },
    },
  });

  let dailyMenus: DailyMenuEntity[] = [];
  let students: StudentEntity[] = [];
  let studentDtos: Student[] = [];
  let orders: OrderEntity[] = [];
  let menus: MenuEntity[] = [];
  let pantryItems: PantryItemEntity[] = [];
  let studentLunchTimes: StudentLunchTime[] = [];
  let users: UserEntity[] = [];

  dailyMenus = await dailyMenuRepository.find({
    where: { schoolYear: { id: currentSchoolYear.id } },
    relations: { items: true },
  });

  if (user.role === Role.TEACHER) {
    students = await getClassroomStudents(currentSchoolYear.id, user);
    studentDtos = students.map((student) => new Student(student));

    let familyOrders = await getOrdersForFamilyMembers(
      currentSchoolYear,
      user,
      myChildren
    );

    let classroomOrders = (
      await getOrdersForStudents(currentSchoolYear.id, students)
    ).filter((o) => !familyOrders.find((o2) => o2.id === o.id));

    const studentIds = myChildren
      .map((child) => child.id)
      .concat(students.map((student) => student.id));

    orders = familyOrders.concat(classroomOrders).map((o) => ({
      ...o,
      meals:
        o.user.id === user.id
          ? o.meals
          : o.meals.filter((m) => studentIds.includes(m.student!.id)),
    }));
    studentLunchTimes = await getStudentLunchTimes(
      currentSchoolYear.id,
      studentIds
    );

    orders.forEach((o) => {
      if (!users.find((u) => o.user.id === u.id)) {
        users.push(o.user);
      }
    });
  } else {
    users = await getUsers(currentSchoolYear.id);

    const studentMap = new Map<number, StudentEntity>();
    users.forEach((user) => {
      if (user.students) {
        user.students.forEach((student) => {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, student);
          }
        });
      }
    });
    students = Array.from(studentMap.values());

    studentDtos = students.map((student) => {
      const studentDto = new Student(student);
      studentDto.parents = Array.from(
        new Set(
          users
            .filter((user) => user.students?.some((s) => s.id === student.id))
            .map((user) => user.id)
        )
      );
      return studentDto;
    });

    studentLunchTimes = await getStudentLunchTimes(currentSchoolYear.id);

    orders = await orderRepository.find({
      where: { schoolYear: { id: currentSchoolYear.id } },
      relations: {
        user: true,
        meals: {
          student: true,
          items: true,
        },
      },
    });
  }

  if (user.role === Role.ADMIN) {
    menus = await menuRepository.find({
      where: { school: { id: user.school.id } },
      relations: {
        items: true,
      },
    });

    pantryItems = await pantryRepository.find({
      where: {
        school: { id: user.school.id },
      },
    });
  }

  const staff = await getStaff(user.school);
  staff.forEach((sm) => {
    if (!users.find((user) => user.id === sm.id)) {
      users.push(sm);
    }
  });

  // Ensure all myChildren are included in the students array
  const studentMap = new Map(
    studentDtos.map((student) => [student.id, student])
  );
  myChildren.forEach((child) => {
    if (!studentMap.has(child.id)) {
      studentDtos.push(new Student(child));
    }
  });

  const schoolYears = allSchoolYears.map((sy) => new SchoolYear(sy));
  if (currentSchoolYear.id) {
    schoolYears.find(
      (sy) => sy.id === currentSchoolYear.id
    )!.studentLunchTimes = studentLunchTimes;
  }

  const sessionInfo: SessionInfo = {
    user: new User(user),
    users: users.map((u) => new User(u)),
    menus: menus.map((menu) => new Menu(menu)),
    students: studentDtos,
    orders: orders.map((order) => new Order(order)),
    scheduledMenus: dailyMenus.map((menu) => new DailyMenu(menu)),
    pantryItems: pantryItems.map((item) => new PantryItem(item)),
    notifications: notifications.map((n) => new Notification(n)),
    school: new School(user.school),
    schoolYears,
  };

  return sessionInfo;
};

export const getSessionInfo = async (
  user: UserEntity
): Promise<SessionInfo> => {
  const currentSchoolYear = getCurrentSchoolYear(user.school);

  if (currentSchoolYear) {
    await addUserToSchoolYear(user, currentSchoolYear);
  }

  return user.role === Role.PARENT
    ? await getParentSession(user)
    : await getStaffSession(user);
};

SessionRouter.get<Empty, SessionInfo, Empty, Empty>("/", async (req, res) => {
  res.send(await getSessionInfo(req.user));
});

export default SessionRouter;
