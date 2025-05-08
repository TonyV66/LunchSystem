import express, { RequestHandler, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SessionInfo, getSessionInfo } from "./SessionRouter";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import { JWT_PRIVATE_KEY, validateAuthorizationToken } from "./RouterUtils";
import { randomUUID } from "crypto";
import { sendForgotPasswordEmail, sendForgotUserNameEmail } from "./EmailUtils";

interface Empty {}

const LoginRouter: Router = express.Router();

export interface Credentials {
  username: string;
  pwd: string;
}

export interface LoginResponse extends SessionInfo {
  jwtToken: string;
}

const authorizeRequest: RequestHandler<any, any, any, any> = async (
  req,
  res,
  next
) => {
  const result = await validateAuthorizationToken(req);
  if (typeof result === "string") {
    res.status(401).send(result);
  } else {
    req.user = result as UserEntity;
    next();
  }
};

LoginRouter.post<{}, {}, { username: string }, Empty>(
  "/forgot/pwd",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { userName: req.body.username.toLowerCase() },
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

    await sendForgotPasswordEmail(
      user.email,
      forgotPwdId,
      user.firstName,
      user.lastName,
      "MICS"
    );
    res.sendStatus(200);
  }
);

LoginRouter.post<{}, {}, { email: string }, Empty>(
  "/forgot/username",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { email: req.body.email.toLowerCase() },
    });

    if (!user) {
      res.status(401).send("Unknown email address.");
      return;
    }

    await sendForgotUserNameEmail(
      user.email,
      user.userName,
      user.firstName,
      user.lastName,
      "MICS"
    );
    res.sendStatus(200);
  }
);

LoginRouter.put<
  {},
  {},
  { forgottenPwdId: string; userName: string; pwd: string },
  Empty
>("/forgottenpwd", async (req, res) => {

  if (!req.body.forgottenPwdId) {
    res.status(401).send("Invalid or expired password reset request.");
    return;
  }

  const userRepository = AppDataSource.getRepository(UserEntity);
  const user = await userRepository.findOne({
    where: { userName: req.body.userName },
  });


  if (!user) {
    res.status(401).send("Unknown username.");
    return;
  }

  if (user.forgotPwdUri !== req.body.forgottenPwdId) {
    res.status(401).send("Invalid or expired password reset request.");
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

  if (
    loginRequest.username.match(
      /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/
    )
  ) {
    res.status(401).send("Invalid username or password.");
    return;
  }

  const user = await userRepository.findOne({
    where: { userName: loginRequest.username.toLowerCase() },
    relations: {
      school: { schoolYears: true },
    },
  });

  if (!user) {
    res.status(401).send("Invalid username or password.");
    return;
  }

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

  if (req.params.invitationId) {
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

    if (invitedUser) {
      const loggedInUser = await userRepository.findOne({
        where: { id: req.user.id },
        relations: {
          students: true,
        },
      });

      const newStudents = invitedUser.students.filter(
        (invitedStudent) =>
          !loggedInUser?.students.find(
            (student) =>
              student.name.toLowerCase() === invitedStudent.name.toLowerCase()
          )
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
    }
  }

  const jwtToken = jwt.sign({ userId: user.id }, JWT_PRIVATE_KEY);
  const sessionInfo = await getSessionInfo(user);

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
>("/pwd", authorizeRequest, async (req, res) => {
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

  await userRepository.update(req.user.id, {
    pwd: bcrypt.hashSync(req.body.newPassword, 5),
  });
  res.send(true);
});

export default LoginRouter;
