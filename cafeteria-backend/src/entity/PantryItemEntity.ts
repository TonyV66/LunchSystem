import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PantryItemType } from "../models/PantryItemType";
import { DecimalTransformer } from "./DecimalTransformer";
import SchoolEntity from "./SchoolEntity";
import RecipeItemEntity from "./RecipeItemEntity";
import MenuItemEntity from "./MenuItemEntity";
import MealItemEntity from "./MealItemEntity";
import DailyMenuItemEntity from "./DailyMenuItemEntity";

@Entity("pantry_item")
export default class PantryItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "enum", enum: PantryItemType })
  type: PantryItemType;
  @Column({ type: "int", default: 1 })
  recipeServingSize: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  price: number;
  @Column({ nullable: false, default: false })
  archived: boolean;
  @OneToMany(() => RecipeItemEntity, (recipeItem) => recipeItem.pantryItem, {
    cascade: true,
  })
  recipeItems: RecipeItemEntity[];
  @OneToMany(() => MenuItemEntity, (menuItem) => menuItem.pantryItem)
  menuItems: MenuItemEntity[];
  @OneToMany(() => MealItemEntity, (mealItem) => mealItem.pantryItem)
  mealItems: MealItemEntity[];
  @OneToMany(() => DailyMenuItemEntity, (dailyMenuItem) => dailyMenuItem.pantryItem)
  dailyMenuItems: DailyMenuItemEntity[];
  @ManyToOne(() => SchoolEntity, (school) => school.pantry)
  school: SchoolEntity;
}
