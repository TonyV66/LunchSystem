import express, { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { DeepPartial, In } from "typeorm";
import UserEntity from "../entity/UserEntity";
import User, { Role } from "../models/User";
import {
  authorizeRequest,
  getCurrentSchoolYear,
  JWT_PRIVATE_KEY,
} from "./RouterUtils";

import CreditCard from "../models/CreditCard";
import { Client, Environment } from "square";
import { GiftCard } from "../models/GiftCard";
import { randomUUID } from "crypto";
import Student from "../models/Student";
import { Credentials, LoginResponse } from "./LoginRouter";
import { getSessionInfo } from "./SessionRouter";
import { sendInvitationEmail } from "../utils/EmailUtils";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import SchoolEntity from "../entity/SchoolEntity";
import StudentEntity from "../entity/StudentEntity";
import { DateTimeUtils } from "../DateTimeUtils";

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
  sendInvitation?: boolean;
}

interface RegistrationRequest extends Credentials {
  schoolCode: string;
  firstName: string;
  lastName: string;
  email: string;
}

UserRouter.get<{ invitationId: string }, Empty, Empty, Empty>(
  "/invite/:invitationId",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const invitedUser = await userRepository.findOne({
      where: { userName: req.params.invitationId },
      relations: { students: true },
    });

    const students = invitedUser?.students ?? [];
    res.send({
      user: invitedUser ? new User(invitedUser) : null,
      students: students.map((s) => new Student(s)),
    });
  }
);

UserRouter.post<Empty, Empty, InvitationRequest, Empty>(
  "/invite",
  authorizeRequest,
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    const existingUser = await userRepository.findOne({
      where: { email: req.body.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(401).send("Email already exists.");
      return;
    }

    const user: DeepPartial<UserEntity> = {
      id: undefined,
      userName: randomUUID(),
      pending: true,
      name: "",
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email.toLowerCase(),
      pwd: "",
      lunchTimes: [],
      role: req.body.role as Role,
      school: req.user.school,
    };
    const savedUser = await userRepository.save(user);

    const currentSchoolYear = getCurrentSchoolYear(req.user.school);

    await AppDataSource.createQueryBuilder()
      .relation(SchoolYearEntity, "parents")
      .of(currentSchoolYear)
      .add(savedUser);

    // Only send invitation email if sendInvitation is true (defaults to true if not specified)
    if (req.body.sendInvitation !== false) {
      await sendInvitationEmail(
        req.body.email,
        req.body.firstName,
        req.body.lastName,
        req.user.school
      );
    }

    res.send(new User(savedUser));
  }
);

UserRouter.post<{}, LoginResponse | string, RegistrationRequest, {}>(
  "/register",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const schoolRepository = AppDataSource.getRepository(SchoolEntity);
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    const school = await schoolRepository.findOne({
      where: { registrationCode: req.body.schoolCode.toUpperCase() },
    });

    if (!school) {
      res.status(401).send("Invalid school code.");
      return;
    }

    // Check if there's a current school year and it hasn't ended
    const currentSchoolYear = await schoolYearRepository.findOne({
      where: {
        school: { id: school.id },
        isCurrent: true,
      },
    });

    if (!currentSchoolYear) {
      res
        .status(401)
        .send("Registration is not available. No current school year found.");
      return;
    }

    if (DateTimeUtils.toString(new Date()) > currentSchoolYear.endDate) {
      res
        .status(401)
        .send(
          "Registration is not available. The current school year has ended."
        );
      return;
    }

    if (
      await userRepository.findOne({
        where: {
          userName: req.body.username.toLowerCase(),
        },
      })
    ) {
      res.status(401).send("Username already exists.");
      return;
    }

    let user = await userRepository.findOne({
      where: {
        email: req.body.email.toLowerCase(),
        school: { id: school.id },
        pending: true,
      },
    });

    const hash = bcrypt.hashSync(req.body.pwd, 5);
    if (!school.openRegistration && !user) {
      res
        .status(401)
        .send(
          "Registration is not available. No invitation found. Please contact your school administrator."
        );
      return;
    }

    user = await userRepository.save({
      id: user?.id,
      userName: req.body.username.toLowerCase(),
      pwd: hash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email.toLowerCase(),
      pending: false,
      school: school,
    });

    // Associate the user with the current school year
    if (user) {
      const existingRelationships = await AppDataSource.createQueryBuilder()
        .relation(SchoolYearEntity, "parents")
        .of(currentSchoolYear)
        .loadMany();

      const relationshipExists = existingRelationships.some(
        (existingUser) => existingUser.id === user!.id
      );

      if (!relationshipExists) {
        await AppDataSource.createQueryBuilder()
          .relation(SchoolYearEntity, "parents")
          .of(currentSchoolYear)
          .add(user);
      }
    }

    user = await userRepository.findOne({
      where: { id: user.id },
      relations: {
        school: { schoolYears: true },
      },
    });

    const jwtToken = jwt.sign({ userId: user!.id }, JWT_PRIVATE_KEY);
    const sessionInfo = await getSessionInfo(user!);

    res.send({
      ...sessionInfo,
      jwtToken,
    });
  }
);

