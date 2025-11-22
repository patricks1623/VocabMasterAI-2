
import { WordForm } from "../types";

/**
 * Lista básica de verbos irregulares comuns para mapeamento manual.
 * Formato: [Base, Past Simple, Past Participle]
 */
const IRREGULAR_VERBS: Record<string, [string, string]> = {
  be: ["was/were", "been"],
  have: ["had", "had"],
  do: ["did", "done"],
  go: ["went", "gone"],
  say: ["said", "said"],
  make: ["made", "made"],
  get: ["got", "got/gotten"],
  know: ["knew", "known"],
  think: ["thought", "thought"],
  take: ["took", "taken"],
  see: ["saw", "seen"],
  come: ["came", "come"],
  find: ["found", "found"],
  give: ["gave", "given"],
  tell: ["told", "told"],
  feel: ["felt", "felt"],
  become: ["became", "become"],
  leave: ["left", "left"],
  put: ["put", "put"],
  mean: ["meant", "meant"],
  keep: ["kept", "kept"],
  let: ["let", "let"],
  begin: ["began", "begun"],
  seem: ["seemed", "seemed"],
  help: ["helped", "helped"],
  show: ["showed", "shown"],
  hear: ["heard", "heard"],
  play: ["played", "played"],
  run: ["ran", "run"],
  move: ["moved", "moved"],
  live: ["lived", "lived"],
  believe: ["believed", "believed"],
  bring: ["brought", "brought"],
  happen: ["happened", "happened"],
  write: ["wrote", "written"],
  sit: ["sat", "sat"],
  stand: ["stood", "stood"],
  lose: ["lost", "lost"],
  pay: ["paid", "paid"],
  meet: ["met", "met"],
  include: ["included", "included"],
  continue: ["continued", "continued"],
  set: ["set", "set"],
  learn: ["learnt/learned", "learnt/learned"],
  change: ["changed", "changed"],
  lead: ["led", "led"],
  understand: ["understood", "understood"],
  watch: ["watched", "watched"],
  follow: ["followed", "followed"],
  stop: ["stopped", "stopped"],
  create: ["created", "created"],
  speak: ["spoke", "spoken"],
  read: ["read", "read"],
  spend: ["spent", "spent"],
  grow: ["grew", "grown"],
  open: ["opened", "opened"],
  walk: ["walked", "walked"],
  win: ["won", "won"],
  offer: ["offered", "offered"],
  remember: ["remembered", "remembered"],
  love: ["loved", "loved"],
  consider: ["considered", "considered"],
  appear: ["appeared", "appeared"],
  buy: ["bought", "bought"],
  wait: ["waited", "waited"],
  serve: ["served", "served"],
  die: ["died", "died"],
  send: ["sent", "sent"],
  expect: ["expected", "expected"],
  build: ["built", "built"],
  stay: ["stayed", "stayed"],
  fall: ["fell", "fallen"],
  cut: ["cut", "cut"],
  reach: ["reached", "reached"],
  kill: ["killed", "killed"],
  remain: ["remained", "remained"],
  suggest: ["suggested", "suggested"],
  raise: ["raised", "raised"],
  pass: ["passed", "passed"],
  sell: ["sold", "sold"],
  break: ["broke", "broken"],
  decide: ["decided", "decided"],
  eat: ["ate", "eaten"],
  drive: ["drove", "driven"],
  wear: ["wore", "worn"],
  choose: ["chose", "chosen"],
  sing: ["sang", "sung"],
  drink: ["drank", "drunk"],
  hit: ["hit", "hit"],
  fly: ["flew", "flown"],
  catch: ["caught", "caught"],
  draw: ["drew", "drawn"],
  throw: ["threw", "thrown"],
  sleep: ["slept", "slept"],
  teach: ["taught", "taught"],
  wake: ["woke", "woken"],
  swim: ["swam", "swum"],
  ride: ["rode", "ridden"],
  forget: ["forgot", "forgotten"]
};

/**
 * Função principal que gera as formas gramaticais baseadas na classe da palavra.
 */
export function getWordForms(word: string, partOfSpeech: string): WordForm[] {
  const cleanWord = word.toLowerCase().trim();
  const forms: WordForm[] = [];
  
  // Simplifica a POS (Part of Speech) para categorias principais
  const isVerb = partOfSpeech.includes('verb') && !partOfSpeech.includes('adverb');
  const isNoun = partOfSpeech.includes('noun');
  const isAdjective = partOfSpeech.includes('adj');

  if (isVerb) {
    generateVerbForms(cleanWord, forms);
  } else if (isNoun) {
    generateNounForms(cleanWord, forms);
  } else if (isAdjective) {
    generateAdjectiveForms(cleanWord, forms);
  } else {
    // Caso genérico ou Advérbios
    forms.push({
      label: "Base Form",
      form: cleanWord,
      explanation: "This word usually doesn't change form or acts as an invariant modifier."
    });
  }

  return forms;
}

