import { Column, PrimaryGeneratedColumn } from "typeorm";
import Meal from "./Meal";
import { DecimalTransformer } from "../entity/DecimalTransformer";

export enum PantryItemType {
  ENTREE,
  SIDE,
  DESSERT,
  DRINK
}

export class Menu {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  showDessertAsSide: boolean;
  @Column()
  numSidesWithMeal: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  price: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  drinkOnlyPrice: number;
}

export class PantryItem {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({type: 'enum', enum: PantryItemType})
  type: PantryItemType;
}

export class MealItem extends PantryItem {
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  price: number;
}

export class DailyMenu extends Menu {
  @Column()
  date: string;
  @Column({default: '2024-01-01 00:00:00'})
  orderStartTime: Date;
  @Column({default: '2024-01-01 00:00:00'})
  orderEndTime: Date;

}