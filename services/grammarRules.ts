
import { WordForm } from "../types";

// ==========================================
// DATA LISTS & EXCEPTIONS
// ==========================================

const IRREGULAR_VERBS: Record<string, [string, string]> = {
  be: ["was/were", "been"], have: ["had", "had"], do: ["did", "done"], go: ["went", "gone"],
  say: ["said", "said"], make: ["made", "made"], get: ["got", "got/gotten"], know: ["knew", "known"],
  think: ["thought", "thought"], take: ["took", "taken"], see: ["saw", "seen"], come: ["came", "come"],
  find: ["found", "found"], give: ["gave", "given"], tell: ["told", "told"], feel: ["felt", "felt"],
  become: ["became", "become"], leave: ["left", "left"], put: ["put", "put"], mean: ["meant", "meant"],
  keep: ["kept", "kept"], let: ["let", "let"], begin: ["began", "begun"], seem: ["seemed", "seemed"],
  help: ["helped", "helped"], show: ["showed", "shown"], hear: ["heard", "heard"], play: ["played", "played"],
  run: ["ran", "run"], move: ["moved", "moved"], live: ["lived", "lived"], believe: ["believed", "believed"],
  bring: ["brought", "brought"], happen: ["happened", "happened"], write: ["wrote", "written"],
  sit: ["sat", "sat"], stand: ["stood", "stood"], lose: ["lost", "lost"], pay: ["paid", "paid"],
  meet: ["met", "met"], include: ["included", "included"], continue: ["continued", "continued"],
  set: ["set", "set"], learn: ["learnt/learned", "learnt/learned"], change: ["changed", "changed"],
  lead: ["led", "led"], understand: ["understood", "understood"], watch: ["watched", "watched"],
  follow: ["followed", "followed"], stop: ["stopped", "stopped"], create: ["created", "created"],
  speak: ["spoke", "spoken"], read: ["read", "read"], spend: ["spent", "spent"], grow: ["grew", "grown"],
  open: ["opened", "opened"], walk: ["walked", "walked"], win: ["won", "won"], offer: ["offered", "offered"],
  remember: ["remembered", "remembered"], love: ["loved", "loved"], consider: ["considered", "considered"],
  appear: ["appeared", "appeared"], buy: ["bought", "bought"], wait: ["waited", "waited"],
  serve: ["served", "served"], die: ["died", "died"], send: ["sent", "sent"], expect: ["expected", "expected"],
  build: ["built", "built"], stay: ["stayed", "stayed"], fall: ["fell", "fallen"], cut: ["cut", "cut"],
  reach: ["reached", "reached"], kill: ["killed", "killed"], remain: ["remained", "remained"],
  suggest: ["suggested", "suggested"], raise: ["raised", "raised"], pass: ["passed", "passed"],
  sell: ["sold", "sold"], break: ["broke", "broken"], decide: ["decided", "decided"], eat: ["ate", "eaten"],
  drive: ["drove", "driven"], wear: ["wore", "worn"], choose: ["chose", "chosen"], sing: ["sang", "sung"],
  drink: ["drank", "drunk"], hit: ["hit", "hit"], fly: ["flew", "flown"], catch: ["caught", "caught"],
  draw: ["drew", "drawn"], throw: ["threw", "thrown"], sleep: ["slept", "slept"], teach: ["taught", "taught"],
  wake: ["woke", "woken"], swim: ["swam", "swum"], ride: ["rode", "ridden"], forget: ["forgot", "forgotten"],
  fight: ["fought", "fought"], hide: ["hid", "hidden"], hold: ["held", "held"], hurt: ["hurt", "hurt"],
  lie: ["lay", "lain"], lay: ["laid", "laid"], light: ["lit", "lit"], quit: ["quit", "quit"],
  rise: ["rose", "risen"], shake: ["shook", "shaken"], shine: ["shone", "shone"], shoot: ["shot", "shot"],
  shut: ["shut", "shut"], steal: ["stole", "stolen"], stick: ["stuck", "stuck"], strike: ["struck", "struck"],
  swear: ["swore", "sworn"], tear: ["tore", "torn"]
};

// Nouns that do not usually have a plural form
const UNCOUNTABLE_NOUNS = new Set([
  "information", "advice", "knowledge", "furniture", "luggage", "baggage", 
  "homework", "evidence", "equipment", "news", "jewelry", "money", "music", 
  "love", "happiness", "sadness", "bravery", "sugar", "salt", "rice", "butter", 
  "water", "milk", "coffee", "air", "weather", "electricity", "power", "chaos",
  "scenery", "traffic", "permission", "behavior", "accommodation", "bread"
]);

