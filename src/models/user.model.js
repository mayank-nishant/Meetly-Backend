import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    token: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
