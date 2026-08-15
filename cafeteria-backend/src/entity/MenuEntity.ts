import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DecimalTransformer } from "./DecimalTransformer";
import SchoolEntity from "./SchoolEntity";
import MenuItemEntity from "./MenuItemEntity";

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
