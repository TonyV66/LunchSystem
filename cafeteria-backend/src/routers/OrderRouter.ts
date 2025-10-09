import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";
import { DateTimeUtils } from "../DateTimeUtils";
import { DailyMenuEntity, MealItemEntity } from "../entity/MenuEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { getCurrentSchoolYear } from "./RouterUtils";
import { PantryItem, PantryItemType } from "../models/Menu";
import { Order } from "../models/Order";
import { ShoppingCart, ShoppingCartItem } from "../models/ShoppingCart";
import { Role } from "../models/User";
import UserEntity from "../entity/UserEntity";
import MealEntity from "../entity/MealEntity";
import { RefundType } from "../models/RefundType";

interface CheckoutRequest {
  isGiftCard: boolean;
  cardId: string;
  shoppingCart: ShoppingCart;
  saveCard?: boolean;
  useCredits?: boolean;
}

const buildMealItems = (
  shoppingCartItem: ShoppingCartItem,
  dailyMenu: DailyMenuEntity,
  isDonate: boolean
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
        pantryItem.type === PantryItemType.DRINK &&
        !isDonate
      ) {
        price = dailyMenu.drinkOnlyPrice;
      } else if (
        !shoppingCartItem.isDrinkOnly &&
        pantryItem.type === PantryItemType.ENTREE &&
        !isDonate
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
    if (req.body.cardId === "donate" && req.user.role !== Role.ADMIN) {
      res.status(400).send("Only admins can donate");
      return;
    }

    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const userRepository = AppDataSource.getRepository(UserEntity);

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
        items: buildMealItems(
          shoppingCartItem,
          dailyMenu,
          req.body.cardId === "donate"
        ).map((item) => ({
          ...item,
          id: undefined,
        })),
      };
    });

    let appliedCredits = 0;
    if (req.body.cardId !== "donate") {
      let price = meals
        .flatMap((meal) => meal.items)
        .map((item) => item!.price!)
        .reduce((prev, curr) => prev + curr, 0);

      appliedCredits = req.body.useCredits
        ? Math.min(price, req.user.availableCredits)
        : 0;
      price -= appliedCredits;

      if (price > 0) {
        let cardId = req.body.cardId;
        let customerId: string | undefined = undefined;

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
      }
    }

    const orderEntity: DeepPartial<OrderEntity> = {
      date: DateTimeUtils.toString(new Date()),
      taxes: 0,
      processingFee: 0,
      otherFees: 0,
      appliedCredits: appliedCredits,
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

    if (appliedCredits > 0) {
      req.user.availableCredits -= appliedCredits;
      await userRepository.save(req.user);
    }

    const savedOrder = await orderRepository.save(orderEntity);

    savedOrder.user = req.user;

    res.send(new Order(savedOrder));
  }
);

OrderRouter.put<
  { id: string },
  { order: Order; availableCredits: number } | string,
  { issueCredits: boolean },
  Empty
>("/:id/cancel", async (req, res) => {
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const userRepository = AppDataSource.getRepository(UserEntity);
  const mealRepository = AppDataSource.getRepository(MealEntity);
  const mealItemRepository = AppDataSource.getRepository(MealItemEntity);

  try {
    const order = await orderRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: {
        meals: {
          items: true,
        },
        user: true,
      },
    });

    if (!order) {
      res.status(404).send("Order not found");
      return;
    }

    // Check if user owns this order or is admin
    if (order.user.id !== req.user.id && req.user.role !== Role.ADMIN) {
      res.status(403).send("Unauthorized to cancel this order");
      return;
    }

    const mealsNotPreviouslyCancelled = order.meals.filter(
      (meal) => !meal.cancelled
    );

    // Update all meals in the order to cancelled
    for (const meal of mealsNotPreviouslyCancelled) {
      meal.cancelled = true;
      meal.refundType = req.body.issueCredits
        ? RefundType.CREDIT
        : RefundType.NONE;
      await mealRepository.save(meal);
    }

    if (req.body.issueCredits) {
      const cost = mealsNotPreviouslyCancelled.reduce((total, meal) => {
        return (
          total +
          meal.items.reduce((mealTotal, item) => {
            return mealTotal + item.price;
          }, 0)
        );
      }, 0);

      if (cost > 0) {
        req.user.availableCredits += cost;
        await userRepository.save(req.user);
      }

      if (order.appliedCredits > 0) {
        order.appliedCredits = 0;
        await orderRepository.save(order);
      }
    }

    const orderEntity = await orderRepository.findOne({
      where: { id: order.id },
      relations: {
        user: true,
        meals: {
          student: true,
          staffMember: true,
          items: true,
        },
      },
    });

    res.status(200).send({
      order: new Order(orderEntity!),
      availableCredits: req.user.availableCredits,
    });
  } catch (error) {
    res.status(500).send("Error cancelling order");
  }
});

export default OrderRouter;
