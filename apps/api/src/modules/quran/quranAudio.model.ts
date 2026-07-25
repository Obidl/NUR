import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';

const quranAudioSchema = new Schema(
  {
    reciterId: { type: Schema.Types.ObjectId, ref: 'Reciter', required: true, index: true },
    scope: { type: String, enum: ['ayah', 'surah'], required: true },
    surahNumber: { type: Number, required: true, min: 1, max: 114 },
    ayahNumber: { type: Number, default: null, min: 1 },
    audioUrl: { type: String, required: true },
    durationSeconds: { type: Number, default: null },
    bitrateKbps: { type: Number, default: null },
    rights: { type: rightsSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'quran_audio',
  },
);

quranAudioSchema.index({ reciterId: 1, surahNumber: 1, ayahNumber: 1 });
quranAudioSchema.index({ scope: 1, surahNumber: 1 });

export type QuranAudioDocument = InferSchemaType<typeof quranAudioSchema> & {
  _id: Types.ObjectId;
};
export const QuranAudioModel = model('QuranAudio', quranAudioSchema);
