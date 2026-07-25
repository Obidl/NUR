import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const preferencesSchema = new Schema(
  {
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    quranFontSize: {
      type: Number,
      default: 22,
      min: 16,
      max: 40,
    },
    reduceMotion: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      enum: ['uz'],
      default: 'uz',
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'editor', 'admin'],
      default: 'user',
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const UserModel = model('User', userSchema);
