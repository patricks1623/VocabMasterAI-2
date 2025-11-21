import { GoogleGenAI, Type } from "@google/genai";
import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";

// Utility to clean JSON if the model returns markdown formatting
const cleanJsonText = (text: string): string => {
  if (!text) return "";
  let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  // Ensure we start with { and end with }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace >= 0) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return clean;
};

const responseSchema = {
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

const pronunciationSchema = {
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

// Helper to validate key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key || key.trim() === '') {
    throw new Error("API Key is missing. If you are on a hosted platform (Netlify/Vercel), ensure the Environment Variable is set and you have redeployed the site.");
  }
  return key;
};

export const generateVocabularyLesson = async (request: GenerateRequest): Promise<VocabularyResponse> => {
  const prompt = request.context 
    ? `Word: "${request.word}". Context provided by user: "${request.context}". Analyze this word.`
    : `Word: "${request.word}". Analyze this word (use most common meaning).`;

  try {
    // Validation throws explicit error before SDK can fail
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response received from Gemini.");
    }

    // Attempt to clean and parse
    const cleanedText = cleanJsonText(textResponse);
    try {
      return JSON.parse(cleanedText) as VocabularyResponse;
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", textResponse);
      throw new Error("Failed to parse the AI response. The model output was not valid JSON.");
    }

  } catch (error) {
    console.error("Error generating vocabulary lesson:", error);
    throw error;
  }
};

export const generateImageForWord = async (word: string): Promise<string | undefined> => {
  // For images, we fail silently/gracefully if key is missing to not break the main flow if called separately
  const key = process.env.API_KEY;
  if (!key) return undefined;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clear, high-quality educational illustration representing the meaning of the English word "${word}". The image should be suitable for a vocabulary flashcard, photorealistic or detailed style, no text overlay.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '4:3',
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    // Image generation errors should not block the main lesson
    console.warn("Error generating vocabulary image (non-fatal):", error);
    return undefined;
  }
};

export const evaluatePronunciation = async (word: string, base64Audio: string, mimeType: string): Promise<PronunciationResult> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

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

    const cleanedText = cleanJsonText(textResponse);
    return JSON.parse(cleanedText) as PronunciationResult;
  } catch (error) {
    console.error("Error evaluating pronunciation:", error);
    throw error;
  }
};