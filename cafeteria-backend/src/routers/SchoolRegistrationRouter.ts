import express, { Router } from "express";
import { randomUUID } from "crypto";
import { AppDataSource } from "../data-source";
import { Credentials, LoginResponse } from "./LoginRouter";
import UserEntity from "../entity/UserEntity";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getCurrentSchoolYear, JWT_PRIVATE_KEY } from "./RouterUtils";
import { getSessionInfo } from "./SessionRouter";
import SchoolEntity from "../entity/SchoolEntity";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import UserStatusEntity from "../entity/UserStatusEntity";
import {
  createUserWithStatus,
  ensureUserStatus,
  getUserSchool,
  saveUserStatus,
} from "../utils/UserStatusUtils";
import { Role, AccountStatus } from "../models/User";
import {
  meetsPasswordRequirements,
  PASSWORD_REQUIREMENTS_ERROR,
} from "../utils/PasswordUtils";
import { sendInvitationEmail } from "../utils/EmailUtils";

const SchoolRegistrationRouter: Router = express.Router();
interface Empty {}

interface RegistrationRequest extends Credentials {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  schoolName: string;
}

// Function to generate a unique 6-character registration code
const generateUniqueRegistrationCode = async (): Promise<string> => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  // Characters allowed: A-Z (excluding I, O) and 2-9 (excluding 0, 1)
  const allowedChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (attempts < maxAttempts) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += allowedChars.charAt(
        Math.floor(Math.random() * allowedChars.length),
      );
    }

    // Check if this code already exists
    const existingSchool = await schoolRepository.findOne({
      where: { registrationCode: code },
    });

    if (!existingSchool) {
      return code;
    }

    attempts++;
  }

  throw new Error(
    "Unable to generate unique registration code after maximum attempts",
  );
};

SchoolRegistrationRouter.post<
  Empty,
  LoginResponse | string,
  RegistrationRequest,
  Empty
