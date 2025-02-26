import express, { Router } from "express";
import { DeepPartial } from "typeorm";
import { DailyMenuEntity } from "../entity/MenuEntity";
import { DailyMenu } from "../models/Menu";
import { buildDailyMenuDto, getLatestSchoolYear } from "./RouterUtils";
import { AppDataSource } from "../data-source";

interface UpdateDailyMenuAvailRequest {
  dailyMenuId: number;
  startDateTime: string;
  endDateTime: string;
}


const DailyMenuRouter: Router = express.Router();
interface Empty {}
interface EntityId {
  id: number;
}

DailyMenuRouter.put<Empty, DailyMenu, DailyMenu, Empty>("/", async (req, res) => {
  const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);

  const menu: DeepPartial<DailyMenuEntity> = {
    ...req.body,
    items: req.body.items.map((item) => ({ ...item, id: undefined })),
  };

  const savedMenu = await dailyMenuRespository.save(menu);
  const menuDto = buildDailyMenuDto(savedMenu);
  res.send(menuDto);
});

DailyMenuRouter.post<Empty, DailyMenu, DailyMenu, Empty>("/", async (req, res) => {
  const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);

  dailyMenuRespository.delete({
    date: req.body.date,
  });
  let schoolYear = getLatestSchoolYear(req.user.school!);

  const menu: DeepPartial<DailyMenuEntity> = {
    ...req.body,
    id: undefined,
    items: req.body.items.map((item) => ({ ...item, id: undefined })),
    schoolYear: schoolYear,
  };
  const savedMenu = await dailyMenuRespository.save(menu);
  const menuDto = buildDailyMenuDto(savedMenu);

  res.send(menuDto);
});

DailyMenuRouter.put<Empty, Empty, UpdateDailyMenuAvailRequest, Empty>(
  "/availability",
  async (req, res) => {
    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);

    const menu = await dailyMenuRespository.findOne({
      where: {
        id: req.body.dailyMenuId,
      },
    });
    if (menu) {
      menu.orderStartTime = new Date(req.body.startDateTime);
      menu.orderEndTime = new Date(req.body.endDateTime);

      await dailyMenuRespository.save(menu);
    }
    res.send();
  }
);

DailyMenuRouter.delete<EntityId, Empty, Empty, Empty>(
  "/:id",
  async (req, res) => {
    const dailyMenuRespository = AppDataSource.getRepository(DailyMenuEntity);

    await dailyMenuRespository.delete(req.params.id);
    res.send();
  }
);

export default DailyMenuRouter;
