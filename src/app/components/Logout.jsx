"use client";
import { handleLogout } from "../utils/auth";
import { IoIosLogOut } from "react-icons/io";

export default function LogoutButton() {
  return (
    <button
      onClick={handleLogout}
      className=" px-4 py-1 rounded-2xl text-gray-700 hover:opacity-70 hover:scale-105 transform duration-200 flex justify-center items-center gap-2 w-full cursor-pointer"
    >
      <IoIosLogOut />
      Logout
    </button>
  );
}
