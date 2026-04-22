import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = "https://gessdgkkbpsuvykvokqd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6FXZBzUPaO6FZivS5wP7VQ_afGgybN4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
