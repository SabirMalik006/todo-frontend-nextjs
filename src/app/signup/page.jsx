"use client";

import Link from "next/link";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AuthRoute from "../components/AuthRoute";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Register API
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        form
      );
      if (res.status === 200) {
        toast.success("Signup successful 🎉");
        setTimeout(() => (window.location.href = "/login"), 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed ❌");
    }
  };

  // 🔹 Google Login
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <AuthRoute reverse>
      <main className="relative flex h-screen w-full items-center justify-center p-5 md:p-0 bg-[oklch(0.869_0.022_252.894)] ">
        <div className="custom-shadow bg-white mx-auto w-full max-w-md  border border-[oklch(0.554_0.046_257.417)] p-6 rounded-2xl md:p-8 dark:bg-black ">
          {/* Heading */}
          <h2 className="text-2xl text-center font-bold text-neutral-800 dark:text-neutral-200">
            Welcome to Todo App
          </h2>
          <p className="mt-2 text-center max-w-sm text-md text-neutral-600 dark:text-neutral-300">
            Create your account to start organizing your tasks.
          </p>

          {/* Signup Form */}
          <form onSubmit={handleRegister} className="my-8 ">
            <LabelInputContainer className="mb-4">
              <Input
              id="name"
              name="name"
              placeholder="Enter your name"
              type="text"
              onChange={handleChange}
              value={form.name}
              required
              className="focus:outline-none focus:ring-0 focus:border-transparent border border-[oklch(0.554_0.046_257.417)] rounded-md"
            />
            </LabelInputContainer>

            <LabelInputContainer className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                onChange={handleChange}
                value={form.email}
                required
                className="border border-[oklch(0.554_0.046_257.417)] rounded-md"
              />
            </LabelInputContainer>

            <LabelInputContainer className="mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                placeholder="••••••••"
                type="password"
                onChange={handleChange}
                value={form.password}
                required
                className="focus:outline-none border border-[oklch(0.554_0.046_257.417)] rounded-md"
              />
            </LabelInputContainer>

            <button
              type="submit"
              className="group/btn cursor-pointer relative block h-10 w-full rounded-md bg-black px-4 font-medium text-white"
            >
              Sign Up
              <BottomGradient />
            </button>
          </form>

          <div className="flex w-full items-center justify-center">
            <div className="flex-grow border-t border-[oklch(0.708_0_0)]"></div>
            <span className="mx-4 text-center text-md font-medium text-gray-500">OR</span>
            <div className="flex-grow border-t border-[oklch(0.708_0_0)]"></div>
          </div>


          {/* Social Logins */}
          <div className="flex flex-col space-y-3 my-7">
            <button
              onClick={handleGoogleLogin}
              className="group/btn shadow-input relative flex h-10 w-full items-center 
                         justify-center space-x-2 rounded-md bg-[oklch(0.87_0_0)] px-4 font-medium 
                         text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] border border-[oklch(0.554_0.046_257.417)]"
              type="button"
            >
              <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300  cursor-pointer  ">
                Continue with Google
              </span>
              <BottomGradient />
            </button>

            <button
              className="group/btn shadow-input relative flex h-10 w-full items-center 
                         justify-center space-x-2 rounded-md bg-[oklch(0.87_0_0)] px-4 font-medium 
                         text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] border border-[oklch(0.554_0.046_257.417)]"
              type="button"
            >
              <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                Continue with GitHub
              </span>
              <BottomGradient />
            </button>
          </div>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-black ">
              Login
            </Link>
          </p>
        </div>
      </main>
    </AuthRoute>
  );
}

/* Helper components */
const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full 
                     bg-gradient-to-r from-transparent via-cyan-500 to-transparent 
                     opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 
                     bg-gradient-to-r from-transparent via-indigo-500 to-transparent 
                     opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
