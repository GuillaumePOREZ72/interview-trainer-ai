import mongoose, { Document } from "mongoose";
export interface ISession extends Document {
    user: mongoose.Types.ObjectId;
    role: string;
    experience: string;
    topicsToFocus: string;
    description?: string;
    language: string;
    questions: mongoose.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}
declare const _default: mongoose.Model<ISession, {}, {}, {}, mongoose.Document<unknown, {}, ISession, {}, mongoose.DefaultSchemaOptions> & ISession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, ISession>;
export default _default;
