
import { VocabularyResponse, WordForm } from "../types";

const API_URL = "https://api.mymemory.translated.net/get";

/**
 * Translates a single string using MyMemory API.
 * Returns the original text if translation fails or text is empty.
 */
async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return text;
  
  try {
    // MyMemory requires source|target pair. We assume source is always English (en).
    const langPair = `en|${targetLang}`;
    const url = `${API_URL}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (error) {
    console.warn("Translation failed for:", text, error);
    return text;
  }
}

/**
 * Orchestrates the translation of the entire VocabularyResponse object.
 * Uses Promise.all to fetch translations in parallel to minimize wait time.
 */
export async function translateVocabularyLesson(
  data: VocabularyResponse, 
  targetLang: string
): Promise<VocabularyResponse> {
  // Extract language code (e.g., 'pt-BR' -> 'pt')
  const langCode = targetLang.split('-')[0];

  // If target is English, return original
  if (langCode === 'en') return data;

  try {
    // Prepare all translation promises
    const meaningPromise = translateText(data.meaning, langCode);
    const grammarPromise = translateText(data.grammarNote, langCode);
    const relatedPromise = translateText(data.relatedExpressions || "", langCode);
    
    const speakingPromise = translateText(data.practice.speakingPrompt, langCode);
    const writingPromise = translateText(data.practice.writingTask, langCode);

    // Translate examples (array)
    const examplesPromises = data.exampleSentences.map(ex => translateText(ex, langCode));

    // Translate form explanations (array) - we keep the label/form in English usually, but translate explanation
    const formsPromises = data.forms.map(async (f) => ({
      ...f,
      explanation: await translateText(f.explanation, langCode)
    }));

    // Execute all requests
    const [
      translatedMeaning,
      translatedGrammar,
      translatedRelated,
      translatedSpeaking,
      translatedWriting,
      translatedExamples,
      translatedForms
    ] = await Promise.all([
      meaningPromise,
      grammarPromise,
      relatedPromise,
      speakingPromise,
      writingPromise,
      Promise.all(examplesPromises),
      Promise.all(formsPromises)
    ]);

    // Return new object with translated fields
    // Note: We keep 'word', 'phonetics', 'partOfSpeech' and form 'labels'/'forms' in English
    // as they represent the core study material.
    return {
      ...data,
      meaning: translatedMeaning,
      grammarNote: translatedGrammar,
      relatedExpressions: translatedRelated,
      exampleSentences: translatedExamples,
      practice: {
        speakingPrompt: translatedSpeaking,
        writingTask: translatedWriting
      },
      forms: translatedForms
    };

  } catch (error) {
    console.error("Full translation failed", error);
    throw new Error("Could not translate content.");
  }
}
