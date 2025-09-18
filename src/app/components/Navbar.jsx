"use client";

import { useState, useEffect } from "react";
import LogoutButton from "../components/Logout";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { IoSettingsOutline } from "react-icons/io5";
import api from "../utils/api";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get(
        "https://todo-backend-w-nextjs-production.up.railway.app/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(res.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user info");
    }
  };

  useEffect(() => {
    fetchUser();

    const handleUserUpdate = () => fetchUser();
    window.addEventListener("userUpdated", handleUserUpdate);

    return () => window.removeEventListener("userUpdated", handleUserUpdate);
  }, []);

  return (
    <nav className="flex justify-between items-center py-3 sm:py-4 bg-white border-b border-gray-500 px-4 sm:px-8 relative">
      {/* Left Logo */}
      <h1 className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-900 cursor-pointer">
        <Link href="/">Todo App</Link>
      </h1>

      {/* Center Title */}
      <h1 className="text-gray-900 text-base sm:text-xl md:text-2xl font-bold text-center">
        Todo Kanban
      </h1>

      {/* Right User Section */}
      <div className="relative flex items-center gap-2 sm:gap-3">
        <span className="text-sm sm:text-base md:text-lg text-gray-900 truncate max-w-[100px] sm:max-w-[150px]">
          {user?.name || "Guest"}
        </span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 text-[#2B1887] font-bold flex items-center justify-center cursor-pointer overflow-hidden"
        >
          {user?.image ? (
            <img
              src={user.image + "?t=" + new Date().getTime()}
              alt="User Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user?.name?.charAt(0) || "U"
          )}
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-2 sm:right-7 top-10 sm:top-12 mt-2 w-56 sm:w-72 bg-white/95 rounded-lg shadow-xl p-4 sm:p-5 z-50">
            <div className="mb-3 sm:mb-4 border-b border-gray-300 pb-3 sm:pb-4 text-left flex flex-col items-start gap-1">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 tracking-wide">
                {user?.name || "Guest User"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate w-full">
                {user?.email || "No email"}
              </p>
            </div>

            {/* Settings */}
            <Link
              href="/settingss"
              className="px-3 sm:px-4 py-1 sm:py-2 rounded-2xl text-sm sm:text-base text-gray-700 hover:opacity-70 hover:scale-105 transform duration-200 flex justify-center items-center gap-2 w-full"
            >
              <IoSettingsOutline className="w-4 h-4 sm:w-5 sm:h-5" />
              Settings
            </Link>

            {/* Logout */}
            <LogoutButton />
          </div>
        )}
      </div>
    </nav>
  );
}
