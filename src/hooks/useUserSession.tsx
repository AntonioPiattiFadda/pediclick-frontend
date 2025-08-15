import { useState, useEffect } from "react";
import { supabase } from "@/service"; 
import type { Session } from "@supabase/supabase-js";

export function useUserSession() {
  const [lookingForSession, setLookingForSession] = useState(true);
  const [userSession, setUserSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchUserSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session);
      setLookingForSession(false);
    };
    fetchUserSession();
  }, []);

  return { lookingForSession, userSession };
}
