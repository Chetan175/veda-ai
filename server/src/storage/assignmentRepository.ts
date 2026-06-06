import mongoose, { Schema, type Model } from 'mongoose';
import type { AssignmentRecord } from '@shared/assignment';
import { config } from '../config.js';

export interface AssignmentRepository {
  mode: 'mongo' | 'memory';
  list(): Promise<AssignmentRecord[]>;
  get(id: string): Promise<AssignmentRecord | null>;
  upsert(record: AssignmentRecord): Promise<AssignmentRecord>;
  delete(id: string): Promise<boolean>;
}

class MemoryAssignmentRepository implements AssignmentRepository {
  mode: 'memory' = 'memory';
  private readonly records = new Map<string, AssignmentRecord>();

  async list(): Promise<AssignmentRecord[]> {
    return [...this.records.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    );
  }

  async get(id: string): Promise<AssignmentRecord | null> {
    return this.records.get(id) ?? null;
  }

  async upsert(record: AssignmentRecord): Promise<AssignmentRecord> {
    this.records.set(record.id, structuredClone(record));
    return record;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}

type AssignmentMongoDocument = AssignmentRecord & {
  _id: mongoose.Types.ObjectId;
};

const assignmentSchema = new Schema<AssignmentMongoDocument>(
  {
    id: { type: String, unique: true, index: true, required: true },
    title: { type: String, required: true },
    dueDate: { type: String, required: true },
    instructions: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    request: { type: Schema.Types.Mixed, required: true },
    sourceFileName: { type: String },
    sourceFileType: { type: String },
    sourceFileText: { type: String },
    questionTypes: { type: [Schema.Types.Mixed], required: true } as any,
    status: { type: String, required: true },
    progress: { type: Number, required: true },
    progressLabel: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    generatedAt: { type: String },
    generatedPaper: { type: Schema.Types.Mixed },
    pdfPath: { type: String },
    pdfReady: { type: Boolean, default: false }
  },
  { versionKey: false }
);

let assignmentModel: Model<AssignmentMongoDocument> | null = null;

function getAssignmentModel(): Model<AssignmentMongoDocument> {
  assignmentModel ??=
    (mongoose.models.Assignment as Model<AssignmentMongoDocument> | undefined) ??
    mongoose.model<AssignmentMongoDocument>('Assignment', assignmentSchema);
  return assignmentModel;
}

class MongoAssignmentRepository implements AssignmentRepository {
  mode: 'mongo' = 'mongo';

  async list(): Promise<AssignmentRecord[]> {
    const model = getAssignmentModel();
    const records = await model.find().sort({ createdAt: -1 }).lean();
    return records as AssignmentRecord[];
  }

  async get(id: string): Promise<AssignmentRecord | null> {
    const model = getAssignmentModel();
    const record = await model.findOne({ id }).lean();
    return (record as AssignmentRecord | null) ?? null;
  }

  async upsert(record: AssignmentRecord): Promise<AssignmentRecord> {
    const model = getAssignmentModel();
    const updated = await model
      .findOneAndUpdate({ id: record.id }, record, {
        new: true,
        upsert: true
      })
      .lean();
    return (updated as AssignmentRecord | null) ?? record;
  }

  async delete(id: string): Promise<boolean> {
    const model = getAssignmentModel();
    const result = await model.deleteOne({ id });
    return result.deletedCount > 0;
  }
}

export async function createAssignmentRepository(): Promise<AssignmentRepository> {
  if (!config.mongoUri || config.demoMode) {
    return new MemoryAssignmentRepository();
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }
    return new MongoAssignmentRepository();
  } catch (error) {
    console.warn(
      `MongoDB unavailable, using in-memory assignment store instead. ${(error as Error).message}`
    );
    return new MemoryAssignmentRepository();
  }
}
