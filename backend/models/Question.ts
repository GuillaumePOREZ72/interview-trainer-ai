import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  session: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  note?: string;
  isPinned: boolean;
  voiceTranscript?: string;
  vocalAnalysis?: {
    accuracy: number; // score de 0 à 100
    filledWords: string[]; // Liste des "euh", "enfin", "voilà" détectés
    sentiment: string; // "confiant", "hésitant", "stressé", etc."
    confidence: number; // score de certitude du STT
  };
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
    voiceTranscript: String,
    vocalAnalysis: {
      accuracy: { type: Number, default: 0 },
      filledWords: [String],
      sentiment: String,
      confidence: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model<IQuestion>("Question", questionSchema);
