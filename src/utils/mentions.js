/**
 * Client-side utility for extracting @mentions from text
 * Can be used in both client and server components
 */

/**
 * Extract @mentions from comment text
 * Returns array of mentioned usernames
 * @param {string} text - The text to extract mentions from
 * @returns {string[]} Array of unique mentioned usernames
 */
export function extractMentions(text) {
  if (!text) return [];

  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Highlight @mentions in text for display
 * @param {string} text - The text containing mentions
 * @returns {string} HTML string with highlighted mentions
 */
export function highlightMentions(text) {
  if (!text) return '';

  return text.replace(/@(\w+)/g, '<span class="text-indigo-400 font-semibold">@$1</span>');
}
