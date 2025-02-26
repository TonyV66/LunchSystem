import express, { Router } from "express";
import School from "../models/School";
import { AppDataSource } from "../data-source";
import SchoolEntity from "../entity/SchoolEntity";

const SchoolRouter: Router = express.Router();
interface Empty {}

SchoolRouter.put<Empty, School, School, Empty>(
  "/",
  async (req, res) => {
    const schoolRepository = AppDataSource.getRepository(SchoolEntity);

    await schoolRepository.update(req.body.id, req.body);
    res.send(req.body);
  }
);

export default SchoolRouter;
