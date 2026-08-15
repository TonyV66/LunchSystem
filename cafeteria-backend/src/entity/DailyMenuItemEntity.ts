import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DecimalTransformer } from "./DecimalTransformer";
import DailyMenuEntity from "./DailyMenuEntity";
import PantryItemEntity from "./PantryItemEntity";

@Entity("daily_menu_item")
export default class DailyMenuItemEntity {
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
  @ManyToOne(() => PantryItemEntity, (pantryItem) => pantryItem.dailyMenuItems)
  @JoinColumn({ name: "pantryItemId" })
  pantryItem: PantryItemEntity;
  @ManyToOne(() => DailyMenuEntity, (menu) => menu.items, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  menu: DailyMenuEntity;
}
