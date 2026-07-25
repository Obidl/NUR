import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const bookProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'BookChapter', required: true },
    position: {
      scrollRatio: { type: Number, default: 0, min: 0, max: 1 },
      blockId: { type: String, default: null },
    },
  },
  { timestamps: true, collection: 'book_progress' },
);

bookProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });
bookProgressSchema.index({ userId: 1, updatedAt: -1 });

export type BookProgressDocument = InferSchemaType<typeof bookProgressSchema> & {
  _id: Types.ObjectId;
};
export const BookProgressModel = model('BookProgress', bookProgressSchema);
