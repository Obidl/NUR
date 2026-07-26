import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const videoProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    episodeId: { type: Schema.Types.ObjectId, ref: 'VideoEpisode', required: true },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'video_progress',
  },
);

videoProgressSchema.index({ userId: 1, episodeId: 1 }, { unique: true });
videoProgressSchema.index({ userId: 1, updatedAt: -1 });

export type VideoProgressDocument = InferSchemaType<typeof videoProgressSchema> & {
  _id: Types.ObjectId;
};

export const VideoProgressModel = model('VideoProgress', videoProgressSchema);
