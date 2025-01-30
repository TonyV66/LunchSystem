import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from "../entity/DecimalTransformer";

export default class Meal {
  @PrimaryGeneratedColumn()
  id: number;
  @Index()
  @Column()
  date: string;
}
