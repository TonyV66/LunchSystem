import UserEntity from "../entity/UserEntity";

export enum Role {
  ADMIN,
  TEACHER,
  PARENT,
  CAFETERIA,
  STAFF,
}

export default class User {
  id: number;
  userName: string;
  pwd: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  description: string;
  role: Role;
  notificationReviewDate: Date;
  resetPwd: boolean;
  forgotPwdUri: string | null;
  forgotPwdDate: Date;

  constructor(entity: UserEntity) {
    this.id = entity.id;
    this.userName = entity.userName;
    this.pwd = entity.pwd;
    this.name = entity.name;
    this.firstName = entity.firstName;
    this.lastName = entity.lastName;
    this.email = entity.email;
    this.phone = entity.phone;
    this.description = entity.description;
    this.role = entity.role;
    this.notificationReviewDate = entity.notificationReviewDate;
    this.resetPwd = entity.resetPwd;
    this.forgotPwdUri = entity.forgotPwdUri;
    this.forgotPwdDate = entity.forgotPwdDate;
  }
}
