import IORedis from 'ioredis';
import type { AssignmentRecord } from '@shared/assignment';
import { config } from '../config.js';

export interface AssignmentStateCache {
  mode: 'redis' | 'memory';
  get(id: string): Promise<AssignmentRecord | null>;
  set(record: AssignmentRecord): Promise<void>;
  delete(id: string): Promise<void>;
  close(): Promise<void>;
}

class MemoryAssignmentStateCache implements AssignmentStateCache {
  mode: 'memory' = 'memory';
  private readonly values = new Map<string, AssignmentRecord>();

  async get(id: string): Promise<AssignmentRecord | null> {
    return this.values.get(id) ?? null;
  }

  async set(record: AssignmentRecord): Promise<void> {
    this.values.set(record.id, structuredClone(record));
  }

  async delete(id: string): Promise<void> {
    this.values.delete(id);
  }

  async close(): Promise<void> {
    return;
  }
}

class RedisAssignmentStateCache implements AssignmentStateCache {
  mode: 'redis' = 'redis';

  constructor(private readonly client: IORedis) {}

  async get(id: string): Promise<AssignmentRecord | null> {
    const raw = await this.client.get(`assignment:${id}`);
    return raw ? (JSON.parse(raw) as AssignmentRecord) : null;
  }

  async set(record: AssignmentRecord): Promise<void> {
    await this.client.set(`assignment:${record.id}`, JSON.stringify(record));
  }

  async delete(id: string): Promise<void> {
    await this.client.del(`assignment:${id}`);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

export async function createAssignmentStateCache(): Promise<AssignmentStateCache> {
  if (!config.redisUrl || config.demoMode) {
    return new MemoryAssignmentStateCache();
  }

  try {
    const client = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });
    await client.ping();
    return new RedisAssignmentStateCache(client);
  } catch (error) {
    console.warn(
      `Redis unavailable, using in-memory assignment cache instead. ${(error as Error).message}`
    );
    return new MemoryAssignmentStateCache();
  }
}
