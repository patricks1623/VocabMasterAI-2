
import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";

/**
 * Fetches vocabulary data from the Free Dictionary API.
 * Replaces AI generation with deterministic API data.
 */
export const generateVocabularyLesson = async (request: GenerateRequest): Promise<VocabularyResponse> => {
  const { word } = request;
  
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      throw new Error("Word not found in the dictionary.");
    }

    const data = await response.json();
    const entry = data[0]; // Take the first entry
    const meaningEntry = entry.meanings[0];

    // Extract example sentences from definitions
    const examples: string[] = [];
    entry.meanings.forEach((m: any) => {
      m.definitions.forEach((d: any) => {
        if (d.example && examples.length < 3) {
          examples.push(d.example);
        }
      });
    });

    // Fallback if no examples found in API
    if (examples.length === 0) {
      examples.push(`The word ${word} is used frequently in this context.`);
    }

    // Generate static practice tasks based on Part of Speech
    const partOfSpeech = meaningEntry.partOfSpeech || "unknown";
    const practiceTasks = generateStaticPractice(word, partOfSpeech);

    return {
      word: entry.word,
      meaning: meaningEntry.definitions[0].definition,
      phonetics: entry.phonetic || (entry.phonetics.find((p: any) => p.text)?.text) || "",
      partOfSpeech: partOfSpeech,
      exampleSentences: examples,
      grammarNote: generateStaticGrammarNote(partOfSpeech),
      relatedExpressions: entry.meanings[0].synonyms?.slice(0, 5).join(", "),
      practice: practiceTasks
    };

  } catch (error) {
    console.error("Dictionary API Error:", error);
    throw new Error("Could not find definition. Please try a different word.");
  }
};

/**
 * Replaces AI evaluation with a simple pass-through since we removed AI.
 * This function is kept for type compatibility but won't be used for AI scoring.
 */
export const evaluatePronunciation = async (word: string, base64Audio: string, mimeType: string): Promise<PronunciationResult> => {
  // We aren't using AI anymore, so we return a dummy result. 
  // The UI will be updated to just play back audio instead of showing a score.
  return {
    score: 0,
    feedback: "",
    improvementTip: ""
  };
};

// Helpers for static content generation

function generateStaticPractice(word: string, pos: string) {
  const prompts = {
    noun: {
      speak: `Describe a specific "${word}" you have seen recently.`,
      write: `Write a sentence using "${word}" as the subject.`
    },
    verb: {
      speak: `Talk about a time you had to ${word}.`,
      write: `Write a sentence using "${word}" in the past tense.`
    },
    adjective: {
      speak: `Describe something using the word "${word}".`,
      write: `Write a comparative sentence using "${word}".`
    },
    adverb: {
      speak: `Describe an action that was done ${word}.`,
      write: `Use "${word}" to modify a verb in a sentence.`
    }
  };

  const key = pos.toLowerCase() as keyof typeof prompts;
  const selected = prompts[key] || prompts.noun;

  return {
    speakingPrompt: selected.speak,
    writingTask: selected.write
  };
}

function generateStaticGrammarNote(pos: string): string {
  const notes: Record<string, string> = {
    noun: "Nouns function as the subject or object of a sentence. Pay attention to whether this is countable or uncountable.",
    verb: "Verbs demonstrate action or state of being. Check if this is regular or irregular in the past tense.",
    adjective: "Adjectives modify nouns. They typically appear before the noun or after a linking verb.",
    adverb: "Adverbs modify verbs, adjectives, or other adverbs. They often end in -ly but not always.",
    preposition: "Prepositions show relationship between a noun and other parts of the sentence.",
    conjunction: "Conjunctions connect clauses or sentences together."
  };
  return notes[pos.toLowerCase()] || "Pay attention to how this word fits into the sentence structure.";
}
