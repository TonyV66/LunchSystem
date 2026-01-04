export interface Question {
  id: number;
  questionText: string;
  order: number;
  oneStarCount: number;
  twoStarCount: number;
  threeStarCount: number;
  fourStarCount: number;
  fiveStarCount: number;
  isAgreeDisagree: boolean;
}

export interface QuestionRequest {
  questionText: string;
  isAgreeDisagree: boolean;
}

