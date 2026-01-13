import mongoose, { Document } from "mongoose";
export interface IQuestion extends Document {
    session: mongoose.Types.ObjectId;
    question: string;
    answer: string;
    note?: string;
    isPinned: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
declare const _default: mongoose.Model<IQuestion, {}, {}, {}, mongoose.Document<unknown, {}, IQuestion, {}, mongoose.DefaultSchemaOptions> & IQuestion & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IQuestion>;
export default _default;
