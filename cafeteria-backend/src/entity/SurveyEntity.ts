import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import SchoolEntity from "./SchoolEntity";
import QuestionEntity from "./QuestionEntity";

@Entity("survey")
export default class SurveyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  active: boolean;

  @Column({ type: "json", nullable: true })
  comments: string[] | null;

  @OneToOne(() => SchoolEntity, (school) => school.survey, { onDelete: "CASCADE" })
  @JoinColumn()
  school: SchoolEntity;

  @OneToMany(() => QuestionEntity, (question) => question.survey, { cascade: true })
  questions: QuestionEntity[];
}

