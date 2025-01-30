import { Entity } from "typeorm";
import { Notification } from "../models/Notification";


@Entity('notification')
export default class NotificationEntity extends Notification {
}
