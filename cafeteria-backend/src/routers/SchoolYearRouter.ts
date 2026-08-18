import express, { Router } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { authorizeUserWithRole } from "./RouterUtils";
import { DateTimeUtils } from "../DateTimeUtils";

import SchoolYearEntity from "../entity/SchoolYearEntity";
import SchoolYear from "../models/SchoolYear";
import SchoolYearLunchTimeEntity from "../entity/SchoolYearLunchTimeEntity";
import SchoolEntity from "../entity/SchoolEntity";
import { Role } from "../models/User";
import DailyLunchTimes from "../models/DailyLunchTimes";
import GradeLunchTimeEntity from "../entity/GradeLunchTimeEntity";
import { GradeLevel } from "../models/GradeLevel";
import TeacherLunchTimeEntity from "../entity/TeacherLunchTimeEntity";
import UserEntity from "../entity/UserEntity";
import UserStatusEntity from "../entity/UserStatusEntity";
import SurveyEntity from "../entity/SurveyEntity";
import { getAdminSession, SessionInfo } from "./SessionRouter";
import { Not, IsNull } from "typeorm";
import StudentLunchTimeEntity from "../entity/StudentLunchTimeEntity";
import { FactsService } from "../services/FactsService";
import {
  completeFactsJob,
  createFactsJob,
  failFactsJob,
  getFactsJob,
  updateFactsJobMessage,
} from "../utils/FactsJobStore";

export interface CreateSchoolYearResponse {
  schoolYear: SchoolYear;
  jobId: string | null;
}

export interface FactsJobStartResponse {
  jobId: string;
}

export interface FactsJobStatusResponse {
  id: string;
  status: "running" | "complete" | "failed";
  message: string;
  schoolYearId?: number;
}

const SchoolYearRouter: Router = express.Router();

SchoolYearRouter.get<{}, SchoolYear[] | string, {}, {}>(
  "/facts",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const factsApiKey = req.school?.factsApiKey?.trim();

    if (!factsApiKey) {
      res.status(400).send("FACTS API key is not configured for this school.");
      return;
    }

    try {
      const existingFactsIds = new Set(
        (
          await AppDataSource.getRepository(SchoolYearEntity).find({
            where: {
              school: { id: req.school.id },
              factsId: Not(IsNull()),
            },
            select: ["factsId"],
          })
        )
          .map((schoolYear) => schoolYear.factsId)
          .filter((factsId): factsId is number => factsId !== null),
      );

      const today = DateTimeUtils.toString(DateTimeUtils.getCurrentDate());
      const schoolYears = (
        await FactsService.getSchoolYears(req.school)
      ).filter(
        (year) =>
          year.factsId !== null &&
          !existingFactsIds.has(year.factsId) &&
          ((year.startDate && year.startDate >= today) ||
            (year.endDate && year.endDate >= today)),
      );

      res.send(schoolYears);
    } catch (error) {
      console.error("Error fetching FACTS school years:", error);
      if (axios.isAxiosError(error)) {
        res
          .status(error.response?.status ?? 502)
          .send(
            (error.response?.data as { detail?: string; title?: string })
              ?.detail ??
              (error.response?.data as { title?: string })?.title ??
              error.message ??
              "Failed to fetch FACTS school years",
          );
        return;
      }
      if (error instanceof Error && error.message.includes("not configured")) {
        res.status(500).send(error.message);
        return;
      }
      res.status(500).send("Failed to fetch FACTS school years");
    }
  },
);

SchoolYearRouter.get<
  { jobId: string },
  FactsJobStatusResponse | string,
  {},
  {}
>("/jobs/:jobId", authorizeUserWithRole(Role.ADMIN), async (req, res) => {
  const job = getFactsJob(req.params.jobId);
  if (!job) {
    res.status(404).send("Job not found");
    return;
  }
  if (job.schoolId !== req.school.id) {
    res.status(403).send("Unauthorized");
    return;
  }

  res.send({
    id: job.id,
    status: job.status,
    message: job.message,
    schoolYearId: job.schoolYearId,
  });
});

