export type ResumeDensity = "compact" | "standard" | "relaxed";

export const DEFAULT_RESUME_DENSITY: ResumeDensity = "standard";

export const RESUME_DENSITY_OPTIONS: {
  value: ResumeDensity;
  label: string;
}[] = [
  { value: "compact", label: "紧凑" },
  { value: "standard", label: "标准" },
  { value: "relaxed", label: "宽松" },
];

export function isResumeDensity(value: unknown): value is ResumeDensity {
  return value === "compact" || value === "standard" || value === "relaxed";
}

/** CSS variables applied on `.resume-print-root`. */
export type ResumeDensityCssVars = Record<`--resume-${string}`, string>;

const DENSITY_TOKENS: Record<ResumeDensity, ResumeDensityCssVars> = {
  compact: {
    "--resume-pad-x": "7%",
    "--resume-pad-y": "4%",
    "--resume-name-size": "18px",
    "--resume-section-title-size": "11px",
    "--resume-entry-title-size": "11px",
    "--resume-body-size": "10px",
    "--resume-meta-size": "9px",
    "--resume-leading": "1.35",
    "--resume-body-mt": "0.75rem",
    "--resume-section-gap": "0.65rem",
    "--resume-entry-gap": "0.4rem",
    "--resume-section-title-mb": "0.25rem",
    "--resume-header-gap": "0.35rem",
    /* Portrait ID photo ~3:4 */
    "--resume-avatar-w": "2.25rem",
    "--resume-avatar-h": "3rem",
  },
  standard: {
    "--resume-pad-x": "9.5%",
    "--resume-pad-y": "6%",
    "--resume-name-size": "24px",
    "--resume-section-title-size": "12px",
    "--resume-entry-title-size": "12px",
    "--resume-body-size": "11px",
    "--resume-meta-size": "10px",
    "--resume-leading": "1.5",
    "--resume-body-mt": "1.5rem",
    "--resume-section-gap": "1.25rem",
    "--resume-entry-gap": "0.75rem",
    "--resume-section-title-mb": "0.5rem",
    "--resume-header-gap": "0.375rem",
    "--resume-avatar-w": "3rem",
    "--resume-avatar-h": "4rem",
  },
  relaxed: {
    "--resume-pad-x": "11%",
    "--resume-pad-y": "7.5%",
    "--resume-name-size": "26px",
    "--resume-section-title-size": "13px",
    "--resume-entry-title-size": "13px",
    "--resume-body-size": "12px",
    "--resume-meta-size": "11px",
    "--resume-leading": "1.65",
    "--resume-body-mt": "1.75rem",
    "--resume-section-gap": "1.5rem",
    "--resume-entry-gap": "1rem",
    "--resume-section-title-mb": "0.65rem",
    "--resume-header-gap": "0.5rem",
    "--resume-avatar-w": "3.2rem",
    "--resume-avatar-h": "4.25rem",
  },
};

export function resumeDensityCssVars(
  density: ResumeDensity = DEFAULT_RESUME_DENSITY
): ResumeDensityCssVars {
  return DENSITY_TOKENS[isResumeDensity(density) ? density : DEFAULT_RESUME_DENSITY];
}