UserRouter.post<Empty, User | string, User, Empty>(
  "/",
  authorizeRequest,
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    if (
      req.body.userName.match(
        /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/
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

    const hash = bcrypt.hashSync(req.body.pwd, 5);

    const user: DeepPartial<UserEntity> = {
      ...req.body,
      id: undefined,
      pwd: hash,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone || "",
      school: req.user.school,
    };

    user.userName = user.userName?.toLowerCase();
    const savedUser = await userRepository.save(user);
    const currentSchoolYear = getCurrentSchoolYear(req.user.school);
    await AppDataSource.createQueryBuilder()
      .relation(SchoolYearEntity, "parents")
      .of(currentSchoolYear)
      .add(savedUser);

    res.send(new User(savedUser));
  }
);

UserRouter.put<Empty, User | string, User, Empty>(
  "/",
  authorizeRequest,
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    const user = await userRepository.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!user) {
      res.status(401).send("User not found.");
      return;
    }

    const updatedUser: DeepPartial<UserEntity> = {
      ...req.body,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      name: req.body.name,
      email: req.body.email.toLowerCase(),
    };

    const savedUser = await userRepository.save(updatedUser);
    res.send(new User(savedUser));
  }
);

UserRouter.get<Empty, Empty, SavedCards[], Empty>(
  "/cards",
  authorizeRequest,
  async (req, res) => {
    const { cardsApi } = new Client({
      accessToken: req.user.school.squareAppAccessToken,
      environment: req.user.school.squareAppId.startsWith("sandbox")
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
        false
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
  }
);

UserRouter.get<{ userId: string }, Student[] | string, Empty, Empty>(
  "/:userId/students",
  authorizeRequest,
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    // Only allow users to access their own students or admins to access any user's students
    if (
      req.user.role !== Role.ADMIN &&
      req.user.id !== parseInt(req.params.userId)
    ) {
      res
        .status(403)
        .send("Access denied. You can only view your own students.");
      return;
    }

    const user = await userRepository.findOne({
      where: { id: parseInt(req.params.userId) },
      relations: {
        students: true,
      },
    });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    res.send(user.students.map((student) => new Student(student)));
  }
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

interface StudentsCsvRowData {
  studentId: string;
  lastName: string;
  firstName: string;
  dob: string;
  grade: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

interface TeachersCsvRowData {
  lastName: string;
  firstName: string;
  email: string;
}

UserRouter.post(
  "/import-students",
  authorizeRequest,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).send("No file uploaded");
        return;
      }

      const userRepository = AppDataSource.getRepository(UserEntity);
      const studentRepository = AppDataSource.getRepository(StudentEntity);
      const currentSchoolYear = getCurrentSchoolYear(req.user.school);

      const csvData: StudentsCsvRowData[] = [];
      const buffer = req.file.buffer;
      const stream = Readable.from(buffer);

      // Helper function to parse full name into first and last name
      const parseFullName = (
        fullName: string
      ): { firstName: string; lastName: string } => {
        const trimmedName = fullName.trim();

        // Check if the name contains a comma (last name, first name format)
        if (trimmedName.includes(",")) {
          const parts = trimmedName.split(",").map((part) => part.trim());
          if (parts.length >= 2) {
            return { firstName: parts[1], lastName: parts[0] };
          } else if (parts.length === 1) {
            // Only one part after splitting by comma, treat as last name
            return { firstName: "", lastName: parts[0] };
          }
        }

        // Original logic for space-separated names
        const nameParts = trimmedName.split(/\s+/);

        if (nameParts.length === 1) {
          // Only one name provided, use as first name
          return { firstName: nameParts[0], lastName: "" };
        } else if (nameParts.length === 2) {
          // Two names, assume first and last
          return { firstName: nameParts[0], lastName: nameParts[1] };
        } else {
          // More than two names, use first as first name and rest as last name
          return {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(" "),
          };
        }
      };

      // Parse CSV data
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", (row) => {
            // Map CSV columns to our expected format (case insensitive)
            const csvRow: StudentsCsvRowData = {
              studentId:
                row["Student_id"] ||
                row["student_id"] ||
                row["studentId"] ||
                "",
              lastName:
                row["Last_name"] || row["last_name"] || row["lastName"] || "",
              firstName:
                row["First_name"] ||
                row["first_name"] ||
                row["firstName"] ||
                "",
              dob: row["dob"] || row["DOB"] || "",
              grade: row["grade"] || row["Grade"] || "",
              contactName:
                row["Contact_name"] ||
                row["contact_name"] ||
                row["contactName"] ||
                "",
              contactPhone:
                row["Contact_phone"] ||
                row["contact_phone"] ||
                row["contactPhone"] ||
                "",
              contactEmail:
                row["Contact_email"] ||
                row["contact_email"] ||
                row["contactEmail"] ||
                "",
            };

            // Only add if we have valid data
            if (csvRow.studentId && csvRow.contactName && csvRow.contactEmail) {
              csvData.push(csvRow);
            }
          })
          .on("end", () => resolve())
          .on("error", (error) => reject(error));
      });

      let newUsersCount = 0;
      let skippedUsersCount = 0;
      let newStudentsCount = 0;
      let skippedStudentsCount = 0;

      // Step 1: Create users for each unique contact email
      const uniqueEmails = [
        ...new Set(csvData.map((row) => row.contactEmail.toLowerCase())),
      ];

      for (const email of uniqueEmails) {
        if (!email.length) {
          skippedUsersCount++;
          continue;
        }

        // Check if user already exists by email (case insensitive)
        const existingUsers = await userRepository.find({
          where: {
            email: email.toLowerCase(),
            school: req.user.school,
          },
        });

        if (existingUsers.length > 0) {
          for (const existingUser of existingUsers) {
            const schoolYearParents = await AppDataSource.createQueryBuilder()
              .relation(SchoolYearEntity, "parents")
              .of(currentSchoolYear)
              .loadMany();

            const relationshipExists = schoolYearParents.some(
              (shoolYearParent) => shoolYearParent.id === existingUser.id
            );

            if (!relationshipExists) {
              await AppDataSource.createQueryBuilder()
                .relation(SchoolYearEntity, "parents")
                .of(currentSchoolYear)
                .add(existingUser);
            }
          }
          continue;
        }

        // Find the first row with this email to get contact info
        const firstRowWithEmail = csvData.find(
          (row) => row.contactEmail.toLowerCase() === email
        );
        if (!firstRowWithEmail) continue;

        // Parse the contact name into first and last name
        const { firstName, lastName } = parseFullName(
          firstRowWithEmail.contactName
        );

        // Create new user
        const newUser: DeepPartial<UserEntity> = {
          id: undefined,
          userName: randomUUID(),
          name: firstRowWithEmail.contactName,
          firstName: firstName,
          lastName: lastName,
          pending: true,
          email: email.toLowerCase(),
          phone: firstRowWithEmail.contactPhone || "",
          pwd: "", // Empty password - user will need to set it via invitation
          description: "",
          role: Role.PARENT,
          school: req.user.school,
        };

        const savedUser = await userRepository.save(newUser);

        // Add user to current school year
        await AppDataSource.createQueryBuilder()
          .relation(SchoolYearEntity, "parents")
          .of(currentSchoolYear)
          .add(savedUser);

        newUsersCount++;
      }

      // Step 2: Create all missing student accounts
      const uniqueStudentIds = [
        ...new Set(csvData.map((row) => row.studentId)),
      ];
      const studentIdToStudentMap = new Map<string, StudentEntity>();

      for (const studentId of uniqueStudentIds) {
        if (!studentId.length) {
          skippedStudentsCount++;
          continue;
        }

        // Check if student already exists by studentId
        const existingStudent = await studentRepository.findOne({
          where: { studentId: studentId },
        });

        if (existingStudent) {
          studentIdToStudentMap.set(studentId, existingStudent);
          continue;
        }

        // Find the first row with this studentId to get student info
        const firstRowWithStudentId = csvData.find(
          (row) => row.studentId === studentId
        );
        if (!firstRowWithStudentId) continue;

        // Create new student
        const newStudent: DeepPartial<StudentEntity> = {
          id: undefined,
          studentId: studentId,
          name: `${firstRowWithStudentId.firstName} ${firstRowWithStudentId.lastName}`,
          firstName: firstRowWithStudentId.firstName,
          lastName: firstRowWithStudentId.lastName,
          birthDate: firstRowWithStudentId.dob,
          school: req.user.school,
        };

        const savedStudent = await studentRepository.save(newStudent);
        studentIdToStudentMap.set(studentId, savedStudent);
        newStudentsCount++;
      }

      // Step 3: Process the entire CSV again to ensure all student-parent relationships are created
      const importedParents = await userRepository.find({
        where: {
          email: In(uniqueEmails),
          school: req.user.school,
        },
        relations: {
          students: true,
        },
      });

      for (const row of csvData) {
        const parentEmail = row.contactEmail.toLowerCase();
        const importedStudent = studentIdToStudentMap.get(row.studentId);

        if (parentEmail && importedStudent) {
          const parents = importedParents.filter(
            (parent) => parent.email === parentEmail
          );
          for (const parent of parents) {
            const relationshipExists = parent.students.some(
              (existingStudent) => existingStudent.id === importedStudent.id
            );

            if (!relationshipExists) {
              await AppDataSource.createQueryBuilder()
                .relation(UserEntity, "students")
                .of(parent)
                .add(importedStudent);
            }
          }
        }
      }

      res.send({
        importedUsersCount: newUsersCount,
        skippedUsersCount,
        importedStudentsCount: newStudentsCount,
        skippedStudentsCount,
      });
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).send("Error processing CSV file");
    }
  }
);

