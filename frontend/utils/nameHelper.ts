/**
 * Clean and format usernames/emails to show a professional name.
 * - Strips trailing digits (e.g. "romanielrai94" -> "romanielrai")
 * - Splits combined names by delimiters (._-)
 * - Handles specific custom mappings (e.g. "romanielrai" -> "Romaniel Rai")
 * - Capitalizes each part of the name
 */
export function getCleanDisplayName(name?: string, email?: string): string {
  let rawName = name || email || '';
  if (!rawName) return 'Systems Specialist';

  // If it's an email format, extract the prefix before '@'
  if (rawName.includes('@')) {
    rawName = rawName.split('@')[0];
  }

  // Strip trailing numbers (e.g. "romanielrai94" -> "romanielrai")
  rawName = rawName.replace(/\d+$/, '');

  // Split by common delimiters
  const parts = rawName.split(/[\._-]/).filter(Boolean);

  // Map and capitalize each part
  const formattedParts = parts.map(part => {
    const lower = part.toLowerCase();
    if (lower === 'romanielrai') {
      return 'Romaniel Rai';
    }
    // Capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  const displayName = formattedParts.join(' ');
  return displayName || 'Systems Specialist';
}
