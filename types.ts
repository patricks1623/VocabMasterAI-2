
export interface VocabularyResponse {
  word: string;
  meaning: string;
  phonetics: string;
  partOfSpeech: string;
  exampleSentences: string[];
  grammarNote: string;
  relatedExpressions?: string;
  practice: {
    speakingPrompt: string;
    writingTask: string;
  };
}

export interface GenerateRequest {
  word: string;
  context?: string;
}

export interface PronunciationResult {
  score: number;
  feedback: string;
  improvementTip: string;
}
