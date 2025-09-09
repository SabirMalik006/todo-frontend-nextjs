"use client";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AuthRoute from "../components/AuthRoute";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://todo-backend-w-nextjs-production-6329.up.railway.app/api/auth/register", form);

      if (res.status === 200) {
        toast.success("Signup successful ");
        setTimeout(() => (window.location.href = "/login"), 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed ❌");
    }
  };

  return (
   <>
   <AuthRoute reverse>
  <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 p-10 rounded-2xl shadow-lg w-80">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">
        Sign Up
      </h1>

      <form
        onSubmit={handleRegister}
        className="flex flex-col gap-4 text-white"
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="px-3 py-2 rounded-xl border border-gray-600 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <button
          type="submit"
          className="bg-cyan-600 text-white py-2 cursor-pointer rounded-xl font-semibold hover:bg-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-md"
        >
          Sign Up
        </button>
      </form>

      <p className="mt-6 text-gray-400 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 font-semibold hover:underline">
          Login
        </Link>
      </p>
    </div>
  </main>
</AuthRoute>

   </>
  );
}
