import { Role, AccountStatus } from "./User";

export const NULL_SCHOOL_USER: SchoolUser = {
  id: 0,
  userName: "",
  pwd: "",
  name: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notificationReviewDate: new Date("2020-01-01 00:00:00").toJSON(),
  resetPwd: false,
  forgotPwdUri: null,
  forgotPwdDate: null,
  userStatusId: 0,
  accountStatus: AccountStatus.ACTIVE,
  role: Role.PARENT,
  availableCredits: 0,
  surveyCompleted: false,
  factsId: null,
  schoolId: 0,
};

export default interface SchoolUser {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notificationReviewDate: string;
  resetPwd: boolean;
  forgotPwdUri: string | null;
  forgotPwdDate: string | null;
  userStatusId: number;
  accountStatus: AccountStatus;
  role: Role;
  availableCredits: number;
  surveyCompleted: boolean;
  factsId: number | null;
  schoolId: number;
}
