import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Profile helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
};

export const createProfile = async (
  profile: Database["public"]["Tables"]["profiles"]["Insert"],
) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert(profile)
    .select()
    .single();

  return { data, error };
};

// Commission tables helpers
export const getCommissionTables = async () => {
  const { data, error } = await supabase
    .from("commission_tables")
    .select("*")
    .order("id");

  return { data, error };
};

// Contracts helpers
export const getContracts = async (representativeId?: string) => {
  let query = supabase.from("contracts").select(`
      *,
      clients(*),
      profiles(*),
      commission_tables(*)
    `);

  if (representativeId) {
    query = query.eq("representative_id", representativeId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  return { data, error };
};

// Representatives helpers
export const getRepresentatives = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "Representante")
    .order("created_at", { ascending: false });

  return { data, error };
};

// Clients helpers
export const getClients = async () => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
};

export const createClient = async (
  client: Database["public"]["Tables"]["clients"]["Insert"],
) => {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  return { data, error };
};

// Withdrawal requests helpers
export const getWithdrawalRequests = async (representativeId?: string) => {
  let query = supabase.from("withdrawal_requests").select(`
      *,
      profiles(*)
    `);

  if (representativeId) {
    query = query.eq("representative_id", representativeId);
  }

  const { data, error } = await query.order("requested_at", {
    ascending: false,
  });
  return { data, error };
};
