const DEFAULT_WORDS = [
  "fuck", "fucking", "fucked", "fucker", "fuckface", "fck", "fukk", "phuck",
  "shit", "shitty", "shat", "asshole", "arsehole", "arse", "ass",
  "bitch", "biatch", "bastard", "cunt", "cnt", "cock", "dick",
  "pussy", "pssy", "motherfucker", "muthafucka", "slut", "slt", "whore", "prick", "twat",
  "wanker", "faggot", "nigger", "niga", "kike", "retard", "spastic", "moron", "idiot", "crap",
  "cazzo", "merda", "stronzo", "puttana", "vaffanculo", "coglione",
  "minchia", "bastardo", "troia"
];

let cachedWords: string[] | null = null;

export const loadProfanityWords = async (
  fetchFn: () => Promise<string[]>
): Promise<string[]> => {
  if (cachedWords) return cachedWords;
  try {
    const dbWords = await fetchFn();
    cachedWords = dbWords.length > 0 ? dbWords : DEFAULT_WORDS;
  } catch {
    cachedWords = DEFAULT_WORDS;
  }
  return cachedWords;
};

export const resetProfanityCache = () => {
  cachedWords = null;
};

// Leet-speak / symbol substitution map
const LEET_MAP: Record<string, string> = {
  "@": "a", "4": "a", "^": "a",
  "8": "b",
  "(": "c", "<": "c",
  "3": "e",
  "6": "g",
  "#": "h",
  "!": "i", "1": "i", "|": "i",
  "0": "o",
  "5": "s", "$": "s",
  "7": "t", "+": "t",
  "v": "v",
  "w": "w",
  "9": "g",
};

/**
 * Normalize text by:
 * 1. Lowercasing
 * 2. Replacing leet-speak characters with their letter equivalents
 * 3. Stripping separators (dots, dashes, underscores, asterisks, spaces between single chars)
 */
const normalizeText = (text: string): string => {
  let result = text.toLowerCase();

  // Replace leet-speak characters
  result = result
    .split("")
    .map((ch) => LEET_MAP[ch] || ch)
    .join("");

  // Remove common separators used to bypass filters: . - _ * ~
  result = result.replace(/[.\-_*~]/g, "");

  return result;
};

/**
 * Normalize a profanity word the same way we normalize input text,
 * so that DB entries like "@sshole" or "f**k" match correctly.
 */
const normalizeWord = (word: string): string => {
  return normalizeText(word);
};

export const checkProfanity = (text: string, words: string[]): boolean => {
  const normalized = normalizeText(text);

  return words.some((w) => {
    const normalizedWord = normalizeWord(w);
    if (normalizedWord.length < 2) return false;
    // Use word boundary regex on normalized text
    const escaped = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    // Check both normalized and also substring match for short aggressive words
    return regex.test(normalized) || normalized.includes(normalizedWord);
  });
};

export const filterProfanity = (text: string, words: string[]): string => {
  let result = text;
  const normalizedResult = normalizeText(text);

  words.forEach((w) => {
    const normalizedWord = normalizeWord(w);
    if (normalizedWord.length < 2) return;

    // Find occurrences in the normalized version and mask the same positions in original
    let searchFrom = 0;
    while (true) {
      const idx = normalizedResult.indexOf(normalizedWord, searchFrom);
      if (idx === -1) break;

      // Map back to original text positions (approximate — same length since we only substitute chars)
      const before = result.substring(0, idx);
      const match = result.substring(idx, idx + normalizedWord.length);
      const after = result.substring(idx + normalizedWord.length);
      result = before + "*".repeat(match.length) + after;
      searchFrom = idx + normalizedWord.length;
    }
  });

  return result;
};
