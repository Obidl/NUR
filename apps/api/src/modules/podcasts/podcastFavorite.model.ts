import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const podcastFavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['series', 'episode'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'podcast_favorites',
  },
);

podcastFavoriteSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  { unique: true },
);

export type PodcastFavoriteDocument = InferSchemaType<typeof podcastFavoriteSchema> & {
  _id: Types.ObjectId;
};

export const PodcastFavoriteModel = model('PodcastFavorite', podcastFavoriteSchema);
