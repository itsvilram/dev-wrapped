import { describe, expect, it } from "vitest";
import { isValidUsername } from "./username";

describe("isValidUsername", () => {
  it.each(["torvalds", "itsvilram", "a", "some-user", "User123"])(
    "accepts %s",
    (name) => expect(isValidUsername(name)).toBe(true),
  );

  it.each([
    "",
    "-start",
    "end-",
    "double--hyphen",
    "has space",
    "../etc",
    "a".repeat(40),
  ])("rejects %s", (name) => expect(isValidUsername(name)).toBe(false));
});
