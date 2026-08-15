import UnitOfMeasureEntity from "../entity/UnitOfMeasureEntity";

export default class UnitOfMeasure {
  id: number;
  name: string;

  constructor(entity: UnitOfMeasureEntity) {
    this.id = entity.id;
    this.name = entity.name;
  }
}
