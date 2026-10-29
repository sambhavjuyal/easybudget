import type { JobListing, GroundingSource } from './index';

export type JobsResult =
  | { ok: true; data: { jobs: JobListing[]; summary?: string }; sources: GroundingSource[] }
  | { ok: false; error: string };

export interface EasyBudgetApi {
  keyStatus(): Promise<{ saved: boolean; secure: boolean }>;
  saveKey(key: string): Promise<{ ok: boolean; error?: string }>;
  clearKey(): Promise<void>;
  searchJobs(req: { query?: string; location?: string; targetDeficit?: number; category?: string }): Promise<JobsResult>;
}

declare global {
  interface Window { easybudget?: EasyBudgetApi }
}
