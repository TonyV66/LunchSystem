import express, { Router } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { In, Not } from "typeorm";
import UserEntity from "../entity/UserEntity";
import User, { Role, AccountStatus, isFactsUserRole } from "../models/User";
import SchoolUser from "../models/SchoolUser";
import { authorizeUserWithRole } from "./RouterUtils";

import CreditCard from "../models/CreditCard";
import { Client, Environment } from "square";
import { GiftCard } from "../models/GiftCard";
import { randomUUID } from "crypto";
import Student from "../models/Student";
import StudentEntity from "../entity/StudentEntity";
import {
  sendInvitationEmail,
  sendSchoolAccessGrantedEmail,
} from "../utils/EmailUtils";
import multer from "multer";
import UserStatusEntity from "../entity/UserStatusEntity";
import {
  createUserWithStatus,
  ensureUserStatus,
  getUserStatus,
  requireUserStatus,
  saveUserStatus,
} from "../utils/UserStatusUtils";
import {
  ensureEnrollment,
  getStudentsForUserInSchoolYear,
  getStudentsWithEnrollmentHistoryForUserAtSchool,
  removeEnrollment,
} from "../utils/EnrollmentUtils";
import {
  meetsPasswordRequirements,
  PASSWORD_REQUIREMENTS_ERROR,
} from "../utils/PasswordUtils";
import {
  CsvImportValidationError,
  importStaffFromCsv,
  importStudentsFromCsv,
} from "../services/CsvImportService";

const UserRouter: Router = express.Router();
interface Empty {}

interface SavedCards {
  creditCards: CreditCard[];
  giftCards: GiftCard[];
}

interface InvitationRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: number;
  userName?: string;
  pwd?: string;
}

interface UpdateUserRequest extends User {
  role: Role;
  accountStatus: AccountStatus;
  availableCredits: number;
  surveyCompleted: boolean;
  factsId: number | null;
}

const toSchoolUser = (user: UserEntity): SchoolUser => {
  return new SchoolUser(user, requireUserStatus(user));
};

