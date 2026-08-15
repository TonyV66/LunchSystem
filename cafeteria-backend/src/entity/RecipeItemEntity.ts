import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from "./DecimalTransformer";
import PantryItemEntity from "./PantryItemEntity";

@Entity("recipe_item")
export default class RecipeItemEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 1.0,
    transformer: new DecimalTransformer(),
  })
  qty: number;
  @Column({ type: "varchar", nullable: true })
  unitOfMeasure: string | null;
  @Column()
  description: string;
  @ManyToOne(() => PantryItemEntity, (pantryItem) => pantryItem.recipeItems, {
    onDelete: "CASCADE",
    orphanedRowAction: "delete",
  })
  pantryItem: PantryItemEntity;
}