// Adjectives that cannot be compared (no "more unique" or "uniquer")
const ABSOLUTE_ADJECTIVES = new Set([
  "unique", "perfect", "dead", "alive", "fatal", "final", "empty", "full",
  "absolute", "impossible", "eternal", "infinite", "universal", "pregnant",
  "main", "principal", "entire", "whole", "correct", "incorrect", "true", "false"
]);

// Adjectives known to take -er/-est (Short list to be safe, otherwise default to more/most)
const SHORT_ADJECTIVES = new Set([
  "big", "small", "fat", "thin", "hot", "cold", "tall", "short", "long", 
  "nice", "brave", "large", "wide", "safe", "late", "close", "wise", 
  "fast", "slow", "hard", "soft", "high", "low", "deep", "weak", "strong",
  "young", "old", "rich", "poor", "clean", "dirty", "cheap", "quick", "dark",
  "bright", "sharp", "dull", "calm", "cool", "warm", "fresh", "sweet", "sour",
  "smart", "dumb", "busy", "easy", "happy", "lazy", "heavy", "dry", "funny"
]);

// Verbs that end in CVC but do NOT double the consonant (stress usually on 1st syllable)
const NO_DOUBLING_EXCEPTIONS = new Set([
  "visit", "open", "happen", "listen", "offer", "suffer", "target", "market", 
  "answer", "cover", "enter", "remember", "develop", "limit", "edit", "budget"
]);

// Irregular plurals map
const IRREGULAR_PLURALS: Record<string, string> = {
  man: "men", woman: "women", child: "children", person: "people",
  foot: "feet", tooth: "teeth", goose: "geese", mouse: "mice", louse: "lice",
  ox: "oxen", leaf: "leaves", life: "lives", knife: "knives", wife: "wives",
  half: "halves", thief: "thieves", elf: "elves", loaf: "loaves",
  potato: "potatoes", tomato: "tomatoes", hero: "heroes", echo: "echoes",
  analysis: "analyses", crisis: "crises", thesis: "theses", basis: "bases",
  diagnosis: "diagnoses", phenomenon: "phenomena", criterion: "criteria",
  datum: "data", bacterium: "bacteria", medium: "media",
  sheep: "sheep", deer: "deer", fish: "fish", series: "series", species: "species", aircraft: "aircraft"
};

// ==========================================
// MAIN FUNCTION
// ==========================================

export function getWordForms(word: string, partOfSpeech: string): WordForm[] {
  const cleanWord = word.toLowerCase().trim();
  const forms: WordForm[] = [];
  
  const p = partOfSpeech.toLowerCase();
  const isVerb = p.includes('verb') && !p.includes('adverb');
  const isNoun = p.includes('noun');
  const isAdjective = p.includes('adj');

  if (isVerb) {
    generateVerbForms(cleanWord, forms);
  } else if (isNoun) {
    generateNounForms(cleanWord, forms);
  } else if (isAdjective) {
    generateAdjectiveForms(cleanWord, forms);
  }
  
  return forms;
}

// ==========================================
// GENERATORS
// ==========================================

function generateVerbForms(word: string, forms: WordForm[]) {
  // 1. 3rd Person Singular
  let thirdPerson = "";
  if (word === 'have') thirdPerson = 'has';
  else if (word === 'be') thirdPerson = 'is';
  else if (word === 'do') thirdPerson = 'does';
  else if (word === 'go') thirdPerson = 'goes';
  else if (word.endsWith('y') && !isVowel(word[word.length - 2])) {
    thirdPerson = word.slice(0, -1) + "ies";
  } else if (word.endsWith('o') || word.endsWith('ch') || word.endsWith('s') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z')) {
    thirdPerson = word + "es";
  } else {
    thirdPerson = word + "s";
  }

  forms.push({
    label: "Present (He/She/It)",
    form: thirdPerson,
    explanation: "Used for current facts or habits with singular subjects."
  });

  // 2. Continuous / Gerund
  let gerund = "";
  if (word === 'be') gerund = 'being';
  else if (word.endsWith('ie')) gerund = word.slice(0, -2) + "ying";
  else if (word.endsWith('e') && !word.endsWith('ee') && !word.endsWith('oe') && !word.endsWith('ye')) {
    gerund = word.slice(0, -1) + "ing";
  } else if (needsDoubling(word)) {
    gerund = word + word[word.length - 1] + "ing";
  } else {
    gerund = word + "ing";
  }

  forms.push({
    label: "Continuous (-ing)",
    form: gerund,
    explanation: "Used for actions happening now or as a noun (gerund)."
  });

  // 3. Past Forms
  let pastSimple = "";
  let pastParticiple = "";
  let isIrregular = false;

  if (IRREGULAR_VERBS[word]) {
    [pastSimple, pastParticiple] = IRREGULAR_VERBS[word];
    isIrregular = true;
  } else {
    // Regular rules
    if (word.endsWith('e')) {
      pastSimple = word + "d";
    } else if (word.endsWith('y') && !isVowel(word[word.length - 2])) {
      pastSimple = word.slice(0, -1) + "ied";
    } else if (needsDoubling(word)) {
      pastSimple = word + word[word.length - 1] + "ed";
    } else {
      pastSimple = word + "ed";
    }
    pastParticiple = pastSimple;
  }

  forms.push({
    label: "Past Simple",
    form: pastSimple,
    explanation: isIrregular ? "Irregular past form." : "Regular past form for finished actions."
  });

  if (pastParticiple !== pastSimple || isIrregular) {
    forms.push({
      label: "Past Participle",
      form: pastParticiple,
      explanation: "Used in Perfect tenses (have done) and Passive Voice."
    });
  }
}

