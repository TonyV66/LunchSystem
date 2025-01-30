import { Entity, ManyToOne, OneToMany } from "typeorm";
import { MealItemEntity } from "./MenuEntity";
import StudentEntity from "./StudentEntity";
import { OrderEntity } from "./OrderEntity";
import Meal from "../models/Meal";

@Entity('meal')
export default class MealEntity extends Meal {
  @ManyToOne(() => StudentEntity, (student) => student.meals)
  student: StudentEntity;
  @ManyToOne(() => OrderEntity, (order) => order.meals)
  order: OrderEntity;
  @OneToMany(() => MealItemEntity, (mealItem) => mealItem.meal, {cascade: true})
  items: MealItemEntity[];
}
