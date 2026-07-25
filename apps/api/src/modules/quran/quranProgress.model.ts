import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const quranProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    surahNumber: { type: Number, required: true, min: 1, max: 114 },
    ayahNumber: { type: Number, required: true, min: 1 },
    mode: { type: String, enum: ['read', 'listen'], required: true },
  },
  {
    timestamps: true,
    collection: 'quran_progress',
  },
);

quranProgressSchema.index({ userId: 1, mode: 1 }, { unique: true });

export type QuranProgressDocument = InferSchemaType<typeof quranProgressSchema> & {
  _id: Types.ObjectId;
};
export const QuranProgressModel = model('QuranProgress', quranProgressSchema);