>("/", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  try {
    const registrationCode = await generateUniqueRegistrationCode();

    // Find the school by registration code
    const school = await schoolRepository.findOne({
      where: { registrationCode: registrationCode },
    });

    if (!school) {
      res.status(404).send("School not found.");
      return;
    }

    if (
      req.body.username.match(
        /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
      )
    ) {
      res.status(401).send("Invalid username.");
      return;
    }

    const existingUser = await userRepository.findOne({
      where: { userName: req.body.username.toLowerCase() },
    });

    if (existingUser) {
      res.status(401).send("Username already exists.");
      return;
    }

    if (!meetsPasswordRequirements(req.body.pwd)) {
      res.status(400).send(PASSWORD_REQUIREMENTS_ERROR);
      return;
    }

    const hash = bcrypt.hashSync(req.body.pwd, 5);

    const savedUser = await createUserWithStatus({
      userName: req.body.username.toLowerCase(),
      pwd: hash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || "",
      name: `${req.body.firstName} ${req.body.lastName}`.trim(),
      school,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
    });

    const jwtToken = jwt.sign({ userId: savedUser.id }, JWT_PRIVATE_KEY);
    const savedUserSchool = getUserSchool(savedUser);
    const sessionInfo = await getSessionInfo(
      savedUser,
      savedUserSchool,
      getCurrentSchoolYear(savedUserSchool),
    );

    res.send({
      ...sessionInfo,
      jwtToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Failed to create registration. Please try again.");
  }
});

SchoolRegistrationRouter.post<
  Empty,
  string,
  {
    username: string;
    schoolRegistrationCode?: string;
  },
  Empty
>("/parent", async (req, res) => {
  const username = (req.body.username ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    res.status(400).send("A valid email address must be provided.");
    return;
  }

  const userRepository = AppDataSource.getRepository(UserEntity);
  let savedUser = await userRepository.findOne({
    where: { userName: username },
    relations: { userStatuses: { school: true } },
  });

  const pendingFactsStatus = savedUser?.userStatuses?.find(
    (status) =>
      status.accountStatus === AccountStatus.PENDING &&
      !!status.school?.factsApiKey?.trim(),
  );

  if (pendingFactsStatus?.school) {
    let invitationId = pendingFactsStatus.invitationId;
    if (!invitationId) {
      invitationId = randomUUID();
      pendingFactsStatus.invitationId = invitationId;
      await saveUserStatus(pendingFactsStatus);
    }
    await sendInvitationEmail(username, pendingFactsStatus.school, invitationId);
    res.send("Registration request submitted. Please check your email.");
    return;
  }

  const schoolRegistrationCode = (req.body.schoolRegistrationCode ?? "").trim();
  if (!schoolRegistrationCode) {
    res.status(400).send("A school registration code must be provided.");
    return;
  }

  const schoolRepository = AppDataSource.getRepository(SchoolEntity);
  const school = await schoolRepository.findOne({
    where: { registrationCode: schoolRegistrationCode },
  });
  if (!school) {
    res.status(400).send("Invalid registration code.");
    return;
  }

  if (school.factsApiKey?.trim()) {
    const schoolLabel = school.name?.trim() || "This school";
    res
      .status(400)
      .send(
        `${schoolLabel} does not accept online registrations. Please contact school administration.`,
      );
    return;
  }

  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const currentSchoolYear = await schoolYearRepository.findOne({
    where: {
      school: { id: school.id },
      isCurrent: true,
    },
  });
  if (!currentSchoolYear) {
    res
      .status(400)
      .send(
        "Registration requests are not yet being accepted for the upcoming school year.",
      );
    return;
  }

  const existingStatus = await AppDataSource.getRepository(
    UserStatusEntity,
  ).findOne({
    where: {
      school: { id: school.id },
      user: { userName: username },
    },
    relations: { user: true },
  });

  if (existingStatus) {
    if (existingStatus.accountStatus === AccountStatus.PENDING) {
      await sendInvitationEmail(username, school, existingStatus.invitationId!);
      res.status(409).send("An invitation is already pending for this email. We have resent the invitation to your email address.");
    } else {
      res.status(409).send("A registered account already exists for the username provided.");
    }
    return;
  }

  const invitationId = randomUUID();

  if (savedUser) {
    await ensureUserStatus(savedUser, school, {
      role: Role.PARENT,
      accountStatus: AccountStatus.PENDING,
      invitationId,
    });
  } else {
    savedUser = await createUserWithStatus({
      userName: username,
      name: "",
      firstName: "",
      lastName: "",
      email: username,
      pwd: "",
      lunchTimes: [],
      school,
      role: Role.PARENT,
      accountStatus: AccountStatus.PENDING,
      availableCredits: 0,
      invitationId,
    });
  }

  await sendInvitationEmail(username, school, invitationId);

  res.send("Registration request submitted. Please check your email.");
});

const isUuidUserName = (userName: string) =>
  /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(
    userName,
  );

interface InvitationDetails {
  invitationId: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  needsUserName: boolean;
}

SchoolRegistrationRouter.get<
  { invitationId: string },
  InvitationDetails | string,
  Empty,
  Empty
>("/invitation/:invitationId", async (req, res) => {
  const invitationId = (req.params.invitationId ?? "").trim();
  if (!invitationId) {
    res.status(400).send("An invitation id must be provided.");
    return;
  }

  const pendingStatus = await AppDataSource.getRepository(
    UserStatusEntity,
  ).findOne({
    where: {
      invitationId,
      accountStatus: AccountStatus.PENDING,
    },
    relations: { user: true, school: true },
  });

  if (!pendingStatus?.user || !pendingStatus.school) {
    res.status(404).send("Invitation not found or already completed.");
    return;
  }

  const user = pendingStatus.user;
  res.send({
    invitationId,
    userName: user.userName,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    schoolName: pendingStatus.school.name,
    needsUserName: isUuidUserName(user.userName),
  });
});

SchoolRegistrationRouter.post<
  Empty,
  string,
  {
    invitationId: string;
    userName?: string;
    firstName: string;
    lastName: string;
    pwd: string;
  },
  Empty
>("/parent/complete", async (req, res) => {
  const invitationId = (req.body.invitationId ?? "").trim();
  if (!invitationId) {
    res.status(400).send("An invitation id must be provided.");
    return;
  }

  const firstName = (req.body.firstName ?? "").trim();
  const lastName = (req.body.lastName ?? "").trim();
  if (!firstName || !lastName) {
    res.status(400).send("First name and last name are required.");
    return;
  }

  if (!meetsPasswordRequirements(req.body.pwd)) {
    res.status(400).send(PASSWORD_REQUIREMENTS_ERROR);
    return;
  }

  const userStatusRepository = AppDataSource.getRepository(UserStatusEntity);
  const pendingStatus = await userStatusRepository.findOne({
    where: {
      invitationId,
      accountStatus: AccountStatus.PENDING,
    },
    relations: { user: true },
  });

  if (!pendingStatus?.user) {
    res.status(404).send("Invitation not found or already completed.");
    return;
  }

  const user = pendingStatus.user;
  if (user.pwd) {
    res.status(409).send("Registration has already been completed.");
    return;
  }

  const needsUserName = isUuidUserName(user.userName);
  if (needsUserName) {
    const newUserName = (req.body.userName ?? "").trim().toLowerCase();
    if (!newUserName) {
      res.status(400).send("A username must be provided.");
      return;
    }
    if (newUserName.includes("@")) {
      res.status(400).send("Username cannot contain '@'.");
      return;
    }
    if (isUuidUserName(newUserName)) {
      res.status(400).send("Invalid username.");
      return;
    }

    const existingUserName = await AppDataSource.getRepository(
      UserEntity,
    ).findOne({
      where: { userName: newUserName },
    });
    if (existingUserName && existingUserName.id !== user.id) {
      res.status(409).send("Username already exists.");
      return;
    }
    user.userName = newUserName;
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.name = `${firstName} ${lastName}`.trim();
  user.pwd = bcrypt.hashSync(req.body.pwd, 5);
  await AppDataSource.getRepository(UserEntity).save(user);

  pendingStatus.accountStatus = AccountStatus.ACTIVE;
  await saveUserStatus(pendingStatus);

  res.send("Registration complete. You can now log in.");
});

export default SchoolRegistrationRouter;
