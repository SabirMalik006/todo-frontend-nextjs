"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../utils/api";

const AuthRoute = ({ children, reverse = false }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    if (reverse) {
      if (token || refresh) {
        router.replace("/");
      }
    } else {
      if (!token) {
        router.replace("/login");
      } else {

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    }

    setLoading(false);
  }, [router, reverse]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;

      try {
        const res = await api.post("auth/refresh", { refreshToken });

        if (res.data?.accessToken) {
       
          localStorage.setItem("accessToken", res.data.accessToken);

        
          api.defaults.headers.common["Authorization"] = `Bearer ${res.data.accessToken}`;
        }
      } catch (err) {
        console.error("Token refresh failed:", err);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.replace("/login");
      }
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [router]);

  if (loading) return null;

  return children;
};

export default AuthRoute;