function generateVerbForms(word: string, forms: WordForm[]) {
  // 1. Third Person Singular (He/She/It)
  let thirdPerson = word + "s";
  if (word.endsWith('o') || word.endsWith('ch') || word.endsWith('s') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z')) {
    thirdPerson = word + "es";
  } else if (word.endsWith('y') && !isVowel(word[word.length - 2])) {
    thirdPerson = word.slice(0, -1) + "ies";
  } else if (word === 'have') {
    thirdPerson = 'has';
  } else if (word === 'be') {
    thirdPerson = 'is';
  }

  forms.push({
    label: "3rd Person Singular",
    form: thirdPerson,
    explanation: "Used with He, She, It in the Present Simple tense."
  });

  // 2. Present Participle / Gerund (-ing)
  let gerund = word + "ing";
  if (word === 'be') {
      gerund = 'being';
  } else if (word.endsWith('ie')) {
    gerund = word.slice(0, -2) + "ying"; // die -> dying
  } else if (word.endsWith('e') && !word.endsWith('ee') && !word.endsWith('oe') && !word.endsWith('ye')) {
    gerund = word.slice(0, -1) + "ing"; // make -> making
  } else if (needsDoubling(word)) {
    gerund = word + word[word.length - 1] + "ing"; // run -> running
  }

  forms.push({
    label: "Gerund / Continuous",
    form: gerund,
    explanation: "Used for continuous actions (Present Continuous) or as a noun."
  });

  // 3. Past Simple & Past Participle
  let pastSimple = "";
  let pastParticiple = "";

  if (IRREGULAR_VERBS[word]) {
    [pastSimple, pastParticiple] = IRREGULAR_VERBS[word];
  } else {
    // Regras Regulares
    if (word.endsWith('e')) {
      pastSimple = word + "d";
    } else if (word.endsWith('y') && !isVowel(word[word.length - 2])) {
      pastSimple = word.slice(0, -1) + "ied";
    } else if (needsDoubling(word)) {
      pastSimple = word + word[word.length - 1] + "ed";
    } else {
      pastSimple = word + "ed";
    }
    pastParticiple = pastSimple; // Para regulares é igual
  }

  forms.push({
    label: "Past Simple (V2)",
    form: pastSimple,
    explanation: "Used to describe finished actions in the past."
  });

  forms.push({
    label: "Past Participle (V3)",
    form: pastParticiple,
    explanation: "Used in Perfect tenses (have done) or Passive Voice."
  });
}

function generateNounForms(word: string, forms: WordForm[]) {
  let plural = word + "s";
  
  // Regras de Plural
  if (word.endsWith('s') || word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z')) {
    plural = word + "es"; // bus -> buses
  } else if (word.endsWith('y') && !isVowel(word[word.length - 2])) {
    plural = word.slice(0, -1) + "ies"; // city -> cities
  } else if (word.endsWith('f')) {
      plural = word.slice(0, -1) + "ves"; // leaf -> leaves (simplificação, nem sempre verdade)
  } else if (word.endsWith('fe')) {
      plural = word.slice(0, -2) + "ves"; // life -> lives
  }
  
  // Irregulares básicos
  const irregularNouns: Record<string, string> = {
      "man": "men", "woman": "women", "child": "children", "foot": "feet",
      "tooth": "teeth", "goose": "geese", "mouse": "mice", "person": "people"
  };

  if (irregularNouns[word]) {
      plural = irregularNouns[word];
  }

  forms.push({
    label: "Singular",
    form: word,
    explanation: "Refers to one single item."
  });

  forms.push({
    label: "Plural",
    form: plural,
    explanation: "Refers to more than one item."
  });
}

function generateAdjectiveForms(word: string, forms: WordForm[]) {
  // Regra heurística: Palavras curtas ganham -er/-est. Longas ganham more/most.
  // Não é perfeito sem contagem de sílabas precisa, mas funciona para a maioria.
  
  const isShort = word.length <= 6; // Heurística simples

  let comparative = "";
  let superlative = "";

  if (word === 'good') {
    comparative = "better";
    superlative = "best";
  } else if (word === 'bad') {
    comparative = "worse";
    superlative = "worst";
  } else if (word === 'far') {
    comparative = "farther/further";
    superlative = "farthest/furthest";
  } else if (word.endsWith('y')) {
    // happy -> happier
    comparative = word.slice(0, -1) + "ier";
    superlative = word.slice(0, -1) + "iest";
  } else if (isShort) {
    // fast -> faster
    comparative = word + "er";
    superlative = word + "est";
    
    if (word.endsWith('e')) {
        comparative = word + "r";
        superlative = word + "st";
    } else if (needsDoubling(word)) {
        comparative = word + word[word.length - 1] + "er";
        superlative = word + word[word.length - 1] + "est";
    }
  } else {
    // beautiful -> more beautiful
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
    explanation: "Used to express the highest degree of a quality."
  });
}

// Utilitários
function isVowel(char: string): boolean {
  return ['a', 'e', 'i', 'o', 'u'].includes(char);
}

function needsDoubling(word: string): boolean {
  // Consoante-Vogal-Consoante (CVC) rule simplification
  if (word.length < 3) return false;
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  const thirdLast = word[word.length - 3];
  
  return !isVowel(last) && isVowel(secondLast) && !isVowel(thirdLast) && 
         !['w', 'x', 'y'].includes(last); // Don't double w, x, y
}
