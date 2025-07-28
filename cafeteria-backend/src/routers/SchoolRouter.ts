import express, { Router } from "express";
import School from "../models/School";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";
import { Not } from "typeorm";

const SchoolRouter: Router = express.Router();
interface Empty {}


SchoolRouter.put<Empty, School, School, Empty>("/ordertimes", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    orderStartPeriodCount: req.body.orderStartPeriodCount,
    orderStartRelativeTo: req.body.orderStartRelativeTo,
    orderStartTime: req.body.orderStartTime,
    orderEndPeriodCount: req.body.orderEndPeriodCount,
    orderEndRelativeTo: req.body.orderEndRelativeTo,
    orderEndTime: req.body.orderEndTime,
  });
  res.send(req.body);
});

SchoolRouter.put<Empty, School, School, Empty>("/prices", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    mealPrice: req.body.mealPrice,
    drinkOnlyPrice: req.body.drinkOnlyPrice,
  });
  res.send(req.body);
});

SchoolRouter.put<Empty, School, School, Empty>("/emailreports", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    emailReportStartPeriodCount: req.body.emailReportStartPeriodCount,
    emailReportStartPeriodType: req.body.emailReportStartPeriodType,
    emailReportStartRelativeTo: req.body.emailReportStartRelativeTo,
    emailReportStartTime: req.body.emailReportStartTime,
  });
  res.send(req.body);
});

SchoolRouter.put<Empty, School | string, School, Empty>("/registration", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  // Check if registration code is already used by another school
  const existingSchool = await schoolRepository.findOne({
    where: {
      registrationCode: req.body.registrationCode,
      id: Not(req.user.school.id)
    },
  });

  if (existingSchool) {
    res.status(400).send("Registration code is already in use by another school.");
    return;
  }

  await schoolRepository.update(req.user.school.id, {
    registrationCode: req.body.registrationCode,
    openRegistration: req.body.openRegistration,
  });
  res.send(req.body);
});

SchoolRouter.put<Empty, School, School, Empty>("/general", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    name: req.body.name,
    timezone: req.body.timezone,
  });
  res.send(req.body);
});

SchoolRouter.put<Empty, School, School, Empty>("/square", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    squareAppId: req.body.squareAppId,
    squareAppAccessToken: req.body.squareAppAccessToken,
    squareLocationId: req.body.squareLocationId,
  });
  res.send(req.body);
});

export default SchoolRouter;
