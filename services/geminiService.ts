import { GoogleGenAI, Type } from "@google/genai";
import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a vocabulary lesson using Gemini 2.5 Flash.
 */
export const generateVocabularyLesson = async (request: GenerateRequest): Promise<VocabularyResponse> => {
  const { word, context } = request;
  
  // Construct the prompt
  const prompt = `Generate a comprehensive vocabulary lesson for the English word "${word}"${context ? ` in the context of "${context}"` : ""}.
  Include meaning, phonetics, part of speech, 3 example sentences, a grammar note, related expressions (optional), and practice tasks (speaking prompt and writing task).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            meaning: { type: Type.STRING },
            phonetics: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            exampleSentences: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            grammarNote: { type: Type.STRING },
            relatedExpressions: { type: Type.STRING },
            practice: {
              type: Type.OBJECT,
              properties: {
                speakingPrompt: { type: Type.STRING },
                writingTask: { type: Type.STRING },
              },
              required: ["speakingPrompt", "writingTask"]
            },
          },
          required: ["word", "meaning", "phonetics", "partOfSpeech", "exampleSentences", "grammarNote", "practice"],
        },
      },
    });

    // The response text is guaranteed to be JSON due to responseMimeType
    const data = JSON.parse(response.text || "{}");
    
    return {
      ...data,
      // Ensure word matches request if model varies capitalization slightly, or use model's version
      word: data.word || word, 
      imageUrl: undefined // Handled by generateImageForWord
    };

  } catch (error) {
    console.error("Gemini API Error in generateVocabularyLesson:", error);
    throw new Error("Failed to generate vocabulary lesson. Please check your API key.");
  }
};

/**
 * Generates an image for the word using Gemini 2.5 Flash Image.
 */
export const generateImageForWord = async (word: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Generate a clear, educational illustration for the word "${word}".`,
      // No responseMimeType or responseSchema for image generation on this model
    });

    // Iterate through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Gemini API Error in generateImageForWord:", error);
    // Fallback to loremflickr if API fails
    return `https://loremflickr.com/800/600/${encodeURIComponent(word)}?lock=${Math.floor(Math.random() * 100)}`;
  }
};

/**
 * Evaluates pronunciation using Gemini 2.5 Flash with audio input.
 */
export const evaluatePronunciation = async (word: string, base64Audio: string, mimeType: string): Promise<PronunciationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `Evaluate the pronunciation of the word "${word}" in this audio. Provide a score (0-100), feedback, and an improvement tip.`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            improvementTip: { type: Type.STRING }
          },
          required: ["score", "feedback", "improvementTip"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error in evaluatePronunciation:", error);
     return {
      score: 0,
      feedback: "Unable to evaluate pronunciation at this time.",
      improvementTip: "Please check your connection and try again."
    };
  }
};