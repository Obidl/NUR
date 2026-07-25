import { Schema } from 'mongoose';

export const rightsSchema = new Schema(
  {
    licenseStatus: {
      type: String,
      enum: ['owned', 'licensed', 'permission_granted', 'public_domain', 'unknown'],
      required: true,
    },
    licenseNotes: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

export type RightsInfo = {
  licenseStatus: 'owned' | 'licensed' | 'permission_granted' | 'public_domain' | 'unknown';
  licenseNotes?: string | null;
};
