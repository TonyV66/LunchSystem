import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import MealEntity from "./MealEntity";
import UserEntity from "./UserEntity";
import { DecimalTransformer } from "./DecimalTransformer";
import SchoolYearEntity from "./SchoolYearEntity";

@Entity("order")
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  date: string;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  taxes: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  processingFee: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  otherFees: number;
  @Column()
  lastMealDate: string;
  @OneToMany(() => MealEntity, (meal) => meal.order, { cascade: true })
  meals: MealEntity[];
  @ManyToOne(() => UserEntity, (user) => user.orders)
  user: UserEntity;
  @ManyToOne(() => SchoolYearEntity, (schoolYear) => schoolYear.orders, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  schoolYear: SchoolYearEntity;
}
