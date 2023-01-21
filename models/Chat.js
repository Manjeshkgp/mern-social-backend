import mongoose, { Schema } from "mongoose";

const ChatSchema = new Schema(
  {
    members: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
);

export default new mongoose.model("Chat",ChatSchema);