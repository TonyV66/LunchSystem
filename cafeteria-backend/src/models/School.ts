import { Column, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from "../entity/DecimalTransformer";

export default class School {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  orderStartPeriodCount: number;
  @Column()
  orderStartPeriodType: number;
  @Column()
  orderStartRelativeTo: number;
  @Column()
  orderStartTime: string;
  @Column()
  orderEndPeriodCount: number;
  @Column()
  orderEndPeriodType: number;
  @Column()
  orderEndRelativeTo: number;
  @Column()
  orderEndTime: string;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  mealPrice: number;
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  drinkOnlyPrice: number;
  @Column()
  squareAppId: string;
  @Column()
  squareAppAccessToken: string;
  @Column()
  squareLocationId: string;
}
