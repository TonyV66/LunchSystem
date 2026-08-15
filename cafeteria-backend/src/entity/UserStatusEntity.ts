import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Role, AccountStatus } from "../models/User";
import { DecimalTransformer } from "./DecimalTransformer";
import SchoolEntity from "./SchoolEntity";
import UserEntity from "./UserEntity";

@Entity("user_status")
@Unique(["user", "school"])
export default class UserStatusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: false, default: AccountStatus.PENDING })
  accountStatus: AccountStatus;

  @Column({ nullable: false, default: Role.PARENT })
  role: Role;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: new DecimalTransformer(),
  })
  availableCredits: number;

  @Column({ nullable: false, default: false })
  surveyCompleted: boolean;

  @Index()
  @Column({ type: "int", nullable: true, default: null })
  factsId: number | null;

  @Index()
  @Column({ type: "varchar", nullable: true, default: null })
  invitationId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.userStatuses, {
    onDelete: "CASCADE",
  })
  user: UserEntity;

  @ManyToOne(() => SchoolEntity, (school) => school.userStatuses, {
    onDelete: "CASCADE",
  })
  school: SchoolEntity;
}
