import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import IngredientEntity from "../entity/IngredientEntity";
import Ingredient from "../models/Ingredient";

const IngredientRouter: Router = express.Router();
interface Empty {}

IngredientRouter.post<Empty, Ingredient, { name: string }, Empty>(
  "",
  async (req, res) => {
    const ingredientRepository = AppDataSource.getRepository(IngredientEntity);
    const name = req.body.name?.trim();
    if (!name) {
      res.status(400).send();
      return;
    }

    const existing = await ingredientRepository.findOne({
      where: {
        name,
        school: { id: req.school.id },
      },
    });
    if (existing) {
      res.send(new Ingredient(existing));
      return;
    }

    const saved = await ingredientRepository.save({
      name,
      school: req.school,
    } as IngredientEntity);
    res.send(new Ingredient(saved));
  }
);

export default IngredientRouter;
