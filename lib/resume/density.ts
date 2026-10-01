/** Fixed campus-style tokens applied on `.resume-print-root`. */

export type ResumeStyleCssVars = Record<`--resume-${string}`, string>;

const CAMPUS_STYLE_TOKENS: ResumeStyleCssVars = {
  "--resume-pad-x": "8.5%",
  "--resume-pad-y": "5%",
  "--resume-name-size": "22px",
  "--resume-section-title-size": "13px",
  "--resume-entry-title-size": "12px",
  "--resume-body-size": "11.5px",
  "--resume-meta-size": "10.5px",
  "--resume-leading": "1.42",
  "--resume-body-mt": "0.7rem",
  "--resume-section-gap": "0.75rem",
  "--resume-entry-gap": "0.5rem",
  "--resume-section-title-mb": "0.3rem",
  "--resume-header-gap": "0.3rem",
  /* ~证件照 3:4，右上角 */
  "--resume-avatar-w": "4.5rem",
  "--resume-avatar-h": "6rem",
};

export function resumeStyleCssVars(): ResumeStyleCssVars {
  return CAMPUS_STYLE_TOKENS;
}
