"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import toast from "react-hot-toast";
import { IoReturnUpBackOutline } from "react-icons/io5";
import api from "../utils/api";
import { CiCamera } from "react-icons/ci";

export default function Settings() {
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setName(res.data.name || "");
      setImagePreview(res.data.image || null);
    } catch (error) {
      console.error(error);
      toast.error(" Failed to fetch user info");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    let uploadedImageUrl = null;
    let uploadedImageId = null;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadRes = await api.post("/image/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        uploadedImageUrl = uploadRes.data.file.path;
        uploadedImageId = uploadRes.data.file.filename;
      }

      const body = {};
      if (uploadedImageUrl) {
        body.image = uploadedImageUrl;
        body.imageId = uploadedImageId;
      }
      if (name && name !== user?.name) {
        body.name = name;
      }
      if (oldPassword && newPassword && confirmPassword) {
        body.oldPassword = oldPassword;
        body.newPassword = newPassword;
        body.confirmPassword = confirmPassword;
      }

      if (Object.keys(body).length > 0) {
        const res = await api.put("/user/update-user", body, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          toast.success(res.data.message || "Profile updated successfully!");
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setImageFile(null);
          setImagePreview(uploadedImageUrl || imagePreview);

          window.dispatchEvent(new Event("userUpdated"));
        }
      } else {
        toast("No changes to save");
      }
    } catch (err) {
      let msg = "Password is Incorrect";
      if (err.response?.data?.message === "Invalid password") {
        msg = "❌ Wrong current password";
      } else if (err.response?.data?.message === "Passwords do not match") {
        msg = "❌ Passwords do not match";
      }
      toast.error(msg);
    }
  };

  return (
    <>
      <Navbar />

      <div className="w-full max-w-lg flex px-8 my-4">
        <Link
          href="/"
          className="text-white font-medium text-start bg-[#2B1887] px-3 py-1 rounded-lg"
        >
          <IoReturnUpBackOutline className="w-6 h-6" />
        </Link>
      </div>

      <main className="flex flex-col items-center justify-center min-h-[68vh] px-8">
        <div className="w-full max-w-lg bg-[#f7f2f2] rounded-2xl shadow-xl px-10 py-12 mb-4">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center">
            <label className="mt-3 block text-gray-700 font-medium">
              Change Profile Image
            </label>

            {/* Hidden input */}
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              className="hidden" // hide the raw input
            />

            {/* Preview area as clickable label */}
            <label
              htmlFor="fileInput" // this makes preview clickable
              className="cursor-pointer mt-2 inline-block"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover hover:opacity-80 transition duration-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-center hover:opacity-80 transition duration-200 mb-4">
                  <span >
                    <CiCamera className="h-7 w-7" />
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Change Name Section */}
          <div className="mt-3">
            <label htmlFor="name" className="text-lg font-medium text-gray-700">
              Title
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter new name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div className="mt-3">
            <label htmlFor="email" className="text-lg font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="text"
              placeholder="Email"
              value={user?.email || ""}
              disabled
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none text-black bg-gray-200 cursor-not-allowed opacity-70"
            />
          </div>

          {/* Change Password Section */}
          <div className="mt-3">
            <label className="text-lg font-medium text-gray-700">
              Old Password
            </label>
            <input
              type="password"
              placeholder="Enter old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />

            <label className="text-lg font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />

            <label className="text-lg font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Single Save Button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-[#2B1887] text-white py-2 rounded-lg cursor-pointer font-semibold hover:opacity-80 duration-300 transition"
            >
              Save All Changes
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
