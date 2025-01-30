import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import MealEntity from "./MealEntity";
import UserEntity from "./UserEntity";
import { Order } from "../models/Order";

@Entity('order')
export class OrderEntity extends Order {
  @Column()
  lastMealDate: string;
  @OneToMany(() => MealEntity, (meal) => meal.order, {cascade: true})
  meals: MealEntity[];
  @ManyToOne(() => UserEntity, (user) => user.orders)
  user: UserEntity;
}