SchoolYearRouter.post<{}, CreateSchoolYearResponse | string, SchoolYear, {}>(
  "/",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (startDate > endDate) {
      const tmpDate = startDate;
      startDate = endDate;
      endDate = tmpDate;
    }

    const existingSchoolYears: SchoolYearEntity[] =
      await AppDataSource.createQueryBuilder()
        .relation(SchoolEntity, "schoolYears")
        .of(req.school)
        .loadMany();

    const overlappingSchoolYear: SchoolYearEntity | undefined =
      existingSchoolYears.find((esy) => startDate === esy.startDate);

    if (overlappingSchoolYear) {
      res.status(400).send("Duplicate school year start dates");
      return;
    }

    const newSchoolYear = await schoolYearRepository.save({
      name: req.body.name,
      startDate: startDate,
      endDate: endDate,
      factsId: req.body.factsId ?? null,
      isCurrent: false,
      hideSchedule: req.body.hideSchedule,
      school: req.school,
    });

    if (existingSchoolYears.length > 0) {
      const nearestSchoolYear = existingSchoolYears.reduce((nearest, year) => {
        const nearestDelta = Math.abs(
          new Date(nearest.endDate).getTime() - new Date(startDate).getTime(),
        );
        const yearDelta = Math.abs(
          new Date(year.endDate).getTime() - new Date(startDate).getTime(),
        );
        return yearDelta < nearestDelta ? year : nearest;
      });

      const sourceSchoolYear = await schoolYearRepository.findOne({
        where: { id: nearestSchoolYear.id },
        relations: { lunchTimes: true, gradeLunchTimes: true },
      });

      if (sourceSchoolYear) {
        await schoolYearRepository.update(newSchoolYear.id, {
          gradesAssignedByClass: sourceSchoolYear.gradesAssignedByClass,
        });
        newSchoolYear.gradesAssignedByClass =
          sourceSchoolYear.gradesAssignedByClass;

        const schoolLunchTimeRepository = AppDataSource.getRepository(
          SchoolYearLunchTimeEntity,
        );
        const gradeLunchTimeRepository = AppDataSource.getRepository(
          GradeLunchTimeEntity,
        );

        newSchoolYear.lunchTimes = [];
        for (const lunchTime of sourceSchoolYear.lunchTimes ?? []) {
          newSchoolYear.lunchTimes.push(
            await schoolLunchTimeRepository.save({
              dayOfWeek: lunchTime.dayOfWeek,
              time: lunchTime.time,
              schoolYear: newSchoolYear,
            }),
          );
        }

        newSchoolYear.gradeLunchTimes = [];
        for (const gradeLunchTime of sourceSchoolYear.gradeLunchTimes ?? []) {
          newSchoolYear.gradeLunchTimes.push(
            await gradeLunchTimeRepository.save({
              dayOfWeek: gradeLunchTime.dayOfWeek,
              time: gradeLunchTime.time,
              blockedDates: gradeLunchTime.blockedDates,
              grade: gradeLunchTime.grade,
              schoolYear: newSchoolYear,
            }),
          );
        }
      }
    }

    if (newSchoolYear.factsId) {
      const school = req.school;
      const schoolYearId = newSchoolYear.id;
      const job = createFactsJob(
        school.id,
        "Importing school year from FACTS…",
        schoolYearId,
      );

      setImmediate(() => {
        void (async () => {
          try {
            const schoolYear = await AppDataSource.getRepository(
              SchoolYearEntity,
            ).findOne({
              where: { id: schoolYearId },
              relations: { school: true },
            });
            if (!schoolYear) {
              failFactsJob(job.id, "School year not found during import.");
              return;
            }

            // const importError = await FactsService.captureSchoolYearTestData(
            //   school,
            //   schoolYear,
            //   999,
            //   5,
            //   (message) => updateFactsJobMessage(job.id, message),
            // );

            await AppDataSource.getRepository(SurveyEntity).update(
              { school: { id: school.id } },
              { active: false },
            );
            await AppDataSource.getRepository(UserStatusEntity).update(
              { school: { id: school.id } },
              { surveyCompleted: false },
            );

            const importError = await FactsService.synchronizeSchoolYear(
              school,
              schoolYear,
              (message) => updateFactsJobMessage(job.id, message),
            );
            if (importError) {
              failFactsJob(job.id, importError);
              return;
            }
            completeFactsJob(job.id, "Import from FACTS is complete.");
          } catch (error) {
            console.error("FACTS import job failed:", error);
            failFactsJob(
              job.id,
              error instanceof Error
                ? error.message
                : "Import failed due to an unexpected error.",
            );
          }
        })();
      });

      res.send({
        schoolYear: new SchoolYear(newSchoolYear),
        jobId: job.id,
      });
      return;
    }

    res.send({
      schoolYear: new SchoolYear(newSchoolYear),
      jobId: null,
    });
  },
);

