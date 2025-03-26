import express, { Router } from "express";
import School from "../models/School";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";

const SchoolRouter: Router = express.Router();
interface Empty {}

SchoolRouter.put<Empty, School, School, Empty>("/", async (req, res) => {
  const schoolRepository = AppDataSource.getRepository(SchoolEntity);

  await schoolRepository.update(req.body.id, {
    orderStartPeriodCount: req.body.orderStartPeriodCount,
    orderStartPeriodType: req.body.orderStartPeriodType,
    orderStartRelativeTo: req.body.orderStartRelativeTo,
    orderStartTime: req.body.orderStartTime,
    orderEndPeriodCount: req.body.orderStartPeriodCount,
    orderEndPeriodType: req.body.orderStartPeriodType,
    orderEndRelativeTo: req.body.orderStartRelativeTo,
    orderEndTime: req.body.orderStartTime,
    mealPrice: req.body.mealPrice,
    drinkOnlyPrice: req.body.drinkOnlyPrice,
  });
  res.send(req.body);
});

export default SchoolRouter;
