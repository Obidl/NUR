import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const podcastProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    episodeId: { type: Schema.Types.ObjectId, ref: 'PodcastEpisode', required: true },
    positionSeconds: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, required: true, min: 1 },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'podcast_progress',
  },
);

podcastProgressSchema.index({ userId: 1, episodeId: 1 }, { unique: true });
podcastProgressSchema.index({ userId: 1, updatedAt: -1 });

export type PodcastProgressDocument = InferSchemaType<typeof podcastProgressSchema> & {
  _id: Types.ObjectId;
};

export const PodcastProgressModel = model('PodcastProgress', podcastProgressSchema);
