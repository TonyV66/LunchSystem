import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import UserEntity from "../entity/UserEntity";
import { DeepPartial } from "typeorm";
import { Notification } from "../models/Notification";
import NotificationEntity from "../entity/NotificationEntity";
import { DateTimeUtils } from "../DateTimeUtils";

const NotificationRouter: Router = express.Router();
interface Empty {}
interface EntityId {
  id: number;
}

NotificationRouter.put<Empty, Notification, Notification, Empty>(
  "/review",
  async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserEntity);

    const user = await userRepository.findOne({
      where: {
        id: req.user.id,
      },
    });
    if (user) {
      user.notificationReviewDate = DateTimeUtils.getCurrentDate();
      await userRepository.save(user);
    }
    res.send();
  }
);

NotificationRouter.post<Empty, Notification, Notification, Empty>(
  "/",
  async (req, res) => {
    const notificationRepository =
      AppDataSource.getRepository(NotificationEntity);

    const item: DeepPartial<NotificationEntity> = {
      ...req.body,
      id: undefined,
      creationDate: DateTimeUtils.getCurrentDate(),
      school: req.school,
    };
    const newItem = notificationRepository.create(item);
    const savedItem = await notificationRepository.save(
      newItem as NotificationEntity
    );
    res.send(new Notification(savedItem));
  }
);

NotificationRouter.delete<EntityId, Empty, Empty, Empty>(
  "/:id",
  async (req, res) => {
    const notificationRepository =
      AppDataSource.getRepository(NotificationEntity);
    await notificationRepository.delete(req.params.id);
    res.send();
  }
);

NotificationRouter.put<Empty, Notification, Notification, Empty>(
  "/",
  async (req, res) => {
    const notificationRepository =
      AppDataSource.getRepository(NotificationEntity);
    await notificationRepository.update(req.body.id, req.body);
    res.send(req.body);
  }
);

export default NotificationRouter;
