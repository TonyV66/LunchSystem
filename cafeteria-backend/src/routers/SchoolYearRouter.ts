import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { authorizeRequest, buildSchoolYearDto, getCurrentSchoolYear } from "./RouterUtils";

import SchoolYearEntity from "../entity/SchoolYearEntity";
import SchoolYear from "../models/SchoolYear";
import DailyLunchTime, { DayOfWeek } from "../models/DailyLunchTime";
import SchoolYearLunchTimeEntity from "../entity/SchoolYearLunchTimeEntity";
import UserEntity from "../entity/UserEntity";
import SchoolEntity from "../entity/SchoolEntity";
import { Role } from "../models/User";
import { Not } from "typeorm";

const SchoolYearRouter: Router = express.Router();

SchoolYearRouter.post<{}, SchoolYear | string, SchoolYear, {}>(
  "/",
  authorizeRequest,
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
    const userRepository = AppDataSource.getRepository(UserEntity);


    const isCurrentSchoolYear = !getCurrentSchoolYear(req.user.school);

    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (startDate > endDate) {
      const tmpDate = startDate;
      startDate = endDate;
      endDate = tmpDate;
    }

    const existingSchoolYears: SchoolYearEntity[] = await AppDataSource.createQueryBuilder().relation(SchoolYearEntity, 'lunchTimes').of(req.user.school).loadMany();
    const overlappingSchoolYear: SchoolYearEntity | undefined = existingSchoolYears.find(esy => !(endDate < esy.startDate || startDate > esy.endDate));
    if (overlappingSchoolYear) {
      res.status(401).send("Overlapping school year dates");
    }

    const newSchoolYear = await schoolYearRepository.save({
      name: req.body.name,
      startDate: startDate,
      endDate: endDate,
      isCurrent: isCurrentSchoolYear,
      lunchTimes: [{dayOfWeek: DayOfWeek.MONDAY},{dayOfWeek: DayOfWeek.TUESDAY},{dayOfWeek: DayOfWeek.WEDNESDAY},{dayOfWeek: DayOfWeek.THURSDAY},{dayOfWeek: DayOfWeek.FRIDAY}]
    });

    res.send(buildSchoolYearDto(newSchoolYear));
  }
);

SchoolYearRouter.put<{}, {}, SchoolYear, {}>(
  "/",
  authorizeRequest,
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (startDate > endDate) {
      const tmpDate = startDate;
      startDate = endDate;
      endDate = tmpDate;
    }

    const existingSchoolYears: SchoolYearEntity[] = await AppDataSource.createQueryBuilder().relation(SchoolYearEntity, 'lunchTimes').of(req.user.school).loadMany();
    const overlappingSchoolYear: SchoolYearEntity | undefined = existingSchoolYears.find(esy => !(endDate < esy.startDate || startDate > esy.endDate));
    if (overlappingSchoolYear && overlappingSchoolYear.id !== req.body.id) {
      res.status(401).send("Overlapping school year dates");
    }

    await schoolYearRepository.update(req.body.id, {
      name: req.body.name,
      startDate: startDate,
      endDate: endDate,
    });
    res.sendStatus(200);
  }
);

SchoolYearRouter.post<
  {},
  DailyLunchTime[] | string,
  { schoolYearId: number; daysOfWeek: number[]; times: string[] },
  {}
>("/times", authorizeRequest, async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const schoolLunchTimeRepository = AppDataSource.getRepository(
    SchoolYearLunchTimeEntity
  );

  let schoolYear = await schoolYearRepository.findOne({
    where: { id: req.body.schoolYearId },
    relations: { lunchTimes: true },
  });

  if (!schoolYear) {
    res.status(401).send("School year not found");
    return;
  }

  for (const dow of req.body.daysOfWeek) {
    const newTimes = req.body.times.join("|");
    const dailyTimes = schoolYear.lunchTimes.find((lt) => lt.dayOfWeek === dow);
    if (dailyTimes) {
      await schoolLunchTimeRepository.update(dailyTimes.id, {
        time: newTimes,
      });
      dailyTimes.time = newTimes;
    }
  }
  res.status(200).send(schoolYear.lunchTimes)
});

export default SchoolYearRouter;
