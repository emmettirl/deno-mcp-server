import { validateFilePath } from "./src/validation.ts";

console.log("Testing null byte validation:");
const result = validateFilePath("file\x00.txt");
console.log("Result:", result);
console.log("Type:", typeof result);
console.log("Is null:", result === null);
console.log("Is falsy:", !result);
