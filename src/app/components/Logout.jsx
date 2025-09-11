"use client";
import { handleLogout } from "../utils/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={handleLogout}
      className=" block  w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:rounded-lg "
    >
      Logout
    </button>
  );
}
