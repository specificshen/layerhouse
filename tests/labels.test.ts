import { describe, expect, test } from "bun:test";
import { SUBTITLE, TITLE } from "@/config";

describe("display name", () => {
  test("the visitor-facing name is 浅庭 / Light Court", () => {
    expect(TITLE).toBe("浅庭");
    expect(SUBTITLE).toBe("Light Court");
  });
});
