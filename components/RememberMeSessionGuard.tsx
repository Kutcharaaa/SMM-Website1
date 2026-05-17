"use client";

import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function RememberMeSessionGuard() {
  useEffect(() => {
    async function checkRememberMeSession() {
      const rememberMe = localStorage.getItem("ascend_remember_me");
      const sessionLogin = sessionStorage.getItem("ascend_session_login");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      if (rememberMe === "false" && !sessionLogin) {
        await supabase.auth.signOut();

        localStorage.removeItem("ascend_remember_me");
        sessionStorage.removeItem("ascend_session_login");

        window.location.href = "/login";
      }
    }

    checkRememberMeSession();
  }, []);

  return null;
}