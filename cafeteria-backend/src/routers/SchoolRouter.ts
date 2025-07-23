import express, { Router } from "express";
import School from "../models/School";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";

const SchoolRouter: Router = express.Router();
interface Empty {}


SchoolRouter.put<Empty, School, School, Empty>("/ordertimes", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    orderStartPeriodCount: req.body.orderStartPeriodCount,
    orderStartPeriodType: req.body.orderStartPeriodType,
    orderStartRelativeTo: req.body.orderStartRelativeTo,
    orderStartTime: req.body.orderStartTime,
    orderEndPeriodCount: req.body.orderEndPeriodCount,
    orderEndPeriodType: req.body.orderEndPeriodType,
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

SchoolRouter.put<Empty, School, School, Empty>("/registration", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.user.school.id, {
    openRegistration: req.body.openRegistration,
  });
  res.send(req.body);
});


export default SchoolRouter;
