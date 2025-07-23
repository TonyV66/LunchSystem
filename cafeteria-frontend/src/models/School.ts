export default interface School {
  name: string;
  registrationCode: string;
  openRegistration: boolean;
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
  squareAppAccessToken: string;
  squareLocationId: string;
}
