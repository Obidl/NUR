import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { rightsSchema } from '../../shared/types/rights.js';
import { CONTENT_STATUSES } from '../../shared/utils/content.js';

const podcastEpisodeSchema = new Schema(
  {
    seriesId: {
      type: Schema.Types.ObjectId,
      ref: 'PodcastSeries',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 10000 },
    audioUrl: { type: String, required: true },
    coverUrl: { type: String, default: null },
    durationSeconds: { type: Number, required: true, min: 1 },
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
    collection: 'podcast_episodes',
  },
);

podcastEpisodeSchema.index({ seriesId: 1, slug: 1 }, { unique: true });
podcastEpisodeSchema.index({ seriesId: 1, episodeNumber: 1 });
podcastEpisodeSchema.index({ status: 1, publishedAt: -1 });

export type PodcastEpisodeDocument = InferSchemaType<typeof podcastEpisodeSchema> & {
  _id: Types.ObjectId;
};

export const PodcastEpisodeModel = model('PodcastEpisode', podcastEpisodeSchema);
