import Session from "../models/Session";
import Question from "../models/Question";
import { logger } from "../config/logger";

class SessionService {
  async createSession(sessionData: {
    user: string;
    role: string;
    experience: string;
    topicsToFocus: string;
    description?: string;
    language: string;
    questions: Array<{ question: string; answer: string }>;
  }) {
    const {
      user,
      role,
      experience,
      topicsToFocus,
      description,
      language,
      questions,
    } = sessionData;

    const session = await Session.create({
      user,
      role,
      experience,
      topicsToFocus,
      description,
      language,
    });

    const questionDocs = await Promise.all(
      questions.map(async (q) => {
        const question = await Question.create({
          session: session._id,
          question: q.question,
          answer: q.answer,
        });
        return question._id;
      }),
    );

    session.questions = questionDocs;
    await session.save();

    return session;
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await Session.findById(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.user.toString() !== userId) {
      throw new Error("Not authorized to delete this session");
    }

    await Question.deleteMany({ session: session._id });
    await Session.deleteOne({ _id: sessionId });
  }

  async addQuestionsToSession(
    sessionId: string,
    questions: Array<{ question: string; answer: string }>,
  ) {
    const session = await Session.findById(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    const createdQuestions = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer,
      })),
    );

    session.questions.push(...createdQuestions.map((q) => q._id));
    await session.save();

    return createdQuestions;
  }

  async togglePinQuestion(questionId: string) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    question.isPinned = !question.isPinned;
    await question.save();

    return question;
  }

  async updateQuestionNote(questionId: string, note: string) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    question.note = note || "";
    await question.save();

    return question;
  }
}

export default new SessionService();
