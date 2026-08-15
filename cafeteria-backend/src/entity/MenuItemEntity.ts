import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DecimalTransformer } from "./DecimalTransformer";
import MenuEntity from "./MenuEntity";
import PantryItemEntity from "./PantryItemEntity";

@Entity("menu_item")
export default class MenuItemEntity {
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
  @ManyToOne(() => PantryItemEntity, (pantryItem) => pantryItem.menuItems)
  @JoinColumn({ name: "pantryItemId" })
  pantryItem: PantryItemEntity;
  @ManyToOne(() => MenuEntity, (menu) => menu.items, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  menu: MenuEntity;
}
