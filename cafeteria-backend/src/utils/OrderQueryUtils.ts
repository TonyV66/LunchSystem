import { AppDataSource } from "../data-source";
import MealEntity from "../entity/MealEntity";
import { OrderEntity } from "../entity/OrderEntity";
import { Order } from "../models/Order";

export const getOrdersForMealDate = async (
  schoolYearId: number,
  date: string,
): Promise<Order[]> => {
  if (!schoolYearId || !date) {
    return [];
  }

  const mealRepository = AppDataSource.getRepository(MealEntity);
  const meals = await mealRepository.find({
    where: {
      date,
      order: { schoolYear: { id: schoolYearId } },
    },
    relations: {
      student: true,
      staffMember: true,
      items: true,
      order: { user: true },
    },
  });

  const ordersById = new Map<number, OrderEntity>();
  for (const meal of meals) {
    const orderEntity = meal.order;
    let grouped = ordersById.get(orderEntity.id);
    if (!grouped) {
      grouped = {
        ...orderEntity,
        meals: [],
      } as OrderEntity;
      ordersById.set(orderEntity.id, grouped);
    }
    grouped.meals.push(meal);
  }

  return Array.from(ordersById.values()).map((order) => new Order(order));
};