UserRouter.post(
  "/import-teachers",
  authorizeRequest,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).send("No file uploaded");
        return;
      }

      const userRepository = AppDataSource.getRepository(UserEntity);
      const currentSchoolYear = getCurrentSchoolYear(req.user.school);

      const csvData: TeachersCsvRowData[] = [];
      const buffer = req.file.buffer;
      const stream = Readable.from(buffer);

      // Parse CSV data
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", (row) => {
            // Map CSV columns to our expected format (case insensitive)
            const csvRow: TeachersCsvRowData = {
              lastName: row["last_name"] || "",
              firstName: row["first_name"] || "",
              email: row["email"] || "",
            };

            // Only add if we have valid data
            if (csvRow.lastName && csvRow.firstName && csvRow.email) {
              csvData.push(csvRow);
            }
          })
          .on("end", () => resolve())
          .on("error", (error) => reject(error));
      });

      let newUsersCount = 0;
      let skippedUsersCount = 0;

      // Step 1: Create users for each unique contact email
      const uniqueEmails = [
        ...new Set(csvData.map((row) => row.email.toLowerCase())),
      ];

      const importedStaffIds: number[] = [];

      for (const email of uniqueEmails) {
        if (!email.length) {
          skippedUsersCount++;
          continue;
        }

        // Check if user already exists by email (case insensitive)
        const existingUser = await userRepository.findOne({
          where: { email: email.toLowerCase() },
          relations: {
            school: true,
          },
        });

        if (existingUser) {
          if (existingUser.school?.id === req.user.school.id) {
            // Ensure user is associated with current school year
            const existingRelationships =
              await AppDataSource.createQueryBuilder()
                .relation(SchoolYearEntity, "parents")
                .of(currentSchoolYear)
                .loadMany();

            const relationshipExists = existingRelationships.some(
              (existingUserInYear) => existingUserInYear.id === existingUser.id
            );

            if (!relationshipExists) {
              await AppDataSource.createQueryBuilder()
                .relation(SchoolYearEntity, "parents")
                .of(currentSchoolYear)
                .add(existingUser);
            }
            if (existingUser.role === Role.PARENT) {
              existingUser.role = Role.STAFF;
              if (existingUser.name === "") {
                existingUser.name =
                  existingUser.firstName + " " + existingUser.lastName;
              }
              await userRepository.save(existingUser);
            }
            importedStaffIds.push(existingUser.id);
          }

          skippedUsersCount++;
          continue;
        } else {
          // Find the first row with this email to get contact info
          const firstRowWithEmail = csvData.find(
            (row) => row.email.toLowerCase() === email
          );

          if (!firstRowWithEmail) continue;
          const newUser: DeepPartial<UserEntity> = {
            id: undefined,
            userName: randomUUID(),
            firstName: firstRowWithEmail.firstName,
            lastName: firstRowWithEmail.lastName,
            name:
              firstRowWithEmail.firstName + " " + firstRowWithEmail.lastName,
            pending: true,
            email: email.toLowerCase(),
            phone: "",
            pwd: "",
            description: "",
            role: Role.STAFF,
            school: req.user.school,
          };

          const savedUser = await userRepository.save(newUser);
          newUsersCount++;

          // Add user to current school year
          await AppDataSource.createQueryBuilder()
            .relation(SchoolYearEntity, "parents")
            .of(currentSchoolYear)
            .add(savedUser);

          importedStaffIds.push(savedUser.id);
        }
      }

      const importedStaff =
        importedStaffIds.length > 0
          ? await userRepository.find({
              where: { id: In(importedStaffIds) },
            })
          : [];

      res.send(importedStaff.map((staff) => new User(staff)));
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).send("Error processing CSV file");
    }
  }
);

export default UserRouter;
