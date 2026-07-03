import type { Resume } from "@/types/resume";

/**
 * Shape of a resume row as stored in the Supabase `resumes` table.
 * snake_case mirrors the SQL column names in supabase/schema.sql.
 */
export interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  section_order: string[] | null;
  tags: string[] | null;
}

export function rowToResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sectionOrder: row.section_order ?? [],
    tags: row.tags ?? [],
  };
}

/** Fixed demo user used while auth is not yet implemented. */
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
