"use client";
import { handleLogout } from "../utils/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={handleLogout}
      className="block px-4 py-2 rounded-2xl text-gray-700 hover:bg-gray-200 transform duration-200"
    >
      Logout
    </button>
  );
}
