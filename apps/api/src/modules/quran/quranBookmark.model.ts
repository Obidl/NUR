import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const quranBookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    surahNumber: { type: Number, required: true, min: 1, max: 114 },
    ayahNumber: { type: Number, required: true, min: 1 },
    note: { type: String, default: null, maxlength: 500 },
  },
  {
    timestamps: true,
    collection: 'quran_bookmarks',
  },
);

quranBookmarkSchema.index({ userId: 1, surahNumber: 1, ayahNumber: 1 }, { unique: true });
quranBookmarkSchema.index({ userId: 1, createdAt: -1 });

export type QuranBookmarkDocument = InferSchemaType<typeof quranBookmarkSchema> & {
  _id: Types.ObjectId;
};
export const QuranBookmarkModel = model('QuranBookmark', quranBookmarkSchema);
