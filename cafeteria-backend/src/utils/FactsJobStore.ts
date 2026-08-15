import { randomUUID } from "crypto";

export type FactsJobStatus = "running" | "complete" | "failed";

export interface FactsJob {
  id: string;
  schoolId: number;
  schoolYearId?: number;
  status: FactsJobStatus;
  message: string;
  error?: string;
  createdAt: number;
  consumed: boolean;
}

const JOB_TTL_MS = 10 * 60 * 1000;
const CONSUMED_DELETE_MS = 30 * 1000;

const jobs = new Map<string, FactsJob>();

const purgeExpiredJobs = () => {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.status === "running") {
      continue;
    }
    if (job.createdAt < cutoff) {
      jobs.delete(id);
    }
  }
};

export const createFactsJob = (
  schoolId: number,
  message: string,
  schoolYearId?: number,
): FactsJob => {
  purgeExpiredJobs();
  const job: FactsJob = {
    id: randomUUID(),
    schoolId,
    schoolYearId,
    status: "running",
    message,
    createdAt: Date.now(),
    consumed: false,
  };
  jobs.set(job.id, job);
  return job;
};

export const updateFactsJobMessage = (jobId: string, message: string) => {
  const job = jobs.get(jobId);
  if (job && job.status === "running") {
    job.message = message;
  }
};

export const completeFactsJob = (jobId: string, message: string) => {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }
  job.status = "complete";
  job.message = message;
};

export const failFactsJob = (jobId: string, message: string) => {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }
  job.status = "failed";
  job.message = message;
  job.error = message;
};

export const getFactsJob = (jobId: string): FactsJob | undefined => {
  purgeExpiredJobs();
  const job = jobs.get(jobId);
  if (!job) {
    return undefined;
  }

  if (
    (job.status === "complete" || job.status === "failed") &&
    !job.consumed
  ) {
    job.consumed = true;
    setTimeout(() => {
      jobs.delete(jobId);
    }, CONSUMED_DELETE_MS);
  }

  return job;
};
