"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthRoute from "../components/AuthRoute";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://todo-backend-w-nextjs-production-6329.up.railway.app/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      toast.success("Login successful");
      setTimeout(() => (window.location.href = "/"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials ❌");
    }
  };

  return (
    <>
      <AuthRoute reverse>
        <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
          <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 p-10 rounded-2xl shadow-lg w-80">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">
              Login
            </h1>

            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-4 text-white"
            >
              <input
                type="email"
                placeholder="Email"
                className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="submit"
                className="bg-cyan-600 text-white py-2 cursor-pointer rounded-xl font-semibold hover:bg-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-md"
              >
                Login
              </button>
            </form>

            {error && <p className="text-red-400 mt-2 text-center">{error}</p>}

            <p className="mt-6 text-gray-400 text-center">
              Don’t have an account?{" "}
              <Link
                href="/signup"
                className="text-cyan-400 font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </main>
      </AuthRoute>
    </>
  );
}
