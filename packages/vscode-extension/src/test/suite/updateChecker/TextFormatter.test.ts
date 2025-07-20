import * as assert from "assert";
import { TextFormatter } from "../../../utils/TextFormatter";

suite("TextFormatter Tests", () => {
  suite("Release Notes Processing", () => {
    test("Should truncate long release notes", () => {
      const longNotes = "# Release Notes\n" + "- ".repeat(100) +
        "Feature\n".repeat(50);
      const truncated = TextFormatter.truncateReleaseNotes(longNotes, 200);

      assert.ok(
        truncated.length <= 203,
        "Should truncate to approximately requested length",
      ); // 200 + "..."
      assert.ok(
        truncated.endsWith("..."),
        "Should end with ellipsis when truncated",
      );
    });

    test("Should not truncate short release notes", () => {
      const shortNotes = "Short release notes\n- Feature A\n- Bug fix B";
      const result = TextFormatter.truncateReleaseNotes(
        "## Short release notes\n- Feature A\n- Bug fix B",
        200,
      );

      // The method cleans up markdown headers, so expect the cleaned version
      assert.strictEqual(
        result,
        shortNotes,
        "Should clean markdown but not truncate short notes",
      );
    });

    test("Should handle empty release notes", () => {
      const result = TextFormatter.truncateReleaseNotes("", 200);
      assert.strictEqual(
        result,
        "No release notes available.",
        "Should provide default message for empty notes",
      );
    });

    test("Should handle null release notes", () => {
      const result = TextFormatter.truncateReleaseNotes(null as any, 200);
      assert.strictEqual(
        result,
        "No release notes available.",
        "Should provide default message for null notes",
      );
    });

    test("Should clean markdown formatting", () => {
      const markdownText = "## Header\n**Bold text** and *italic text*\n[Link](http://example.com)";
      const result = TextFormatter.truncateReleaseNotes(markdownText, 200);

      assert.ok(
        !result.includes("##"),
        "Should remove markdown headers",
      );
      assert.ok(
        !result.includes("**"),
        "Should remove bold markdown",
      );
      assert.ok(
        !result.includes("[") && !result.includes("]("),
        "Should convert markdown links to text",
      );
    });

    test("Should respect custom max length", () => {
      const longText = "A".repeat(500);
      const result = TextFormatter.truncateReleaseNotes(longText, 100);

      assert.ok(
        result.length <= 103, // 100 + "..."
        "Should respect custom max length",
      );
    });
  });
});
