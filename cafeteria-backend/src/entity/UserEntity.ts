import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderEntity } from "./OrderEntity";
import StudentEntity from "./StudentEntity";
import User, { Role } from "../models/User";

@Entity('user')
export default class UserEntity extends User {
  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];
  @OneToMany(() => StudentEntity, (student) => student.teacher)
  students: StudentEntity[];
  @OneToMany(() => StudentEntity, (student) => student.parent)
  children: StudentEntity[];
}
