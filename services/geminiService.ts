import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";

/**
 * MOCK SERVICE IMPLEMENTATION
 * 
 * Since the API Key requirement has been removed, this service now simulates
 * the behavior of the AI by returning generated placeholder data.
 * This allows the UI/UX to be tested and demonstrated without external dependencies.
 */

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateVocabularyLesson = async (request: GenerateRequest): Promise<VocabularyResponse> => {
  await delay(1500); // Simulate "Thinking..." time

  const word = request.word.trim();
  const context = request.context || "General context";

  // Return a realistic-looking structure based on the input word
  return {
    word: word,
    meaning: `[SIMULATED] This is a simulated definition for "${word}". In a real version, the AI would explain this accurately based on the context: "${context}".`,
    phonetics: `/ˈsɪmjʊˌleɪtɪd/`,
    partOfSpeech: "Noun/Verb (Simulated)",
    exampleSentences: [
      `This is the first example sentence using the word "${word}".`,
      `Here is another situation where "${word}" might be used appropriately.`,
      `Finally, a third example demonstrating "${word}" in a complex structure.`
    ],
    grammarNote: `Typically, "${word}" is used in formal or informal contexts. This is a placeholder for actual grammar rules.`,
    relatedExpressions: "Piece of cake, Break a leg, Once in a blue moon",
    imageUrl: undefined, // Will be handled by the image generator mock
    practice: {
      speakingPrompt: `Describe a situation where you would use the word "${word}".`,
      writingTask: `Write a short paragraph (3-4 sentences) incorporating "${word}".`
    }
  };
};

export const generateImageForWord = async (word: string): Promise<string | undefined> => {
  await delay(1000); // Simulate image generation time
  // Return a generic placeholder image with the word text
  return `https://placehold.co/800x600/14b8a6/ffffff?text=${encodeURIComponent(word)}`;
};

export const evaluatePronunciation = async (word: string, base64Audio: string, mimeType: string): Promise<PronunciationResult> => {
  await delay(2000); // Simulate audio analysis time

  // Generate a random score between 60 and 95
  const randomScore = Math.floor(Math.random() * (95 - 60 + 1)) + 60;

  return {
    score: randomScore,
    feedback: `[SIMULATED] Good effort pronouncing "${word}"! Since this is a demo mode without AI, we cannot analyze the actual audio file provided.`,
    improvementTip: "Try to articulate the vowel sounds more clearly and pay attention to the stress on the second syllable."
  };
};