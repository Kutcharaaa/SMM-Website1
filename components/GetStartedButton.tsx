"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type GetStartedButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function GetStartedButton({
  className = "",
  children = "Get Started",
}: GetStartedButtonProps) {
  const router = useRouter();

  async function handleClick() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.push("/dashboard");
      return;
    }

    router.push("/register");
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}