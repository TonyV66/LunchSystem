import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import StudentEntity from "../entity/StudentEntity";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";
import { DateTimeUtils } from "../DateTimeUtils";
import { DailyMenuEntity } from "../entity/MenuEntity";
import { OrderEntity } from "../entity/OrderEntity";
import SchoolEntity from "../entity/SchoolEntity";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { DayOfWeek } from "../models/DailyLunchTime";
import { getLatestSchoolYear, buildOrderDto } from "./RouterUtils";
import { PantryItem, PantryItemType } from "../models/Menu";
import { Order } from "../models/Order";
import { ShoppingCart, ShoppingCartItem } from "../models/ShoppingCart";
import StudentLunchTime from "../models/StudentLunchTime";

export class CheckoutDTO {
  paymentToken: string;
  latestLunchSchedule: StudentLunchTime[];
  shoppingCart: ShoppingCart;
}

const buildMealItems = (
  shoppingCartItem: ShoppingCartItem,
  dailyMenu: DailyMenuEntity
) => {
  let entrees: PantryItem[] = [];
  let sides: PantryItem[] = [];
  let desserts: PantryItem[] = [];

  if (!shoppingCartItem.isDrinkOnly) {
    entrees = dailyMenu.items.filter(
      (item) => item.type === PantryItemType.ENTREE
    );
    if (entrees.length > 1) {
      entrees = entrees.filter((entree) =>
        shoppingCartItem.selectedMenuItemIds.includes(entree.id)
      );
    }

    sides = dailyMenu.items.filter((item) => item.type === PantryItemType.SIDE);
    if (
      sides.length > 1 &&
      dailyMenu.numSidesWithMeal &&
      dailyMenu.numSidesWithMeal < sides.length
    ) {
      sides = sides.filter((side) =>
        shoppingCartItem.selectedMenuItemIds.includes(side.id)
      );
    }

    desserts = dailyMenu.items.filter(
      (item) => item.type === PantryItemType.DESSERT
    );
    if (desserts.length > 1) {
      desserts = desserts.filter((dessert) =>
        shoppingCartItem.selectedMenuItemIds.includes(dessert.id)
      );
    }
  }

  let drinks = dailyMenu.items.filter(
    (item) => item.type === PantryItemType.DRINK
  );
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

const OrderRouter: Router = express.Router();
interface Empty {}

OrderRouter.post<Empty, Order, CheckoutDTO, Empty>("/", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);
  const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);
  const studentRepository = AppDataSource.getRepository(StudentEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const studentLunchTimeRepository = AppDataSource.getRepository(
    StudentLunchTimeEntity
  );

  const school = await schoolRepository.findOne({
    where: {
      id: 1,
    },
  });

  const { paymentsApi } = new Client({
    accessToken: school!.squareAppAccessToken,
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

  const schoolYear = getLatestSchoolYear(req.user.school)!;

  const students = await studentRepository.find({
    where: {
      id: In(
        Array.from(
          new Set(req.body.shoppingCart.items.map((item) => item.studentId))
        )
      ),
    },
    relations: {
      lunchTimes: {
        lunchtimeTeacher: true,
        schoolYear: true,
      },
    },
  });

  for (const student of students) {
    for (let i = DayOfWeek.MONDAY; i <= DayOfWeek.SATURDAY; i++) {
      const requestedLunchTime = req.body.latestLunchSchedule.find(
        (lt) => lt.id === student.id && lt.dayOfWeek === i
      );
      if (requestedLunchTime) {
        const currentLunchTime = student.lunchTimes.find(
          (lt) => lt.id === student.id && lt.dayOfWeek === i
        );
        if (!currentLunchTime) {
          await studentLunchTimeRepository.insert({
            dayOfWeek: i,
            schoolYear: schoolYear,
            time: "",
            lunchtimeTeacher: { id: requestedLunchTime.teacherId },
            student: student,
          });
        } else if (
          requestedLunchTime.teacherId !==
            currentLunchTime.lunchtimeTeacher.id ||
          currentLunchTime.schoolYear.id !== schoolYear.id
        ) {
          await studentLunchTimeRepository.delete({
            id: currentLunchTime.id,
          });
          await studentLunchTimeRepository.insert({
            dayOfWeek: i,
            schoolYear: schoolYear,
            time: "",
            lunchtimeTeacher: { id: requestedLunchTime.teacherId },
            student: student,
          });
        }
      }
    }
  }

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
        items: buildMealItems(shoppingCartItem, dailyMenu).map((item) => ({
          ...item,
          id: undefined,
        })),
      };
    }),
    schoolYear: schoolYear,
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

  let price = orderEntity
    .meals!.flatMap((meal) => meal.items)
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
});

export default OrderRouter;
