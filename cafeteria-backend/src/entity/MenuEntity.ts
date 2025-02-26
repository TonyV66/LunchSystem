import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import MealEntity from "./MealEntity";
import { PantryItemType } from "../models/Menu";
import { DecimalTransformer } from "./DecimalTransformer";
import SchoolEntity from "./SchoolEntity";
import SchoolYearEntity from "./SchoolYearEntity";

@Entity("pantry_item")
export class PantryItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "enum", enum: PantryItemType })
  type: PantryItemType;
  @ManyToOne(() => SchoolEntity, (school) => school.pantry)
  school: SchoolEntity;
}

@Entity("meal_item")
export class MealItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "enum", enum: PantryItemType })
  type: PantryItemType;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  price: number;
  @ManyToOne(() => MealEntity, (meal) => meal.items)
  meal: MealEntity;
}

@Entity("menu")
export default class MenuEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  showDessertAsSide: boolean;
  @Column()
  numSidesWithMeal: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  price: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  drinkOnlyPrice: number;
  @OneToMany(() => MenuItemEntity, (menuItem) => menuItem.menu, {
    cascade: true,
  })
  items: MenuItemEntity[];
  @ManyToOne(() => SchoolEntity, (school) => school.menus)
  school: SchoolEntity;
}

@Entity("daily_menu")
export class DailyMenuEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  showDessertAsSide: boolean;
  @Column()
  numSidesWithMeal: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  price: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  drinkOnlyPrice: number;
  @Column()
  date: string;
  @Column({ default: "2024-01-01 00:00:00" })
  orderStartTime: Date;
  @Column({ default: "2024-01-01 00:00:00" })
  orderEndTime: Date;
  @OneToMany(() => DailyMenuItemEntity, (menuItem) => menuItem.menu, {
    cascade: true,
  })
  items: DailyMenuItemEntity[];
  @ManyToOne(() => SchoolYearEntity, (schoolYear) => schoolYear.dailyMenus, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  schoolYear: SchoolYearEntity;
}

@Entity("menu_item")
export class MenuItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "enum", enum: PantryItemType })
  type: PantryItemType;
  @ManyToOne(() => MenuEntity, (menu) => menu.items, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  menu: MenuEntity;
}

@Entity("daily_menu_item")
export class DailyMenuItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "enum", enum: PantryItemType })
  type: PantryItemType;
  @ManyToOne(() => DailyMenuEntity, (menu) => menu.items, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  menu: DailyMenuEntity;
}
