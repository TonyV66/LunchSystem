import QuestionEntity from "../entity/QuestionEntity";

export default class Question {
  id: number;
  questionText: string;
  order: number;
  oneStarCount: number;
  twoStarCount: number;
  threeStarCount: number;
  fourStarCount: number;
  fiveStarCount: number;
  isAgreeDisagree: boolean;

  constructor(entity: QuestionEntity) {
    this.id = entity.id;
    this.questionText = entity.questionText;
    this.order = entity.order;
    this.oneStarCount = entity.oneStarCount;
    this.twoStarCount = entity.twoStarCount;
    this.threeStarCount = entity.threeStarCount;
    this.fourStarCount = entity.fourStarCount;
    this.fiveStarCount = entity.fiveStarCount;
    this.isAgreeDisagree = entity.isAgreeDisagree;
  }
}

