import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'refresh_tokens',
  },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ revokedAt: 1 });

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema> & {
  _id: Types.ObjectId;
};

export const RefreshTokenModel = model('RefreshToken', refreshTokenSchema);
