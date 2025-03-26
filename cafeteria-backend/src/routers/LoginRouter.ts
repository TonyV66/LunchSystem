import express, { RequestHandler, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SessionInfo, getSessionInfo } from "./SessionRouter";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import User from "../models/User";
import { DeepPartial } from "typeorm";
import { JWT_PRIVATE_KEY, validateAuthorizationToken } from "./RouterUtils";

interface Empty {}

const LoginRouter: Router = express.Router();

interface LoginRequest {
  username: string;
  pwd: string;
}

interface LoginResponse extends SessionInfo {
  jwtToken: string;
}

type JwtPayload = {
  userId: number;
};

const authorizeRequest: RequestHandler<any, any, any, any> = async (
  req,
  res,
  next
) => {
  const result = await validateAuthorizationToken(req);
  if (typeof result === 'string') {
    res.status(401).send(result);
  } else {
    req.user = (result as UserEntity);
    next();

  }
};


LoginRouter.post<Empty, LoginResponse | string, LoginRequest, Empty>(
  "/",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    const loginRequest = req.body;

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

    const jwtToken = jwt.sign({ userId: user.id }, JWT_PRIVATE_KEY);
    const sessionInfo = await getSessionInfo(user);

    res.send({
      ...sessionInfo,
      jwtToken,
    });
  }
);

LoginRouter.put<Empty, boolean | string, {oldPassword: string, newPassword: string}, Empty>("/pwd", authorizeRequest, async (req, res) => {
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

  const updatedUser: DeepPartial<User> = {
    id: req.user.id,
    pwd: bcrypt.hashSync(req.body.newPassword, 5)
  };

  await userRepository.save(updatedUser);
  res.send(true);
});

export default LoginRouter;
