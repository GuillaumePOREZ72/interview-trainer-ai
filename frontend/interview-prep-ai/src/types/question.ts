export interface Question {
  _id?: string;
  question: string;
  answer: string;
  isPinned?: boolean;
  voiceTranscript?: string;
  vocalAnalysis?: {
    accuracy: number;
    fillerWords: string[];
    sentiment: string;
    confidence: number;
  };
}
