import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { Role } from "../models/User";
import MealEntity from "../entity/MealEntity";
import { OrderEntity } from "../entity/OrderEntity";
import MealItemEntity from "../entity/MealItemEntity";
import { Order } from "../models/Order";
import { RefundType } from "../models/RefundType";
import { saveUserStatus } from "../utils/UserStatusUtils";

const MealRouter: Router = express.Router();
interface Empty {}


MealRouter.put<
  { id: string },
  {order: Order, availableCredits: number} | string,
  { issueCredits: boolean },
  Empty
>("/:id/cancel", async (req, res) => {
  const mealRepository = AppDataSource.getRepository(MealEntity);
  const orderRepository = AppDataSource.getRepository(OrderEntity);
  const mealItemRepository = AppDataSource.getRepository(MealItemEntity);

  try {
    const meal = await mealRepository.findOne({
      where: { id: parseInt(req.params.id) },
      relations: { student: true, staffMember: true, items: true, order: { user: true } },
    });

    if (!meal) {
      res.status(404).send("Meal not found");
      return;
    }

    // Check if user owns the order containing this meal or is admin
    if (meal.order.user.id !== req.user.id && req.userStatus.role !== Role.ADMIN) {
      res.status(403).send("Unauthorized to cancel this meal");
      return;
    }

    // Check if meal is already cancelled
    if (meal.cancelled) {
      res.status(400).send("Meal is already cancelled");
      return;
    }

    // Update meal to cancelled
    meal.cancelled = true;
    meal.refundType = req.body.issueCredits ? RefundType.CREDIT : RefundType.NONE;
    await mealRepository.save(meal);

    // Apply credit if requested
    if (req.body.issueCredits) {
      const cost = meal.items.filter(item => item.price > 0).reduce((mealTotal, item) => {
        return mealTotal + item.price;
      }, 0);

      req.userStatus.availableCredits += cost;
      await saveUserStatus(req.userStatus);

      meal.order.appliedCredits = Math.min(0, meal.order.appliedCredits - cost);
      await orderRepository.save(meal.order);
    }

    const orderEntity = await orderRepository.findOne({
      where: { id: meal.order.id },
      relations: {
        user: true,
        meals: {
          student: true,
          staffMember: true,
          items: true,
        },
      },
    });

    res.send({
      order: new Order(orderEntity!),
      availableCredits: req.userStatus.availableCredits,
    });
  } catch (error) {
    res.status(500).send("Error cancelling meal");
  }
});

export default MealRouter;
