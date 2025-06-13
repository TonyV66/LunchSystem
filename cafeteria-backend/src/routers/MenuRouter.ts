import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import { DeepPartial } from "typeorm";
import MenuEntity from "../entity/MenuEntity";
import { Menu } from "../models/Menu";

const MenuRouter: Router = express.Router();
interface Empty {}
interface EntityId {
  id: number;
}

MenuRouter.post<Empty, Menu, Menu, Empty>("/", async (req, res) => {
  const menuRespository = AppDataSource.getRepository(MenuEntity);

  const menu: DeepPartial<MenuEntity> = {
    ...req.body,
    id: undefined,
    items: req.body.items.map((item) => ({ ...item, id: undefined })),
    school: req.user.school,
  };
  const savedMenu = await menuRespository.save(menu);

  res.send(new Menu(savedMenu));
});

MenuRouter.delete<EntityId, Empty, Empty, Empty>(
  "/:id",
  async (req, res) => {
    const menuRespository = AppDataSource.getRepository(MenuEntity);

    await menuRespository.delete(req.params.id);
    res.send();
  }
);


MenuRouter.put<Empty, Menu, Menu, Empty>("/", async (req, res) => {
  const menuRespository = AppDataSource.getRepository(MenuEntity);

  const menu: DeepPartial<MenuEntity> = {
    ...req.body,
    items: req.body.items.map((item) => ({ ...item, id: undefined })),
  };

  const savedMenu = await menuRespository.save(menu);
  res.send(new Menu(savedMenu));
});

export default MenuRouter;
