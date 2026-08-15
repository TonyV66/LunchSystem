import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DecimalTransformer } from "./DecimalTransformer";
import MealEntity from "./MealEntity";
import PantryItemEntity from "./PantryItemEntity";

@Entity("meal_item")
export default class MealItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  price: number;
  @Column()
  pantryItemId: number;
  @ManyToOne(() => PantryItemEntity, (pantryItem) => pantryItem.mealItems)
  @JoinColumn({ name: "pantryItemId" })
  pantryItem: PantryItemEntity;
  @ManyToOne(() => MealEntity, (meal) => meal.items)
  meal: MealEntity;
}
