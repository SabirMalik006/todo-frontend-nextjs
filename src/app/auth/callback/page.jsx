"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const id = params.get("id");
    const name = params.get("name");
    const email = params.get("email");

    if (accessToken && refreshToken) {

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify({ id, name, email }));


      setTimeout(() => {
        router.replace("/dashboard");
      }, 800);
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#2B1887] to-[#4a3bbd]">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-xl font-semibold text-white/90 animate-pulse">
          Logging you in...
        </p>
        <p className="text-white/60 text-sm mt-2">
          Please wait while we authenticate your account
        </p>
      </div>
    </div>
  );
}
