import SchoolEntity from "../entity/SchoolEntity";

export default class School {
  orderStartPeriodCount: number;
  orderStartPeriodType: number;
  orderStartRelativeTo: number;
  orderStartTime: string;
  orderEndPeriodCount: number;
  orderEndPeriodType: number;
  orderEndRelativeTo: number;
  orderEndTime: string;
  mealPrice: number;
  drinkOnlyPrice: number;
  squareAppId: string;
  squareLocationId: string;

  constructor(entity: SchoolEntity) {
    this.orderStartPeriodCount = entity.orderStartPeriodCount;
    this.orderStartPeriodType = entity.orderStartPeriodType;
    this.orderStartRelativeTo = entity.orderStartRelativeTo;
    this.orderStartTime = entity.orderStartTime;
    this.orderEndPeriodCount = entity.orderEndPeriodCount;
    this.orderEndPeriodType = entity.orderEndPeriodType;
    this.orderEndRelativeTo = entity.orderEndRelativeTo;
    this.orderEndTime = entity.orderEndTime;
    this.mealPrice = entity.mealPrice;
    this.drinkOnlyPrice = entity.drinkOnlyPrice;
    this.squareAppId = entity.squareAppId;
    this.squareLocationId = entity.squareLocationId;
  }
}