SchoolYearRouter.put<{}, SchoolYear | string, SchoolYear, {}>(
  "/",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (startDate > endDate) {
      const tmpDate = startDate;
      startDate = endDate;
      endDate = tmpDate;
    }

    const existingSchoolYears: SchoolYearEntity[] =
      await AppDataSource.createQueryBuilder()
        .relation(SchoolEntity, "schoolYears")
        .of(req.school)
        .loadMany();

    const overlappingSchoolYear: SchoolYearEntity | undefined =
      existingSchoolYears.find(
        (esy) => !(endDate < esy.startDate || startDate > esy.endDate),
      );

    if (overlappingSchoolYear && overlappingSchoolYear.id !== req.body.id) {
      res.status(400).send("Overlapping school year dates");
      return;
    }

    const existingSchoolYear = await schoolYearRepository.findOne({
      where: { id: req.body.id },
      relations: { school: true },
    });

    if (!existingSchoolYear) {
      res.status(404).send("School year not found");
      return;
    }

    if (existingSchoolYear.school.id !== req.school.id) {
      res.status(403).send("Unauthorized");
      return;
    }

    await schoolYearRepository.update(req.body.id, {
      name: req.body.name,
      startDate: startDate,
      endDate: endDate,
      hideSchedule: req.body.hideSchedule,
    });

    const updatedSchoolYear = await schoolYearRepository.findOne({
      where: { id: req.body.id },
    });

    res.send(new SchoolYear(updatedSchoolYear!));
  },
);

SchoolYearRouter.post<
  { schoolYearId: string; teacherId: string },
  {},
  DailyLunchTimes[],
  {}
>(
  "/:schoolYearId/teacher/:teacherId/times",
  authorizeUserWithRole(),
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
    const teacherLunchTimeRepository = AppDataSource.getRepository(
      TeacherLunchTimeEntity,
    );
    const userRepository = AppDataSource.getRepository(UserEntity);

    let schoolYear = await schoolYearRepository.findOne({
      where: { id: parseInt(req.params.schoolYearId) },
      relations: { teacherLunchTimes: { teacher: true } },
    });

    if (!schoolYear) {
      res.status(401).send("School year not found");
      return;
    }

    const teacher = await userRepository.findOne({
      where: { id: parseInt(req.params.teacherId) },
    });

    if (!teacher) {
      res.status(401).send("Teacher not found");
      return;
    }

    for (const dlt of req.body) {
      const newTimes = dlt.times.sort().join("|");
      const newGrades = (dlt as any).grades
        ? (dlt as any).grades.join("|")
        : "";
      const dailyTimes = schoolYear.teacherLunchTimes.find(
        (lt) => lt.dayOfWeek === dlt.dayOfWeek && lt.teacher.id === teacher.id,
      );
      const newBlockedDates = Array.isArray((dlt as any).blockedDates)
        ? (dlt as any).blockedDates.join("|")
        : (dailyTimes?.blockedDates ?? "");

      if (dailyTimes) {
        if (
          dailyTimes.time !== newTimes ||
          dailyTimes.grades !== newGrades ||
          dailyTimes.blockedDates !== newBlockedDates
        ) {
          await teacherLunchTimeRepository.update(dailyTimes.id, {
            time: newTimes,
            grades: newGrades,
            blockedDates: newBlockedDates,
          });
        }
      } else {
        await teacherLunchTimeRepository.save({
          dayOfWeek: dlt.dayOfWeek,
          time: newTimes,
          grades: newGrades,
          blockedDates: newBlockedDates,
          schoolYear: schoolYear,
          teacher: teacher,
        });
      }
    }

    res.sendStatus(200);
  },
);

SchoolYearRouter.post<
  { schoolYearId: string; teacherId: string; newTeacherId: string },
  {},
  DailyLunchTimes[],
  {}
