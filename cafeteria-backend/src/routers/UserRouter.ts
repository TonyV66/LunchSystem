import express, { Router } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { DeepPartial } from "typeorm";
import UserEntity from "../entity/UserEntity";
import User from "../models/User";
import { buildUserDto, getLatestSchoolYear } from "./RouterUtils";

const UserRouter: Router = express.Router();
interface Empty {}

UserRouter.post<Empty, User | string, User, Empty>("/", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const existingUser = await userRepository.findOne({
    where: { userName: req.body.userName.toLowerCase() },
  });

  if (existingUser) {
      res.status(401).send("Username already exists.");
      return;
  }

  const schoolYear = getLatestSchoolYear(req.user.school);

  const hash = bcrypt.hashSync(req.body.pwd, 5);

  const user: DeepPartial<UserEntity> = {
    ...req.body,
    id: undefined,
    pwd: hash,
    lunchTimes: !schoolYear
      ? undefined
      : req.body.lunchTimes.map((item) => ({
          ...item,
          id: undefined,
          schoolYear: schoolYear,
        })),
    school: req.user.school,
  };
  
  user.userName = user.userName?.toLowerCase();
  const savedUser = await userRepository.save(user);
  res.send(buildUserDto(savedUser));
});

UserRouter.put<Empty, User, User, Empty>("/", async (req, res) => {
  const userRepository = AppDataSource.getRepository(UserEntity);

  const user = await userRepository.findOne({
    where: {
      id: req.body.id,
    },
  });

  if (user) {
    const schoolYear = getLatestSchoolYear(req.user.school);

    const updatedUser: DeepPartial<UserEntity> = {
      ...req.body,
      lunchTimes: !schoolYear
        ? undefined
        : req.body.lunchTimes.map((item) => ({
            ...item,
            id: undefined,
            schoolYear: schoolYear,
          })),
    };

    const savedUser = await userRepository.save(updatedUser);
    res.send(savedUser);
  }
});

export default UserRouter;
