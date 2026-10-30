import "server-only";
import { db } from "./supabase/server";
import type { DesignId } from "./document-designs";
export type VisualTemplate = {
  id: DesignId;
  name: string;
  description: string;
  thumbnail: string;
  sort_order: number;
  updated_at?: string;
  published: boolean;
};
export async function visualLibrary(): Promise<VisualTemplate[]> {
  const client = await db();
  const { data, error } = await client
    .from("visual_templates")
    .select("*")
    .eq("published", true)
    .order("sort_order")
    .order("name");
  if (error)
    throw new Error("Não foi possível carregar a biblioteca de modelos.");
  return data || [];
}
