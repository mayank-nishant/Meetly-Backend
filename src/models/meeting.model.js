import { Schema, model } from 'mongoose';

const meetingSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    meetingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const Meeting = model('Meeting', meetingSchema);
