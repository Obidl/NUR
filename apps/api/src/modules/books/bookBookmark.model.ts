import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const bookBookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'BookChapter', required: true },
    note: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'book_bookmarks' },
);

bookBookmarkSchema.index({ userId: 1, bookId: 1, chapterId: 1 }, { unique: true });

export type BookBookmarkDocument = InferSchemaType<typeof bookBookmarkSchema> & {
  _id: Types.ObjectId;
};
export const BookBookmarkModel = model('BookBookmark', bookBookmarkSchema);
