import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const surahSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1, max: 114 },
    nameArabic: { type: String, required: true },
    nameLatin: { type: String, required: true },
    nameUz: { type: String, default: null },
    ayahCount: { type: Number, required: true, min: 1 },
    revelationType: {
      type: String,
      enum: ['meccan', 'medinan'],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'surahs',
  },
);

surahSchema.index({ nameLatin: 'text', nameUz: 'text', nameArabic: 'text' });

export type SurahDocument = InferSchemaType<typeof surahSchema> & { _id: Types.ObjectId };
export const SurahModel = model('Surah', surahSchema);
