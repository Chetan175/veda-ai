import type { User } from 'web/shared/user.js';
import { config } from '../config.js';

export interface UserRepository {
  mode: 'mongodb' | 'memory';
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  list(): Promise<User[]>;
  close(): Promise<void>;
}

// In-memory implementation for demo/development
class InMemoryUserRepository implements UserRepository {
  mode = 'memory' as const;
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async list(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async close(): Promise<void> {
    // No-op for in-memory
  }
}

// MongoDB implementation for production
class MongoDBUserRepository implements UserRepository {
  mode = 'mongodb' as const;
  private collection: any;

  constructor(collection: any) {
    this.collection = collection;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? mapDocToUser(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? mapDocToUser(doc) : null;
  }

  async create(user: User): Promise<User> {
    const result = await this.collection.insertOne(mapUserToDoc(user));
    return user;
  }

  async list(): Promise<User[]> {
    const docs = await this.collection.find({}).toArray();
    return docs.map(mapDocToUser);
  }

  async close(): Promise<void> {
    // No-op, connection is managed elsewhere
  }
}

function mapUserToDoc(user: User) {
  return {
    _id: user.id,
    ...user
  };
}

function mapDocToUser(doc: any): User {
  return {
    id: doc._id,
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    schoolName: doc.schoolName,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function createUserRepository(): Promise<UserRepository> {
  if (config.demoMode || !config.mongoUri) {
    console.log('Using in-memory user repository (demo mode)');
    return new InMemoryUserRepository();
  }

  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(config.mongoUri);
    await client.connect();
    const db = client.db('veda_ai');
    const collection = db.collection('users');

    // Create index on email for uniqueness
    await collection.createIndex({ email: 1 }, { unique: true });

    return new MongoDBUserRepository(collection);
  } catch (error) {
    console.error('Failed to connect to MongoDB, falling back to in-memory storage', error);
    return new InMemoryUserRepository();
  }
}
