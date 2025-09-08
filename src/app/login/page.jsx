"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://todo-backend-w-nextjs-production-6329.up.railway.app/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("accessToken", res.data.accessToken) 
      // localStorage.setItem("refreshToken", res.data.refreshToken);

      toast.success("Login successful");
      setTimeout(() => (window.location.href = "/todo"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials ❌");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-blue-100">
      <div className="border border-gray-700 p-10 rounded-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-black">Login</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-64">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-500 px-3 py-2 rounded-2xl text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border px-3 py-2 rounded-2xl border-gray-500 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-2xl transform hover:scale-105 ease-in-out duration-300"
          >
            Login
          </button>
        </form>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <p className="mt-4 text-blue-600 text-center">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-green-500">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
