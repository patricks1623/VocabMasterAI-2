
import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";

/**
 * Orchestrates the data fetching. 
 * Tries to scrape Cambridge Dictionary first for exact definitions.
 * Falls back to Free Dictionary API if scraping fails.
 */
export const generateVocabularyLesson = async (request: GenerateRequest): Promise<VocabularyResponse> => {
  const { word } = request;
  const lowerWord = word.trim().toLowerCase();

  try {
    const data = await fetchCambridgeData(lowerWord);
    // Force the word to match the user's input (trimmed).
    // The UI handles capitalization via CSS.
    return { ...data, word: word.trim() };
  } catch (error) {
    console.warn("Cambridge scrape failed, falling back to Free Dictionary API", error);
    const data = await fetchFreeDictionaryData(lowerWord);
    // Force the word to match the user's input here as well.
    return { ...data, word: word.trim() };
  }
};

/**
 * Scrapes data from Cambridge Dictionary using a CORS proxy.
 */
async function fetchCambridgeData(word: string): Promise<VocabularyResponse> {
  const targetUrl = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`;
  
  // Switching to corsproxy.io as it handles Cambridge Dictionary's anti-bot pages better than allorigins
  // Note: corsproxy.io returns the raw HTML string directly
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
  
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Proxy response error: ${response.status}`);
  }
  const htmlText = await response.text();

  // Parse the HTML string into a DOM object
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Helper to extract text safely
  const getText = (selector: string) => {
    const el = doc.querySelector(selector);
    return el ? el.textContent?.trim() || "" : "";
  };

  // 1. Validate if we landed on a valid page
  // We use .dhw (Dictionary Head Word) which is specific to the entry title in Cambridge
  const headword = getText('.dhw');
  if (!headword) {
    // Fallback check
    const hw = getText('.hw');
    if (!hw) throw new Error("Word not found in Cambridge Dictionary");
  }

  // 2. Extract Definitions
  // We look for '.def.ddef_d' which is the specific class for the definition text in Cambridge
  // If not found, fall back to generic '.def'
  let meaning = getText('.def.ddef_d');
  if (!meaning) {
      meaning = getText('.def');
  }
  
  // 3. Extract Part of Speech
  // .pos contains 'verb', 'noun', etc.
  const partOfSpeech = getText('.pos');

  // 4. Extract Phonetics
  // .ipa contains the pronunciation symbols
  const phoneticsRaw = getText('.ipa');
  const phonetics = phoneticsRaw ? `/${phoneticsRaw}/` : "";

  // 5. Extract Examples
  // .examp .eg contains example sentences
  const exampleElements = doc.querySelectorAll('.examp .eg');
  const examples: string[] = [];
  exampleElements.forEach((el) => {
    if (examples.length < 3 && el.textContent) {
      examples.push(el.textContent.trim());
    }
  });

  if (!meaning) {
    throw new Error("Definition content missing");
  }

  // Generate static content for missing pieces
  const grammarNote = generateStaticGrammarNote(partOfSpeech);
  const practice = generateStaticPractice(word, partOfSpeech);

  return {
    word: headword || word, // This is just a fallback here, the parent function overwrites it
    meaning: meaning,
    phonetics: phonetics,
    partOfSpeech: partOfSpeech || "unknown",
    exampleSentences: examples,
    grammarNote: grammarNote,
    relatedExpressions: "", // Scraper simplification: skipping complex synonym extraction for now
    practice: practice
  };
}

/**
 * Fallback: Fetches vocabulary data from the Free Dictionary API.
 */
async function fetchFreeDictionaryData(word: string): Promise<VocabularyResponse> {
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
}

/**
 * Replaces AI evaluation with a simple pass-through since we removed AI.
 */
export const evaluatePronunciation = async (word: string, base64Audio: string, mimeType: string): Promise<PronunciationResult> => {
  return {
    score: 0,
    feedback: "",
    improvementTip: ""
  };
};

// Helpers for static content generation

function generateStaticPractice(word: string, pos: string) {
  // Normalize pos string to handle cases like "phrasal verb" or "noun [C]"
  const cleanPos = pos.toLowerCase().includes('verb') ? 'verb' 
                 : pos.toLowerCase().includes('noun') ? 'noun'
                 : pos.toLowerCase().includes('adj') ? 'adjective'
                 : pos.toLowerCase().includes('adv') ? 'adverb'
                 : 'noun'; // Default

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

  const selected = prompts[cleanPos as keyof typeof prompts] || prompts.noun;

  return {
    speakingPrompt: selected.speak,
    writingTask: selected.write
  };
}

function generateStaticGrammarNote(pos: string): string {
  const p = pos.toLowerCase();
  if (p.includes('noun')) return "Nouns function as the subject or object of a sentence. Pay attention to whether this is countable or uncountable.";
  if (p.includes('verb')) return "Verbs demonstrate action or state of being. Check if this is regular or irregular in the past tense.";
  if (p.includes('adj')) return "Adjectives modify nouns. They typically appear before the noun or after a linking verb.";
  if (p.includes('adv')) return "Adverbs modify verbs, adjectives, or other adverbs. They often end in -ly but not always.";
  if (p.includes('prep')) return "Prepositions show relationship between a noun and other parts of the sentence.";
  if (p.includes('conj')) return "Conjunctions connect clauses or sentences together.";
  
  return "Pay attention to how this word fits into the sentence structure.";
}
