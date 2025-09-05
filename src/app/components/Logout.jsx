"use client";
import { handleLogout } from "../utils/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded-2xl hover:bg-red-700"
    >
      Logout
    </button>
  );
}
