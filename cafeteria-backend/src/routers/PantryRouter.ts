import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial } from "typeorm";
import PantryItemEntity from "../entity/PantryItemEntity";
import PantryItem from "../models/PantryItem";

const PantryRouter: Router = express.Router();
interface Empty {}
interface EntityId {
  id: string;
}

const toRecipeItemPartials = (
  recipeItems: { qty: number; unitOfMeasure: string | null; description: string }[] | undefined
): DeepPartial<PantryItemEntity>["recipeItems"] =>
  (recipeItems ?? [])
    .filter((item) => item.description?.trim())
    .map((item) => ({
      id: undefined,
      qty: item.qty,
      unitOfMeasure: item.unitOfMeasure?.trim() || null,
      description: item.description.trim(),
    }));

PantryRouter.post<Empty, PantryItem, PantryItem, Empty>(
  "",
  async (req, res) => {
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);

    const item: DeepPartial<PantryItemEntity> = {
      ...req.body,
      id: undefined,
      school: req.school,
      recipeItems: toRecipeItemPartials(req.body.recipeItems),
    };
    const newItem = pantryRespository.create(item);
    const savedItem = await pantryRespository.save(newItem as PantryItemEntity);
    const reloaded = await pantryRespository.findOne({
      where: { id: savedItem.id },
      relations: { recipeItems: true },
    });
    res.send(new PantryItem(reloaded!));
  }
);

PantryRouter.put<Empty, PantryItem, PantryItem, Empty>(
  "",
  async (req, res) => {
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);

    const item = await pantryRespository.findOne({
      where: { id: req.body.id },
      relations: { recipeItems: true },
    });
    if (!item) {
      res.status(404).send();
      return;
    }
    item.recipeServingSize = req.body.recipeServingSize;
    item.recipeItems = toRecipeItemPartials(req.body.recipeItems) as typeof item.recipeItems;
    const savedItem = await pantryRespository.save(item);
    const reloaded = await pantryRespository.findOne({
      where: { id: savedItem.id },
      relations: { recipeItems: true },
    });
    res.send(new PantryItem(reloaded!));
  }
);

PantryRouter.delete<EntityId, PantryItem, Empty, Empty>(
  "/:id",
  async (req, res) => {
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);

    const item = await pantryRespository.findOneBy({
      id: parseInt(req.params.id),
    });
    if (!item) {
      res.status(404).send();
      return;
    }
    item.archived = true;
    const savedItem = await pantryRespository.save(item);
    res.send(new PantryItem(savedItem));
  }
);

PantryRouter.put<EntityId, PantryItem, Empty, Empty>(
  "/:id/unarchive",
  async (req, res) => {
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);

    const item = await pantryRespository.findOneBy({
      id: parseInt(req.params.id),
    });
    if (!item) {
      res.status(404).send();
      return;
    }
    item.archived = false;
    const savedItem = await pantryRespository.save(item);
    res.send(new PantryItem(savedItem));
  }
);

export default PantryRouter;
