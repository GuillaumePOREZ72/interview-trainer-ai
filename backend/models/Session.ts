import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  role: string;
  experience: string;
  topicsToFocus: string;
  description?: string;
  questions: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    topicsToFocus: { type: String, required: true },
    description: String,
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  },
  { timestamps: true }
);

export default mongoose.model<ISession>("Session", sessionSchema);
