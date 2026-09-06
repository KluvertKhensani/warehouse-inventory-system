import { supabase } from "./supabase";

export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        connected: false,
        message: error.message,
      };
    }

    return {
      connected: true,
      message: "Supabase client initialized successfully.",
    };
  } catch (error) {
    return {
      connected: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to connect to Supabase.",
    };
  }
}