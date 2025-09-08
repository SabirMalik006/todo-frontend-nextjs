"use client";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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
    <main className="flex flex-col items-center justify-center h-screen bg-green-100">
      <div className="border border-gray-500 p-10 rounded-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-black">Sign Up</h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-4 w-64 text-black">
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleChange}
            className="border border-gray-500 px-3 py-2 rounded-2xl"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="border border-gray-500 px-3 py-2 rounded-2xl"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="border border-gray-500 px-3 py-2 rounded-2xl"
          />
          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded-2xl transform hover:scale-105 ease-in-out duration-300"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-green-500 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
