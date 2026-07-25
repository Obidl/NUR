import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const pathProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pathId: { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
    currentLessonId: { type: Schema.Types.ObjectId, default: null },
    completedLessonIds: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true, collection: 'path_progress' },
);

pathProgressSchema.index({ userId: 1, pathId: 1 }, { unique: true });
pathProgressSchema.index({ userId: 1, updatedAt: -1 });

export type PathProgressDocument = InferSchemaType<typeof pathProgressSchema> & {
  _id: Types.ObjectId;
};
export const PathProgressModel = model('PathProgress', pathProgressSchema);
