import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

const videoEpisodeSchema = new Schema(
  {
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'VideoSeries',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 10000 },
    youtubeVideoId: { type: String, required: true, trim: true, maxlength: 32 },
    coverUrl: { type: String, default: null },
    durationSeconds: { type: Number, default: null, min: 1 },
    episodeNumber: { type: Number, default: null, min: 1 },
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
    collection: 'video_episodes',
  },
);

videoEpisodeSchema.index({ seriesId: 1, slug: 1 }, { unique: true });
videoEpisodeSchema.index({ seriesId: 1, episodeNumber: 1 });
videoEpisodeSchema.index({ status: 1, publishedAt: -1 });
videoEpisodeSchema.index({ youtubeVideoId: 1 });

export type VideoEpisodeDocument = InferSchemaType<typeof videoEpisodeSchema> & {
  _id: Types.ObjectId;
};

export const VideoEpisodeModel = model('VideoEpisode', videoEpisodeSchema);
