import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial } from "typeorm";
import { PantryItemEntity } from "../entity/MenuEntity";
import { PantryItem } from "../models/Menu";

const PantryRouter: Router = express.Router();
interface Empty {}
interface EntityId {
  id: number;
}

PantryRouter.post<Empty, PantryItem, PantryItem, Empty>(
  "",
  async (req, res) => {
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);

    const item: DeepPartial<PantryItemEntity> = {
      ...req.body,
      id: undefined,
      school: req.user.school,
    };
    const newItem = pantryRespository.create(item);
    const savedItem = await pantryRespository.save(newItem as PantryItemEntity);
    res.send(new PantryItem(savedItem));
  }
);

PantryRouter.delete<EntityId, Empty, Empty, Empty>(
  "/:id",
  async (req, res) => {
    const pantryRespository = AppDataSource.getRepository(PantryItemEntity);

    await pantryRespository.delete(req.params.id);
    res.send();
  }
);

export default PantryRouter;
