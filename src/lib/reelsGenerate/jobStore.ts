import type { ReelsGenerateJob, ReelsJobStatus } from "@/lib/reelsGenerate/types";

/** 개발용 인메모리 저장소. 프로덕션에서는 Redis/DB + 큐로 교체 */
const jobs = new Map<string, ReelsGenerateJob>();

export function createJob(initial: Omit<ReelsGenerateJob, "updatedAt">): ReelsGenerateJob {
  const now = new Date().toISOString();
  const job: ReelsGenerateJob = { ...initial, updatedAt: now };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): ReelsGenerateJob | undefined {
  return jobs.get(id);
}

export function patchJob(id: string, patch: Partial<ReelsGenerateJob>): ReelsGenerateJob | undefined {
  const cur = jobs.get(id);
  if (!cur) return undefined;
  const next: ReelsGenerateJob = {
    ...cur,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, next);
  return next;
}

export function setJobStatus(id: string, status: ReelsJobStatus, extra?: Partial<ReelsGenerateJob>): void {
  const cur = jobs.get(id);
  if (!cur) return;
  jobs.set(id, {
    ...cur,
    ...extra,
    status,
    updatedAt: new Date().toISOString(),
  });
}