UserRouter.post<Empty, Empty, InvitationRequest, Empty>(
  "/invite",
  authorizeUserWithRole(),
  async (req, res) => {
    const role = req.body.role as Role;

    const isFactsRole = isFactsUserRole(role);

    const email = req.body.email.toLowerCase();
    let userName = email;
    const userNameProvided = !!req.body.userName;
    let invitationId = randomUUID();

    if (isFactsRole) {
      if (!req.school.factsApiKey) {
        res
          .status(400)
          .send(
            "Cannot invite parents, teachers, or staff for FACTS-linked schools.",
          );
        return;
      }
      if (userNameProvided) {
        res
          .status(400)
          .send(
            "Username cannot be provided for parent, teacher, or staff invites.",
          );
        return;
      }
    } else {
      if (userNameProvided) {
        userName = req.body.userName!.toLowerCase();
        if (userName.includes("@")) {
          res.status(400).send("Username cannot contain '@'.");
          return;
        }
        if (!req.body.pwd) {
          res
            .status(400)
            .send("Password is required when a username is provided.");
          return;
        }
      } else {
        userName = invitationId;
      }
    }

    const existingStatus = await AppDataSource.getRepository(
      UserStatusEntity,
    ).findOne({
      where: isFactsRole
        ? {
            school: { id: req.school.id },
            user: { userName },
          }
        : {
            school: { id: req.school.id },
            user: userNameProvided
              ? { userName }
              : { email },
            role: Not(In([Role.PARENT, Role.TEACHER, Role.STAFF])),
          },
      relations: { user: true },
    });

    if (existingStatus) {
      if (
        existingStatus.accountStatus === AccountStatus.PENDING ||
        existingStatus.accountStatus === AccountStatus.INACTIVE
      ) {
        const userHasPassword = !!existingStatus.user.pwd;
        existingStatus.accountStatus = userHasPassword
          ? AccountStatus.ACTIVE
          : AccountStatus.PENDING;
        existingStatus.invitationId = invitationId;
        await saveUserStatus(existingStatus);
        if (userHasPassword) {
          await sendSchoolAccessGrantedEmail(
            email,
            req.school,
          );
        } else {
          await sendInvitationEmail(
            email,
            req.school,
            invitationId,
          );
        }
        const userRepository = AppDataSource.getRepository(UserEntity);
        const existingUser = await userRepository.findOne({
          where: { id: existingStatus.user.id },
          relations: {
            userStatuses: {
              school: true,
            },
          },
        });
        res.send(toSchoolUser(existingUser!));
        return;
      }

      res.status(409).send("User already has an active account.");
      return;
    }

    const currentSchoolYear = req.schoolYear;
    if (isFactsRole && !currentSchoolYear) {
      res
        .status(400)
        .send("Invitations are not available. No active school year found.");
      return;
    }

    const userRepository = AppDataSource.getRepository(UserEntity);
    let savedUser = await userRepository.findOne({
      where: isFactsRole ? [{ email }, { userName: email }] : { userName },
    });

    if (savedUser && req.body.userName && !isFactsRole) {
      res.status(409).send("Username already exists.");
      return;
    }

    const userHasPassword = !!savedUser?.pwd;
    const accountStatus = req.body.userName
      ? AccountStatus.ACTIVE
      : isFactsRole && userHasPassword
        ? AccountStatus.ACTIVE
        : AccountStatus.PENDING;

    if (savedUser) {
      await ensureUserStatus(savedUser, req.school, {
        role,
        accountStatus,
        availableCredits: 0,
        invitationId,
      });
    } else {
      savedUser = await createUserWithStatus({
        userName,
        name: "",
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email,
        pwd: req.body.userName ? bcrypt.hashSync(req.body.pwd!, 5) : "",
        lunchTimes: [],
        school: req.school,
        role,
        accountStatus,
        availableCredits: 0,
        invitationId,
      });
    }

    if (isFactsRole && userHasPassword) {
      await sendSchoolAccessGrantedEmail(
        email,
        req.school,
      );
    } else if (!req.body.userName) {
      await sendInvitationEmail(
        req.body.email,
        req.school,
        invitationId,
      );
    }

    res.send(toSchoolUser(savedUser));
  },
);

UserRouter.post<Empty, SchoolUser | string, UpdateUserRequest, Empty>(
  "/",
  authorizeUserWithRole(),
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    if (
      req.body.userName.match(
        /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
      )
    ) {
      res.status(401).send("Invalid username.");
      return;
    }

    const existingUser = await userRepository.findOne({
      where: { userName: req.body.userName.toLowerCase() },
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

    const {
      role,
      accountStatus,
      availableCredits,
      surveyCompleted,
      factsId,
      ...userBody
    } = req.body;

    const savedUser = await createUserWithStatus({
      ...userBody,
      id: undefined,
      pwd: hash,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || "",
      userName: req.body.userName.toLowerCase(),
      school: req.school,
      role,
      accountStatus,
      availableCredits,
      surveyCompleted,
      factsId,
    });

    res.send(toSchoolUser(savedUser));
  },
);

UserRouter.put<Empty, SchoolUser | string, UpdateUserRequest, Empty>(
  "/",
  authorizeUserWithRole(),
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    const user = await userRepository.findOne({
      where: {
        id: req.body.id,
      },
      relations: {
        userStatuses: {
          school: true,
        },
      },
    });

    if (!user) {
      res.status(401).send("User not found.");
      return;
    }

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.name = req.body.name;
    user.email = req.body.email.toLowerCase();
    user.phone = req.body.phone;
    user.userName = req.body.userName;
    if (req.body.pwd) {
      user.pwd = req.body.pwd;
    }

    const registration = requireUserStatus(user);
    if (isFactsUserRole(registration.role) !== isFactsUserRole(req.body.role)) {
      res
        .status(400)
        .send(
          "Cannot change role between parent/teacher/staff and other roles.",
        );
      return;
    }

    registration.role = req.body.role;
    registration.accountStatus = req.body.accountStatus;
    registration.surveyCompleted = req.body.surveyCompleted;
    registration.factsId = req.body.factsId;
    registration.availableCredits =
      req.userStatus.role === Role.ADMIN
        ? req.body.availableCredits
        : registration.availableCredits;

    const savedUser = await userRepository.save(user);
    await saveUserStatus(registration);
    res.send(toSchoolUser(savedUser));
  },
);

