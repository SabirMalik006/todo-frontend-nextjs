"use client";

import { useState, useEffect } from "react";
import LogoutButton from "../components/Logout";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { IoSettingsOutline } from "react-icons/io5";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await axios.get(
        "https://todo-backend-w-nextjs-production-6329.up.railway.app/api/auth/me",
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
    <nav className="flex justify-between items-center py-4 bg-[#e0dee6] border-b border-gray-500 mx-8 relative">
      <h1 className="font-bold text-2xl text-gray-900 cursor-pointer">
        <Link href="/">Todo App</Link>
      </h1>
      <h1 className="text-gray-900 text-center text-2xl font-bold">
        Todo Kanban
      </h1>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-gray-200 text-[#2B1887] font-bold flex items-center justify-center cursor-pointer"
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
          <div className="absolute right-0 mt-2 w-72 bg-white/95 rounded-lg shadow-xl p-5 z-50">
            
            <div className="mb-4 border-b border-gray-300 mx-4 pb-4 text-left flex flex-col items-start gap-1">
              <h2 className="text-lg font-medium text-gray-900 tracking-wide">
                {user?.name || "Guest User"}
              </h2>
              <p className="text-sm text-gray-500 truncate w-full">
                {user?.email || "No email"}
              </p>
            </div>

            {/* Settings */}
            <Link
              href="/settingss"
              className="px-4 py-2 rounded-2xl text-gray-700 hover:opacity-70 hover:scale-105 transform duration-200 flex justify-center items-center gap-2 w-full"
            >
              Settings
              <IoSettingsOutline className="w-4 h-4" />
            </Link>

            {/* Logout */}
            <LogoutButton />
          </div>
        )}
      </div>
    </nav>
  );
}
