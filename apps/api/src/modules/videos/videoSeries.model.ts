import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

const videoSeriesSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    hostOrScholar: { type: String, required: true, trim: true, maxlength: 200 },
    coverUrl: { type: String, required: true },
    language: { type: String, default: 'uz' },
    topics: { type: [String], default: [] },
    channelUrl: { type: String, default: null },
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
    collection: 'video_series',
  },
);

videoSeriesSchema.index({ status: 1, publishedAt: -1 });
videoSeriesSchema.index({ deletedAt: 1, status: 1 });
videoSeriesSchema.index({ topics: 1, status: 1 });

export type VideoSeriesDocument = InferSchemaType<typeof videoSeriesSchema> & {
  _id: Types.ObjectId;
};

export const VideoSeriesModel = model('VideoSeries', videoSeriesSchema);
