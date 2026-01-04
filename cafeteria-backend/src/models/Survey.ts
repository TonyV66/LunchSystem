import SurveyEntity from "../entity/SurveyEntity";
import Question from "./Question";

export default class Survey {
  id: number;
  active: boolean;
  questions: Question[];
  comments: string[];

  constructor(entity: SurveyEntity) {
    this.id = entity.id;
    this.active = entity.active;
    this.questions = entity.questions
      ? entity.questions.map((q) => new Question(q))
      : [];
    this.comments = entity.comments || [];
  }
}

