import { describe, expect, test } from "bun:test";
import { requestOptionalPointerLock } from "@/features/walk/bind-walk-pointer";

describe("optional pointer lock", () => {
  test("a rejected lock does not become an unhandled rejection", async () => {
    const reasons: unknown[] = [];
    const onRejection = (reason: unknown) => {
      reasons.push(reason);
    };
    process.on("unhandledRejection", onRejection);
    const canvas = {
      requestPointerLock() {
        return Promise.reject(new Error("WrongDocumentError"));
      },
    } as unknown as HTMLCanvasElement;
    requestOptionalPointerLock(canvas);
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off("unhandledRejection", onRejection);
    expect(reasons).toEqual([]);
  });

  test("a synchronous lock failure stays inside the helper", () => {
    const canvas = {
      requestPointerLock() {
        throw new Error("no lock");
      },
    } as unknown as HTMLCanvasElement;
    expect(() => requestOptionalPointerLock(canvas)).not.toThrow();
  });

  test("a successful lock is still requested", async () => {
    let calls = 0;
    const canvas = {
      requestPointerLock() {
        calls += 1;
        return Promise.resolve();
      },
    } as unknown as HTMLCanvasElement;
    requestOptionalPointerLock(canvas);
    await Promise.resolve();
    expect(calls).toBe(1);
  });
});
