import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import { Client, Environment } from "square";
import { randomUUID } from "crypto";
import { DateTimeFormat, DateTimeUtils } from "../DateTimeUtils";
import DailyMenuEntity from "../entity/DailyMenuEntity";
import MealItemEntity from "../entity/MealItemEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { PantryItemType } from "../models/PantryItemType";
import { Order } from "../models/Order";
import { ShoppingCart, ShoppingCartItem } from "../models/ShoppingCart";
import { Role } from "../models/User";
import MealEntity from "../entity/MealEntity";
import PantryItemEntity from "../entity/PantryItemEntity";
import UserEntity from "../entity/UserEntity";
import { RefundType } from "../models/RefundType";
import { saveUserStatus } from "../utils/UserStatusUtils";
import { sendOrderReceiptEmail } from "../utils/EmailUtils";

interface CheckoutRequest {
  isGiftCard: boolean;
  cardId: string;
  shoppingCart: ShoppingCart;
  saveCard?: boolean;
  useCredits?: boolean;
  emailReceipt?: boolean;
}

const buildMealItems = (
  shoppingCartItem: ShoppingCartItem,
  dailyMenu: DailyMenuEntity,
  isDonate: boolean,
  pantryItemById: Map<number, PantryItemEntity>
) => {
  const getPantryItem = (item: { pantryItemId: number }) =>
    pantryItemById.get(item.pantryItemId)!;

  let entrees = !shoppingCartItem.isDrinkOnly
    ? dailyMenu.items.filter(
        (item) => getPantryItem(item).type === PantryItemType.ENTREE
      )
    : [];
  if (!shoppingCartItem.isDrinkOnly && entrees.length > 1) {
    entrees = entrees.filter((entree) =>
      shoppingCartItem.selectedMenuItemIds.includes(entree.id)
    );
  }

  let sides = !shoppingCartItem.isDrinkOnly
    ? dailyMenu.items.filter(
        (item) => getPantryItem(item).type === PantryItemType.SIDE
      )
    : [];
  if (
    !shoppingCartItem.isDrinkOnly &&
    sides.length > 1 &&
    dailyMenu.numSidesWithMeal &&
    dailyMenu.numSidesWithMeal < sides.length
  ) {
    sides = sides.filter((side) =>
      shoppingCartItem.selectedMenuItemIds.includes(side.id)
    );
  }

  let desserts = !shoppingCartItem.isDrinkOnly
    ? dailyMenu.items.filter(
        (item) => getPantryItem(item).type === PantryItemType.DESSERT
      )
    : [];
  if (!shoppingCartItem.isDrinkOnly && desserts.length > 1) {
    desserts = desserts.filter((dessert) =>
      shoppingCartItem.selectedMenuItemIds.includes(dessert.id)
    );
  }

  let drinks = dailyMenu.items.filter(
    (item) => getPantryItem(item).type === PantryItemType.DRINK
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
    .map((menuItem) => {
      const pantryItem = getPantryItem(menuItem);
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
        id: 0,
        price,
        pantryItemId: menuItem.pantryItemId,
      };
    });
};

const OrderRouter: Router = express.Router();
interface Empty {}

OrderRouter.post<Empty, Order | string, CheckoutRequest, Empty>(
  "/",
  async (req, res) => {
    if (req.body.cardId === "donate" && req.userStatus.role !== Role.ADMIN) {
      res.status(400).send("Only admins can donate");
      return;
    }

    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const pantryItemRepository = AppDataSource.getRepository(PantryItemEntity);

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

    const schoolYear = req.schoolYear!;
    const pantryItems = await pantryItemRepository.find({
      where: { school: { id: req.school.id } },
    });
    const pantryItemById = new Map(
      pantryItems.map((item) => [item.id, item])
    );

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
          req.body.cardId === "donate",
          pantryItemById
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
        ? Math.min(price, req.userStatus.availableCredits)
        : 0;
      price -= appliedCredits;

      if (price > 0) {
        let cardId = req.body.cardId;
        let customerId: string | undefined = undefined;

        try {
          const { paymentsApi, customersApi, cardsApi, giftCardsApi } =
            new Client({
              accessToken: req.school.squareAppAccessToken,
              environment: req.school.squareAppId.startsWith("sandbox")
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
              if (customerId.length) {
                req.user.paymentSysUserId = customerId;
                await AppDataSource.getRepository(UserEntity).save(req.user);
              }
            }

            if (req.body.isGiftCard) {
              const { result: createCardResponse } =
                await giftCardsApi.createGiftCard({
                  idempotencyKey: randomUUID(),
                  locationId: req.school.squareLocationId,
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
            locationId: req.school.squareLocationId,
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
      date: DateTimeUtils.toString(DateTimeUtils.getCurrentDate()),
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
      req.userStatus.availableCredits -= appliedCredits;
      await saveUserStatus(req.userStatus);
    }

    const savedOrder = await orderRepository.save(orderEntity);

    savedOrder.user = req.user;

    if (req.body.emailReceipt) {
      try {
        const orderWithDetails = await orderRepository.findOne({
          where: { id: savedOrder.id },
          relations: {
            meals: {
              student: true,
              staffMember: true,
              items: {
                pantryItem: true,
              },
            },
          },
        });

        if (orderWithDetails) {
          const receiptMeals = orderWithDetails.meals.map((meal) => {
            const orderedFor = meal.student
              ? `${meal.student.firstName} ${meal.student.lastName}`.trim() ||
                meal.student.name
              : meal.staffMember
                ? `${meal.staffMember.firstName} ${meal.staffMember.lastName}`.trim() ||
                  meal.staffMember.name
                : "Unknown";
            const items = (meal.items ?? []).map((item) => ({
              name: item.pantryItem?.name ?? "Item",
              price: item.price,
            }));
            const total = items.reduce((sum, item) => sum + item.price, 0);
            return {
              date: DateTimeUtils.toString(meal.date, DateTimeFormat.SHORT_DESC),
              orderedFor,
              total,
              items,
            };
          });

          await sendOrderReceiptEmail(
            req.user.userName,
            receiptMeals,
            req.school.name,
          );
        }
      } catch (error) {
        console.error("Failed to send order receipt email:", error);
      }
    }

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
    if (order.user.id !== req.user.id && req.userStatus.role !== Role.ADMIN) {
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
        req.userStatus.availableCredits += cost;
        await saveUserStatus(req.userStatus);
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
      availableCredits: req.userStatus.availableCredits,
    });
  } catch (error) {
    res.status(500).send("Error cancelling order");
  }
});

export default OrderRouter;
