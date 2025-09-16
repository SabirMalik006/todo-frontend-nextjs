"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthRoute from "../components/AuthRoute";
import api from "../utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        "/auth/login",
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
  <main className="relative flex h-screen w-full login-page">
    {/* Background Shape */}
    <div className="absolute inset-0">
    <svg
        className="w-full h-full"
        viewBox="0 0 1440 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          fill="black"
          d="M0,0 L0,800 C480,400 960,600 1440,0 L1440,0 Z"
        />
      </svg>
    </div>

    {/* Login Box */}
    <div className="relative z-10 flex w-full items-center justify-center min-h-screen">
      <div className="w-80 rounded-2xl p-10 bg-white/30 backdrop-blur-md shadow-lg">
        {/* Heading */}
        <h1 className="text-2xl font-bold mb-6 text-center text-white/80">
          LOGIN
        </h1>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-white">
          <input
            type="email"
            placeholder="Email"
            className="border-b border-white/50 bg-transparent focus:outline-none py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border-b border-white/50 bg-transparent focus:outline-none py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="border border-black py-2 mt-4 text-black cursor-pointer font-medium rounded-2xl hover:bg-black hover:text-white transition-all"
          >
            LOGIN
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 text-center text-sm text-black">OR</div>

        {/* Signup Link */}
        <Link
          href="/signup"
          className="block border border-black py-2 cursor-pointer text-black font-medium rounded-2xl text-center hover:bg-black hover:text-white transition-all"
        >
          SIGN UP
        </Link>
      </div>
    </div>
  </main>
</AuthRoute>

    </>
  );
}
