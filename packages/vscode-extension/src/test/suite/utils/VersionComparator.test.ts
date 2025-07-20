import * as assert from "assert";
import { VersionComparator } from "../../../utils/VersionComparator";

suite("VersionComparator Tests", () => {
  suite("Version Comparison", () => {
    test("Should correctly compare semantic versions - older vs newer", () => {
      const result = VersionComparator.compareVersions("1.0.0", "1.0.1");
      assert.strictEqual(result, -1, "1.0.0 should be less than 1.0.1");
    });

    test("Should correctly compare semantic versions - newer vs older", () => {
      const result = VersionComparator.compareVersions("1.1.0", "1.0.9");
      assert.strictEqual(result, 1, "1.1.0 should be greater than 1.0.9");
    });

    test("Should correctly compare semantic versions - equal", () => {
      const result = VersionComparator.compareVersions("1.0.0", "1.0.0");
      assert.strictEqual(result, 0, "1.0.0 should equal 1.0.0");
    });

    test("Should handle version prefixes (v1.0.0 vs 1.0.0)", () => {
      const result1 = VersionComparator.compareVersions(
        "v1.0.0",
        "1.0.1",
      );
      const result2 = VersionComparator.compareVersions(
        "1.0.0",
        "v1.0.1",
      );
      assert.strictEqual(result1, -1, "v1.0.0 should be less than 1.0.1");
      assert.strictEqual(result2, -1, "1.0.0 should be less than v1.0.1");
    });

    test("Should handle date-based versions", () => {
      const result = VersionComparator.compareVersions(
        "2025.07.20.1000",
        "2025.07.20.1100",
      );
      assert.strictEqual(
        result,
        -1,
        "Earlier timestamp should be less than later timestamp",
      );
    });

    test("Should handle complex version formats", () => {
      const result1 = VersionComparator.compareVersions(
        "1.0.0-beta.1",
        "1.0.0",
      );
      const result2 = VersionComparator.compareVersions(
        "1.0.0-alpha.1",
        "1.0.0-beta.1",
      );
      assert.strictEqual(
        result1,
        -1,
        "Beta version should be less than release",
      );
      assert.strictEqual(result2, -1, "Alpha should be less than beta");
    });

    test("Should handle invalid version formats gracefully", () => {
      // Test with various invalid version formats
      const invalidVersions = ["", "invalid", "v", "1.2.3.4.5"];

      const testVersionComparison = (version: string) => {
        const result = VersionComparator.compareVersions(
          "1.0.0",
          version,
        );
        return typeof result === "number"; // Should always return a number
      };

      invalidVersions.forEach((invalidVersion) => {
        const isValidResult = testVersionComparison(invalidVersion);
        assert.ok(
          isValidResult,
          `Should handle invalid version gracefully: ${invalidVersion}`,
        );
      });
    });
  });

  suite("Version Normalization", () => {
    test("Should normalize versions with v prefix", () => {
      const result = VersionComparator.normalizeVersion("v1.2.3");
      assert.strictEqual(result, "1.2.3", "Should remove v prefix");
    });

    test("Should handle versions without v prefix", () => {
      const result = VersionComparator.normalizeVersion("1.2.3");
      assert.strictEqual(
        result,
        "1.2.3",
        "Should preserve version without prefix",
      );
    });

    test("Should handle empty versions", () => {
      const result = VersionComparator.normalizeVersion("");
      assert.strictEqual(result, "", "Should handle empty string");
    });
  });
});
