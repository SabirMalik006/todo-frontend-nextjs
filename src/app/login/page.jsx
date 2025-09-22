"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthRoute from "../components/AuthRoute";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";
import api from "../utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password }
      );

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
        })
      );

      toast.success("Login successful 🎉");
      router.push("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials ❌");
    }
  };

  return (
    <AuthRoute reverse>
      <main className="relative flex h-screen w-full items-center justify-center bg-[#FBFCF8]">
        <div className="relative z-10 flex w-full items-center justify-center min-h-screen ">
          <div className="shadow-input w-full max-w-md rounded-none p-6 md:rounded-2xl md:p-10 dark:bg-black bg-[#C6Cfff]">
            {/* Heading */}
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 text-center">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 text-center">
              Login to your account to continue organizing your tasks.
            </p>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="my-8">
              <LabelInputContainer className="mb-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:outline-none focus:ring-0 bg-transparent"
                />
              </LabelInputContainer>

              <LabelInputContainer className="mb-6">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:outline-none focus:ring-0 bg-transparent"
                />
              </LabelInputContainer>

              <button
                type="submit"
                className="group/btn relative block h-10 w-full rounded-md bg-black px-4 font-medium text-white"
              >
                LOGIN 
                <BottomGradient />
              </button>
            </form>

              <div><p className="text-center  text-md" >OR</p></div>

            {/* Divider */}
            <div className="my-4 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700"></div>

            {/* Social Logins */}
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] transition-all duration-300 cursor-pointer"
              >
                <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Continue with Google
                </span>
                <BottomGradient />
              </button>

              <button
                type="button"
                className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] transition-all duration-300 cursor-pointer"
              >
                <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Continue with GitHub
                </span>
                <BottomGradient />
              </button>
            </div>

            {/* Signup link */}
            <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
              Don’t have an account?{" "}
              <Link href="/signup" className="font-medium text-black ">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </AuthRoute>
  );
}

/* Helper Components */
const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
