import { createClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("Supabase client should only be used server-side.");
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or anon key in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
