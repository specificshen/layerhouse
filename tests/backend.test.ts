import { describe, expect, test } from "bun:test";
import { previewBackendName, readBackendName, wantsWebGLBackend } from "@/engine";

describe("renderer backend", () => {
  test("asks for WebGL2 only when the query sets backend=webgl", () => {
    expect(wantsWebGLBackend(new URLSearchParams())).toBe(false);
    expect(wantsWebGLBackend(new URLSearchParams("backend=webgpu"))).toBe(false);
    expect(wantsWebGLBackend(new URLSearchParams("backend=webgl"))).toBe(true);
  });

  test("previews WebGPU until init, unless WebGL was forced", () => {
    expect(previewBackendName(false)).toBe("WebGPU");
    expect(previewBackendName(true)).toBe("WebGL2");
  });

  test("reads the HUD label from the backend flag after init", () => {
    expect(readBackendName({ isWebGPUBackend: true })).toBe("WebGPU");
    expect(readBackendName({ isWebGPUBackend: false })).toBe("WebGL2");
    expect(readBackendName({})).toBe("WebGL2");
  });
});