>(
  "/:schoolYearId/teacher/:teacherId/replacewith/:newTeacherId",
  authorizeUserWithRole(),
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
    const teacherLunchTimeRepository = AppDataSource.getRepository(
      TeacherLunchTimeEntity,
    );
    const userRepository = AppDataSource.getRepository(UserEntity);

    let schoolYear = await schoolYearRepository.findOne({
      where: { id: parseInt(req.params.schoolYearId) },
      relations: {
        teacherLunchTimes: { teacher: true },
      },
    });

    if (!schoolYear) {
      res.status(401).send("School year not found");
      return;
    }

    const teacher = await userRepository.findOne({
      where: { id: parseInt(req.params.teacherId) },
    });

    if (!teacher) {
      res.status(401).send("Teacher not found");
      return;
    }

    const newTeacher = await userRepository.findOne({
      where: { id: parseInt(req.params.newTeacherId) },
    });

    if (!newTeacher) {
      res.status(401).send("New teacher not found");
      return;
    }

    if (
      schoolYear.teacherLunchTimes.some(
        (tlt) => tlt.teacher.id === newTeacher.id,
      )
    ) {
      res.status(401).send("New teacher already has lunch times");
      return;
    }

    await teacherLunchTimeRepository.update(
      {
        teacher: { id: teacher.id },
        schoolYear: { id: schoolYear.id },
      },
      { teacher: newTeacher },
    );

    const studentLunchTimeRepository = AppDataSource.getRepository(
      StudentLunchTimeEntity,
    );

    await studentLunchTimeRepository.update(
      {
        lunchtimeTeacher: { id: teacher.id },
        schoolYear: { id: schoolYear.id },
      },
      { lunchtimeTeacher: newTeacher },
    );

    res.sendStatus(200);
  },
);

SchoolYearRouter.post<
  { schoolYearId: string },
  DailyLunchTimes[] | string,
  DailyLunchTimes[],
  {}
>("/:schoolYearId/times", authorizeUserWithRole(), async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const schoolLunchTimeRepository = AppDataSource.getRepository(
    SchoolYearLunchTimeEntity,
  );

  let schoolYear = await schoolYearRepository.findOne({
    where: { id: parseInt(req.params.schoolYearId) },
    relations: { lunchTimes: true },
  });

  if (!schoolYear) {
    res.status(401).send("School year not found");
    return;
  }

  for (const dlt of req.body) {
    const newTimes = dlt.times.join("|");
    const dailyTimes = schoolYear.lunchTimes.find(
      (lt) => lt.dayOfWeek === dlt.dayOfWeek,
    );
    if (dailyTimes) {
      await schoolLunchTimeRepository.update(dailyTimes.id, {
        time: newTimes,
      });
      dailyTimes.time = newTimes;
    } else {
      schoolYear.lunchTimes.push(
        await schoolLunchTimeRepository.save({
          dayOfWeek: dlt.dayOfWeek,
          time: newTimes,
          schoolYear: schoolYear,
        }),
      );
    }
  }
  res.status(200).send(
    schoolYear.lunchTimes.map((sylt) => ({
      dayOfWeek: sylt.dayOfWeek,
      times: sylt.time ? sylt.time.split("|") : [],
    })),
  );
});

SchoolYearRouter.put<
  { schoolYearId: string },
  SchoolYear | string,
  GradeLevel[],
  {}
>("/:schoolYearId/gradeconfig", authorizeUserWithRole(Role.ADMIN), async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const schoolYear = await schoolYearRepository.findOne({
    where: {
      id: parseInt(req.params.schoolYearId),
    },
    relations: { school: true },
  });

  if (!schoolYear) {
    res.status(404).send("Current school year not found");
    return;
  }

  await schoolYearRepository.update(schoolYear.id, {
    gradesAssignedByClass: req.body.join("|"),
  });

  const updatedSchoolYear = await schoolYearRepository.findOne({
    where: { id: schoolYear.id },
  });

  res.send(new SchoolYear(updatedSchoolYear!));
});

SchoolYearRouter.put<
  { schoolYearId: string },
  SchoolYear | string,
  { oneTeacherPerStudent: boolean },
  {}
>("/:schoolYearId/teacher-config", authorizeUserWithRole(Role.ADMIN), async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

  const schoolYear = await schoolYearRepository.findOne({
    where: {
      id: parseInt(req.params.schoolYearId),
    },
    relations: { school: true },
  });

  if (!schoolYear) {
    res.status(404).send("School year not found");
    return;
  }

  if (schoolYear.school.id !== req.school.id) {
    res.status(403).send("Unauthorized");
    return;
  }

  await schoolYearRepository.update(schoolYear.id, {
    oneTeacherPerStudent: req.body.oneTeacherPerStudent,
  });

  const updatedSchoolYear = await schoolYearRepository.findOne({
    where: { id: schoolYear.id },
  });

  res.send(new SchoolYear(updatedSchoolYear!));
});

SchoolYearRouter.post<
  { schoolYearId: string; grade: string },
  {},
  DailyLunchTimes[],
  {}