UserRouter.get<Empty, Empty, SavedCards[], Empty>(
  "/cards",
  authorizeUserWithRole(),
  async (req, res) => {
    if (req.userStatus.role === Role.ADMIN) {
      res.send({
        creditCards: [],
        giftCards: [],
      });
      return;
    }

    const { cardsApi } = new Client({
      accessToken: req.school.squareAppAccessToken,
      environment: req.school.squareAppId.startsWith("sandbox")
        ? Environment.Sandbox
        : Environment.Production,
    });

    const savedCards: SavedCards = {
      creditCards: [],
      giftCards: [],
    };

    if (req.user.paymentSysUserId && req.user.paymentSysUserId.length) {
      const response = await cardsApi.listCards(
        undefined,
        req.user.paymentSysUserId,
        false,
      );
      if (response.result.cards) {
        savedCards.creditCards = response.result.cards.map((card) => ({
          id: card.id!,
          cardBrand: card.cardBrand!,
          last4: card.last4!,
          expMonth: card.expMonth!.toString(),
          expYear: card.expYear!.toString(),
        }));
      }
    }

    res.send(savedCards);
  },
);

interface UserChildEnrollment {
  student: Student;
  enrolled: boolean;
}

interface UpdateUserEnrollmentsRequest {
  enrollments: Array<{ studentId: number; enrolled: boolean }>;
}

const toUserChildEnrollments = (
  students: StudentEntity[],
  userId: number,
): UserChildEnrollment[] => {
  const byStudentId = new Map<number, UserChildEnrollment>();
  for (const student of students) {
    if (byStudentId.has(student.id)) {
      continue;
    }
    byStudentId.set(student.id, {
      student: new Student(student),
      enrolled:
        student.enrollments?.some(
          (enrollment) => enrollment.user?.id === userId,
        ) ?? false,
    });
  }

  return Array.from(byStudentId.values()).sort((a, b) =>
    `${a.student.firstName} ${a.student.lastName}`.localeCompare(
      `${b.student.firstName} ${b.student.lastName}`,
    ),
  );
};

const requireFactsUserAtSchool = async (
  userId: number,
  schoolId: number,
): Promise<UserEntity | string> => {
  const user = await AppDataSource.getRepository(UserEntity).findOne({
    where: { id: userId },
    relations: {
      userStatuses: {
        school: true,
      },
    },
  });

  if (!user) {
    return "User not found.";
  }

  const status = user.userStatuses?.find(
    (userStatus) => userStatus.school?.id === schoolId,
  );
  if (!status || !isFactsUserRole(status.role)) {
    return "User is not a parent, teacher, or staff member at this school.";
  }

  return user;
};

UserRouter.get<
  { userId: string },
  UserChildEnrollment[] | string,
  Empty,
  Empty
>(
  "/:userId/enrollments",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const userId = parseInt(req.params.userId);
    const targetUser = await requireFactsUserAtSchool(userId, req.school.id);
    if (typeof targetUser === "string") {
      res.status(targetUser === "User not found." ? 404 : 400).send(targetUser);
      return;
    }

    const students = await getStudentsWithEnrollmentHistoryForUserAtSchool(
      userId,
      req.school.id,
      req.schoolYear?.id,
    );

    res.send(toUserChildEnrollments(students, userId));
  },
);

UserRouter.put<
  { userId: string },
  UserChildEnrollment[] | string,
  UpdateUserEnrollmentsRequest,
  Empty
