import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import {DecimalTransformer } from "./DecimalTransformer";

@Entity('system_defaults')
export default class SystemDefaultsEntity {
  @PrimaryGeneratedColumn()
  id: number;
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
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  mealPrice: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  drinkOnlyPrice: number;
  @Column()
  squareAppId: string;
  @Column()
  squareAppAccessToken: string;
  @Column()
  squareLocationId: string;
}
