/**
 * Text formatting utilities for release notes and markdown processing
 */
export class TextFormatter {
  /**
   * Truncate release notes for display in notification
   * Always cleans markdown regardless of length
   */
  static truncateReleaseNotes(body: string, maxLength: number = 200): string {
    if (!body) {
      return "No release notes available.";
    }

    // Clean up markdown first
    const cleaned = body
      .replace(/#{1,6}\s/g, "") // Remove markdown headers
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "") // Remove italic markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace links with text
      .trim();

    // If cleaned text is short enough, return as-is
    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.substring(0, maxLength) + "...";
  }
}
