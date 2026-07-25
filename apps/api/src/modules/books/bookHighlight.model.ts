import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const bookHighlightSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'BookChapter', required: true },
    selectedText: { type: String, required: true, trim: true, maxlength: 2000 },
    note: { type: String, default: null, maxlength: 1000 },
    color: {
      type: String,
      enum: ['lamp', 'soft'],
      default: 'lamp',
    },
  },
  { timestamps: true, collection: 'book_highlights' },
);

bookHighlightSchema.index({ userId: 1, chapterId: 1, createdAt: -1 });
bookHighlightSchema.index({ userId: 1, bookId: 1 });

export type BookHighlightDocument = InferSchemaType<typeof bookHighlightSchema> & {
  _id: Types.ObjectId;
};
export const BookHighlightModel = model('BookHighlight', bookHighlightSchema);
