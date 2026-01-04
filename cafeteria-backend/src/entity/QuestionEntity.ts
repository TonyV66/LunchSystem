import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import SurveyEntity from "./SurveyEntity";

@Entity("question")
export default class QuestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionText: string;

  @Column()
  order: number;

  @Column({ default: 0 })
  oneStarCount: number;

  @Column({ default: 0 })
  twoStarCount: number;

  @Column({ default: 0 })
  threeStarCount: number;

  @Column({ default: 0 })
  fourStarCount: number;

  @Column({ default: 0 })
  fiveStarCount: number;

  @Column({ default: false })
  isAgreeDisagree: boolean;

  @ManyToOne(() => SurveyEntity, (survey) => survey.questions, { onDelete: "CASCADE" })
  survey: SurveyEntity;
}

