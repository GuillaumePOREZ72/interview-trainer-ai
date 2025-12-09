import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  session: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  note?: string;
  isPinned: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session" },
    question: String,
    answer: String,
    note: String,
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IQuestion>("Question", questionSchema);
