// UpdateChecker Service Modular Test Suite
// This file imports all modular test files to maintain the complete test coverage
// while providing better organization and maintainability.

// Import all modular test suites
import "./updateChecker/VersionComparator.test";
import "./updateChecker/TextFormatter.test";
import "./updateChecker/GitHubApiClient.test";
import "./updateChecker/ReleaseProcessor.test";
import "./updateChecker/UpdateConfiguration.test";
import "./updateChecker/UpdateCheckerService.test";
import "./updateChecker/EdgeCases.test";

// Note: All 102+ tests are now organized into focused modules:
//
// 1. VersionComparator.test.ts - Version comparison and normalization logic
// 2. TextFormatter.test.ts - Release notes processing and formatting
// 3. GitHubApiClient.test.ts - GitHub API URL construction and configuration
// 4. ReleaseProcessor.test.ts - Release data processing and extraction
// 5. UpdateConfiguration.test.ts - VS Code configuration reading and parsing
// 6. UpdateCheckerService.test.ts - Main service integration and lifecycle tests
// 7. EdgeCases.test.ts - Error handling, edge cases, and resource management
//
// This modular approach provides:
// - Better maintainability with focused test files (~50-100 lines each)
// - Clear separation of concerns matching the refactored service modules
// - Easier debugging with targeted test suites
// - Improved readability and organization
// - Shared test utilities in TestHelpers.ts
