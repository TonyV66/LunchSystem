import express, { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SessionInfo, getSessionInfo } from "./SessionRouter";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import { JWT_PRIVATE_KEY, authorizeUserWithRole, getCurrentSchoolYear } from "./RouterUtils";
import { randomUUID } from "crypto";
import { sendForgotPasswordEmail } from "../utils/EmailUtils";
import { getUserSchool, saveUserStatus } from "../utils/UserStatusUtils";
import { AccountStatus, Role, isFactsUserRole } from "../models/User";
import EnrollmentEntity from "../entity/EnrollmentEntity";
import {
  meetsPasswordRequirements,
  PASSWORD_REQUIREMENTS_ERROR,
} from "../utils/PasswordUtils";

interface Empty {}

const LoginRouter: Router = express.Router();

export interface Credentials {
  username: string;
  pwd: string;
}

export interface LoginResponse extends SessionInfo {
  jwtToken: string;
}

const isFactsSchool = (school: { factsApiKey?: string | null } | undefined) =>
  !!school?.factsApiKey?.trim();

LoginRouter.post<
  {},
  {
    exists: boolean;
    hasPassword: boolean;
    allInactive: boolean;
    allActive: boolean;
    isFactsRegistrationPending: boolean;
  },
  { username: string },
  Empty
>("/pwd/verify", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const user = await userRepository.findOne({
    where: { userName: req.body.username.toLowerCase() },
    relations: { userStatuses: { school: true } },
  });

  const statuses = user?.userStatuses ?? [];
  res.send({
    exists: !!user,
    hasPassword: !!user?.pwd,
    allInactive:
      statuses.length > 0 &&
      statuses.every((status) => status.accountStatus === AccountStatus.INACTIVE),
    allActive:
      statuses.length > 0 &&
      statuses.every((status) => status.accountStatus === AccountStatus.ACTIVE),
    isFactsRegistrationPending:
      !!user &&
      statuses.some(
        (status) =>
          status.accountStatus === AccountStatus.PENDING &&
          isFactsSchool(status.school),
      ),
  });
});

LoginRouter.post<{}, {}, { username: string }, Empty>(
  "/pwd/forgot",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { userName: req.body.username.toLowerCase() },
      relations: { userStatuses: true },
    });

    if (!user) {
      res.status(401).send("Unknown username.");
      return;
    }

    let forgotPwdId = user.forgotPwdUri;
    if (!forgotPwdId || !forgotPwdId.length) {
      forgotPwdId = randomUUID();
      userRepository.update(user.id, { forgotPwdUri: forgotPwdId });
    }

    const hasFactsRole = (user.userStatuses ?? []).some((status) =>
      isFactsUserRole(status.role),
    );
    const toEmail = hasFactsRole ? user.userName : user.email;

    if (!toEmail) {
      res.status(401).send("No email address found.");
      return;
    }

    await sendForgotPasswordEmail(
      toEmail,
      forgotPwdId,
      user.firstName,
      user.lastName,
    );
    res.sendStatus(200);
  }
);

LoginRouter.put<
  {},
  {},
  { forgottenPwdId: string; userName: string; pwd: string },
  Empty
>("/pwd/reset", async (req, res) => {

  if (!req.body.forgottenPwdId) {
    res.status(401).send("Invalid or expired password reset request.");
    return;
  }

  const userRepository = AppDataSource.getRepository(UserEntity);
  const user = await userRepository.findOne({
    where: { userName: req.body.userName?.includes("@") ? req.body.userName.toLowerCase() : req.body.userName },
  });


  if (!user) {
    res.status(401).send("Unknown username.");
    return;
  }

  if (user.forgotPwdUri !== req.body.forgottenPwdId) {
    res.status(401).send("Invalid or expired password reset request.");
    return;
  }

  if (!meetsPasswordRequirements(req.body.pwd)) {
    res.status(400).send(PASSWORD_REQUIREMENTS_ERROR);
    return;
  }

  const hash = bcrypt.hashSync(req.body.pwd, 5);

  userRepository.update(user.id, { pwd: hash, forgotPwdUri: null });

  res.sendStatus(200);
});

LoginRouter.post<
  { invitationId: string },
  LoginResponse | string,
  Credentials,
  Empty
