"use client";

import { useState, useEffect } from "react";
import LogoutButton from "../components/Logout";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch logged-in user from backend
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
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-[#2B1887] border-b border-gray-300 relative">
      <h1 className="font-bold text-lg text-white">Todo App</h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-gray-200 text-[#2B1887] font-bold flex items-center justify-center cursor-pointer hover:scale-105 duration-200"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt="User Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user?.name?.charAt(0) || "U"
          )}
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-30 bg-white/90 rounded-lg shadow-lg p-5 z-50">
            <Link
              href="/settingss"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Settings
            </Link>
            <LogoutButton />
          </div>
        )}
      </div>
    </nav>
  );
}
