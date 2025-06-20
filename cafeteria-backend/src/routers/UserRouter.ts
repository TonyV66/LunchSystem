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
import { sendInvitationEmail } from "./EmailUtils";
import SchoolYearEntity from "../entity/SchoolYearEntity";
import StudentEntity from "../entity/StudentEntity";

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
}

interface RegistrationRequest extends Credentials {
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
      students: students.map(s => new Student(s)),
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

    if (!existingUser) {
      res.status(401).send("Email already exists.");
      return;
    }

    const invitationId = randomUUID();
    const user: DeepPartial<UserEntity> = {
      id: undefined,
      userName: randomUUID(),
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

    await AppDataSource.createQueryBuilder().relation(SchoolYearEntity, 'parents').of(currentSchoolYear).add(savedUser);
    
    const emailResponse = await sendInvitationEmail(
      req.body.email,
      invitationId,
      req.body.firstName,
      req.body.lastName,
      "MICS"
    );
    res.send(new User(savedUser));
  }
);

UserRouter.put<{ invitationId: string }, Student[] | string, Empty, Empty>(
  "/accept/:invitationId",
  authorizeRequest,
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const studentRepository = AppDataSource.getRepository(StudentEntity);

    const invitedUser = await userRepository.findOne({
      where: { userName: req.params.invitationId },
      relations: {
        students: {
          lunchTimes: {
            lunchtimeTeacher: true,
            schoolYear: true,
          },
        },
      },
    });

    if (!invitedUser) {
      res.status(401).send("Unable to add student to your account");
      return;
    }

    const loggedInUser = await userRepository.findOne({
      where: { id: req.user.id },
      relations: {
        students: true,
      },
    });

    let newStudents = invitedUser.students.filter(
      (invitedStudent) =>
        !loggedInUser!.students.find((student) => {
          if (invitedStudent.studentId.length && student.studentId.length) {
            return invitedStudent.studentId === student.studentId;
          } else {
            return (
              invitedStudent.name.toLowerCase() === student.name.toLowerCase()
            );
          }
        })
    );

    for (const newStudent of newStudents) {
      await AppDataSource.createQueryBuilder()
        .relation(UserEntity, "students")
        .of(loggedInUser)
        .add(newStudent);
    }

    for (const invitedStudent of invitedUser.students) {
      await AppDataSource.createQueryBuilder()
        .relation(UserEntity, "students")
        .of(invitedUser)
        .remove(invitedStudent);
    }

    userRepository.delete(invitedUser.id);

    newStudents = await studentRepository.find({
      where: { id: In(newStudents.map(s => s.id)) },
      relations: {
        parents: true,
      },
    });

    res.send(newStudents.map((student) => new Student(student)));
  }
);

UserRouter.post<
  { invitationId: string },
  LoginResponse | string,
  RegistrationRequest,
  Empty
>("/register/:invitationId", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const invitedUser = await userRepository.findOne({
    where: { userName: req.params.invitationId! },
  });

  if (!invitedUser) {
    res.status(401).send("Unknown invitation ID.");
    return;
  }

  const existingUser = await userRepository.findOne({
    where: [
      { userName: req.body.username.toLowerCase() },
      { email: req.body.email.toLowerCase() },
    ],
  });

  if (existingUser) {
    res.status(401).send("Username or email already exists.");
    return;
  }

  const hash = bcrypt.hashSync(req.body.pwd, 5);

  await userRepository.save({
    id: invitedUser.id,
    userName: req.body.username.toLowerCase(),
    pwd: hash,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email.toLowerCase(),
  });

  const user = await userRepository.findOne({
    where: { id: invitedUser.id },
    relations: {
      school: { schoolYears: true },
      students: {
        lunchTimes: {
          lunchtimeTeacher: true,
          schoolYear: true,
        },
      },
    },
  });

  if (!user) {
    res.status(401).send("Unable to create account.");
    return;
  }

  const jwtToken = jwt.sign({ userId: user.id }, JWT_PRIVATE_KEY);
  const sessionInfo = await getSessionInfo(user);

  res.send({
    ...sessionInfo,
    jwtToken,
  });
});

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
      school: req.user.school,
    };

    user.userName = user.userName?.toLowerCase();
    const savedUser = await userRepository.save(user);
    const currentSchoolYear = getCurrentSchoolYear(req.user.school);
    await AppDataSource.createQueryBuilder().relation(SchoolYearEntity, 'parents').of(currentSchoolYear).add(savedUser);

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
      res.status(401).send("Username already exists.");
      return;
    }

    if (user.email !== req.body.email) {
      const userWithEmail = await userRepository.findOne({
        where: {
          email: req.body.email.toLowerCase(),
        },
      });

      if (userWithEmail) {
        res.status(401).send("Email already exists.");
        return;
      }
    }


    if (user) {
      const updatedUser: DeepPartial<UserEntity> = {
        ...req.body,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email.toLowerCase(),
      };

      const savedUser = await userRepository.save(updatedUser);
      res.send(new User(savedUser));
    }
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
    if (req.user.role !== Role.ADMIN && req.user.id !== parseInt(req.params.userId)) {
      res.status(403).send("Access denied. You can only view your own students.");
      return;
    }

    const user = await userRepository.findOne({
      where: { id: parseInt(req.params.userId) },
      relations: {
        students: true
      }
    });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    res.send(user.students.map(student => new Student(student)));
  }
);

export default UserRouter;