>("/:invitationId?", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const loginRequest = req.body;

  const invitationId = req.params.invitationId;

  if (
    invitationId &&
    !/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(
      invitationId,
    )
  ) {
    res.status(401).send("Invalid invitation.");
    return;
  }

  const user = await userRepository.findOne({
    where: { userName: invitationId ?? loginRequest.username.toLowerCase() },
    relations: {
      userStatuses: {
        school: { schoolYears: true },
      },
    },
  });

  if (!user) {
    res.status(401).send(invitationId ? "Invalid/stale invitation." : "Invalid username or password.");
    return;
  }

  if (!invitationId && !user.pwd) {
    const hasNonInactiveStatus = user.userStatuses?.some(
      (status) => status.accountStatus !== AccountStatus.INACTIVE,
    );
    if (!hasNonInactiveStatus) {
      res.status(401).send("Your account is currently inactive.");
      return;
    }
    res.status(401).send("Registration has not been completed.");
    return;
  }

  const hasUsableAccountStatus = user.userStatuses?.some(
    (status) =>
      status.accountStatus === AccountStatus.ACTIVE ||
      status.accountStatus === AccountStatus.PENDING,
  );
  if (!hasUsableAccountStatus) {
    res.status(401).send("Your account is currently inactive.");
    return;
  }

  const statuses = user.userStatuses ?? [];
  const parentStatuses = statuses.filter(
    (status) => status.role === Role.PARENT,
  );
  const isParentAtAllSchools =
    statuses.length > 0 && parentStatuses.length === statuses.length;

  if (isParentAtAllSchools) {
    type ActiveParentSchool = {
      school: NonNullable<(typeof parentStatuses)[number]["school"]>;
      schoolYearId: number;
    };

    const activeParentSchools: ActiveParentSchool[] = [];
    for (const status of parentStatuses) {
      const school = status.school;
      const activeYear = school?.schoolYears?.find(
        (schoolYear) => schoolYear.isCurrent,
      );
      if (school && activeYear) {
        activeParentSchools.push({ school, schoolYearId: activeYear.id });
      }
    }

    if (activeParentSchools.length === 0) {
      res.status(401).send("No active school year found.");
      return;
    }

    const enrollmentRepository = AppDataSource.getRepository(EnrollmentEntity);
    let hasEnrollment = false;
    for (const { schoolYearId } of activeParentSchools) {
      const enrollmentCount = await enrollmentRepository.count({
        where: {
          user: { id: user.id },
          schoolYear: { id: schoolYearId },
          active: true,
        },
      });
      if (enrollmentCount > 0) {
        hasEnrollment = true;
        break;
      }
    }

    if (!hasEnrollment) {
      res
        .status(401)
        .send("No student enrollments found for the active school year.");
      return;
    }
  }


  if (invitationId) {
    if (!loginRequest.username || !loginRequest.pwd) {
      res.status(401).send("Username and password are required.");
      return;
    }

    if (!meetsPasswordRequirements(loginRequest.pwd)) {
      res.status(400).send(PASSWORD_REQUIREMENTS_ERROR);
      return;
    }

    user.userName = loginRequest.username.toLowerCase();
    user.pwd = bcrypt.hashSync(loginRequest.pwd, 5);
    await userRepository.save(user);
  } else {
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(loginRequest.pwd, user.pwd);
    } catch (error) {
      res.status(401).send("Invalid username or password.");
      return;
    }
  
    if (!passwordMatch) {
      res.status(401).send("Invalid username or password.");
      return;
    }
  }

  for (const status of user.userStatuses ?? []) {
    if (status.accountStatus !== AccountStatus.PENDING) {
      continue;
    }
    status.accountStatus = AccountStatus.ACTIVE;
    await saveUserStatus(status);
  }

  const jwtToken = jwt.sign({ userId: user.id }, JWT_PRIVATE_KEY);
  const school = getUserSchool(user);
  const sessionInfo = await getSessionInfo(user, school, getCurrentSchoolYear(school));

  res.send({
    ...sessionInfo,
    jwtToken,
  });
});

LoginRouter.put<
  Empty,
  boolean | string,
  { oldPassword: string; newPassword: string },
  Empty
>("/pwd", authorizeUserWithRole(), async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const user = await userRepository.findOne({
    where: { id: req.user.id },
  });

  if (!user) {
    res.status(400).send("Unable to change password");
    return;
  }

  let passwordMatch = false;
  try {
    passwordMatch = await bcrypt.compare(req.body.oldPassword, user.pwd);
  } catch (error) {
    res.status(400).send("Unable to change password");
    return;
  }

  if (!passwordMatch) {
    res.status(400).send("Unable to change password");
    return;
  }

  if (!meetsPasswordRequirements(req.body.newPassword)) {
    res.status(400).send(PASSWORD_REQUIREMENTS_ERROR);
    return;
  }

  await userRepository.update(req.user.id, {
    pwd: bcrypt.hashSync(req.body.newPassword, 5),
  });
  res.send(true);
});

export default LoginRouter;
