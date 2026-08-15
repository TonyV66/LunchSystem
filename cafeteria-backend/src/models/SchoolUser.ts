import UserEntity from "../entity/UserEntity";
import UserStatusEntity from "../entity/UserStatusEntity";
import { Role, AccountStatus } from "./User";

export default class SchoolUser {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notificationReviewDate: Date;
  resetPwd: boolean;
  forgotPwdUri: string | null;
  forgotPwdDate: Date;
  userStatusId: number;
  accountStatus: AccountStatus;
  role: Role;
  availableCredits: number;
  surveyCompleted: boolean;
  factsId: number | null;
  schoolId: number;

  constructor(user: UserEntity, userStatus: UserStatusEntity) {
    this.id = user.id;
    this.userName = user.userName;
    this.pwd = user.pwd;
    this.name = user.name;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.phone = user.phone;
    this.notificationReviewDate = user.notificationReviewDate;
    this.resetPwd = user.resetPwd;
    this.forgotPwdUri = user.forgotPwdUri;
    this.forgotPwdDate = user.forgotPwdDate;
    this.userStatusId = userStatus.id;
    this.accountStatus = userStatus.accountStatus;
    this.role = userStatus.role;
    this.availableCredits = userStatus.availableCredits;
    this.surveyCompleted = userStatus.surveyCompleted;
    this.factsId = userStatus.factsId;
    this.schoolId = userStatus.school?.id ?? 0;
  }
}
