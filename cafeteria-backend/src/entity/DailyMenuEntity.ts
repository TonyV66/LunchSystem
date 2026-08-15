import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DecimalTransformer } from "./DecimalTransformer";
import SchoolYearEntity from "./SchoolYearEntity";
import DailyMenuItemEntity from "./DailyMenuItemEntity";

@Entity("daily_menu")
export default class DailyMenuEntity {
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
