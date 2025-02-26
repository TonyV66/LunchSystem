import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MealItemEntity } from "./MenuEntity";
import StudentEntity from "./StudentEntity";
import { OrderEntity } from "./OrderEntity";
import Meal from "../models/Meal";

@Entity('meal')
export default class MealEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Index()
  @Column()
  date: string;
  @OneToMany(() => MealItemEntity, (mealItem) => mealItem.meal, {cascade: true})
  items: MealItemEntity[];
  @ManyToOne(() => StudentEntity, (student) => student.meals)
  student: StudentEntity;
  @ManyToOne(() => OrderEntity, (order) => order.meals)
  order: OrderEntity;
}
