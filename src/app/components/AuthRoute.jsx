"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AuthRoute = ({ children, reverse = false }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    if (reverse) {
      if (token || refresh) router.replace("/dashboard");
    } else {
      if (!token && !refresh) router.replace("/login");
    }

    setLoading(false);
  }, [router, reverse]);

  if (loading) return null;
  return children;
};

export default AuthRoute;
