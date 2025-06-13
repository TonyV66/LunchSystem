import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MealItemEntity } from "./MenuEntity";
import StudentEntity from "./StudentEntity";
import { OrderEntity } from "./OrderEntity";
import Meal from "../models/Meal";
import UserEntity from "./UserEntity";

@Entity('meal')
export default class MealEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Index()
  @Column()
  date: string;
  @Column({default: ''})
  time: string;
  @OneToMany(() => MealItemEntity, (mealItem) => mealItem.meal, {cascade: true})
  items: MealItemEntity[];
  @ManyToOne(() => StudentEntity, (student) => student.meals, {nullable: true})
  student: StudentEntity | null;
  @ManyToOne(() => UserEntity, (user) => user.meals, {nullable: true})
  staffMember: UserEntity | null;
  @ManyToOne(() => OrderEntity, (order) => order.meals)
  order: OrderEntity;
}
