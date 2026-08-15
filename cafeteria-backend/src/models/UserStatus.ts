import UserStatusEntity from "../entity/UserStatusEntity";
import { Role, AccountStatus } from "./User";

export default class UserStatus {
  id: number;
  accountStatus: AccountStatus;
  role: Role;
  availableCredits: number;
  surveyCompleted: boolean;
  factsId: number | null;
  invitationId: string | null;
  userId: number;
  schoolId: number;

  constructor(entity: UserStatusEntity) {
    this.id = entity.id;
    this.accountStatus = entity.accountStatus;
    this.role = entity.role;
    this.availableCredits = entity.availableCredits;
    this.surveyCompleted = entity.surveyCompleted;
    this.factsId = entity.factsId;
    this.invitationId = entity.invitationId;
    this.userId = entity.user?.id;
    this.schoolId = entity.school?.id;
  }
}
