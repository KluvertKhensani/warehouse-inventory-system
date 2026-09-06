import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile(userId) {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          employee_number,
          is_active,
          role:roles (
            id,
            name,
            description
          )
          `
        )
        .eq("id", userId)
        .single();

      if (!isMounted) {
        return;
      }

      if (error) {
        setProfile(null);
        setProfileError(
          `Unable to load your profile: ${error.message}`
        );
        return;
      }

      if (!data.is_active) {
        setProfile(null);
        setProfileError(
          "Your account is inactive. Contact an administrator."
        );
        return;
      }

      setProfile(data);
      setProfileError("");
    }

    async function initializeAuth() {
      setLoading(true);

      const {
        data: { session: existingSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        setProfile(null);
        setProfileError(error.message);
        setLoading(false);
        return;
      }

      setSession(existingSession);

      if (existingSession?.user?.id) {
        await loadProfile(existingSession.user.id);
      } else {
        setProfile(null);
        setProfileError("");
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!isMounted) {
          return;
        }

        if (event === "SIGNED_OUT" || !nextSession) {
          setSession(null);
          setProfile(null);
          setProfileError("");
          setLoading(false);
          return;
        }

        setSession(nextSession);

        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "USER_UPDATED"
        ) {
          setLoading(true);

          window.setTimeout(async () => {
            await loadProfile(nextSession.user.id);

            if (isMounted) {
              setLoading(false);
            }
          }, 0);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user || null,
    profile,
    loading,
    profileError,
  };
}