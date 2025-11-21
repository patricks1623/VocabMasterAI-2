import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";

// Initialize the Gemini client
// The API key is strictly retrieved from the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "The word provided by the user." },
    meaning: { type: Type.STRING, description: "Concise definition in English. Use the most relevant definition based on context." },
    phonetics: { type: Type.STRING, description: "IPA Phonetic transcription (e.g., /ˌɪnˈkrɛdəbl/)." },
    partOfSpeech: { type: Type.STRING, description: "e.g., Noun, Adjective, Verb." },
    exampleSentences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 distinct example sentences demonstrating usage in varied contexts."
    },
    grammarNote: { type: Type.STRING, description: "Brief explanation of grammar rules, conjugation, collocations, or usage." },
    relatedExpressions: { type: Type.STRING, description: "Common phrasal verb, idiom, or fixed phrase (optional, empty if not relevant)." },
    practice: {
      type: Type.OBJECT,
      properties: {
        speakingPrompt: { type: Type.STRING, description: "An open-ended question requiring the user to use the word." },
        writingTask: { type: Type.STRING, description: "A concise writing instruction." }
      },
      required: ["speakingPrompt", "writingTask"]
    }
  },
  required: ["word", "meaning", "phonetics", "partOfSpeech", "exampleSentences", "grammarNote", "practice"]
};

const pronunciationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "A score from 0 to 100 representing pronunciation accuracy. Be generous for beginners." },
    feedback: { type: Type.STRING, description: "Encouraging feedback focusing on intelligibility." },
    improvementTip: { type: Type.STRING, description: "Simple, actionable advice on how to improve." }
  },
  required: ["score", "feedback", "improvementTip"]
};

const SYSTEM_INSTRUCTION = `
You are a highly structured, experienced, and enthusiastic English Vocabulary Professor specializing in linguistics and SLA (Second Language Acquisition).
You are known for clarity, precision, and engaging, practical teaching methods. Your tone is professional, encouraging, and educational.

Your Role:
Act as a Word Analyst and Activity Creator. You receive an English word (and optional context) and transform it into a complete study lesson.

Logic:
1. If the user provides a word with multiple meanings and NO context, use the most common dictionary meaning.
2. If context is provided, use it to select the accurate meaning.
3. ALL OUTPUT MUST BE 100% IN ENGLISH.
4. Do not include the URL generation in the text response; simply provide the data. The frontend application will handle URL generation for YouGlish and Images based on the word you return.
`;

export const generateVocabularyLesson = async (request: GenerateRequest): Promise<VocabularyResponse> => {
  const prompt = request.context 
    ? `Word: "${request.word}". Context provided by user: "${request.context}". Analyze this word.`
    : `Word: "${request.word}". Analyze this word (use most common meaning).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Slightly creative but focused
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response received from Gemini.");
    }

    return JSON.parse(textResponse) as VocabularyResponse;
  } catch (error) {
    console.error("Error generating vocabulary lesson:", error);
    throw error;
  }
};

export const generateImageForWord = async (word: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A clear, high-quality educational illustration representing the meaning of the English word "${word}". The image should be suitable for a vocabulary flashcard, photorealistic or detailed style, no text overlay.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return undefined;
  } catch (error) {
    console.error("Error generating vocabulary image:", error);
    return undefined;
  }
};

export const evaluatePronunciation = async (word: string, base64Audio: string, mimeType: string): Promise<PronunciationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `Listen to this audio. The user is a BEGINNER English learner trying to pronounce the word "${word}". 
            
            Instructions for evaluation:
            1. Be very encouraging, lenient, and supportive.
            2. Focus on INTELLIGIBILITY rather than perfect native accent. If you can understand the word, give a good score (above 75).
            3. Provide a generous score out of 100.
            4. Give friendly feedback highlighting what was good first, then gently mention one thing to improve.
            5. Provide a simple, easy-to-understand physical tip (e.g., "Open your mouth more", "Round your lips").`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: pronunciationSchema
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response received for pronunciation evaluation.");
    }

    return JSON.parse(textResponse) as PronunciationResult;
  } catch (error) {
    console.error("Error evaluating pronunciation:", error);
    throw error;
  }
};