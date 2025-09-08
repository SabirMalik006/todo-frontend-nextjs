"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login"); 
    }
  }, [router]);

  const token = typeof window !== "undefined" && localStorage.getItem("accessToken");

  if (!token) return null;

  return children;
};

export default ProtectedRoute;
