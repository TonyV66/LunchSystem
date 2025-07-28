export default interface School {
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
}
