/**
 * Example Deno module for testing the MCP extension
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(x: number, y: number): number {
  return x * y;
}

// Main function for running the module directly
if (import.meta.main) {
  console.log(greet("Deno MCP Extension"));
  console.log(`2 + 3 = ${add(2, 3)}`);
  console.log(`4 * 5 = ${multiply(4, 5)}`);
}
