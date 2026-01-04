import { Question } from "./Question";

export interface Survey {
  id: number;
  active: boolean;
  questions: Question[];
  comments: string[];
}

