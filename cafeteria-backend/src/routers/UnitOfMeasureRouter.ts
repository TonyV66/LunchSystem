import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import UnitOfMeasureEntity from "../entity/UnitOfMeasureEntity";
import UnitOfMeasure from "../models/UnitOfMeasure";

const UnitOfMeasureRouter: Router = express.Router();
interface Empty {}

UnitOfMeasureRouter.post<Empty, UnitOfMeasure, { name: string }, Empty>(
  "",
  async (req, res) => {
    const unitOfMeasureRepository =
      AppDataSource.getRepository(UnitOfMeasureEntity);
    const name = req.body.name?.trim();
    if (!name) {
      res.status(400).send();
      return;
    }

    const existing = await unitOfMeasureRepository.findOne({
      where: {
        name,
        school: { id: req.school.id },
      },
    });
    if (existing) {
      res.send(new UnitOfMeasure(existing));
      return;
    }

    const saved = await unitOfMeasureRepository.save({
      name,
      school: req.school,
    } as UnitOfMeasureEntity);
    res.send(new UnitOfMeasure(saved));
  }
);

export default UnitOfMeasureRouter;
