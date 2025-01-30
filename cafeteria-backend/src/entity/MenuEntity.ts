import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import MealEntity from "./MealEntity";
import { Menu, DailyMenu, PantryItem, MealItem } from "../models/Menu";
import { DecimalTransformer } from "./DecimalTransformer";


@Entity('pantry_item')
export class PantryItemEntity extends PantryItem {
}

@Entity('meal_item')
export class MealItemEntity extends MealItem {
  @ManyToOne(() => MealEntity, (meal) => meal.items)
  meal: MealEntity
}

@Entity('menu')
export default class MenuEntity extends Menu {
  @OneToMany(() => MenuItemEntity, (menuItem) => menuItem.menu, {cascade: true})
  items: MenuItemEntity[];
}

@Entity('daily_menu')
export class DailyMenuEntity extends DailyMenu {
  @OneToMany(() => DailyMenuItemEntity, (menuItem) => menuItem.menu, {cascade: true})
  items: DailyMenuItemEntity[];
}

@Entity('menu_item')
export class MenuItemEntity extends PantryItem {
  @ManyToOne(() => MenuEntity, (menu) => menu.items, {onDelete: 'CASCADE', orphanedRowAction: 'delete'})
  menu: MenuEntity
}

@Entity('daily_menu_item')
export class DailyMenuItemEntity extends PantryItem {
  @ManyToOne(() => DailyMenuEntity, (menu) => menu.items, {onDelete: 'CASCADE', orphanedRowAction: 'delete'})
  menu: DailyMenuEntity
}
