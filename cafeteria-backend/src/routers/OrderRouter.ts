import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import StudentEntity from "../entity/StudentEntity";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";
import { DateTimeUtils } from "../DateTimeUtils";
import { DailyMenuEntity } from "../entity/MenuEntity";
import { OrderEntity } from "../entity/OrderEntity";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { DayOfWeek } from "../models/DailyLunchTime";
import { getCurrentSchoolYear, buildOrderDto } from "./RouterUtils";
import { PantryItem, PantryItemType } from "../models/Menu";
import { Order } from "../models/Order";
import { ShoppingCart, ShoppingCartItem } from "../models/ShoppingCart";
import StudentLunchTime from "../models/StudentLunchTime";
import UserEntity from "../entity/UserEntity";
import CreditCard from "../models/CreditCard";

interface CheckoutRequest {
  isGiftCard: boolean;
  cardId: string;
  latestLunchSchedule: StudentLunchTime[];
  shoppingCart: ShoppingCart;
  saveCard?: boolean;
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

OrderRouter.post<Empty, Order | string, CheckoutRequest, Empty>(
  "/",
  async (req, res) => {
    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);
    const studentRepository = AppDataSource.getRepository(StudentEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const userRepository = AppDataSource.getRepository(UserEntity);
    const studentLunchTimeRepository = AppDataSource.getRepository(
      StudentLunchTimeEntity
    );

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

    const schoolYear = getCurrentSchoolYear(req.user.school)!;
    const studentIds = new Set(req.body.shoppingCart.items.map((item) => item.studentId));

    for (const studentId of studentIds) {
      const currentLunchTimes = await studentLunchTimeRepository.find({
        where: {
          schoolYear,
          student: { id: studentId },
        },
      });
      const revisedLunchTimes = req.body.latestLunchSchedule.filter(lt => lt.studentId === studentId)
      for (const revisedLunchTime of revisedLunchTimes) {
        const currentLunchTime = currentLunchTimes.find(clt => clt.dayOfWeek === revisedLunchTime.dayOfWeek);
        if (!currentLunchTime) {
          await studentLunchTimeRepository.save(revisedLunchTime);
        } else {
          await studentLunchTimeRepository.save({...currentLunchTime, dayOfWeek: revisedLunchTime.dayOfWeek});
        }
      }
    }

    const meals = req.body.shoppingCart.items.map((shoppingCartItem, index) => {
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
    });
    let price = meals
      .flatMap((meal) => meal.items)
      .map((item) => item!.price!)
      .reduce((prev, curr) => prev + curr, 0);

    let cardId = req.body.cardId;
    let customerId: string | undefined = undefined;

    try {
      const { paymentsApi, customersApi, cardsApi, giftCardsApi } = new Client({
        accessToken: req.user.school.squareAppAccessToken,
        environment: req.user.school.squareAppId.startsWith("sandbox")
          ? Environment.Sandbox
          : Environment.Production,
      });

      customerId = req.user.paymentSysUserId?.length
        ? req.user.paymentSysUserId
        : undefined;

      if (req.body.saveCard) {
        if (!customerId?.length) {
          const { result: createCustomerResponse } =
            await customersApi.createCustomer({
              idempotencyKey: "createCustomer:" + req.user.id,
              givenName: req.user.firstName,
              familyName: req.user.lastName,
              emailAddress: req.user.email,
              referenceId: req.user.id.toString(),
            });
          customerId = createCustomerResponse.customer?.id ?? "";
        }

        if (req.body.isGiftCard) {
          const { result: createCardResponse } =
            await giftCardsApi.createGiftCard({
              idempotencyKey: randomUUID(),
              locationId: req.user.school.squareLocationId,
              giftCard: {
                type: "PHYSICAL",
                gan: cardId,
                customerIds: [customerId],
              },
            });
          if (createCardResponse.giftCard?.id) {
            cardId = createCardResponse.giftCard.id;
          }
        } else {
          const { result: createCardResponse } = await cardsApi.createCard({
            idempotencyKey: randomUUID(),
            sourceId: cardId,
            card: { customerId },
          });
          if (createCardResponse.card?.id) {
            cardId = createCardResponse.card.id;
          }
        }
      }

      const { result } = await paymentsApi.createPayment({
        idempotencyKey: randomUUID(),
        customerId,
        sourceId: cardId,
        locationId: req.user.school.squareLocationId,
        amountMoney: {
          currency: "USD",
          amount: BigInt(price * 100),
        },
      });
    } catch (error) {
      res.status(400).send("Unable to process payment");
      return;
    }

    const orderEntity: DeepPartial<OrderEntity> = {
      date: DateTimeUtils.toString(new Date()),
      taxes: 0,
      processingFee: 0,
      otherFees: 0,
      meals,
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

    res.send(orderDto);
  }
);

export default OrderRouter;
