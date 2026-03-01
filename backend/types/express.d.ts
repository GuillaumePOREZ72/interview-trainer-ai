import { IMockInterviewSession } from "../models/MockInterviewSession";
import { IQuestion } from "../models/Question";
import { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      correlationId?: string;
      ownedSession?: any; // generic session to fit both regular and mock
      ownedQuestion?: any; // generic question
    }
  }
}

export { };
