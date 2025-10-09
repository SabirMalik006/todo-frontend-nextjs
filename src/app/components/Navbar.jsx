"use client";

import { useState, useEffect } from "react";
import LogoutButton from "../components/Logout";
import Link from "next/link";
import { IoSettingsOutline } from "react-icons/io5";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";

export default function Navbar() {
  const { id: routeBoardId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [boardId, setBoardId] = useState(null);

  useEffect(() => {
    if (routeBoardId) {
      setBoardId(routeBoardId);
      localStorage.setItem("lastBoardId", routeBoardId);
    } else {
      const storedId = localStorage.getItem("lastBoardId");
      if (storedId) setBoardId(storedId);
    }
  }, [routeBoardId]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center py-3 sm:py-4 bg-[oklch(96.7%_0.003_264.542)] border-b border-gray-200 px-4 sm:px-8 shadow-sm">

      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
        <Link href="/dashboard" className="flex items-center gap-2">

          <img
             src="/image/business.png" 
            alt="Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />

        </Link>
      </div>

      {/* Center Title */}
      <h1 className="text-slate-700 text-base sm:text-xl md:text-3xl font-semibold text-center">
        Todo Kanban
      </h1>

      {/* Right User Menu */}
      <div className="relative flex items-center gap-2 sm:gap-3">
        <span className="text-sm sm:text-base md:text-lg text-slate-700 truncate max-w-[100px] sm:max-w-[150px]">
          {user?.name || "Guest"}
        </span>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-semibold flex items-center justify-center cursor-pointer overflow-hidden hover:bg-slate-200 transition-colors"
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

        {menuOpen && (
          <div className="absolute right-2 sm:right-7 top-10 sm:top-8 mt-2 w-56 sm:w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-4 sm:p-5 z-50 animate-in fade-in-80 zoom-in-95 slide-in-from-top-2 duration-200">
            <div className="mb-3 sm:mb-4 border-b border-slate-200 pb-3 sm:pb-4 text-left flex flex-col items-start gap-1">
              <h2 className="text-base sm:text-lg font-medium text-slate-900 tracking-wide">
                {user?.name || "Guest User"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate w-full">
                {user?.email || "No email"}
              </p>
            </div>

            <Link
              href="/settingss"
              className="px-3 sm:px-4 py-2 sm:py-2 rounded-2xl text-sm sm:text-base text-gray-700 hover:opacity-70 hover:scale-105 transform duration-200 flex justify-center items-center gap-2 w-full"
            >
              <IoSettingsOutline className="w-4 h-4 sm:w-5 sm:h-5" />
              Settings
            </Link>

            <div className="mt-2 flex justify-center x">
              <LogoutButton />
            </div>
          </div>
        )}
      </div>

      {/* Overlay for closing menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}
