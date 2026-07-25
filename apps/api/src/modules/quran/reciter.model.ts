import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';

const reciterSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    bio: { type: String, default: null },
    photoUrl: { type: String, default: null },
    audioEdition: { type: String, required: true },
    cdnAyahBaseUrl: { type: String, required: true },
    cdnSurahBaseUrl: { type: String, required: true },
    rights: { type: rightsSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'reciters',
  },
);

export type ReciterDocument = InferSchemaType<typeof reciterSchema> & { _id: Types.ObjectId };
export const ReciterModel = model('Reciter', reciterSchema);
