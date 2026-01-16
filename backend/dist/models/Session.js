import mongoose, { Schema } from "mongoose";
const sessionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    topicsToFocus: { type: String, required: true },
    description: String,
    language: { type: String, default: "en" },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
}, { timestamps: true });
export default mongoose.model("Session", sessionSchema);
