import { assertEquals } from "@std/assert";
import { add, greet, multiply } from "./mod.ts";

Deno.test("greet function", () => {
  assertEquals(greet("World"), "Hello, World!");
  assertEquals(greet("Deno"), "Hello, Deno!");
});

Deno.test("add function", () => {
  assertEquals(add(2, 3), 5);
  assertEquals(add(-1, 1), 0);
  assertEquals(add(0, 0), 0);
});

Deno.test("multiply function", () => {
  assertEquals(multiply(2, 3), 6);
  assertEquals(multiply(4, 5), 20);
  assertEquals(multiply(0, 10), 0);
});
