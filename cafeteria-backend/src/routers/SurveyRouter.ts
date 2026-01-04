import express, { Router } from "express";
import { AppDataSource } from "../data-source";
import SurveyEntity from "../entity/SurveyEntity";
import QuestionEntity from "../entity/QuestionEntity";
import UserEntity from "../entity/UserEntity";
import Survey from "../models/Survey";
import { Role } from "../models/User";
import { In } from "typeorm";

const SurveyRouter: Router = express.Router();
interface Empty {}

interface QuestionRequest {
  questionText: string;
  isAgreeDisagree: boolean;
}

interface SubmitSurveyRequest {
  ratings: number[];
  comment?: string;
}

SurveyRouter.post<Empty, Survey | string, QuestionRequest[], Empty>("/start", async (req, res) => {
  const questions = req.body;

  // Validate that we have at most 5 questions
  if (questions.length > 5) {
    res.status(400).send("Maximum of 5 questions allowed");
    return;
  }

  const surveyRepository = AppDataSource.getRepository(SurveyEntity);
  const questionRepository = AppDataSource.getRepository(QuestionEntity);
  const userRepository = AppDataSource.getRepository(UserEntity);

  const school = req.user.school;

  // Get or create survey for the school
  let survey = await surveyRepository.findOne({
    where: { school: { id: school.id } },
    relations: { questions: true },
  });

  if (!survey) {
    // Create new survey
    survey = surveyRepository.create({
      school: school,
      comments: null,
      active: true,
    });
    survey = await surveyRepository.save(survey);
  } else {
    // Delete existing questions
    if (survey.questions && survey.questions.length > 0) {
      const questionIds = survey.questions.map((q) => q.id);
      await questionRepository.delete({ id: In(questionIds) });
    }
    await surveyRepository.update(survey.id, { active: true, comments: [] });
  }

  // Create new questions with zero ratings
  const newQuestions: QuestionEntity[] = questions.filter((q) => q.questionText.trim() !== "").map((q, index) =>
    questionRepository.create({
      questionText: q.questionText,
      order: index + 1,
      oneStarCount: 0,
      twoStarCount: 0,
      threeStarCount: 0,
      fourStarCount: 0,
      fiveStarCount: 0,
      isAgreeDisagree: q.isAgreeDisagree,
      survey: survey,
    })
  );

  await questionRepository.save(newQuestions);

  await userRepository.update(
    { school: { id: school.id } },
    { surveyCompleted: false }
  );

  const updatedSurvey = await surveyRepository.findOne({
    where: { id: survey.id },
    relations: { questions: true },
  });


    res.send(new Survey(updatedSurvey!));
});


SurveyRouter.put<Empty, Survey | string, {}, Empty>(
  "/end",
  async (req, res) => {
    const surveyRepository = AppDataSource.getRepository(SurveyEntity);
    const school = req.user.school;

    // Find the survey for the school
    const survey = await surveyRepository.findOne({
      where: { school: { id: school.id } },
      relations: { questions: true },
    });

    if (!survey) {
      res.status(404).send("Survey not found");
      return;
    }

    // Update the active status and clear comments
    await surveyRepository.update(survey.id, {
      active: false,
      comments: [],
    });

    // Reload the survey with relations
    const updatedSurvey = await surveyRepository.findOne({
      where: { id: survey.id },
      relations: { questions: true },
    });

    res.send(new Survey(updatedSurvey!));
  }
);

SurveyRouter.get<Empty, Survey | string, Empty, Empty>("/", async (req, res) => {
  const surveyRepository = AppDataSource.getRepository(SurveyEntity);
  const school = req.user.school;

  // Find the survey for the school
  const survey = await surveyRepository.findOne({
    where: { school: { id: school.id } },
    relations: { questions: true },
  });

  let surveyModel: Survey;

  if (!survey) {
    // Return a survey with id=0 and no questions
    surveyModel = {
      id: 0,
      active: false,
      questions: [],
      comments: [],
    };
  } else {
    // Sort questions by order field
    if (survey.questions) {
      survey.questions.sort((a, b) => a.order - b.order);
    }

    surveyModel = new Survey(survey);

    // If user is not admin, set all star counts to 0
    if (req.user.role !== Role.ADMIN) {
      surveyModel.questions.forEach((question) => {
        question.oneStarCount = 0;
        question.twoStarCount = 0;
        question.threeStarCount = 0;
        question.fourStarCount = 0;
        question.fiveStarCount = 0;
      });
    }
  }

  res.send(surveyModel);
});

SurveyRouter.post<Empty, Empty | string, SubmitSurveyRequest, Empty>(
  "/submit",
  async (req, res) => {
    const surveyRepository = AppDataSource.getRepository(SurveyEntity);
    const questionRepository = AppDataSource.getRepository(QuestionEntity);
    const userRepository = AppDataSource.getRepository(UserEntity);
    const school = req.user.school;
    const { ratings, comment } = req.body;

    // Find the survey for the school
    const survey = await surveyRepository.findOne({
      where: { school: { id: school.id } },
      relations: { questions: true },
    });

    if (!survey) {
      res.status(404).send("Survey not found");
      return;
    }

    if (!survey.active) {
      res.status(400).send("Survey is not active");
      return;
    }

    survey.questions.sort((a, b) => a.order - b.order);

    // Validate ratings
    if (!Array.isArray(ratings)) {
      res.status(400).send("Ratings must be an array");
      return;
    }

    for (const rating of ratings) {
      if (rating < 0 || rating > 5) {
        res.status(400).send("Rating must be between 0 and 5");
        return;
      }
    }

    // Validate comment if provided
    if (comment !== undefined && comment !== null) {
      if (typeof comment !== "string" || comment.length > 500) {
        res.status(400).send("Comment must be a string with at most 500 characters");
        return;
      }
    }

    // Update star counts for each rating
    for (let i = 0; i < ratings.length; i++) {
      if (i >= survey.questions.length) {
        break;
      }

      const rating = ratings[i];
      if (rating === 0) {
        continue;
      }

      const question = survey.questions[i];

      // Increment the appropriate star count
      switch (rating) {
        case 1:
          question.oneStarCount += 1;
          break;
        case 2:
          question.twoStarCount += 1;
          break;
        case 3:
          question.threeStarCount += 1;
          break;
        case 4:
          question.fourStarCount += 1;
          break;
        case 5:
          question.fiveStarCount += 1;
          break;
      }

      await questionRepository.save(question);
    }

    // Add comment if provided
    if (comment !== undefined && comment !== null && comment.trim()) {
      const comments = survey.comments || [];
      comments.push(comment.trim());
      await surveyRepository.update(survey.id, { comments: comments });
    }

    // Update user's surveyCompleted status
    await userRepository.update(req.user.id, {
      surveyCompleted: true,
    });

    res.sendStatus(200);
  }
);

export default SurveyRouter;

