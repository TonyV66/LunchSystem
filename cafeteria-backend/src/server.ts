// Import the 'express' module
import express, { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import UserEntity from "./entity/UserEntity";
import MenuEntity, {
  DailyMenuEntity,
  MealItemEntity,
  PantryItemEntity,
} from "./entity/MenuEntity";
import { DeepPartial, In, MoreThanOrEqual } from "typeorm";
import { DateTimeUtils } from "./DateTimeUtils";
import { OrderEntity } from "./entity/OrderEntity";
import SessionInfo from "./api/dto/SessionInfo";
import UserDTO from "./api/dto/UserDTO";
import StudentDTO from "./api/dto/StudentDTO";
import User, { Role } from "./models/User";
import { Order } from "./models/Order";
import { OrderDTO } from "./api/dto/OrderDTO";
import { Menu, DailyMenu, PantryItem, PantryItemType } from "./models/Menu";
import { Notification } from "./models/Notification";
import MenuDTO, { DailyMenuDTO } from "./api/dto/MenuDTO";
import StudentEntity from "./entity/StudentEntity";
import NotificationEntity from "./entity/NotificationEntity";
import SystemDefaultsEntity from "./entity/SystemDefaultsEntity";
import { ShoppingCart, ShoppingCartItem } from "./models/ShoppingCart";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";
import { CheckoutDTO } from "./api/dto/CheckoutDTO";
import Student from "./models/Student";

const router = express.Router();

const JWT_PRIVATE_KEY = "your-secret-key";
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

interface UpdateDailyMenuAvailRequest {
  dailyMenuId: number;
  startDateTime: string;
  endDateTime: string;
}

const buildMealItems = (
  shoppingCartItem: ShoppingCartItem,
  dailyMenu: DailyMenuEntity
) => {

  let entrees = dailyMenu.items.filter(
    (item) => item.type === PantryItemType.ENTREE
  );
  let sides = dailyMenu.items.filter(
    (item) => item.type === PantryItemType.SIDE
  );
  let desserts = dailyMenu.items.filter(
    (item) => item.type === PantryItemType.DESSERT
  );
  let drinks = dailyMenu.items.filter(
    (item) => item.type === PantryItemType.DRINK
  );

  if (!shoppingCartItem.isDrinkOnly) {
    if (entrees.length > 1) {
      entrees = entrees.filter((entree) =>
        shoppingCartItem.selectedMenuItemIds.includes(entree.id)
      );
    }
    if (
      sides.length > 1 &&
      dailyMenu.numSidesWithMeal &&
      dailyMenu.numSidesWithMeal < sides.length
    ) {
      sides = sides.filter((side) =>
        shoppingCartItem.selectedMenuItemIds.includes(side.id)
      );
    }
    if (desserts.length > 1) {
      desserts = desserts.filter((dessert) =>
        shoppingCartItem.selectedMenuItemIds.includes(dessert.id)
      );
    }
  }
  if (drinks.length > 1) {
    drinks = drinks.filter((drink) =>
      shoppingCartItem.selectedMenuItemIds.includes(drink.id)
    );
  }
  return entrees
    .concat(sides)
    .concat(desserts)
    .concat(drinks)
    .map((pantryItem) => {
      let price = 0;
      if (
        shoppingCartItem.isDrinkOnly &&
        pantryItem.type === PantryItemType.DRINK
      ) {
        price = dailyMenu.drinkOnlyPrice;
      } else if (
        !shoppingCartItem.isDrinkOnly &&
        pantryItem.type === PantryItemType.ENTREE
      ) {
        price = dailyMenu.price;
      }
      return {
        ...pantryItem,
        id: 0,
        price,
      };
    });
};


AppDataSource.initialize()
  .then(async () => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);
    const menuRespository = AppDataSource.getRepository(MenuEntity);
    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const studentRepository = AppDataSource.getRepository(StudentEntity);
    const systemDefaultsRepository =
      AppDataSource.getRepository(SystemDefaultsEntity);
    const notificationRepository =
      AppDataSource.getRepository(NotificationEntity);

    // Create an Express application
    const app = express();
    // parse application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: true }));

    // parse application/json
    app.use(bodyParser.json());

    // Set the port number for the server
    const port = 4000;

    interface Empty {}
    interface EntityId {
      id: number;
    }

    interface LoginRequest {
      username: string;
      pwd: string;
    }

    interface LoginResponse extends SessionInfo {
      jwtToken: string;
    }

    const buildMenuDto = (menu: MenuEntity) => {
      const menuDto: MenuDTO = {
        ...(menu as Menu),
        items: menu.items?.map((item) => ({ ...(item as PantryItem) })) || [],
      };
      return menuDto;
    };

    const buildDailyMenuDto = (menu: DailyMenuEntity) => {
      const menuDto: DailyMenuDTO = {
        ...(menu as DailyMenu),
        items: menu.items?.map((item) => ({ ...(item as PantryItem) })) || [],
      };
      return menuDto;
    };

    const buildOrderDto = (orderEntity: OrderEntity, userId?: number) => {
      const order: OrderDTO = {
        ...(orderEntity as Order),
        meals:
          orderEntity.meals.map((meal) => ({
            ...meal,
            student: undefined,
            lastMealDate: undefined,
            studentId: meal.student.id,
            items: meal.items,
          })) || [],
        userId: orderEntity.user?.id ?? userId,
      };
      return order;
    };

    const buildUserDto = (userEntity: UserEntity) => {
      const users: UserDTO[] = [userEntity].map((user) => ({
        ...user,
        students: undefined,
        children: undefined,
        orders: undefined,
      }));
      return users[0];
    };

    const buildStudentDto = (studentEntity: StudentEntity) => {
      const students: StudentDTO[] =
        [studentEntity].map((student) => ({
          ...student,
          teacher: undefined,
          teacherId: student.teacher.id,
        })) || [];

      return students[0];
    };

    const getSessionInfo = async (user: User): Promise<SessionInfo> => {
      const userEntity = (await userRepository.findOne({
        where: { id: user.id },
        relations: {
          orders: {
            meals: {
              student: true,
              items: true,
            },
          },
          children: {
            teacher: true,
          },
          students: {
            teacher: true,
          },
        },
      })) as UserEntity;

      const teacherEntities = await userRepository.find({
        where: { role: parseInt(Role.TEACHER.toString()) + 1 },
      });

      const allUsers = await userRepository.find();

      const menus = await menuRespository.find({
        relations: {
          items: true,
        },
      });

      const pantryItems = await pantryRespository.find();
      const notifications = await notificationRepository.find();

      const dailyMenus = await dailyMenuRespository.find({
        where: {
          date: MoreThanOrEqual(
            DateTimeUtils.toString(DateTimeUtils.getFirstDayOfWeek(new Date()))
          ),
        },
        relations: {
          items: true,
        },
      });

      const systemDefaults = await systemDefaultsRepository.find({
        take: 1,
      });

      let sessionInfo: SessionInfo = {
        user: buildUserDto(userEntity),
        users: allUsers
          .filter(
            (user) =>
              userEntity.role === Role.ADMIN || user.role === Role.TEACHER
          )
          .map((user) => buildUserDto(user)),
        menus: menus.map((menu) => buildMenuDto(menu)),
        students: [],
        orders: [],
        scheduledMenus: dailyMenus.map((menu) => buildDailyMenuDto(menu)),
        pantryItems,
        notifications,
        systemDefaults: { ...systemDefaults[0], squareAppAccessToken: "" },
      };

      if (userEntity.role === Role.TEACHER) {
        sessionInfo.students = userEntity.students.map((student) =>
          buildStudentDto(student)
        );
      } else if (userEntity.role === Role.PARENT) {
        sessionInfo.students = userEntity.children.map((student) =>
          buildStudentDto(student)
        );
      } else if (
        userEntity.role === Role.ADMIN ||
        userEntity.role === Role.CAFETERIA
      ) {
        const students = await studentRepository.find({
          relations: {
            teacher: true,
          },
        });
        sessionInfo.students = students.map((student) =>
          buildStudentDto(student)
        );
      }

      const firstDayOfThisWeek = DateTimeUtils.toString(
        DateTimeUtils.getFirstDayOfWeek(new Date())
      );
      if (user.role === Role.PARENT) {
        sessionInfo.orders = userEntity.orders
          .filter((order) => order.lastMealDate >= firstDayOfThisWeek)
          .map((order) => buildOrderDto(order, userEntity.id));
      } else {
        const studentIds = sessionInfo.students.map((student) => student.id);
        const orders = await orderRepository.find({
          where: {
            lastMealDate: MoreThanOrEqual(firstDayOfThisWeek),
          },
          relations: {
            user: true,
            meals: {
              student: true,
              items: true,
            },
          },
        });
        const filteredOrders = orders.filter(
          (order) =>
            userEntity.role === Role.ADMIN ||
            userEntity.role === Role.CAFETERIA ||
            order.meals.find((meal) => studentIds.includes(meal.student.id))
        );
        sessionInfo.orders = filteredOrders.map((order) =>
          buildOrderDto(order)
        );
      }
      return sessionInfo;
    };

    const authorizeRequest: RequestHandler<any, any, any, any> = async (
      req,
      res,
      next
    ) => {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        res.status(401).send("Access denied. No token provided");
      } else {
        try {
          const jwtPayload = jwt.verify(token, JWT_PRIVATE_KEY) as JwtPayload;

          const user = await userRepository.findOne({
            where: { id: jwtPayload.userId },
          });

          if (user) {
            req.user = user;
            next();
          } else {
            res.status(401).send("Access denied. Not an admin");
          }
        } catch (err) {
          res.status(400).send("Invalid token");
        }
      }
    };

    app.get<Empty, SessionInfo, Empty, Empty>(
      "/session",
      authorizeRequest,
      async (req, res) => {
        res.send(await getSessionInfo(req.user));
      }
    );

    app.post<Empty, PantryItem, PantryItem, Empty>(
      "/pantry",
      async (req, res) => {
        const item: DeepPartial<PantryItem> = { ...req.body, id: undefined };
        const newItem = pantryRespository.create(item);
        const savedItem = await pantryRespository.save(
          newItem as PantryItemEntity
        );
        res.send(savedItem as PantryItem);
      }
    );

    app.post<Empty, User, User, Empty>(
      "/user",
      async (req, res) => {
        const user: DeepPartial<UserEntity> = { ...req.body, id: undefined };
        const newUser = userRepository.create(user);
        const savedUser = await userRepository.save(
          newUser as UserEntity
        );
        res.send(savedUser as User);
      }
    );

    app.post<Empty, Student, Student, Empty>(
      "/student",
      async (req, res) => {
        const user: DeepPartial<Student> = { ...req.body, id: undefined };
        const newStudent = studentRepository.create(user);
        const savedStudent = await studentRepository.save(
          newStudent as StudentEntity
        );
        res.send(savedStudent as Student);
      }
    );

    app.put<Empty, Notification, Notification, Empty>(
      "/notification/review",
      authorizeRequest,
      async (req, res) => {
        const user = await userRepository.findOne({
          where: {
            id: req.user.id,
          },
        });
        if (user) {
          user.notificationReviewDate = new Date();
          await userRepository.save(user);
        }
        res.send();
      }
    );

    app.post<Empty, Notification, Notification, Empty>(
      "/notification",
      async (req, res) => {
        const item: DeepPartial<Notification> = {
          ...req.body,
          id: undefined,
          creationDate: new Date(),
        };
        const newItem = notificationRepository.create(item);
        const savedItem = await notificationRepository.save(
          newItem as NotificationEntity
        );
        res.send(savedItem as Notification);
      }
    );

    app.delete<EntityId, Empty, Empty, Empty>(
      "/notification/:id",
      async (req, res) => {
        await notificationRepository.delete(req.params.id);
        res.send();
      }
    );

    app.put<Empty, Notification, Notification, Empty>(
      "/notification",
      async (req, res) => {
        await notificationRepository.update(req.body.id, req.body);
        res.send(req.body);
      }
    );

    app.put<Empty, SystemDefaultsEntity, SystemDefaultsEntity, Empty>(
      "/sysdefaults",
      async (req, res) => {
        await systemDefaultsRepository.update(req.body.id, req.body);
        res.send(req.body);
      }
    );

    app.put<Empty, MenuDTO, MenuDTO, Empty>("/menu", async (req, res) => {
      const menu: DeepPartial<MenuEntity> = {
        ...req.body,
        items: req.body.items.map((item) => ({ ...item, id: undefined })),
      };

      const savedMenu = await menuRespository.save(menu);
      const menuDto = buildMenuDto(savedMenu);
      res.send(menuDto);
    });

    app.put<Empty, DailyMenuDTO, DailyMenuDTO, Empty>(
      "/dailymenu",
      async (req, res) => {
        const menu: DeepPartial<DailyMenuEntity> = {
          ...req.body,
          items: req.body.items.map((item) => ({ ...item, id: undefined })),
        };

        const savedMenu = await dailyMenuRespository.save(menu);
        const menuDto = buildDailyMenuDto(savedMenu);
        res.send(menuDto);
      }
    );

    app.post<Empty, OrderDTO, CheckoutDTO, Empty>(
      "/order",
      authorizeRequest,
      async (req, res) => {
        const systemDefaults = await systemDefaultsRepository.find({
          take: 1,
        });

        const { paymentsApi } = new Client({
          accessToken: systemDefaults[0].squareAppAccessToken,
          environment: Environment.Sandbox,
        });

        const dailyMenuIds = new Set(
          req.body.shoppingCart.items.map((item) => item.dailyMenuId)
        );

        const dailyMenus = await dailyMenuRespository.find({
          where: {
            id: In(Array.from(dailyMenuIds)),
          },
          relations: {
            items: true,
          },
        });

        const orderEntity: DeepPartial<OrderEntity> = {
          date: DateTimeUtils.toString(new Date()),
          taxes: 0,
          processingFee: 0,
          otherFees: 0,
          meals: req.body.shoppingCart.items.map((shoppingCartItem, index) => {
            const dailyMenu = dailyMenus.find(
              (sm) => sm.id === shoppingCartItem.dailyMenuId
            )!;
      
            return {
              date: dailyMenu.date,
              student: { id: shoppingCartItem.studentId },
              items: buildMealItems(shoppingCartItem, dailyMenu).map((item) => ({ ...item, id: undefined }))
            };
          }),
        };

        let lastMealDate = dailyMenus[0].date;
        dailyMenus.forEach(
          (meal) =>
            (lastMealDate = meal.date > lastMealDate ? meal.date : lastMealDate)
        );
        orderEntity.lastMealDate = lastMealDate;
        orderEntity.user = req.user;

        const savedOrder = await orderRepository.save(orderEntity);
        const orderDto = buildOrderDto(savedOrder);

        let price = orderEntity.meals!
          .flatMap((meal) => meal.items)
          .map((item) => item!.price!)
          .reduce((prev, curr) => prev + curr, 0);
        price += orderEntity.taxes! + orderEntity.otherFees!;
        try {
          const { result } = await paymentsApi.createPayment({
            idempotencyKey: randomUUID(),
            sourceId: req.body.paymentToken,
            amountMoney: {
              currency: "USD",
              amount: BigInt(price * 100),
            },
          });
        } catch (error) {
          console.log(error);
        }
        res.send(orderDto);
      }
    );

    app.post<Empty, MenuDTO, MenuDTO, Empty>("/menu", async (req, res) => {
      const menu: DeepPartial<MenuEntity> = {
        ...req.body,
        id: undefined,
        items: req.body.items.map((item) => ({ ...item, id: undefined })),
      };
      const savedMenu = await menuRespository.save(menu);
      const menuDto = buildMenuDto(savedMenu);

      res.send(menuDto);
    });

    app.post<Empty, DailyMenuDTO, DailyMenuDTO, Empty>(
      "/dailymenu",
      async (req, res) => {
        dailyMenuRespository.delete({
          date: req.body.date,
        });
        const menu: DeepPartial<DailyMenuEntity> = {
          ...req.body,
          id: undefined,
          items: req.body.items.map((item) => ({ ...item, id: undefined })),
        };
        const savedMenu = await dailyMenuRespository.save(menu);
        const menuDto = buildDailyMenuDto(savedMenu);

        res.send(menuDto);
      }
    );

    app.put<Empty, Empty, UpdateDailyMenuAvailRequest, Empty>(
      "/dailymenu/availability",
      async (req, res) => {
        const menu = await dailyMenuRespository.findOne({
          where: {
            id: req.body.dailyMenuId,
          },
        });
        if (menu) {
          menu.orderStartTime = new Date(req.body.startDateTime);
          menu.orderEndTime = new Date(req.body.endDateTime);

          await dailyMenuRespository.save(menu);
        }
        res.send();
      }
    );

    app.delete<EntityId, Empty, Empty, Empty>("/menu/:id", async (req, res) => {
      await menuRespository.delete(req.params.id);
      res.send();
    });

    app.delete<EntityId, Empty, Empty, Empty>(
      "/dailyMenu/:id",
      async (req, res) => {
        await dailyMenuRespository.delete(req.params.id);
        res.send();
      }
    );

    app.delete<EntityId, Empty, Empty, Empty>(
      "/pantry/:id",
      async (req, res) => {
        await pantryRespository.delete(req.params.id);
        res.send();
      }
    );

    app.post<Empty, LoginResponse | string, LoginRequest, Empty>(
      "/login",
      async (req, res) => {
        const loginRequest = req.body;

        const user = await userRepository.findOne({
          where: { userName: loginRequest.username },
          relations: {
            orders: {
              meals: true,
            },
          },
        });

        if (!user) {
          res.status(401).send("Unauthorized");
          return;
        }

        let passwordMatch = false;
        try {
          passwordMatch = await bcrypt.compare(loginRequest.pwd, user.pwd);
        } catch (error) {}

        if (!passwordMatch) {
          res.status(401).send("Unauthorized");
        }

        const jwtToken = jwt.sign({ userId: user.id }, JWT_PRIVATE_KEY);
        const sessionInfo = await getSessionInfo(user);

        res.send({
          ...sessionInfo,
          jwtToken,
        });
      }
    );

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));
