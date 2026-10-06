import { describe, expect, it } from "vitest";
import { resumeStyleCssVars } from "./density";

describe("resumeStyleCssVars", () => {
  it("uses a restrained 3:4 avatar size for preview and PDF", () => {
    const vars = resumeStyleCssVars();

    expect(vars["--resume-avatar-w"]).toBe("3.6rem");
    expect(vars["--resume-avatar-h"]).toBe("4.8rem");
  });
});
