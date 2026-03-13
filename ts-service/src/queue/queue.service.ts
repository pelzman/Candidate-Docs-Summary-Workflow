import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
}

@Injectable()
export class QueueService {
  private readonly jobs: EnqueuedJob[] = [];

  enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload> {
    const job: EnqueuedJob<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
    };

    this.jobs.push(job);
    return job;
  }

  dequeue<TPayload>(name: string): EnqueuedJob<TPayload> | null {
    const index = this.jobs.findIndex((j) => j.name === name);
    if (index === -1) {
      return null;
    }
    const [job] = this.jobs.splice(index, 1);
    return job as EnqueuedJob<TPayload>;
  }

  getQueuedJobs(): readonly EnqueuedJob[] {
    return this.jobs;
  }
}

