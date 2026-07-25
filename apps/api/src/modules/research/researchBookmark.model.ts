import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const researchBookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    articleId: { type: Schema.Types.ObjectId, ref: 'ResearchArticle', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'research_bookmarks' },
);

researchBookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export type ResearchBookmarkDocument = InferSchemaType<typeof researchBookmarkSchema> & {
  _id: Types.ObjectId;
};
export const ResearchBookmarkModel = model('ResearchBookmark', researchBookmarkSchema);
