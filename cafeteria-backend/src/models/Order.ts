import { Column, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from "../entity/DecimalTransformer";

export class Order {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  date: string;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  taxes: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  processingFee: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0, transformer: new DecimalTransformer() })
  otherFees: number;
}