>("/:schoolYearId/grade/:grade/times", authorizeUserWithRole(), async (req, res) => {
  const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
  const gradeLunchTimeRepository =
    AppDataSource.getRepository(GradeLunchTimeEntity);

  let schoolYear = await schoolYearRepository.findOne({
    where: { id: parseInt(req.params.schoolYearId) },
    relations: { gradeLunchTimes: true },
  });

  if (!schoolYear) {
    res.status(401).send("School year not found");
    return;
  }

  const grade = req.params.grade as GradeLevel;
  if (!Object.values(GradeLevel).includes(grade)) {
    res.status(400).send("Invalid grade level");
    return;
  }

  for (const dlt of req.body) {
    const newTimes = dlt.times.sort().join("|");
    const dailyTimes = schoolYear.gradeLunchTimes.find(
      (lt) => lt.dayOfWeek === dlt.dayOfWeek && lt.grade === grade,
    );
    const newBlockedDates = Array.isArray((dlt as any).blockedDates)
      ? (dlt as any).blockedDates.join("|")
      : (dailyTimes?.blockedDates ?? "");

    if (dailyTimes) {
      if (
        dailyTimes.time !== newTimes ||
        dailyTimes.blockedDates !== newBlockedDates
      ) {
        await gradeLunchTimeRepository.update(dailyTimes.id, {
          time: newTimes,
          blockedDates: newBlockedDates,
        });
      }
    } else {
      await gradeLunchTimeRepository.save({
        dayOfWeek: dlt.dayOfWeek,
        time: newTimes,
        blockedDates: newBlockedDates,
        grade,
        schoolYear,
      });
    }
  }

  res.sendStatus(200);
});

SchoolYearRouter.put<{ schoolYearId: string }, SessionInfo | string, {}, {}>(
  "/:schoolYearId/toggle-current",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);

    const schoolYear = await schoolYearRepository.findOne({
      where: { id: parseInt(req.params.schoolYearId) },
      relations: { school: true },
    });

    if (!schoolYear) {
      res.status(404).send("School year not found");
      return;
    }

    if (schoolYear.school.id !== req.school.id) {
      res.status(403).send("Unauthorized");
      return;
    }

    const isCurrent = !schoolYear.isCurrent;

    // If we're activating this year, deactivate all other years first
    if (isCurrent) {
      await schoolYearRepository.update(
        { school: { id: req.school.id } },
        { isCurrent: false },
      );
    }

    await schoolYearRepository.update(schoolYear.id, {
      isCurrent,
      hideSchedule: !isCurrent ? true : schoolYear.hideSchedule,
    });

    const updatedSessionInfo: SessionInfo = await getAdminSession(
      req.user,
      req.school,
    );

    res.send(updatedSessionInfo);
  },
);

SchoolYearRouter.post<
  { schoolYearId: string },
  FactsJobStartResponse | string,
  {},
  {}
>(
  "/:schoolYearId/synchronize",
  authorizeUserWithRole(Role.ADMIN),
  async (req, res) => {
    const factsApiKey = req.school?.factsApiKey?.trim();
    if (!factsApiKey) {
      res.status(400).send("FACTS API key is not configured for this school.");
      return;
    }

    const schoolYearRepository = AppDataSource.getRepository(SchoolYearEntity);
    const schoolYear = await schoolYearRepository.findOne({
      where: { id: parseInt(req.params.schoolYearId) },
      relations: { school: true },
    });

    if (!schoolYear) {
      res.status(404).send("School year not found");
      return;
    }

    if (schoolYear.school.id !== req.school.id) {
      res.status(403).send("Unauthorized");
      return;
    }

    if (!schoolYear.factsId) {
      res.status(400).send("School year is not linked to a FACTS year.");
      return;
    }

    const school = req.school;
    const schoolYearId = schoolYear.id;
    const job = createFactsJob(
      school.id,
      "Synchronizing with FACTS…",
      schoolYearId,
    );

    setImmediate(() => {
      void (async () => {
        try {
          const year = await schoolYearRepository.findOne({
            where: { id: schoolYearId },
            relations: { school: true },
          });
          if (!year) {
            failFactsJob(job.id, "School year not found during synchronization.");
            return;
          }

          const syncError = await FactsService.synchronizeSchoolYear(
            school,
            year,
            (message) => updateFactsJobMessage(job.id, message),
          );
          if (syncError) {
            failFactsJob(job.id, syncError);
            return;
          }
          completeFactsJob(job.id, "Synchronization with FACTS is complete.");
        } catch (error) {
          console.error("FACTS sync job failed:", error);
          failFactsJob(
            job.id,
            error instanceof Error
              ? error.message
              : "Synchronization failed due to an unexpected error.",
          );
        }
      })();
    });

    res.send({ jobId: job.id });
  },
);

export default SchoolYearRouter;
