import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

export const SOURCE_TYPES = [
  'book',
  'article',
  'scholar',
  'quran',
  'hadith_collection',
  'other',
] as const;

const contentSourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    type: { type: String, enum: SOURCE_TYPES, required: true },
    citation: { type: String, required: true, trim: true, maxlength: 1000 },
    url: { type: String, default: null },
    notes: { type: String, default: null, maxlength: 1000 },
  },
  { _id: false },
);

const researchArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 1000 },
    body: { type: String, required: true },
    bodyFormat: { type: String, enum: ['html', 'markdown'], default: 'html' },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    tags: { type: [String], default: [] },
    authors: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length > 0, 'authors required'],
    },
    reviewer: { type: String, default: null, maxlength: 120 },
    sources: { type: [contentSourceSchema], default: [] },
    language: { type: String, default: 'uz' },
    coverUrl: { type: String, default: null },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    rights: { type: rightsSchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'research_articles' },
);

researchArticleSchema.index({ status: 1, publishedAt: -1 });
researchArticleSchema.index({ category: 1, status: 1 });
researchArticleSchema.index({ tags: 1, status: 1 });

export type ResearchArticleDocument = InferSchemaType<typeof researchArticleSchema> & {
  _id: Types.ObjectId;
};
export const ResearchArticleModel = model('ResearchArticle', researchArticleSchema);
