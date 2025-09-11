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
      const res = await axios.post(
        "https://todo-backend-w-nextjs-production-6329.up.railway.app/api/auth/register",
        form
      );

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
        <main className="relative flex h-screen w-full">
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

          <div className="relative z-10 flex w-full items-center justify-center signup min-h-screen">
            <div className="w-80 rounded-2xl p-10 bg-white/30 backdrop-blur-md shadow-lg">
              {/* Heading */}
              <h1 className="text-2xl font-bold mb-6 text-center text-white/80">
                SIGN UP
              </h1>

              {/* Form */}
              <form
                onSubmit={handleRegister}
                className="flex flex-col gap-4 text-white"
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  onChange={handleChange}
                  className="border-b border-white/50 bg-transparent focus:outline-none py-2"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  className="border-b border-white/50 bg-transparent focus:outline-none py-2"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  className="border-b border-white/50 bg-transparent focus:outline-none py-2"
                  required
                />

                <button
                  type="submit"
                  className="border border-black py-2 mt-4 text-black cursor-pointer font-medium rounded-2xl hover:bg-black hover:text-white transition-all"
                >
                  REGISTER
                </button>
              </form>

              {/* Divider */}
              <div className="my-4 text-center text-sm text-black">OR</div>

              {/* Login Link */}
              <Link
                href="/login"
                className="block border border-black py-2 cursor-pointer text-black font-medium rounded-2xl text-center hover:bg-black hover:text-white transition-all"
              >
                LOGIN
              </Link>
            </div>
          </div>
        </main>
      </AuthRoute>
    </>
  );
}
