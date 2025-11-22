
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
  // Pass 'word' to generate varied content based on the specific word
  const grammarNote = generateStaticGrammarNote(word, partOfSpeech);
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
      grammarNote: generateStaticGrammarNote(word, partOfSpeech),
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
  const p = pos.toLowerCase();
  const cleanPos = p.includes('verb') && !p.includes('adverb') ? 'verb' 
                 : p.includes('noun') ? 'noun'
                 : p.includes('adj') ? 'adjective'
                 : p.includes('adv') ? 'adverb'
                 : 'general';

  // Deterministic selection based on word characters
  // This ensures "apple" always gets the same prompt, but "banana" gets a different one from the list.
  const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const templates = {
    noun: {
      speak: [
        `Describe a specific "${word}" you have seen recently in great detail.`,
        `If you had to explain what a "${word}" is to a 5-year-old, what would you say?`,
        `Talk about the pros and cons of a typical "${word}".`,
        `Describe your ideal version of a "${word}".`,
        `Tell a story involving a lost "${word}".`
      ],
      write: [
        `Write a sentence using "${word}" as the subject of a rhetorical question.`,
        `Write a short product description for a new type of "${word}".`,
        `Compose a tweet (280 characters) about a "${word}".`,
        `Write a dialogue between two people arguing about a "${word}".`,
        `List 5 adjectives that commonly describe a "${word}".`
      ]
    },
    verb: {
      speak: [
        `Talk about the last time you had to "${word}".`,
        `Explain specifically how to "${word}" safely and effectively.`,
        `Describe a situation where it would be a bad idea to "${word}".`,
        `Who is the best person you know to "${word}"? Why?`,
        `Predict what would happen if everyone started to "${word}" tomorrow.`
      ],
      write: [
        `Write a set of 3 instructions on how to "${word}".`,
        `Write a diary entry about a day you spent trying to "${word}".`,
        `Write a formal email asking for permission to "${word}".`,
        `Write a sentence using "${word}" in the past continuous tense (was/were ...ing).`,
        `Create a warning sign regarding the action to "${word}".`
      ]
    },
    adjective: {
      speak: [
        `Describe a person, place, or thing that is extremely "${word}".`,
        `Talk about a time when you felt very "${word}".`,
        `Compare something that is "${word}" with something that is the opposite.`,
        `Explain why being "${word}" can be an advantage in some situations.`,
        `Describe a movie character who is famously "${word}".`
      ],
      write: [
        `Write a review for a product that is surprisingly "${word}".`,
        `Write a haiku or short poem about the feeling of being "${word}".`,
        `Write a sentence using "${word}" and a superlative (most/least).`,
        `Describe a room using only synonyms for "${word}".`,
        `Write a letter to a friend explaining why you are feeling "${word}".`
      ]
    },
    adverb: {
      speak: [
        `Describe an action that is typically done "${word}".`,
        `Tell a story about someone who behaved "${word}".`,
        `Explain the difference between doing something normally vs doing it "${word}".`
      ],
      write: [
        `Write a sentence modifying a verb with "${word}".`,
        `Describe a scene where the weather changes "${word}".`,
        `Write 3 different commands instructing someone to act "${word}".`
      ]
    },
    general: {
      speak: [
        `Use the word "${word}" in three distinct sentences aloud.`,
        `Explain the connection between "${word}" and your daily routine.`,
        `Talk about the first thing that comes to mind when you hear "${word}".`
      ],
      write: [
         `Write a paragraph containing the word "${word}" three times.`,
         `Create a mind map of 5 words related to "${word}".`,
         `Write a definition of "${word}" in your own words without using the word itself.`
      ]
    }
  };

  const category = templates[cleanPos as keyof typeof templates] || templates.general;
  
  const speakIndex = hash % category.speak.length;
  const writeIndex = hash % category.write.length;

  return {
    speakingPrompt: category.speak[speakIndex],
    writingTask: category.write[writeIndex]
  };
}

function generateStaticGrammarNote(word: string, pos: string): string {
  const p = pos.toLowerCase();
  const cleanPos = p.includes('verb') && !p.includes('adverb') ? 'verb' 
                 : p.includes('noun') ? 'noun'
                 : p.includes('adj') ? 'adjective'
                 : p.includes('adv') ? 'adverb'
                 : 'general';

  // Same deterministic logic as practice prompts
  const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const notes = {
    noun: [
      `Determine if "${word}" is countable or uncountable. Uncountable nouns usually don't take 'a' or 'an' and lack a plural form.`,
      `Consider common collocations with "${word}". Specific verbs often pair with it, like "make" vs "do".`,
      `Check if "${word}" is acting as the subject (doer) or object (receiver) in your current sentence structure.`,
      `If "${word}" is a concrete noun, try using specific adjectives to describe its texture, size, or color.`,
      `Pay attention to article usage with "${word}". Does it need 'the' for a specific reference, or is it being used generally?`
    ],
    verb: [
      `Determine if "${word}" is transitive (needs an object) or intransitive (stands alone) in your sentence.`,
      `Check the past tense form of "${word}". Is it regular (ending in -ed) or does it have an irregular spelling?`,
      `Consider whether "${word}" is typically followed by a gerund (doing) or an infinitive (to do).`,
      `Think about the voice: can "${word}" be used naturally in the passive voice?`,
      `Look out for phrasal verbs involving "${word}". Adding prepositions like 'up' or 'out' might change its meaning.`
    ],
    adjective: [
      `When using "${word}" with other adjectives, remember the standard order: Opinion → Size → Age → Shape → Color → Origin → Material.`,
      `Check the comparative and superlative forms of "${word}". Do you add -er/-est, or do you use 'more'/'most'?`,
      `Remember that "${word}" typically appears before the noun (attributive) or after linking verbs like 'be' (predicative).`,
      `Ensure you are correctly distinguishing between "${word}" and related forms (e.g., -ed vs -ing endings).`,
      `Use "${word}" to add specificity, but avoid using 'very' + "${word}" if a stronger synonym exists.`
    ],
    adverb: [
      `Adverbs like "${word}" usually go before the main verb, but after 'to be'.`,
      `Remember that "${word}" modifies a verb, adjective, or another adverb, often answering 'how', 'when', or 'to what extent'.`,
      `While "${word}" likely functions as an adverb, verify if it has an irregular form compared to its adjective counterpart.`,
      `Placement matters: ensure "${word}" is placed correctly (often after the object) to convey the intended meaning.`
    ],
    general: [
      `Pay close attention to the specific context in which "${word}" is used to understand its nuance.`,
      `Check if "${word}" has multiple meanings depending on the sentence structure or part of speech.`,
      `Consider the register of "${word}": is it appropriate for formal writing or better suited for casual conversation?`,
      `Practice using "${word}" in a question, a negative sentence, and a positive statement to master its usage.`
    ]
  };

  const category = notes[cleanPos as keyof typeof notes] || notes.general;
  const index = hash % category.length;
  
  return category[index];
}
