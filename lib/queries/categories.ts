import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/domain";
export async function getCategories(type?: "income" | "expense"): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*").order("is_system", { ascending: false }).order("name");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}
export async function createCategory(input: { name: string; type: "income" | "expense"; color?: string }): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").insert({ name: input.name, type: input.type, color: input.color ?? "#64748B", is_system: false }).select().single();
  if (error) throw error;
  return data as Category;
}
