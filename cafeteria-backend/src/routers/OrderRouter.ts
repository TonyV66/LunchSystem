import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";
import { DateTimeUtils } from "../DateTimeUtils";
import { DailyMenuEntity } from "../entity/MenuEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { getCurrentSchoolYear } from "./RouterUtils";
import { PantryItem, PantryItemType } from "../models/Menu";
import { Order } from "../models/Order";
import { ShoppingCart, ShoppingCartItem } from "../models/ShoppingCart";
import { Role } from "../models/User";

interface CheckoutRequest {
  isGiftCard: boolean;
  cardId: string;
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
    const orderRepository = AppDataSource.getRepository(OrderEntity);

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

    const meals = req.body.shoppingCart.items.map((shoppingCartItem, index) => {
      const dailyMenu = dailyMenus.find(
        (sm) => sm.id === shoppingCartItem.dailyMenuId
      )!;
      const diner = shoppingCartItem.studentId
        ? { student: { id: shoppingCartItem.studentId } }
        : { staffMember: { id: req.user.id } };
      return {
        ...diner,
        date: dailyMenu.date,
        time: shoppingCartItem.time ?? "",
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

    if (req.body.cardId !== "donate") {
      try {
        const { paymentsApi, customersApi, cardsApi, giftCardsApi } =
          new Client({
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
    } else {
      if (req.user.role !== Role.ADMIN) {
        res.status(400).send("Only admins can donate");
        return;
      }
      price = 0;
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
    savedOrder.user = req.user;

    res.send(new Order(savedOrder));
  }
);

OrderRouter.post<Empty, Order | string, ShoppingCart, Empty>(
  "/donate",
  async (req, res) => {
    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);

    const dailyMenuIds = new Set(
      req.body.items.map((item) => item.dailyMenuId)
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

    const meals = req.body.items.map((shoppingCartItem, index) => {
      const dailyMenu = dailyMenus.find(
        (sm) => sm.id === shoppingCartItem.dailyMenuId
      )!;
      const diner = { student: { id: shoppingCartItem.studentId } };
      return {
        ...diner,
        date: dailyMenu.date,
        time: "",
        items: buildMealItems(shoppingCartItem, dailyMenu).map((item) => ({
          ...item,
          id: undefined,
          price: 0,
        })),
      };
    });

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
    savedOrder.user = req.user;

    res.send(new Order(savedOrder));
  }
);

export default OrderRouter;
