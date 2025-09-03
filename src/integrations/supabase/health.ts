import { supabase } from "./client";

export async function checkHealth() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
  } catch (err) {
    console.error("Supabase health check failed", err);
  }
}