import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";

@Entity("unit_of_measure")
export default class UnitOfMeasureEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => SchoolEntity, (school) => school.unitsOfMeasure, {
    onDelete: "CASCADE",
  })
  school: SchoolEntity;
}
