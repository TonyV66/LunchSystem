import SchoolEntity from "../entity/SchoolEntity";

export default class School {
  name: string;
  registrationCode: string;
  openRegistration: boolean;
  orderStartPeriodCount: number;
  orderStartRelativeTo: number;
  orderStartTime: string;
  orderEndPeriodCount: number;
  orderEndRelativeTo: number;
  orderEndTime: string;
  emailReportStartPeriodCount: number;
  emailReportStartPeriodType: number;
  emailReportStartRelativeTo: number;
  emailReportStartTime: string;
  timezone: string;
  mealPrice: number;
  drinkOnlyPrice: number;
  squareAppId: string;
  squareAppAccessToken: string;
  squareLocationId: string;

  constructor(entity: SchoolEntity) {
    this.name = entity.name;
    this.registrationCode = entity.registrationCode;
    this.openRegistration = entity.openRegistration;
    this.orderStartPeriodCount = entity.orderStartPeriodCount;
    this.orderStartRelativeTo = entity.orderStartRelativeTo;
    this.orderStartTime = entity.orderStartTime;
    this.orderEndPeriodCount = entity.orderEndPeriodCount;
    this.orderEndRelativeTo = entity.orderEndRelativeTo;
    this.orderEndTime = entity.orderEndTime;
    this.emailReportStartPeriodCount = entity.emailReportStartPeriodCount;
    this.emailReportStartPeriodType = entity.emailReportStartPeriodType;
    this.emailReportStartRelativeTo = entity.emailReportStartRelativeTo;
    this.emailReportStartTime = entity.emailReportStartTime;
    this.timezone = entity.timezone;
    this.mealPrice = entity.mealPrice;
    this.drinkOnlyPrice = entity.drinkOnlyPrice;
    this.squareAppId = entity.squareAppId;
    this.squareAppAccessToken = entity.squareAppAccessToken;
    this.squareLocationId = entity.squareLocationId;
  }
}
