import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

const bookChapterSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    body: { type: String, required: true },
    bodyFormat: { type: String, enum: ['html', 'markdown'], default: 'html' },
    status: { type: String, enum: CONTENT_STATUSES, default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'book_chapters' },
);

bookChapterSchema.index({ bookId: 1, slug: 1 }, { unique: true });
bookChapterSchema.index({ bookId: 1, order: 1 }, { unique: true });

export type BookChapterDocument = InferSchemaType<typeof bookChapterSchema> & {
  _id: Types.ObjectId;
};
export const BookChapterModel = model('BookChapter', bookChapterSchema);
