import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

function keys(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("translations", () => {
  it("have the same keys in English and French", () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });

  it("have no empty strings", () => {
    for (const messages of [en, fr]) {
      const empty = keys(messages).filter(
        (key) =>
          key
            .split(".")
            .reduce<unknown>(
              (node, part) => (node as Record<string, unknown>)[part],
              messages,
            ) === "",
      );
      expect(empty).toEqual([]);
    }
  });
});
