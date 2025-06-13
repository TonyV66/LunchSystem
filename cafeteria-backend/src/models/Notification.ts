import NotificationEntity from "../entity/NotificationEntity";

export class Notification {
  id: number;
  startDate: string;
  endDate: string;
  msg: string;
  creationDate: Date;

  constructor(entity: NotificationEntity) {
    this.id = entity.id;
    this.startDate = entity.startDate;
    this.endDate = entity.endDate;
    this.msg = entity.msg;
    this.creationDate = entity.creationDate;
  }
}