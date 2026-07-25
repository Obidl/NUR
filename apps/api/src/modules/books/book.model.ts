import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    authors: { type: [String], required: true, validate: [(v: string[]) => v.length > 0, 'authors required'] },
    translator: { type: String, default: null },
    description: { type: String, required: true, maxlength: 5000 },
    coverUrl: { type: String, required: true },
    language: { type: String, default: 'uz' },
    categories: { type: [String], default: [] },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    rights: { type: rightsSchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'books' },
);

bookSchema.index({ status: 1, publishedAt: -1 });
bookSchema.index({ categories: 1, status: 1 });

export type BookDocument = InferSchemaType<typeof bookSchema> & { _id: Types.ObjectId };
export const BookModel = model('Book', bookSchema);
