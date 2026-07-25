import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

const podcastSeriesSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    hostOrScholar: { type: String, required: true, trim: true, maxlength: 200 },
    coverUrl: { type: String, required: true },
    language: { type: String, default: 'uz' },
    topics: { type: [String], default: [] },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: 'draft',
    },
    rights: { type: rightsSchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'podcast_series',
  },
);

podcastSeriesSchema.index({ status: 1, publishedAt: -1 });
podcastSeriesSchema.index({ deletedAt: 1, status: 1 });
podcastSeriesSchema.index({ topics: 1, status: 1 });

export type PodcastSeriesDocument = InferSchemaType<typeof podcastSeriesSchema> & {
  _id: Types.ObjectId;
};

export const PodcastSeriesModel = model('PodcastSeries', podcastSeriesSchema);
