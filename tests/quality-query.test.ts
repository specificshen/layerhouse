import { describe, expect, test } from "bun:test";
import { QUALITY } from "@/config";
import { applyQualityQuery } from "@/engine";

const saved = {
  ao: QUALITY.ao,
  ssr: QUALITY.ssr,
  bloom: QUALITY.bloom,
  poolReflection: QUALITY.poolReflection,
};

function restore() {
  QUALITY.ao = saved.ao;
  QUALITY.ssr = saved.ssr;
  QUALITY.bloom = saved.bloom;
  QUALITY.poolReflection = saved.poolReflection;
}

describe("applyQualityQuery", () => {
  test("?fx=low disables GTAO, SSR, and the pool mirror", () => {
    try {
      applyQualityQuery(new URLSearchParams("fx=low"));
      expect(QUALITY.ao).toBe(false);
      expect(QUALITY.ssr).toBe(false);
      expect(QUALITY.poolReflection).toBe(false);
      expect(QUALITY.bloom).toBe(true);
    } finally {
      restore();
    }
  });

  test("leaves the defaults alone for any other query", () => {
    try {
      applyQualityQuery(new URLSearchParams("backend=webgl"));
      expect(QUALITY.ao).toBe(true);
      expect(QUALITY.ssr).toBe(true);
      expect(QUALITY.poolReflection).toBe(true);
      expect(QUALITY.bloom).toBe(true);
    } finally {
      restore();
    }
  });
});
