import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";

@Entity("ingredient")
export default class IngredientEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => SchoolEntity, (school) => school.ingredients, {
    onDelete: "CASCADE",
  })
  school: SchoolEntity;
}
