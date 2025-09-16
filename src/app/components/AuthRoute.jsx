// "use client";

// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// const AuthRoute = ({ children, reverse = false }) => {
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     const refresh = localStorage.getItem("refreshToken");

//     if (reverse) {

//       if (token || refresh) {

//         router.replace("/");
//       }
//     } else {
   
//       if (!token) {
//         router.replace("/login");
//       }
//     }

//     setLoading(false);
//   }, [router, reverse]);

//   if (loading) return null;

//   return children;
// };

// export default AuthRoute;


"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import api from "../utils/api";

const AuthRoute = ({ children, reverse = false }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    if (reverse) {
      // if already logged in, redirect away from login/register
      if (token || refresh) {
        router.replace("/");
      }
    } else {
      // if not logged in, redirect to login
      if (!token) {
        router.replace("/login");
      }
    }

    setLoading(false);
  }, [router, reverse]);

  // 🔄 Refresh access token every 3 minutes
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;

      try {
        const res = await api.post(
          `auth/refresh`,
          { refreshToken }
        );

        if (res.data?.accessToken) {
          localStorage.setItem("accessToken", res.data.accessToken);
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
        // optional: if refresh fails, log out
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.replace("/login");
      }
    }, 1 * 60 * 1000); // 3 minutes

    return () => clearInterval(refreshInterval);
  }, [router]);

  if (loading) return null;

  return children;
};

export default AuthRoute;