function generateNounForms(word: string, forms: WordForm[]) {
  // If uncountable, do not generate plural
  if (UNCOUNTABLE_NOUNS.has(word)) {
    forms.push({
      label: "Type",
      form: "Uncountable Noun",
      explanation: "This noun is usually used in the singular form and takes a singular verb."
    });
    return;
  }

  let plural = "";

  if (IRREGULAR_PLURALS[word]) {
    plural = IRREGULAR_PLURALS[word];
  } else if (word.endsWith('y') && !isVowel(word[word.length - 2])) {
    plural = word.slice(0, -1) + "ies"; // city -> cities
  } else if (word.endsWith('s') || word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z')) {
    plural = word + "es"; // bus -> buses
  } else {
    plural = word + "s";
  }

  // Only show if plural is different (e.g. sheep -> sheep handled in irregulars, but visuals aid understanding)
  forms.push({
    label: "Plural",
    form: plural,
    explanation: plural === word ? "This noun has the same form for singular and plural." : "Used when referring to more than one."
  });
}

function generateAdjectiveForms(word: string, forms: WordForm[]) {
  if (ABSOLUTE_ADJECTIVES.has(word)) {
    forms.push({
      label: "Type",
      form: "Absolute Adjective",
      explanation: "This adjective represents a limit or absolute state and cannot be compared (e.g., you cannot be 'more dead')."
    });
    return;
  }

  let comparative = "";
  let superlative = "";

  // Strategy: 
  // 1. Check irregulars
  // 2. Check 'y' ending
  // 3. Check SHORT_ADJECTIVES whitelist (takes -er/-est)
  // 4. Default to more/most for everything else (Safest approach)

  if (word === 'good') {
    comparative = "better";
    superlative = "best";
  } else if (word === 'bad') {
    comparative = "worse";
    superlative = "worst";
  } else if (word === 'far') {
    comparative = "farther/further";
    superlative = "farthest/furthest";
  } else if (word === 'little') {
    comparative = "less";
    superlative = "least";
  } else if (word.endsWith('y')) {
    // happy -> happier
    comparative = word.slice(0, -1) + "ier";
    superlative = word.slice(0, -1) + "iest";
  } else if (SHORT_ADJECTIVES.has(word)) {
    if (word.endsWith('e')) {
        comparative = word + "r";
        superlative = word + "st";
    } else if (needsDoubling(word)) {
        comparative = word + word[word.length - 1] + "er";
        superlative = word + word[word.length - 1] + "est";
    } else {
        comparative = word + "er";
        superlative = word + "est";
    }
  } else {
    // Default for long words or uncertain words
    comparative = "more " + word;
    superlative = "most " + word;
  }

  forms.push({
    label: "Comparative",
    form: comparative,
    explanation: "Used to compare two things."
  });

  forms.push({
    label: "Superlative",
    form: superlative,
    explanation: "Used to express the highest degree."
  });
}

// ==========================================
// HELPERS
// ==========================================

function isVowel(char: string): boolean {
  return ['a', 'e', 'i', 'o', 'u'].includes(char);
}

function needsDoubling(word: string): boolean {
  if (word.length < 3) return false;
  
  // Never double w, x, y, k (panic -> panicked handles k usually, but standard CVC excludes these)
  const last = word[word.length - 1];
  if (['w', 'x', 'y'].includes(last)) return false;
  
  // Exception list check (stress not on last syllable)
  if (NO_DOUBLING_EXCEPTIONS.has(word)) return false;

  const secondLast = word[word.length - 2];
  const thirdLast = word[word.length - 3];

  // CVC pattern: Consonant - Vowel - Consonant
  // Note: this is a heuristic. 'commit' doubles, 'visit' doesn't.
  // Without phonetic stress data, we rely on the exception list above.
  return !isVowel(last) && isVowel(secondLast) && !isVowel(thirdLast);
}
