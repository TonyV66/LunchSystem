import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { Role } from "../models/User";
import MealEntity from "../entity/MealEntity";
import { OrderEntity } from "../entity/OrderEntity";
import MealItemEntity from "../entity/MealItemEntity";
import DailyMenuEntity from "../entity/DailyMenuEntity";
import { Order } from "../models/Order";
import { RefundType } from "../models/RefundType";
import { saveUserStatus } from "../utils/UserStatusUtils";
import { authorizeUserWithRole } from "./RouterUtils";
import { getOrdersForMealDate } from "../utils/OrderQueryUtils";
import { DateTimeUtils } from "../DateTimeUtils";
import {
  getStudentsAssignedToLunchtimeTeacher,
  getStudentsForUserInSchoolYear,
} from "../utils/EnrollmentUtils";

const MealRouter: Router = express.Router();
interface Empty {}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

MealRouter.get<Empty, Order[] | string, Empty, { date?: string }>(
  "/",
  authorizeUserWithRole(
    Role.KITCHEN,
    Role.CAFETERIA,
    Role.ADMIN,
    Role.PRINCIPAL,
    Role.TEACHER,
  ),
  async (req, res) => {
    const date = typeof req.query.date === "string" ? req.query.date : "";
    if (!ISO_DATE.test(date)) {
      res.status(400).send("A date query parameter in YYYY-MM-DD format is required");
      return;
    }

    const schoolYearId = req.schoolYear?.id;
    if (!schoolYearId) {
      res.send([]);
      return;
    }

    const orders = await getOrdersForMealDate(schoolYearId, date);
    if (req.userStatus.role !== Role.TEACHER) {
      res.send(orders);
      return;
    }

    const [children, classroomStudents] = await Promise.all([
      getStudentsForUserInSchoolYear(req.user.id, schoolYearId),
      getStudentsAssignedToLunchtimeTeacher(req.user.id, schoolYearId),
    ]);
    const allowedStudentIds = new Set(
      children.concat(classroomStudents).map((student) => student.id),
    );
    res.send(
      orders
        .map((order) => ({
          ...order,
          meals: order.meals.filter(
            (meal) =>
              meal.staffMemberId === req.user.id ||
              (meal.studentId != null && allowedStudentIds.has(meal.studentId)),
          ),
        }))
        .filter((order) => order.meals.length > 0),
    );
  },
);

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

    const isAdmin = req.userStatus.role === Role.ADMIN;
    const isPurchaser = meal.order.user.id === req.user.id;

    if (!isPurchaser && !isAdmin) {
      res.status(403).send("Unauthorized to cancel this meal");
      return;
    }

    // Check if meal is already cancelled
    if (meal.cancelled) {
      res.status(400).send("Meal is already cancelled");
      return;
    }

    if (!isAdmin) {
      const schoolYearId = req.schoolYear?.id;
      const dailyMenu = schoolYearId
        ? await AppDataSource.getRepository(DailyMenuEntity).findOne({
            where: { date: meal.date, schoolYear: { id: schoolYearId } },
          })
        : null;
      const now = DateTimeUtils.getCurrentDate();
      if (
        !dailyMenu ||
        new Date(dailyMenu.orderStartTime) > now ||
        new Date(dailyMenu.orderEndTime) <= now
      ) {
        res
          .status(400)
          .send("Cancellations are no longer being accepted for this meal date");
        return;
      }
    }

    const issueCredits = isAdmin ? Boolean(req.body.issueCredits) : true;

    // Update meal to cancelled
    meal.cancelled = true;
    meal.refundType = issueCredits ? RefundType.CREDIT : RefundType.NONE;
    await mealRepository.save(meal);

    // Apply credit if requested
    if (issueCredits) {
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
