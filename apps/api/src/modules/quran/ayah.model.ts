import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';

const ayahSchema = new Schema(
  {
    surahNumber: { type: Number, required: true, min: 1, max: 114, index: true },
    ayahNumber: { type: Number, required: true, min: 1 },
    textArabic: { type: String, required: true },
    textUz: { type: String, default: null },
    globalAyahNumber: { type: Number, required: true, min: 1, max: 6236, unique: true },
    translationMeta: {
      type: new Schema(
        {
          translatorName: { type: String, required: true },
          translationKey: { type: String, required: true },
          rights: { type: rightsSchema, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    sourceMeta: {
      type: new Schema(
        {
          datasetName: { type: String, required: true },
          datasetVersion: { type: String, required: true },
          importedAt: { type: Date, required: true },
          checksum: { type: String, default: null },
        },
        { _id: false },
      ),
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'ayahs',
  },
);

ayahSchema.index({ surahNumber: 1, ayahNumber: 1 }, { unique: true });
ayahSchema.index({ textArabic: 'text', textUz: 'text' });

export type AyahDocument = InferSchemaType<typeof ayahSchema> & { _id: Types.ObjectId };
export const AyahModel = model('Ayah', ayahSchema);
