import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

export const LESSON_TARGET_TYPES = [
  'quran_range',
  'podcast_episode',
  'video_episode',
  'book_chapter',
  'research_article',
] as const;

export type LessonTargetType = (typeof LESSON_TARGET_TYPES)[number];

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, required: true, min: 1 },
    estimatedMinutes: { type: Number, default: null, min: 1 },
    targetType: { type: String, enum: LESSON_TARGET_TYPES, required: true },
    targetRef: { type: Schema.Types.Mixed, required: true },
  },
  { _id: true },
);

const moduleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, required: true, min: 1 },
    summary: { type: String, default: null, trim: true, maxlength: 1000 },
    lessons: { type: [lessonSchema], default: [] },
  },
  { _id: true },
);

const learningPathSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
    coverUrl: { type: String, default: null },
    language: { type: String, default: 'uz' },
    authors: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length > 0, 'authors required'],
    },
    modules: { type: [moduleSchema], default: [] },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    rights: { type: rightsSchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'learning_paths' },
);

learningPathSchema.index({ status: 1, publishedAt: -1 });
learningPathSchema.index({ language: 1, status: 1 });

export type LearningPathDocument = InferSchemaType<typeof learningPathSchema> & {
  _id: Types.ObjectId;
};
export const LearningPathModel = model('LearningPath', learningPathSchema);
