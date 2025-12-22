import { Question } from './question';
// src/types/session.ts
export interface Session {
  _id: string;
  role: string;
  experience: number;
  topicsToFocus: string;
  description: string;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionFormData {
  role: string;
  experience: string;
  topicsToFocus: string;
  description: string;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface ExplanationResponse {
  title: string;
  explanation: string;
}

export interface SessionResponse {
  session: Session;
}
