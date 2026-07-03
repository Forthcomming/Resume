// Core resume domain types (see docs/resume-optimizer-prd.md §5)

export type SectionType =
  | "basic_info"
  | "summary"
  | "education"
  | "work_experience"
  | "project"
  | "skills"
  | "awards"
  | "custom";

export interface Resume {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  sectionOrder: string[];
  /**
   * Display-only labels shown on the dashboard cards (e.g. 产品 / 互联网).
   * Extension over the PRD model to support the resume library UI.
   */
  tags: string[];
}
