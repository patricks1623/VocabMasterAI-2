
import { GenerateRequest, VocabularyResponse, PronunciationResult } from "../types";
import { getWordForms } from "./grammarRules";

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
  const forms = getWordForms(word, partOfSpeech);

  return {
    word: headword || word, // This is just a fallback here, the parent function overwrites it
    meaning: meaning,
    phonetics: phonetics,
    partOfSpeech: partOfSpeech || "unknown",
    exampleSentences: examples,
    grammarNote: grammarNote,
    relatedExpressions: "", // Scraper simplification: skipping complex synonym extraction for now
    practice: practice,
    forms: forms
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
    const forms = getWordForms(word, partOfSpeech);

    return {
      word: entry.word,
      meaning: meaningEntry.definitions[0].definition,
      phonetics: entry.phonetic || (entry.phonetics.find((p: any) => p.text)?.text) || "",
      partOfSpeech: partOfSpeech,
      exampleSentences: examples,
      grammarNote: generateStaticGrammarNote(word, partOfSpeech),
      relatedExpressions: entry.meanings[0].synonyms?.slice(0, 5).join(", "),
      practice: practiceTasks,
      forms: forms
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
  // Normalize pos string
  const p = pos.toLowerCase();
  const cleanPos = p.includes('verb') && !p.includes('adverb') ? 'verb' 
                 : p.includes('noun') ? 'noun'
                 : p.includes('adj') ? 'adjective'
                 : p.includes('adv') ? 'adverb'
                 : 'general';

  // Deterministic selection based on word characters
  const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Improved templates focused on Scenarios, Role-play, and Critical Thinking
  const templates = {
    noun: {
      speak: [
        `Role-play: You are a salesperson trying to sell a "${word}". What are its best features?`,
        `Debate: Argue why the world needs more (or less) of "${word}".`,
        `Imagine you are explaining what a "${word}" is to an alien who has never visited Earth.`,
        `Tell a short story about a time you lost or found a "${word}".`,
        `If you could give a "${word}" to any famous person, who would it be and why?`,
        `Describe the perfect environment for a "${word}". What does it look like?`,
        `Compare a "${word}" to an elephant. How are they different?`,
        `If "${word}" was the main topic of a movie, what kind of movie would it be?`
      ],
      write: [
        `Write a 3-line poem where the last word is "${word}".`,
        `Create a shopping list or a 'to-do' list that involves a "${word}".`,
        `Write a warning label for a "${word}". What should people be careful about?`,
        `If "${word}" was a company name, what would their slogan be?`,
        `Write a short text message to a friend explaining why you need a "${word}" right now.`,
        `Describe a "${word}" using 3 adjectives and 3 verbs.`,
        `Write a definition of "${word}" for a dictionary written by 5-year-olds.`
      ]
    },
    verb: {
      speak: [
        `Confession time: Have you ever forgotten to "${word}"? What happened?`,
        `Instruction: Teach me how to "${word}" perfectly in 3 steps.`,
        `Prediction: Do you think people will still "${word}" in 100 years? Why?`,
        `Interview: If you could hire someone just to "${word}" for you, would you?`,
        `Scenario: You are late for a meeting because you had to "${word}". Explain this to your boss.`,
        `Challenge: Try to convince me that it is dangerous to "${word}".`,
        `If animals could "${word}", which animal would be the best at it?`,
        `What is the most boring place to "${word}"? Explain why.`
      ],
      write: [
        `Write a diary entry about a day where you did nothing but "${word}".`,
        `Write a set of rules for a library regarding how to "${word}".`,
        `Create a fortune cookie message that includes the word "${word}".`,
        `Write a sentence using "${word}" in the past, present, and future tense.`,
        `Write a text message canceling plans because you need to "${word}".`,
        `List 3 adverbs (e.g., quickly, sadly) that change the feeling of "${word}".`,
        `Write a headline for a newspaper about a man who loves to "${word}".`
      ]
    },
    adjective: {
      speak: [
        `Opinion: Is it better to be rich or to be "${word}"? Defend your answer.`,
        `Story: Describe a character in a movie who is extremely "${word}".`,
        `Scenario: You are designing a house that must be very "${word}". Describe one room.`,
        `Comparison: What is something that is "${word}" and something that is definitely NOT?`,
        `If you were a food, would you be "${word}"? Why?`,
        `Describe your perfect vacation using the word "${word}" twice.`,
        `Do you think being "${word}" helps people succeed in life?`,
        `If a car was described as "${word}", would you buy it?`
      ],
      write: [
        `Write a review for a restaurant that was very "${word}". give it 1 star.`,
        `Write a dating profile bio for someone who describes themselves as "${word}".`,
        `List 5 things in your room that are (or are not) "${word}".`,
        `Complete the sentence: "The problem with being ${word} is that..."`,
        `Write a short email to a hotel complaining that the room was not "${word}" enough.`,
        `Create a new superhero name based on the word "${word}".`,
        `Write a tweet (short sentence) using hashtags #life and #${word}.`
      ]
    },
    adverb: {
      speak: [
        `Demonstration: Act out or describe doing a common task (like brushing teeth) "${word}".`,
        `Advice: When is the best time to speak "${word}"?`,
        `Scenario: A police officer stops you. Why is it important to answer "${word}"?`,
        `Contrast: What is the difference between doing something "${word}" vs doing it quickly?`,
        `Who in your family behaves "${word}" the most? Give an example.`
      ],
      write: [
        `Write a guide on "How to Drive "${word}".`,
        `Write a mysterious note left on a desk that uses the word "${word}".`,
        `List 3 verbs that change meaning when you add "${word}" (e.g. run "${word}").`,
        `Write a sentence describing a storm moving "${word}".`,
        `Complete this thought: "I wish I could sing ${word} because..."`
      ]
    },
    general: {
      speak: [
        `Philosophy: What does the word "${word}" mean to you personally?`,
        `Memory: Does the word "${word}" remind you of any specific memory?`,
        `Association: Say the first 3 words that come to your mind when you hear "${word}".`,
        `Creative: If "${word}" was a flavor of ice cream, what would it taste like?`,
        `Use "${word}" in a question you would ask the President.`
      ],
      write: [
         `Write a haiku (5-7-5 syllables) about "${word}".`,
         `Write the word "${word}" in the middle of the page and draw a circle around it with related words.`,
         `Write a sentence that uses "${word}" and its opposite.`,
         `Write a cryptic message in a bottle using "${word}".`
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
