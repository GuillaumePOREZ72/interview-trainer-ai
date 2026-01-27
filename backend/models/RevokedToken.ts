import mongoose, { Schema, Document } from "mongoose";

export interface IRevokedToken extends Document {
  token: string;
  expiry: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>(
  {
    token: { type: String, required: true, unique: true },
    expiry: { type: Date, required: true },
  },
  { timestamps: true },
);

// Index for efficient cleanup of expired tokens
revokedTokenSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRevokedToken>("RevokedToken", revokedTokenSchema);