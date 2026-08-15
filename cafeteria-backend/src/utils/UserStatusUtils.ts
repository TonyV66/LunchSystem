import { DeepPartial } from "typeorm";
import { AppDataSource } from "../data-source";
import UserStatusEntity from "../entity/UserStatusEntity";
import SchoolEntity from "../entity/SchoolEntity";
import UserEntity from "../entity/UserEntity";
import { Role, AccountStatus } from "../models/User";

export type UserStatusFields = {
  school: SchoolEntity;
  role?: Role;
  accountStatus?: AccountStatus;
  availableCredits?: number;
  surveyCompleted?: boolean;
  factsId?: number | null;
  invitationId?: string | null;
};

//TODO: Fix assumption that there is only one user status per user.
export const getUserStatus = (
  user: UserEntity,
): UserStatusEntity | undefined => {
  return user.userStatuses?.[0];
};

export const requireUserStatus = (user: UserEntity): UserStatusEntity => {
  const userStatus = getUserStatus(user);
  if (!userStatus) {
    throw new Error(`No user status found for user ${user.id}`);
  }
  return userStatus;
};

export const getUserSchool = (user: UserEntity): SchoolEntity => {
  const school = getUserStatus(user)?.school;
  if (!school) {
    throw new Error(`No school found for user ${user.id}`);
  }
  return school;
};

const attachUserStatus = (user: UserEntity, userStatus: UserStatusEntity) => {
  user.userStatuses = [userStatus];
};

/** Invitation ids only apply while status is PENDING. */
const clearInvitationIdIfNotPending = (
  userStatus: Pick<UserStatusEntity, "accountStatus" | "invitationId">,
) => {
  if (userStatus.accountStatus !== AccountStatus.PENDING) {
    userStatus.invitationId = null;
  }
};

export const saveUserStatus = async (
  userStatus: UserStatusEntity,
): Promise<UserStatusEntity> => {
  clearInvitationIdIfNotPending(userStatus);
  return AppDataSource.getRepository(UserStatusEntity).save(userStatus);
};

export const createUserWithStatus = async (
  userData: DeepPartial<UserEntity> & UserStatusFields,
): Promise<UserEntity> => {
  const {
    school,
    role = Role.PARENT,
    accountStatus = AccountStatus.PENDING,
    availableCredits = 0,
    surveyCompleted = false,
    factsId = null,
    invitationId = null,
    ...userFields
  } = userData;

  const userRepository = AppDataSource.getRepository(UserEntity);
  const userStatusRepository = AppDataSource.getRepository(UserStatusEntity);

  const savedUser = await userRepository.save(userFields);
  const statusFields = {
    user: savedUser,
    school,
    role,
    accountStatus,
    availableCredits,
    surveyCompleted,
    factsId,
    invitationId,
  };
  clearInvitationIdIfNotPending(statusFields);
  const userStatus = await userStatusRepository.save(statusFields);

  attachUserStatus(savedUser, {
    ...userStatus,
    school,
    user: savedUser,
  });

  return savedUser;
};

export const ensureUserStatus = async (
  user: UserEntity,
  school: SchoolEntity,
  fields: Omit<UserStatusFields, "school"> = {},
): Promise<UserStatusEntity> => {
  const userStatusRepository = AppDataSource.getRepository(UserStatusEntity);

  let userStatus =
    user.userStatuses?.find((status) => status.school?.id === school.id) ??
    (await userStatusRepository.findOne({
      where: {
        user: { id: user.id },
        school: { id: school.id },
      },
      relations: { school: true },
    })) ??
    undefined;

  if (userStatus) {
    if (fields.role !== undefined) {
      userStatus.role = fields.role;
    }
    if (fields.accountStatus !== undefined) {
      userStatus.accountStatus = fields.accountStatus;
    }
    if (fields.availableCredits !== undefined) {
      userStatus.availableCredits = fields.availableCredits;
    }
    if (fields.surveyCompleted !== undefined) {
      userStatus.surveyCompleted = fields.surveyCompleted;
    }
    if (fields.factsId !== undefined) {
      userStatus.factsId = fields.factsId;
    }
    if (fields.invitationId !== undefined) {
      userStatus.invitationId = fields.invitationId;
    }
    const saved = await saveUserStatus(userStatus);
    attachUserStatus(user, { ...saved, school });
    return saved;
  }

  const createdFields = {
    user,
    school,
    role: fields.role ?? Role.PARENT,
    accountStatus: fields.accountStatus ?? AccountStatus.PENDING,
    availableCredits: fields.availableCredits ?? 0,
    surveyCompleted: fields.surveyCompleted ?? false,
    factsId: fields.factsId ?? null,
    invitationId: fields.invitationId ?? null,
  };
  clearInvitationIdIfNotPending(createdFields);
  const created = await userStatusRepository.save(createdFields);
  attachUserStatus(user, { ...created, school, user });
  return created;
};