>(
  "/:userId/enrollments",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const userId = parseInt(req.params.userId);
    const targetUser = await requireFactsUserAtSchool(userId, req.school.id);
    if (typeof targetUser === "string") {
      res.status(targetUser === "User not found." ? 404 : 400).send(targetUser);
      return;
    }

    const currentSchoolYear = req.schoolYear;
    if (!currentSchoolYear) {
      res.status(400).send("No current school year found.");
      return;
    }

    if (!Array.isArray(req.body.enrollments)) {
      res.status(400).send("enrollments is required.");
      return;
    }

    const historyStudents =
      await getStudentsWithEnrollmentHistoryForUserAtSchool(
        userId,
        req.school.id,
        currentSchoolYear.id,
      );
    const studentsById = new Map(
      historyStudents.map((student) => [student.id, student]),
    );

    const unseenStudentIds = [
      ...new Set(
        req.body.enrollments
          .map((enrollment) => enrollment.studentId)
          .filter((studentId) => !studentsById.has(studentId)),
      ),
    ];
    if (unseenStudentIds.length > 0) {
      const extraStudents = await AppDataSource.getRepository(
        StudentEntity,
      ).find({
        where: {
          id: In(unseenStudentIds),
          school: { id: req.school.id },
        },
      });
      for (const student of extraStudents) {
        studentsById.set(student.id, student);
      }
    }

    const seenStudentIds = new Set<number>();
    for (const enrollment of req.body.enrollments) {
      if (seenStudentIds.has(enrollment.studentId)) {
        res.status(400).send("Duplicate student in enrollment list.");
        return;
      }
      seenStudentIds.add(enrollment.studentId);

      const student = studentsById.get(enrollment.studentId);
      if (!student) {
        res.status(400).send("Student is not associated with this school.");
        return;
      }

      const currentlyEnrolled =
        student.enrollments?.some(
          (existing) => existing.user?.id === userId,
        ) ?? false;

      if (enrollment.enrolled && !currentlyEnrolled) {
        await ensureEnrollment(targetUser, student, currentSchoolYear);
      } else if (!enrollment.enrolled && currentlyEnrolled) {
        await removeEnrollment(targetUser, student, currentSchoolYear);
      }
    }

    const updatedStudents =
      await getStudentsWithEnrollmentHistoryForUserAtSchool(
        userId,
        req.school.id,
        currentSchoolYear.id,
      );

    res.send(toUserChildEnrollments(updatedStudents, userId));
  },
);

UserRouter.get<{ userId: string }, Student[] | string, Empty, Empty>(
  "/:userId/students",
  authorizeUserWithRole(),
  async (req, res) => {
    // Only allow users to access their own students or admins to access any user's students
    if (
      req.userStatus.role !== Role.ADMIN &&
      req.user.id !== parseInt(req.params.userId)
    ) {
      res
        .status(403)
        .send("Access denied. You can only view your own students.");
      return;
    }

    const schoolYearId = req.schoolYear?.id;
    if (!schoolYearId) {
      res.send([]);
      return;
    }

    const students = await getStudentsForUserInSchoolYear(
      parseInt(req.params.userId),
      schoolYearId,
    );

    res.send(students.map((student) => new Student(student)));
  },
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

UserRouter.post(
  "/import-staff-csv",
  authorizeUserWithRole(),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).send("No file uploaded");
        return;
      }

      const result = await importStaffFromCsv(req.file.buffer, req.school);
      res.send(result);
    } catch (error) {
      if (error instanceof CsvImportValidationError) {
        res.status(400).send(error.message);
        return;
      }
      console.error("Error importing staff CSV:", error);
      res.status(500).send("Error processing CSV file");
    }
  },
);

UserRouter.post(
  "/import-students-csv",
  authorizeUserWithRole(),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).send("No file uploaded");
        return;
      }

      const currentSchoolYear = req.schoolYear;
      if (!currentSchoolYear) {
        res.status(400).send("No current school year found");
        return;
      }

      const result = await importStudentsFromCsv(
        req.file.buffer,
        req.school,
        currentSchoolYear,
      );
      res.send(result);
    } catch (error) {
      if (error instanceof CsvImportValidationError) {
        res.status(400).send(error.message);
        return;
      }
      console.error("Error importing students CSV:", error);
      res.status(500).send("Error processing CSV file");
    }
  },
);

export default UserRouter;
