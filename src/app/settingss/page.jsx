"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import axios from "axios";

export default function Settings() {
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      console.log("Token from localStorage:", token);       
      const res = await axios.put(
        "http://localhost:5000/api/user/update-user",
        {
          name,
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200) {
        alert(res.data.message || "Profile updated successfully!");
        setName("");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        alert(err.response.data.message || "Update failed");
      } else {
        alert("Something went wrong");
      }
    }
  };

  return (
    <>
      <Navbar />

      {/* Back Button */}
      <div className="w-full max-w-lg flex px-5 my-2">
        <Link
          href="/"
          className="text-white font-medium text-start bg-[#2B1887] px-4 py-2 rounded-lg"
        >
          Back
        </Link>
      </div>

      {/* Settings Form */}
      <main className="flex flex-col items-center justify-center min-h-[78vh] bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
            User Settings
          </h2>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Change Name */}
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Change Name
              </label>
              <input
                type="text"
                placeholder="Enter new name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Old Password */}
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Old Password
              </label>
              <input
                type="password"
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-gray-700 mb-1 font-medium">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg cursor-pointer font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
