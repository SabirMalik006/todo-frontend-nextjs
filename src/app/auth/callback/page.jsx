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
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-black/20 to-gray-800">
      <div className="text-center">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        {/* Message */}
        <p className="mt-6 text-lg font-semibold text-white animate-pulse">
          Logging you in...
        </p>
      </div>
    </div>
  );
}
